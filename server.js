const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const fs = require('fs');

dotenv.config();

const API_KEYS_FILE_PATH = path.join(__dirname, 'userApiKeys.json');

let userApiKeys = new Map();

const loadApiKeysFromFile = () => {
    try {
        if (fs.existsSync(API_KEYS_FILE_PATH)) {
            const data = fs.readFileSync(API_KEYS_FILE_PATH, 'utf8');
            const parsedData = JSON.parse(data);
            userApiKeys = new Map(parsedData.map(item => [item.apiKey, item]));
            console.log(`[Server Init] Loaded ${userApiKeys.size} API keys from ${API_KEYS_FILE_PATH}`);
        } else {
            console.log(`[Server Init] ${API_KEYS_FILE_PATH} not found. Starting with empty API keys.`);
            fs.writeFileSync(API_KEYS_FILE_PATH, JSON.stringify([], null, 2), 'utf8');
        }
    } catch (error) {
        console.error(`[Server Init] Error loading API keys from file: ${error.message}`);
        userApiKeys = new Map();
    }
};

const saveApiKeysToFile = () => {
    try {
        const dataToSave = Array.from(userApiKeys.values());
        fs.writeFileSync(API_KEYS_FILE_PATH, JSON.stringify(dataToSave, null, 2), 'utf8');
        console.log(`[Server] Saved ${userApiKeys.size} API keys to ${API_KEYS_FILE_PATH}`);
    } catch (error) {
        console.error(`[Server] Error saving API keys to file: ${error.message}`);
    }
};

loadApiKeysFromFile();

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

const MASTER_API_KEY = process.env.MASTER_API_KEY || 'default_master_key_for_testing';
const STATUS_PAGE_API_KEY = process.env.STATUS_PAGE_API_KEY;
if (process.env.NODE_ENV !== 'production' && !process.env.MASTER_API_KEY) {
    console.warn('WARNING: MASTER_API_KEY is not set in production. Using default key for testing.');
}
console.log(`[Server Init] STATUS_PAGE_API_KEY from .env: ${STATUS_PAGE_API_KEY ? STATUS_PAGE_API_KEY.substring(0, 8) + '...' : 'NOT SET'}`);


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

const authenticateUserApiKey = async (req, res, next) => {
    console.log(`[Auth Middleware] Request to: ${req.originalUrl}`);
    const authHeader = req.headers['authorization'];
    const userApiKey = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!userApiKey) {
        console.log('[Auth Middleware] No API Key provided. Returning 401.');
        return res.status(401).json({ success: false, message: 'Authentication failed: API Key is missing. Please visit the documentation page to get a key.' });
    }

    console.log(`[Auth Middleware] API Key provided: ${userApiKey.substring(0, 8)}...`);

    if (userApiKeys.has(userApiKey)) {
        console.log('[Auth Middleware] API Key is valid (found in Map).');
        req.isStatusCheck = false;
        
        // Update lastUsed timestamp and usageCount
        const apiKeyData = userApiKeys.get(userApiKey);
        apiKeyData.lastUsed = new Date().toISOString();
        apiKeyData.usageCount = (apiKeyData.usageCount || 0) + 1;
        userApiKeys.set(userApiKey, apiKeyData);
        saveApiKeysToFile(); // Simpan perubahan ke file
        
        next();
    } else if (userApiKey === MASTER_API_KEY) {
        console.log('[Auth Middleware] API Key is valid (Master Key).');
        req.isStatusCheck = true;
        next();
    } else if (userApiKey === STATUS_PAGE_API_KEY) {
        console.log('[Auth Middleware] API Key is valid (Status Page Key).');
        req.isStatusCheck = true;
        next();
    } else {
        console.log('[Auth Middleware] API Key is INVALID (not found in Map or not Master/Status Key). Returning 403.');
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
    skip: (req, res) => req.isStatusCheck === true
});

app.get('/api/get-new-api-key', async (req, res) => {
    const userIp = req.ip;
    const ONE_HOUR_MS = 60 * 60 * 1000;

    try {
        let existingKey = null;
        for (const [key, data] of userApiKeys.entries()) {
            if (data.ipAddress === userIp) {
                existingKey = { apiKey: key, ...data };
                break;
            }
        }

        if (existingKey) {
            const createdAtDate = new Date(existingKey.createdAt);
            if (new Date() - createdAtDate < ONE_HOUR_MS) {
                console.log(`[GET /api/get-new-api-key] Returning existing fresh API Key for IP: ${userIp}`);
                return res.json({ success: true, api_key: existingKey.apiKey, message: 'Your existing API Key has been retrieved.' });
            }
        }

        const newApiKey = generateCustomApiKey();
        const newKeyData = {
            apiKey: newApiKey,
            createdAt: new Date().toISOString(),
            ipAddress: userIp,
            lastUsed: new Date().toISOString(),
            usageCount: 0
        };
        userApiKeys.set(newApiKey, newKeyData);
        saveApiKeysToFile();

        console.log(`[GET /api/get-new-api-key] Generated and saved new API Key: ${newApiKey.substring(0, 8)}... for IP: ${userIp}`);
        res.json({ success: true, api_key: newApiKey, message: 'Your new API Key has been generated.' });

    } catch (error) {
        console.error('[GET /api/get-new-api-key] Error generating/retrieving API Key:', error);
        res.status(500).json({ success: false, message: 'Internal server error while generating API Key.' });
    }
});


app.use('/api/', authenticateUserApiKey);

app.use(express.static(path.join(__dirname, 'public'), {
    extensions: ['html']
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

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

app.get('/api/server-metrics', authenticateUserApiKey, (req, res) => {
    const uptimeMs = new Date() - serverMetrics.serverStartTime;
    // Deklarasikan semua variabel waktu di awal scope
    const uptimeSeconds = Math.floor(uptimeMs / 1000);
    const uptimeMinutes = Math.floor(uptimeSeconds / 60);
    const uptimeHours = Math.floor(uptimeMinutes / 60);
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

