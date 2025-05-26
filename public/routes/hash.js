const express = require('express');
const router = express.Router();
const crypto = require('crypto'); 

const SUPPORTED_HASH_ALGORITHMS = ['md5', 'sha1', 'sha256', 'sha512'];
const DEFAULT_HASH_ENCODING = 'hex'; 

router.post('/', (req, res) => { 
    const { data, algorithm, encoding = DEFAULT_HASH_ENCODING } = req.body;

    if (!data || !algorithm) {
        return res.status(400).json({ success: false, message: 'Parameter "data" dan "algorithm" wajib diisi.' });
    }

    if (!SUPPORTED_HASH_ALGORITHMS.includes(algorithm.toLowerCase())) {
        return res.status(400).json({ success: false, message: `Algoritma hash tidak didukung. Pilih dari: ${SUPPORTED_HASH_ALGORITHMS.join(', ')}.` });
    }

    try {
        const hash = crypto.createHash(algorithm.toLowerCase());
        hash.update(Buffer.from(data, 'base64')); // Asumsi data input selalu Base64
        const hashedData = hash.digest(encoding);

        res.status(200).json({
            success: true,
            originalData: data,
            algorithm: algorithm.toLowerCase(),
            hash: hashedData,
            encoding: encoding
        });
    } catch (error) {
        console.error('Error saat menghasilkan hash:', error.message);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server internal saat menghasilkan hash.', error: error.message });
    }
});

module.exports = router;

