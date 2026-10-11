const EVIDENCE_TYPES = Object.freeze(['file', 'log', 'memory_dump', 'disk_image', 'network_capture', 'screenshot', 'document', 'other']);
const CUSTODY_ACTIONS = Object.freeze(['registered', 'integrity_verified', 'metadata_viewed', 'downloaded', 'custody_note_added']);
module.exports = { EVIDENCE_TYPES, CUSTODY_ACTIONS };
