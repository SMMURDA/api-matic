const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const ExifReader = require('exifreader');
const pdfParse = require('pdf-parse');
const mime = require('mime-types');

const router = express.Router();
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 } // Maksimum 10MB
});

function gpsToDecimal(gpsData, ref) {
  if (!gpsData || gpsData.length !== 3) return null;
  let [d, m, s] = gpsData;
  let dec = d + m / 60 + s / 3600;
  return (ref === 'S' || ref === 'W') ? -dec : dec;
}

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'kB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function calculateChecksum(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('error', reject);
    stream.on('data', chunk => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

function safeUnlink(filePath) {
  try {
    fs.unlinkSync(filePath);
    console.log(`[CLEANUP] File deleted: ${filePath}`);
  } catch (err) {
    console.warn(`[CLEANUP] Failed to delete file: ${filePath}`, err.message);
  }
}

router.post('/', upload.single('file'), async (req, res) => {
  console.log('[REQUEST] POST /metadata');

  if (!req.file) {
    console.error('[ERROR] No file uploaded');
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const { path: filePath, originalname, size } = req.file;
  const ext = path.extname(originalname).toLowerCase();
  const mimeType = mime.lookup(ext) || 'application/octet-stream';

  console.log(`[UPLOAD] Received file: ${originalname}`);
  console.log(`[UPLOAD] Path: ${filePath}, Size: ${size}, Ext: ${ext}, MIME: ${mimeType}`);

  if (size > 10 * 1024 * 1024) {
    safeUnlink(filePath);
    return res.status(400).json({ error: 'File too large (max 10MB)' });
  }

  try {
    const checksum = await calculateChecksum(filePath);
    console.log(`[HASH] SHA256: ${checksum}`);

    if (['.jpg', '.jpeg', '.png'].includes(ext)) {
      console.log('[INFO] Processing image file...');
      const buffer = fs.readFileSync(filePath);
      const tags = ExifReader.load(buffer);
      let metadata = {};

      try {
        metadata = await sharp(buffer).metadata();
      } catch (err) {
        console.error('[SHARP ERROR]', err.message);
        safeUnlink(filePath);
        return res.status(500).json({ error: 'Failed to read image metadata' });
      }

      const latitude = gpsToDecimal(tags.GPSLatitude?.description, tags.GPSLatitudeRef?.description);
      const longitude = gpsToDecimal(tags.GPSLongitude?.description, tags.GPSLongitudeRef?.description);
      const location = (latitude != null && longitude != null) ? { latitude, longitude } : null;

      const response = {
        Checksum: checksum,
        Filename: originalname,
        Filesize: formatBytes(size),
        Filetype: metadata.format ? metadata.format.toUpperCase() : mimeType,
        Filetypeextension: ext.slice(1),
        Mimetype: mimeType,
        Exifbyteorder: tags.ByteOrder?.description || 'Unknown',
        Orientation: tags.Orientation?.description || 'Unknown',
        Jfifversion: tags.JFIFVersion?.description || 'Unknown',
        Resolutionunit: tags.ResolutionUnit?.description || 'Unknown',
        Xresolution: tags.XResolution?.description || 1,
        Yresolution: tags.YResolution?.description || 1,
        Imagewidth: metadata.width,
        Imageheight: metadata.height,
        Encodingprocess: metadata.encoding || 'Baseline DCT, Huffman coding',
        Bitspersample: metadata.depth || 8,
        Colorcomponents: metadata.channels || 3,
        Ycbcrsubsampling: tags.YCbCrSubSampling?.description
          ? `YCbCr${tags.YCbCrSubSampling.description}`
          : 'Unknown',
        Imagesize: `${metadata.width}x${metadata.height}`,
        Megapixels: ((metadata.width * metadata.height) / 1_000_000).toFixed(1),
        Category: 'image',
        Location: location,
        DateTimeOriginal: tags.DateTimeOriginal?.description || 'Unknown',
      };

      safeUnlink(filePath);
      console.log('[RESPONSE] Image metadata sent');
      return res.json(response);
    }

    if (ext === '.pdf') {
      console.log('[INFO] Processing PDF file...');
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);

      const response = {
        Checksum: checksum,
        Filename: originalname,
        Filesize: formatBytes(size),
        Filetype: 'PDF',
        Filetypeextension: ext.slice(1),
        Mimetype: mimeType,
        Title: data.info?.Title || 'Unknown',
        Author: data.info?.Author || 'Unknown',
        Subject: data.info?.Subject || 'Unknown',
        Keywords: data.info?.Keywords || 'Unknown',
        CreationDate: data.info?.CreationDate || 'Unknown',
        ModDate: data.info?.ModDate || 'Unknown',
        NumberOfPages: data.numpages,
        Category: 'document',
      };

      safeUnlink(filePath);
      console.log('[RESPONSE] PDF metadata sent');
      return res.json(response);
    }

    safeUnlink(filePath);
    console.warn('[WARN] Unsupported file type');
    return res.status(400).json({ error: 'Unsupported file type' });
  } catch (error) {
    safeUnlink(filePath);
    console.error('[ERROR]', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

module.exports = router;
