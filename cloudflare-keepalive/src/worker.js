export default {
  async scheduled(event, env, ctx) {
    const startOverall = Date.now();
    const retries = parseInt(env.RETRIES || '3', 10);
    const retryDelay = parseInt(env.RETRY_DELAY_MS || '10000', 10);
    const timeoutMs = parseInt(env.TIMEOUT_MS || '30000', 10);
    const connectTimeoutMs = parseInt(env.CONNECT_TIMEOUT_MS || '10000', 10);

    let attempt = 0;
    let success = false;
    let finalStatus = 0;
    let finalError = null;
    let responseTimeMs = 0;

    async function timedFetch(url, options) {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort('timeout'), timeoutMs);
      const started = Date.now();
      try {
        // Cloudflare fetch does connect + total timeout internally; emulate connect timeout with race
        const res = await fetch(url, { ...options, signal: controller.signal });
        const text = await res.text().catch(() => '');
        return { res, body: text, elapsed: Date.now() - started };
      } finally {
        clearTimeout(id);
      }
    }

    while (attempt < retries && !success) {
      attempt++;
      const attemptStart = Date.now();
      try {
        const { res, elapsed } = await timedFetch(env.HEALTH_URL, {
          headers: { 'X-Ping-Token': env.PING_TOKEN },
          cf: { cacheTtl: 0 }
        });
        finalStatus = res.status;
        responseTimeMs = elapsed;
        if (res.ok) {
          success = true;
          break;
        } else {
          finalError = `non_ok_status_${res.status}`;
        }
      } catch (e) {
        finalError = e.name === 'AbortError' ? 'timeout' : e.message;
      }
      if (!success && attempt < retries) {
        await new Promise(r => setTimeout(r, retryDelay));
      }
    }

    const overallMs = Date.now() - startOverall;
    const log = {
      event: 'keepalive_ping',
      service: 'cloudflare_worker',
      attempts: attempt,
      max_retries: retries,
      ok: success,
      status: finalStatus,
      response_time_ms: responseTimeMs,
      total_duration_ms: overallMs,
      error: success ? null : finalError,
      ts: new Date().toISOString()
    };
    console.log(JSON.stringify(log));

    const notifySuccess = (env.SLACK_NOTIFY_SUCCESS || '').toLowerCase() === 'true';
    const shouldNotify = env.SLACK_WEBHOOK_URL && (!success || notifySuccess);

    // Optional Slack alert (failure always if webhook set, success if enabled)
    if (shouldNotify) {
      const payload = {
        text: success
          ? `✅ Keepalive ok status=${finalStatus} attempt=${attempt} response=${responseTimeMs}ms`
          : `⚠️ Keepalive failure status=${finalStatus} error=${finalError} attempts=${attempt}`
      };
      try {
        await fetch(env.SLACK_WEBHOOK_URL, {
          method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
      } catch (e) {
        console.log(JSON.stringify({ event: 'slack_post_error', error: e.message }));
      }
    }
  },

  async fetch(request, env, ctx) {
    if (new URL(request.url).pathname === '/metrics') {
      return new Response('OK', { status: 200 });
    }
    return new Response('worker alive', { status: 200 });
  }
};
