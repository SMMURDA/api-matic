const express = require('express');
const router = express.Router();
const chroma = require('chroma-js'); 

/**
 * @route GET /color/convert
 * @desc Mengkonversi warna dari satu format ke format lain (misal: HEX ke RGB, HSL).
 * @param {string} colorValue - Nilai warna (misal: '#FF0000', 'rgb(255,0,0)', 'hsl(0,100%,50%)').
 * @param {string} [toFormat='rgb'] - Format tujuan (rgb, hex, hsl, cmyk).
 * @returns {object} - Objek JSON berisi warna asli dan konversinya.
 */
router.get('/', async (req, res) => {
    const { colorValue, toFormat = 'rgb' } = req.query;

    if (!colorValue) {
        return res.status(400).json({ success: false, message: 'Parameter "colorValue" wajib diisi.' });
    }

    if (!chroma.valid(colorValue)) {
        return res.status(400).json({ success: false, message: 'Nilai warna tidak valid atau format tidak dikenali. Harap gunakan format HEX, RGB, atau HSL yang benar.' });
    }
    // ===================================================================

    try {
    
        const color = chroma(colorValue);
        
        let convertedValue;

        switch (toFormat.toLowerCase()) {
            case 'hex':
                convertedValue = color.hex();
                break;
            case 'rgb':
                convertedValue = color.rgb();
                break;
            case 'hsl':
                convertedValue = color.hsl();
                break;
            case 'cmyk':
                convertedValue = color.cmyk();
                break;
            default:
                return res.status(400).json({ success: false, message: 'Format tujuan tidak valid. Gunakan: hex, rgb, hsl, cmyk.' });
        }

        res.status(200).json({
            success: true,
            originalColor: colorValue,
            convertedFormat: toFormat,
            convertedValue: convertedValue
        });

    } catch (error) {
        console.error('Error saat mengkonversi warna:', error.message);
        // Tangani error yang mungkin terjadi setelah validasi (misal: masalah internal library)
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server internal saat mengkonversi warna.', error: error.message });
    }
});


module.exports = router;

