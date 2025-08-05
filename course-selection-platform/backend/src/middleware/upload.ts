import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { Request } from 'express';
import config from '../config';

// Configure storage
const storage = multer.diskStorage({
  destination: (_req: Request, file: Express.Multer.File, cb) => {
    let uploadPath = 'uploads/';
    
    if (file.fieldname === 'avatar') {
      uploadPath += 'avatars/';
    } else if (file.mimetype.startsWith('image/')) {
      uploadPath += 'images/';
    } else {
      uploadPath += 'documents/';
    }
    
    cb(null, uploadPath);
  },
  filename: (_req: Request, file: Express.Multer.File, cb) => {
    // Generate unique filename
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname);
    const filename = `${file.fieldname}-${Date.now()}-${uniqueSuffix}${ext}`;
    cb(null, filename);
  }
});

// File filter
const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (config.upload.allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, PDF, and Word documents are allowed.'));
  }
};

// Create multer instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.upload.maxFileSize
  }
});

export default upload;