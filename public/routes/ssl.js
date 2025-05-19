const express = require('express');
const tls = require('tls');

const router = express.Router();

router.get('/', (req, res) => {
  const host = req.query.host || req.query.domain;
  if (!host) {
    return res.status(400).json({ success: false, message: 'Host is required' });
  }

  const socket = tls.connect(443, host, { servername: host, timeout: 5000 }, () => {
    const cert = socket.getPeerCertificate();
    if (!cert || !cert.valid_to) {
      return res.status(500).json({ success: false, message: 'Could not retrieve certificate' });
    }

    res.json({
      success: true,
      domain: host,
      valid_from: cert.valid_from,
      valid_to: cert.valid_to,
      issuer: cert.issuer && cert.issuer.O,
      expired: new Date(cert.valid_to) < new Date()
    });

    socket.end();
  });

  socket.on('error', err => {
    res.status(500).json({ success: false, message: 'SSL error', error: err.message });
  });
});

module.exports = router;
