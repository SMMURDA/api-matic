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

const apiLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 10,
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again after 10 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use('/api/', apiLimiter);

app.use(express.static(path.join(__dirname, 'public'), {
    extensions: ['html']
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/api/whois', whoisRoute);
app.use('/api/embed', embedRoute);
app.use('/api/shorten', shortenRoute);
app.use('/api/randomuser', randomUserRoute);
app.use('/api/iplocator', ipLocatorRoute);
app.use('/api/docparser', docParserRoute);
app.use('/api/qrcode', qrCodeRoute);
app.use('/api/deepseek', deepseekRoute);
app.use('/api/gemini', geminiRoute);
app.use('/api/llama', llamaRoute);
app.use('/api/microsoft', microsoftRoute);
app.use('/api/nvidia', nvidiaRoute);
app.use('/api/ssl', sslRoute);
app.use('/api/metadata', metadataRoute);
app.use('/api/dns', dnsRoute);
app.use('/api/translate', translateRoute);
app.use('/api/currency', currencyRoute);
app.use('/api/asciiart', asciiartRoute);
app.use('/api/hash', hashRoute);
app.use('/api/leet', leetRoute);

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

