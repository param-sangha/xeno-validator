const express = require('express');
const cors = require('cors');
const multer = require('multer');
const Papa = require('papaparse');

const app = express();
app.use(cors());

const upload = multer({ storage: multer.memoryStorage() });

// Country -> required phone digit count
const PHONE_RULES = {
  IN: 10,
  SG: 8,
  US: 10,
  GB: 10,
  AE: 9,
  AU: 9,
};

const PAYMENT_MODES = ['cash', 'card', 'upi', 'netbanking', 'wallet', 'credit', 'debit'];

function validatePhone(phone, countryCode) {
  if (!phone) return 'Phone missing';
  const digits = phone.toString().replace(/\D/g, '');
  const required = PHONE_RULES[countryCode?.toUpperCase()];
  if (!required) return `Unknown country code: ${countryCode}`;
  if (digits.length !== required) return `Phone must be ${required} digits for ${countryCode}`;
  return null;
}

function validateDate(dateStr) {
  if (!dateStr) return 'Date missing';
  const formats = [/^\d{4}-\d{2}-\d{2}$/, /^\d{2}\/\d{2}\/\d{4}$/, /^\d{2}-\d{2}-\d{4}$/];
  if (!formats.some(f => f.test(dateStr))) return `Invalid date format: ${dateStr}`;
  return null;
}

function validateTime(timeStr) {
  if (!timeStr) return 'Time missing';
  if (!/^\d{2}:\d{2}(:\d{2})?$/.test(timeStr)) return `Invalid time format: ${timeStr}`;
  return null;
}

function validatePaymentMode(mode) {
  if (!mode) return 'Payment mode missing';
  if (!PAYMENT_MODES.includes(mode.toLowerCase())) return `Unknown payment mode: ${mode}`;
  return null;
}

function validateAmount(amount) {
  if (amount === '' || amount === undefined) return 'Amount missing';
  const n = parseFloat(amount);
  if (isNaN(n)) return `Amount not a number: ${amount}`;
  if (n < 0) return `Amount negative: ${amount}`;
  return null;
}

function validateRow(row) {
  const errors = [];

  if (!row.order_id) errors.push('Missing order_id');
  if (!row.customer_id) errors.push('Missing customer_id');

  const phoneErr = validatePhone(row.phone_number, row.country_code);
  if (phoneErr) errors.push(phoneErr);

  const dateErr = validateDate(row.order_date);
  if (dateErr) errors.push(dateErr);

  const timeErr = validateTime(row.order_time);
  if (timeErr) errors.push(timeErr);

  const payErr = validatePaymentMode(row.payment_mode);
  if (payErr) errors.push(payErr);

  const amtErr = validateAmount(row.amount);
  if (amtErr) errors.push(amtErr);

  if (row.quantity !== undefined) {
    const q = parseInt(row.quantity);
    if (isNaN(q) || q <= 0) errors.push(`Invalid quantity: ${row.quantity}`);
  }

  return errors;
}

function cleanRow(row) {
  const cleaned = {};
  for (const key in row) {
    cleaned[key.trim()] = (row[key] || '').toString().trim();
  }
  if (cleaned.payment_mode) cleaned.payment_mode = cleaned.payment_mode.toLowerCase();
  if (cleaned.phone_number) cleaned.phone_number = cleaned.phone_number.replace(/\D/g, '');
  return cleaned;
}

function chunkArray(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}

app.post('/validate', upload.single('file'), (req, res) => {
  const csvText = req.file.buffer.toString('utf-8');
  const chunkSize = parseInt(req.query.chunkSize) || 100;

  const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
  const rows = parsed.data;

  const results = rows.map((row, i) => {
    const cleaned = cleanRow(row);
    const errors = validateRow(cleaned);
    return { rowNumber: i + 2, original: row, cleaned, errors, isValid: errors.length === 0 };
  });

  const validRows = results.filter(r => r.isValid).map(r => r.cleaned);
  const invalidRows = results.filter(r => !r.isValid);

  const cleanedCSV = Papa.unparse(validRows);
  const chunks = chunkArray(validRows, chunkSize).map((c, i) => ({
    index: i + 1,
    csv: Papa.unparse(c),
  }));

  res.json({
    totalRows: rows.length,
    validCount: validRows.length,
    invalidCount: invalidRows.length,
    invalidRows,
    cleanedCSV,
    chunks,
  });
});

app.listen(3001, () => console.log('Server running on http://localhost:3001'));