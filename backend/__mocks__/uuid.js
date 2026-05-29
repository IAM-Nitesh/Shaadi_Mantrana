// CJS shim for uuid — used by Jest only (see jest.config.js moduleNameMapper).
// uuid v14+ is pure ESM which Jest (running in CJS mode) cannot parse directly.
// This shim re-exports the uuid functions using Node's native crypto module
// so tests that import the User model (which requires uuid) work without errors.
const { randomUUID } = require('crypto');

function v4() {
  return randomUUID();
}

function v1() {
  // Simple v1-like UUID using randomUUID (sufficient for tests)
  return randomUUID();
}

function validate(str) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

module.exports = { v4, v1, validate };
module.exports.v4 = v4;
module.exports.v1 = v1;
module.exports.validate = validate;
