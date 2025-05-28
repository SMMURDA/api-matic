const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');

dotenv.config();

const whoisRoute = require('./public/routes/whois');
const embedRoute = require('./public/routes/embed');
const shortenRoute = require('./public/routes/shorten');
const randomUserRoute = require('./public/routes/randomUser');
const ipLocatorRoute = require('./public/routes/iplocator');
const docParserRoute = require('./public/routes/docparser');
const qrCodeRoute = require('./public/routes/qrcode');
const deepseekRoute = require('./public/routes/deepseek');
const geminiRoute = require('./public/routes/gemini');
const llamaRoute = require('./public/routes/llama');
const microsoftRoute = require('./public/routes/microsoft');
const nvidiaRoute = require('./public/routes/nvidia');
const sslRoute = require('./public/routes/ssl');
const metadataRoute = require('./public/routes/metadata');
const dnsRoute = require('./public/routes/dns');
const translateRoute = require('./public/routes/translate');
const currencyRoute = require('./public/routes/currency');
const asciiartRoute = require('./public/routes/asciiart');
const hashRoute = require('./public/routes/hash');
const leetRoute = require('./public/routes/leet');

const app = express();
const PORT = process.env.PORT || 3000;

const serverMetrics = {
    serverStartTime: new Date(),
    totalRequests: 0,
    successfulRequests: 0,
    totalResponseTime: 0,
    requestCountForAvg: 0
};

const generateCustomApiKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const length = 48;
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const prefix = 'pk-';
    return prefix + result;
};

const userApiKeys = new Map();

const MASTER_API_KEY = process.env.MASTER_API_KEY || 'default_master_key_for_testing';
const STATUS_PAGE_API_KEY = process.env.STATUS_PAGE_API_KEY; // Ambil API Key halaman status
if (process.env.NODE_ENV !== 'production' && !process.env.MASTER_API_KEY) {
    console.warn('WARNING: MASTER_API_KEY is not set in production. Using default key for testing.');
}

app.use((req, res, next) => {
    const start = process.hrtime.bigint();

    res.on('finish', () => {
        const end = process.hrtime.bigint();
        const durationNs = end - start;
        const durationMs = Number(durationNs / 1_000_000n);

        if (req.originalUrl.startsWith('/api/')) {
            serverMetrics.totalRequests++;
            serverMetrics.totalResponseTime += durationMs;
            serverMetrics.requestCountForAvg++;

            if (res.statusCode >= 200 && res.statusCode < 400) {
                serverMetrics.successfulRequests++;
            }
        }
    });
    next();
});

app.use(cors());
app.set('trust proxy', 1);

const authenticateUserApiKey = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const userApiKey = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!userApiKey) {
        return res.status(401).json({ success: false, message: 'Authentication failed: API Key is missing. Please visit the documentation page to get a key.' });
    }

    if (userApiKeys.has(userApiKey)) {
        req.isStatusCheck = false; // Tandai ini bukan dari halaman status khusus
        next();
    } else if (userApiKey === MASTER_API_KEY) {
        req.isStatusCheck = true; // Master Key bisa dianggap sebagai status check jika diinginkan
        next();
    } else if (userApiKey === STATUS_PAGE_API_KEY) { // Cek API Key halaman status
        req.isStatusCheck = true; // Tandai permintaan ini dari halaman status
        next();
    } else {
        return res.status(403).json({ success: false, message: 'Authentication failed: Invalid API Key.' });
    }
};

const apiLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 10,
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again after 10 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Kunci: Lewati rate limiting jika permintaan datang dari halaman status
    skip: (req, res) => req.isStatusCheck === true
});

// PENTING: Endpoint untuk menghasilkan API Key harus didefinisikan SEBELUM
// middleware autentikasi dan rate limiter global untuk /api/
app.get('/api/get-new-api-key', (req, res) => {
    const newApiKey = generateCustomApiKey();
    userApiKeys.set(newApiKey, { createdAt: new Date(), ip: req.ip });
    console.log(`Generated new API Key: ${newApiKey} for IP: ${req.ip}`);

    if (userApiKeys.size > 10000) {
        const oldestKey = userApiKeys.keys().next().value;
        userApiKeys.delete(oldestKey);
    }

    res.json({ success: true, api_key: newApiKey, message: 'Your new API Key has been generated.' });
});

// Terapkan autentikasi API Key secara global ke semua API endpoint.
// Rate limiter akan diterapkan secara individual ke setiap route di bawah.
app.use('/api/', authenticateUserApiKey);

app.use(express.static(path.join(__dirname, 'public'), {
    extensions: ['html']
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Daftarkan semua route API dengan rate limiter individual
// Endpoint server-metrics tidak perlu rate limiter
app.use('/api/whois', apiLimiter, whoisRoute);
app.use('/api/embed', apiLimiter, embedRoute);
app.use('/api/shorten', apiLimiter, shortenRoute);
app.use('/api/randomuser', apiLimiter, randomUserRoute);
app.use('/api/iplocator', apiLimiter, ipLocatorRoute);
app.use('/api/docparser', apiLimiter, docParserRoute);
app.use('/api/qrcode', apiLimiter, qrCodeRoute);
app.use('/api/deepseek', apiLimiter, deepseekRoute);
app.use('/api/gemini', apiLimiter, geminiRoute);
app.use('/api/llama', apiLimiter, llamaRoute);
app.use('/api/microsoft', apiLimiter, microsoftRoute);
app.use('/api/nvidia', apiLimiter, nvidiaRoute);
app.use('/api/ssl', apiLimiter, sslRoute);
app.use('/api/metadata', apiLimiter, metadataRoute);
app.use('/api/dns', apiLimiter, dnsRoute);
app.use('/api/translate', apiLimiter, translateRoute);
app.use('/api/currency', apiLimiter, currencyRoute);
app.use('/api/asciiart', apiLimiter, asciiartRoute);
app.use('/api/hash', apiLimiter, hashRoute);
app.use('/api/leet', apiLimiter, leetRoute);

// Endpoint untuk mendapatkan metrik server - TIDAK DILINDUNGI RATE LIMITER
app.get('/api/server-metrics', (req, res) => {
    const uptimeMs = new Date() - serverMetrics.serverStartTime;
    const uptimeSeconds = Math.floor(uptimeMs / 1000);
    const uptimeMinutes = Math.floor(uptimeSeconds / 60);
    const uptimeHours = Math.floor(uptimeMinutes / 24);
    const uptimeDays = Math.floor(uptimeHours / 24);

    const avgResponseTime = serverMetrics.requestCountForAvg > 0 ?
        Math.round(serverMetrics.totalResponseTime / serverMetrics.requestCountForAvg) : 0;

    const successRate = serverMetrics.totalRequests > 0 ?
        (serverMetrics.successfulRequests / serverMetrics.totalRequests * 100).toFixed(1) : '0.0';

    res.json({
        success: true,
        metrics: {
            totalRequests: serverMetrics.totalRequests,
            averageResponseTime: `${avgResponseTime}ms`,
            uptime: {
                days: uptimeDays,
                hours: uptimeHours % 24,
                minutes: uptimeMinutes % 60,
                seconds: uptimeSeconds % 60,
                fullString: `${uptimeDays} days, ${uptimeHours % 24} hours, ${uptimeMinutes % 60} minutes`
            },
            successRate: `${successRate}%`
        }
    });
});

app.get('/', (req, res) => {
    res.send('Welcome to the API server');
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

