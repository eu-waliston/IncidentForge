const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const { sha256 } = require('../utils/evidence-crypto');
const mongoose = require('mongoose');
const { Evidence } = require('../models/evidence');
const { CustodyRecord } = require('../models/custody-record');
const { EVIDENCE_TYPES } = require('../models/evidence-constants');
const { httpError } = require('../utils/http-error');
const { parsePagination, rejectUnknownFields, requirePlainObject } = require('../utils/validation');

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const STORAGE_DIR = path.resolve(process.env.EVIDENCE_STORAGE_DIR || './var/evidence');
function validateActor(actor) {
  if (typeof actor !== 'string' || !actor.trim() || actor.trim().length > 120) {
    throw httpError(400, 'INVALID_ACTOR', 'actor is required and must contain at most 120 characters.');
  }
  return actor.trim();
}
function validateId(id) {
  if (typeof id !== 'string' || !/^[a-fA-F0-9]{24}$/.test(id)) throw httpError(400, 'INVALID_EVIDENCE_ID', 'The evidence ID is not valid.');
}
function validateRegistration(input) {
  requirePlainObject(input);
  const allowed = ['title', 'description', 'evidenceType', 'source', 'originalFileName', 'mimeType', 'contentBase64', 'incidentId', 'capturedAt', 'registeredBy', 'tags', 'immutableMetadata'];
  rejectUnknownFields(input, allowed);
  for (const key of ['title', 'evidenceType', 'source', 'originalFileName', 'mimeType', 'contentBase64', 'registeredBy']) {
    if (typeof input[key] !== 'string' || !input[key].trim()) throw httpError(400, 'MISSING_EVIDENCE_FIELD', `${key} is required.`);
  }
  if (input.title.trim().length < 3 || input.title.trim().length > 160) throw httpError(400, 'INVALID_EVIDENCE_TITLE', 'title must contain 3 to 160 characters.');
  if (!EVIDENCE_TYPES.includes(input.evidenceType)) throw httpError(400, 'INVALID_EVIDENCE_TYPE', `evidenceType must be one of: ${EVIDENCE_TYPES.join(', ')}.`);
  if (input.source.length > 200 || input.originalFileName.length > 255 || input.mimeType.length > 150) throw httpError(400, 'INVALID_EVIDENCE_METADATA', 'One or more evidence metadata fields exceed their maximum length.');
  if (input.description !== undefined && (typeof input.description !== 'string' || input.description.length > 3000)) throw httpError(400, 'INVALID_EVIDENCE_DESCRIPTION', 'description must be a string of at most 3000 characters.');
  if (input.incidentId != null && !mongoose.isValidObjectId(input.incidentId)) throw httpError(400, 'INVALID_INCIDENT_ID', 'incidentId is not valid.');
  if (input.capturedAt != null && Number.isNaN(new Date(input.capturedAt).getTime())) throw httpError(400, 'INVALID_CAPTURED_AT', 'capturedAt must be a valid date.');
  if (input.tags !== undefined && (!Array.isArray(input.tags) || input.tags.length > 30 || input.tags.some(t => typeof t !== 'string' || !t.trim() || t.trim().length > 40))) throw httpError(400, 'INVALID_EVIDENCE_TAGS', 'tags must be an array of up to 30 non-empty strings (maximum 40 characters each).');
  if (input.immutableMetadata !== undefined && (!input.immutableMetadata || typeof input.immutableMetadata !== 'object' || Array.isArray(input.immutableMetadata) || Buffer.byteLength(JSON.stringify(input.immutableMetadata)) > 8192)) throw httpError(400, 'INVALID_IMMUTABLE_METADATA', 'immutableMetadata must be an object no larger than 8 KB.');
  // Require canonical base64; reject malformed encodings before writing bytes.
  const encoded = input.contentBase64;
  if (encoded.length > Math.ceil(MAX_FILE_BYTES * 4 / 3) + 8 || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(encoded)) throw httpError(400, 'INVALID_BASE64', 'contentBase64 must be valid standard Base64.');
  const bytes = Buffer.from(encoded, 'base64');
  if (!bytes.length) throw httpError(400, 'EMPTY_EVIDENCE', 'Evidence content cannot be empty.');
  if (bytes.length > MAX_FILE_BYTES) throw httpError(413, 'EVIDENCE_TOO_LARGE', 'Evidence files cannot exceed 10 MB.');
  if (bytes.toString('base64') !== encoded) throw httpError(400, 'INVALID_BASE64', 'contentBase64 is not canonical Base64.');
  return { ...input, actor: validateActor(input.registeredBy), bytes };
}
async function recordCustody({ evidenceId, action, actor, digest = null, details = '', requestId = null }) {
  return CustodyRecord.create({ evidenceId, action, actor: validateActor(actor), sha256: digest, details, requestId });
}
async function registerEvidence(input, requestId) {
  const data = validateRegistration(input);
  if (data.incidentId) {
    const { Incident } = require('../models/incident');
    const incidentExists = await Incident.exists({ _id: data.incidentId });
    if (!incidentExists) throw httpError(404, 'INCIDENT_NOT_FOUND', 'The linked incident was not found.');
  }
  await fs.mkdir(STORAGE_DIR, { recursive: true, mode: 0o700 });
  const digest = sha256(data.bytes);
  const storageName = `${crypto.randomUUID()}.evidence`;
  const storagePath = path.join(STORAGE_DIR, storageName);
  // wx prevents accidental overwrite; restrictive permissions limit local access.
  await fs.writeFile(storagePath, data.bytes, { flag: 'wx', mode: 0o600 });
  let evidence;
  try {
    evidence = await Evidence.create({
      title: data.title.trim(), description: (data.description || '').trim(), evidenceType: data.evidenceType,
      source: data.source.trim(), originalFileName: path.basename(data.originalFileName.replace(/\\/g, '/')).slice(0, 255),
      mimeType: data.mimeType.trim(), sizeBytes: data.bytes.length, sha256: digest, storagePath,
      incidentId: data.incidentId || null, capturedAt: data.capturedAt ? new Date(data.capturedAt) : null,
      registeredBy: data.actor, tags: data.tags || [], immutableMetadata: data.immutableMetadata || {}
    });
    await recordCustody({ evidenceId: evidence._id, action: 'registered', actor: data.actor, digest, details: 'Evidence registered; SHA-256 calculated from original bytes.', requestId });
  } catch (error) {
    if (evidence?._id) await Evidence.deleteOne({ _id: evidence._id }).catch(() => {});
    await fs.unlink(storagePath).catch(() => {});
    throw error;
  }
  return publicEvidence(evidence);
}
function publicEvidence(evidence) {
  const obj = evidence.toObject ? evidence.toObject() : { ...evidence };
  delete obj.storagePath;
  delete obj.__v;
  return obj;
}
async function listEvidence(query) {
  rejectUnknownFields(query, ['page', 'limit', 'incidentId', 'evidenceType', 'sha256', 'tag']);
  const { page, limit } = parsePagination(query);
  const filter = {};
  if (query.incidentId !== undefined) {
    if (!mongoose.isValidObjectId(query.incidentId)) throw httpError(400, 'INVALID_INCIDENT_ID', 'incidentId is not valid.');
    filter.incidentId = query.incidentId;
  }
  if (query.evidenceType !== undefined) {
    if (!EVIDENCE_TYPES.includes(query.evidenceType)) throw httpError(400, 'INVALID_EVIDENCE_TYPE', 'evidenceType is not supported.');
    filter.evidenceType = query.evidenceType;
  }
  if (query.sha256 !== undefined) {
    if (!/^[a-f0-9]{64}$/i.test(query.sha256)) throw httpError(400, 'INVALID_SHA256', 'sha256 must contain 64 hexadecimal characters.');
    filter.sha256 = query.sha256.toLowerCase();
  }
  if (query.tag !== undefined) {
    if (typeof query.tag !== 'string' || !query.tag.trim() || query.tag.length > 40) throw httpError(400, 'INVALID_TAG', 'tag must be a non-empty string of at most 40 characters.');
    filter.tags = query.tag.trim().toLowerCase();
  }
  const [items, total] = await Promise.all([
    Evidence.find(filter).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Evidence.countDocuments(filter)
  ]);
  return { items: items.map(publicEvidence), pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}
async function getEvidence(id, actor, requestId) {
  validateId(id); actor = validateActor(actor);
  const evidence = await Evidence.findById(id).select('+storagePath').lean();
  if (!evidence) throw httpError(404, 'EVIDENCE_NOT_FOUND', 'The requested evidence was not found.');
  await recordCustody({ evidenceId: evidence._id, action: 'metadata_viewed', actor, digest: evidence.sha256, details: 'Evidence metadata viewed.', requestId });
  return publicEvidence(evidence);
}
async function verifyEvidence(id, actor, requestId) {
  validateId(id); actor = validateActor(actor);
  const evidence = await Evidence.findById(id).select('+storagePath').lean();
  if (!evidence) throw httpError(404, 'EVIDENCE_NOT_FOUND', 'The requested evidence was not found.');
  let actualDigest = null; let sizeBytes = null; let status = 'verified';
  try {
    const buffer = await fs.readFile(evidence.storagePath);
    actualDigest = sha256(buffer); sizeBytes = buffer.length;
    if (actualDigest !== evidence.sha256 || sizeBytes !== evidence.sizeBytes) status = 'mismatch';
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'EACCES') status = 'unavailable'; else throw error;
  }
  await recordCustody({ evidenceId: evidence._id, action: 'integrity_verified', actor, digest: actualDigest || evidence.sha256, details: `Integrity verification result: ${status}.`, requestId });
  return { evidenceId: String(evidence._id), expectedSha256: evidence.sha256, actualSha256: actualDigest, expectedSizeBytes: evidence.sizeBytes, actualSizeBytes: sizeBytes, status, verifiedAt: new Date().toISOString() };
}
async function listCustody(id, query) {
  validateId(id);
  rejectUnknownFields(query, ['page', 'limit']);
  const { page, limit } = parsePagination(query);
  if (!(await Evidence.exists({ _id: id }))) throw httpError(404, 'EVIDENCE_NOT_FOUND', 'The requested evidence was not found.');
  const [items, total] = await Promise.all([
    CustodyRecord.find({ evidenceId: id }).sort({ occurredAt: 1, _id: 1 }).skip((page - 1) * limit).limit(limit).lean(),
    CustodyRecord.countDocuments({ evidenceId: id })
  ]);
  return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}
async function addCustodyNote(id, input, requestId) {
  validateId(id); requirePlainObject(input); rejectUnknownFields(input, ['actor', 'details']);
  const actor = validateActor(input.actor);
  if (typeof input.details !== 'string' || !input.details.trim() || input.details.trim().length > 1000) throw httpError(400, 'INVALID_CUSTODY_NOTE', 'details is required and must contain at most 1000 characters.');
  const evidence = await Evidence.findById(id).select('sha256');
  if (!evidence) throw httpError(404, 'EVIDENCE_NOT_FOUND', 'The requested evidence was not found.');
  return recordCustody({ evidenceId: id, action: 'custody_note_added', actor, digest: evidence.sha256, details: input.details.trim(), requestId });
}
module.exports = { MAX_FILE_BYTES, STORAGE_DIR, sha256, validateRegistration, registerEvidence, listEvidence, getEvidence, verifyEvidence, listCustody, addCustodyNote };
