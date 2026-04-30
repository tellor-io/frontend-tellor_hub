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
          "'unsafe-eval'",
          'https://cdn.jsdelivr.net',
          'https://cdn.ethers.io',
          'https://cdn.tailwindcss.com',
          "'sha256-tPSqgOKRnJ/WEHfggnPInj/c+HOKaO+h49SR8r7YF1s='",
          "'sha256-SQqHoLh6BkeSdXNPEVzfkPKf+vM0fl4VaDjViheLkuY='",
          "'sha256-2htPfnJDN8rJzOaosKYVFFpD1K2kwsjZJL/Rh8nukeQ='",
          "'sha256-4nqzWaR+MoUtjlfZZVdqZSTEUjLVwV5QuxTKhUmvniU='"
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
