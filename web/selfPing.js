const http = require('node:http');
const https = require('node:https');

function requestUrl(targetUrl, timeoutMs) {
    const url = new URL(targetUrl);
    const transport = url.protocol === 'https:' ? https : http;

    return new Promise((resolve, reject) => {
        const request = transport.get(url, response => {
            response.resume();
            response.on('end', () => {
                resolve({
                    statusCode: response.statusCode,
                });
            });
        });

        request.setTimeout(timeoutMs, () => {
            request.destroy(new Error('Request timed out'));
        });

        request.on('error', reject);
    });
}

function startSelfPing(targetUrl, options = {}) {
    if (!targetUrl) {
        console.log('[keepalive] SELF_PING_URL is not set. Self-ping is disabled.');
        return null;
    }

    const intervalMs = Number(options.intervalMs || process.env.SELF_PING_INTERVAL_MS || 300000);
    const initialDelayMs = Number(options.initialDelayMs || process.env.SELF_PING_INITIAL_DELAY_MS || 30000);
    const timeoutMs = Number(options.timeoutMs || process.env.SELF_PING_TIMEOUT_MS || 10000);
    const path = options.path || process.env.SELF_PING_PATH || '/health';
    const pingUrl = new URL(path, targetUrl).toString();

    let stopped = false;
    let timer = null;

    const scheduleNext = delay => {
        if (stopped) return;
        timer = setTimeout(runPingLoop, delay);
    };

    const runPingLoop = async () => {
        try {
            const result = await requestUrl(pingUrl, timeoutMs);
            console.log(`[keepalive] pinged ${pingUrl} (${result.statusCode})`);
        } catch (error) {
            console.error('[keepalive] ping failed:', error.message);
        }

        scheduleNext(intervalMs);
    };

    scheduleNext(initialDelayMs);

    console.log(`[keepalive] enabled for ${pingUrl}`);

    return {
        stop() {
            stopped = true;
            if (timer) {
                clearTimeout(timer);
                timer = null;
            }
        },
    };
}

module.exports = {
    startSelfPing,
};
