const express = require('express');
const helmet = require('helmet');
const path = require('path');

const app = express();
const port = Number(process.env.PORT || 8000);
const frontendDir = path.join(__dirname, 'frontend');

app.disable('x-powered-by');

app.use(
  helmet({
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
          "'unsafe-eval'",
          'https://cdn.jsdelivr.net',
          'https://cdn.ethers.io',
          'https://cdn.tailwindcss.com'
        ],
        connectSrc: [
          "'self'",
          'https://mainnet.tellorlayer.com',
          'https://node-palmito.tellorlayer.com',
          'https://mainnet.infura.io',
          'https://sepolia.infura.io'
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
