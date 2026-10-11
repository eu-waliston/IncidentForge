const crypto = require('node:crypto');

function sha256(buffer) {
  if (!Buffer.isBuffer(buffer)) throw new TypeError('sha256 expects a Buffer of original evidence bytes.');
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

module.exports = { sha256 };
