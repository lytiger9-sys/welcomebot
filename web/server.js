const http = require('node:http');

function renderHomePage() {
    const now = new Date().toISOString();

    return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>service online</title>
  <style>
    :root {
      color-scheme: dark;
      --bg: #0b0f14;
      --card: #121821;
      --text: #e6edf3;
      --muted: #8b949e;
      --line: #243041;
      --accent: #6ea8fe;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      background: radial-gradient(circle at top, #182233 0%, var(--bg) 52%);
      color: var(--text);
      font-family: Arial, Helvetica, sans-serif;
    }
    .card {
      width: min(560px, calc(100vw - 32px));
      padding: 32px;
      border: 1px solid var(--line);
      border-radius: 20px;
      background: rgba(18, 24, 33, 0.92);
      box-shadow: 0 24px 80px rgba(0, 0, 0, 0.45);
    }
    .badge {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 999px;
      border: 1px solid rgba(110, 168, 254, 0.35);
      color: var(--accent);
      font-size: 12px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    h1 {
      margin: 18px 0 10px;
      font-size: clamp(28px, 5vw, 44px);
      line-height: 1.05;
    }
    p {
      margin: 0;
      color: var(--muted);
      line-height: 1.7;
      font-size: 15px;
    }
    .meta {
      margin-top: 18px;
      padding-top: 18px;
      border-top: 1px solid var(--line);
      font-size: 13px;
      color: var(--muted);
    }
    code {
      color: #c9d1d9;
    }
  </style>
</head>
<body>
  <main class="card">
    <span class="badge">online</span>
    <h1>Nothing useful here.</h1>
    <p>
      This page exists only so the deployment has a real HTTP endpoint.
      The bot process can use it for health checks and keepalive pings.
    </p>
    <div class="meta">Last rendered at <code>${now}</code></div>
  </main>
</body>
</html>`;
}

function startWebServer() {
    const requestedPort = Number(process.env.PORT || process.env.WEB_PORT || 3000);
    const canFallback = !process.env.PORT;

    const createServer = () => {
        const server = http.createServer((req, res) => {
            const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

            if (url.pathname === '/' || url.pathname === '/health') {
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(renderHomePage());
                return;
            }

            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Not found');
        });

        server.on('error', error => {
            if (error.code === 'EADDRINUSE' && canFallback) {
                console.warn(`[web] port ${currentPort} is busy, trying ${currentPort + 1}`);
                createAndListen(currentPort + 1);
                return;
            }

            if (error.code === 'EADDRINUSE') {
                console.warn(`[web] port ${currentPort} is already in use. Web server disabled.`);
                return;
            }

            console.error('[web] server error:', error);
        });

        return server;
    };

    let currentPort = requestedPort;

    const createAndListen = port => {
        currentPort = port;
        const server = createServer();
        server.listen(port, '0.0.0.0', () => {
            console.log(`[web] listening on port ${port}`);
        });
        return server;
    };

    return createAndListen(requestedPort);
}

module.exports = {
    startWebServer,
};
