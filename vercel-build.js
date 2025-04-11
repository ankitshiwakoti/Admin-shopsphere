// This file is used to prepare the application for Vercel deployment
// It ensures proper ES modules support and creates necessary directories

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Created uploads directory');
}

// Log environment for debugging
console.log('Node version:', process.version);
console.log('Environment:', process.env.NODE_ENV);
console.log('Vercel deployment preparation complete'); 