// Lightweight test logger used by scripts, artifacts and tests to avoid
// noisy console output and accidental leakage of secrets in test logs.
const MASK_RE_EMAIL = /([\w.+-]{3})([\w.+-]*)(@[^\s@]+)/g;
const MASK_RE_PHONE = /(\d{3})(\d+)(\d{2})/g;

function mask(msg) {
  if (typeof msg !== 'string') {
    try { msg = JSON.stringify(msg); } catch (_) { msg = String(msg); }
  }
  return msg.replace(MASK_RE_EMAIL, '$1***$3').replace(MASK_RE_PHONE, '$1***$3');
}

function safeLog(level, ...args) {
  const out = args.map(a => (typeof a === 'string' ? mask(a) : mask(String(a)))).join(' ');
  try {
    if (level === 'info') console.info(out);
    else if (level === 'warn') console.warn(out);
    else if (level === 'error') console.error(out);
    else console.log(out);
  } catch (_) { /* swallow */ }
}

module.exports = {
  info: (...a) => safeLog('info', ...a),
  warn: (...a) => safeLog('warn', ...a),
  error: (...a) => safeLog('error', ...a),
  debug: (...a) => safeLog('debug', ...a),
};
