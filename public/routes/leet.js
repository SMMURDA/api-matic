const express = require('express');
const router = express.Router();

// Pemetaan karakter Leet Speak yang JAUH LEBIH LENGKAP.
// Setiap huruf biasa memiliki array pengganti Leet yang berbeda.
// Urutan dalam array bisa menunjukkan "keketatan" (strictness) dari yang paling sederhana hingga kompleks,
// atau hanya daftar variasi yang mungkin.
const leetReplacements = {
    'a': ['4', '@', '/\\', '/-\\', '^'],
    'b': ['8', '|3', 'i3', 'ß'],
    'c': ['(', '<', '{', '['],
    'd': ['|)','|>', '[)', 'cl'],
    'e': ['3'],
    'f': ['ph', '|=', 'f', 'v'],
    'g': ['6', '9'],
    'h': ['#', ']-[', '/-/', '[-]', '|-|', ']-['], // Menambahkan ']-[' sebagai unit tunggal untuk 'h'
    'i': ['1', '!', '|', '][', 'l'], // 'l' juga bisa jadi '1'
    'j': ['_j', 'j'],
    'k': ['|<', '|{', 'k'],
    'l': ['1', '|', '|_'],
    'm': ['/\\/\\', '^/\\^', '(v)', '|\\/|', 'em'],
    'n': ['/\\/', '^/^', '|\\|'],
    'o': ['0', '()', '[]', '<>'],
    'p': ['|*', '|D'],
    'q': ['(,)', 'kw'],
    'r': ['Я', 'R', '|Z', '|_'],
    's': ['5', '$', 'z'],
    't': ['7', '+', '-|-'],
    'u': ['|_|', 'v', 'µ'],
    'v': ['\\/', '\\|/', '\\/'],
    'w': ['\\/\\/', '\\/\\/\\/', 'vv', 'w'], // Menambahkan '\\/\\/\\/' sebagai unit tunggal untuk 'w'
    'x': ['><', '}{'],
    'y': ['j', '`/', '¥'],
    'z': ['2', '%']
};

// Logika pemilihan pengganti berdasarkan tingkat keketatan untuk encoding
const strictnessLevels = {
    'low': (replacements) => replacements[0] || '', // Selalu ambil yang pertama/paling sederhana
    'medium': (replacements) => replacements[Math.min(1, replacements.length - 1)] || replacements[0] || '', // Ambil yang kedua jika ada, jika tidak ambil yang pertama
    'high': (replacements) => replacements[Math.floor(Math.random() * replacements.length)] || '' // Pilih acak dari semua yang tersedia
};

// Fungsi untuk meng-encode teks ke Leet Speak
function encodeLeet(text, strictness = 'medium') {
    let result = '';
    const lowerText = text.toLowerCase();
    const getReplacement = strictnessLevels[strictness] || strictnessLevels['medium']; // Default ke medium jika strictness tidak valid

    for (let i = 0; i < lowerText.length; i++) {
        const char = lowerText[i];
        const originalChar = text[i]; 

        if (leetReplacements[char] && leetReplacements[char].length > 0) {
            result += getReplacement(leetReplacements[char]);
        } else {
            result += originalChar; // Pertahankan karakter asli jika tidak ada pengganti leet
        }
    }
    return result;
}

// Fungsi untuk men-decode teks dari Leet Speak (lebih kompleks dan robust)
function decodeLeet(leetText) {
    let decodedResult = '';
    let currentPos = 0;
    const lowerLeetText = leetText.toLowerCase();

    // Bangun reverse map yang memprioritaskan Leet yang lebih panjang.
    // Ini penting agar pengganti multi-karakter (misal "ph") dicocokkan sebelum karakter tunggal ("p" atau "h").
    const reverseLeetMap = {};
    for (const normalChar in leetReplacements) {
        // Leet forms for a given normalChar
        const leetForms = leetReplacements[normalChar];
        for (const leetChar of leetForms) {
            reverseLeetMap[leetChar] = normalChar;
        }
    }

    // Urutkan kunci reverse map berdasarkan panjang (descending).
    // Ini adalah kunci utama untuk dekode yang akurat, karena memastikan 'ph' dicoba sebelum 'p'.
    const sortedLeetChars = Object.keys(reverseLeetMap).sort((a, b) => b.length - a.length);

    while (currentPos < lowerLeetText.length) {
        let matched = false;
        // Coba cocokkan Leet yang paling panjang dari posisi saat ini
        for (const leetChar of sortedLeetChars) {
            // Pastikan panjang string saat ini cukup untuk leetChar yang sedang diperiksa
            if (currentPos + leetChar.length <= lowerLeetText.length) {
                const sub = lowerLeetText.substring(currentPos, currentPos + leetChar.length);
                if (sub === leetChar) {
                    decodedResult += reverseLeetMap[leetChar];
                    currentPos += leetChar.length;
                    matched = true;
                    break; // Hentikan pencarian jika sudah ada yang cocok
                }
            }
        }

        // Jika tidak ada Leet yang cocok, tambahkan karakter asli
        if (!matched) {
            decodedResult += lowerLeetText[currentPos];
            currentPos++;
        }
    }

    return decodedResult;
}


/**
 * Endpoint POST /api/leet
 * Melakukan konversi teks ke Leet Speak atau sebaliknya.
 * Menentukan operasi berdasarkan parameter input.
 */
router.post('/', (req, res) => {
    const { text, leet_text, strictness } = req.body;

    // Validasi input: hanya boleh salah satu dari 'text' atau 'leet_text' yang diisi
    if (text && leet_text) {
        return res.status(400).json({
            success: false,
            message: 'Hanya boleh mengisi salah satu parameter: \'text\' untuk encode, atau \'leet_text\' untuk decode.'
        });
    }

    // Validasi input: setidaknya salah satu dari 'text' atau 'leet_text' harus diisi
    if (!text && !leet_text) {
        return res.status(400).json({
            success: false,
            message: 'Parameter \'text\' atau \'leet_text\' wajib diisi.'
        });
    }

    try {
        if (text) {
            // Lakukan encoding jika 'text' ada
            const encodedText = encodeLeet(text, strictness);
            res.json({
                success: true,
                operation: 'encode',
                original_text: text,
                leet_text: encodedText
            });
        } else { // 'leet_text' ada, lakukan decoding
            const decodedText = decodeLeet(leet_text);
            res.json({
                success: true,
                operation: 'decode',
                original_leet_text: leet_text,
                decoded_text: decodedText
            });
        }
    } catch (error) {
        console.error('Error in Leet conversion:', error.message);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server saat melakukan konversi Leet Speak.',
            error: error.message
        });
    }
});

module.exports = router;

