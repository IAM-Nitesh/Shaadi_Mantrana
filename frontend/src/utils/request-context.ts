// Simple in-memory request context for tracking the most recent request_id
// This is not a full tracing solution; it just helps surface request IDs
// to user-facing error messages or custom logging.

let lastRequestId: string | null = null;

export function setLastRequestId(id: string | undefined | null) {
  if (id && typeof id === 'string') {
    lastRequestId = id;
  }
}

export function getLastRequestId(): string | null {
  return lastRequestId;
}

// Helper to decorate an error message with current request id
export function withRequestIdMessage(message: string): string {
  return lastRequestId ? `${message} (request_id=${lastRequestId})` : message;
}

// Optionally expose on window for debugging (non-production)
try {
  if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
    (window as any).__LAST_REQUEST_ID__ = () => lastRequestId;
  }
} catch (_) { /* ignore */ }
