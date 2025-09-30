import path from "path";

export const PORT = 3001;
export const SERVER_ROOT = process.cwd();
export const UPLOADS_DIR = path.join(SERVER_ROOT, "uploads");
export const OUTPUT_DIR = path.join(SERVER_ROOT, "output");

export const RTF_CONFIG = {
  maxImageWidth: 400,
  pixelToTwips: 15,
  hexChunkSize: 128,
};