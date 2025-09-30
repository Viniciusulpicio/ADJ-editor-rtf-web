import multer from "multer";
import path from "path";
import { UPLOADS_DIR } from "../config/constants";

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

export const upload = multer({ 
  storage, 
  limits: { fileSize: 10 * 1024 * 1024 } 
});