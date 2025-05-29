const express = require('express');
const router = express.Router();
const QRCode = require('qrcode'); // Pastikan library ini sudah diinstal: npm install qrcode

// Mengubah dari router.post menjadi router.get
router.get('/', async (req, res) => {
  // Mengambil data dari query parameter 'url', sesuai dengan yang dikirim index.html
  const textToEncode = req.query.url;

  if (!textToEncode) {
    // Menggunakan nama parameter yang benar dalam pesan error
    return res.status(400).json({ success: false, message: 'Parameter "url" (teks untuk di-encode) wajib diisi.' });
  }

  try {
    const dataUrl = await QRCode.toDataURL(textToEncode);
    // Mengirim respons yang konsisten dengan yang diharapkan frontend (index.html)
    res.json({
        success: true,
        dataUrl: dataUrl, // Frontend menggunakan ini untuk menampilkan gambar QR
        message: 'QR Code berhasil dibuat.'
    });
  } catch (err) {
    console.error('[API /api/qrcode] Gagal membuat QR Code:', err);
    res.status(500).json({ success: false, message: 'Gagal membuat QR Code.' });
  }
});

module.exports = router;
