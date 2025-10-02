

import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import fs from "fs";
import { PORT, UPLOADS_DIR, OUTPUT_DIR } from "./config/constants";
import uploadRoutes from "./routes/uploadRoutes";
import documentRoutes from "./routes/documentRoutes";


const app = express();

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use("/uploads", express.static(UPLOADS_DIR));

app.use("/api", uploadRoutes);
app.use("/api", documentRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", uploadsDir: UPLOADS_DIR, outputDir: OUTPUT_DIR });
});

app.listen(PORT, () => {
  console.log(`\n Servidor rodando em http://localhost:${PORT}`);
});