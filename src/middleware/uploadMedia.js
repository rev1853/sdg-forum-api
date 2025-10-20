const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { randomUUID } = require('crypto');

const uploadsRoot = path.join(__dirname, '../../uploads');

const ensureUploadsRoot = () => {
  if (!fs.existsSync(uploadsRoot)) {
    fs.mkdirSync(uploadsRoot, { recursive: true });
  }
};

ensureUploadsRoot();

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const folderName = randomUUID();
    const targetDir = path.join(uploadsRoot, folderName);
    fs.mkdirSync(targetDir, { recursive: true });
    req.uploadedMediaFolder = folderName;
    cb(null, targetDir);
  },
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname || '').toLowerCase();
    const uniqueName = `${randomUUID()}${extension}`;
    req.uploadedMediaPath = path.join('uploads', req.uploadedMediaFolder, uniqueName);
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 1 * 1024 * 1024
  }
});

module.exports = upload;
