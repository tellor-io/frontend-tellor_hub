const express = require('express');
const helmet = require('helmet');
const path = require('path');

const app = express();
const port = Number(process.env.PORT || 8000);
const frontendDir = path.join(__dirname, 'frontend');

app.disable('x-powered-by');

app.use(
  helmet({
    // Older browsers honor this instead of CSP frame-ancestors.
    frameguard: { action: 'deny' },
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        formAction: ["'self'"],
        scriptSrc: [
          "'self'",
          // Allow inline scripts in this local dev server (app bootstrap + tests/test-suite.html harness).
          "'unsafe-inline'",
          // protobufjs compiles each Cosmos message encoder with new Function()
          // on first use. Real browsers block that, and then delegate, withdraw,
          // and dispute signing throw, unless this source is allowed.
          "'unsafe-eval'",
          'https://cdn.jsdelivr.net',
          'https://cdn.ethers.io',
          // Keplr injects chrome-extension://.../injectedScript.bundle.js into the page.
          'chrome-extension:',
          'moz-extension:'
        ],
        connectSrc: [
          "'self'",
          'https://mainnet.tellorlayer.com',
          'https://node-palmito.tellorlayer.com',
          'https://mainnet.infura.io',
          'https://sepolia.infura.io',
          'chrome-extension:',
          'moz-extension:'
        ],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        fontSrc: ["'self'", 'data:', 'https:'],
        upgradeInsecureRequests: []
      }
    },
    crossOriginEmbedderPolicy: false
  })
);

app.use(express.static(frontendDir));

app.get('/health', (_req, res) => {
  res.status(200).json({ ok: true });
});

app.use((_req, res) => {
  res.sendFile(path.join(frontendDir, 'index.html'));
});

app.listen(port, () => {
  console.log(`Tellor Hub server listening on port ${port}`);
});
