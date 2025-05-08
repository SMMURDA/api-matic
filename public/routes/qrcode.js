const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');

router.post('/', async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  try {
    const dataUrl = await QRCode.toDataURL(text);
    res.json({ dataUrl });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate QR Code' });
  }
});

module.exports = router;
