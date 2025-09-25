// src/index.ts
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import htmlToRtf from "html-to-rtf";

const app = express();

// === MIDDLEWARES ===
// CORS global, aplicado antes das rotas
app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// JSON e URL-encoded
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// === ROTAS ===
// Rota POST para salvar documentos
app.post("/api/documents", (req, res) => {
  const { htmlContent } = req.body as { htmlContent: string };
  if (!htmlContent) return res.status(400).send("Nenhum conteúdo recebido.");

  try {
    const outputDir = path.join(__dirname, "output");
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);
    const timestamp = Date.now();
    const filePath = path.join(outputDir, `document_${timestamp}.rtf`);

    const rtfContent = htmlToRtf.convertHtmlToRtf(htmlContent);
    fs.writeFileSync(filePath, rtfContent);

    res.status(201).json({
      message: "Documento salvo com sucesso!",
      filePath
    });
  } catch (err) {
    console.error("Erro ao processar RTF:", err);
    res.status(500).send("Erro interno.");
  }
});

// Rota teste GET
app.get("/api/ping", (_req, res) => {
  res.send("Servidor rodando ✅");
});

// === START SERVER ===
const PORT = 3001;
app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));