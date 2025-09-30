import { Router, Request, Response } from "express";
import fs from "fs";
import path from "path";
import { convertHtmlToRtf } from "../services/rtfConverter";
import { readRtfFile, updateRtfFile } from "../services/rtfParser";
import { OUTPUT_DIR } from "../config/constants";

const router = Router();

// Criar documento RTF
router.post("/documents", (req: Request, res: Response) => {
  const { htmlContent } = req.body as { htmlContent: string };
  
  if (!htmlContent) {
    console.error("[ERRO] Requisição sem conteúdo HTML");
    return res.status(400).json({ error: "Nenhum conteúdo recebido." });
  }

  try {
    const rtfContent = convertHtmlToRtf(htmlContent);

    if (!rtfContent || typeof rtfContent !== "string") {
      throw new Error("Conversão RTF retornou conteúdo inválido");
    }

    const timestamp = Date.now();
    const filename = `document_${timestamp}.rtf`;
    const filePath = path.join(OUTPUT_DIR, filename);
    
    fs.writeFileSync(filePath, rtfContent, "utf-8");

    console.log(`[SUCESSO] RTF salvo: ${filePath}`);
    
    res.status(201).json({ 
      message: "Documento RTF salvo com sucesso!", 
      filePath,
      filename,
      size: rtfContent.length
    });
  } catch (err: any) {
    console.error("[ERRO] Falha ao gerar RTF:", err);
    res.status(500).json({ error: "Erro ao gerar RTF", details: err.message });
  }
});

// Listar documentos RTF
router.get("/documents", (req: Request, res: Response) => {
  try {
    const files = fs.readdirSync(OUTPUT_DIR)
      .filter(file => file.endsWith('.rtf'))
      .map(file => {
        const filePath = path.join(OUTPUT_DIR, file);
        const stats = fs.statSync(filePath);
        return {
          filename: file,
          filePath,
          size: stats.size,
          createdAt: stats.birthtime,
          modifiedAt: stats.mtime
        };
      })
      .sort((a, b) => b.modifiedAt.getTime() - a.modifiedAt.getTime());
    
    res.status(200).json({ documents: files });
  } catch (err: any) {
    console.error("[ERRO] Falha ao listar documentos:", err);
    res.status(500).json({ error: "Erro ao listar documentos", details: err.message });
  }
});

// Ler documento RTF específico
router.get("/documents/:filename", (req: Request, res: Response) => {
  const { filename } = req.params;
  
  try {
    const filePath = path.join(OUTPUT_DIR, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Documento não encontrado" });
    }
    
    const htmlContent = readRtfFile(filePath);
    
    res.status(200).json({ 
      filename,
      filePath,
      htmlContent 
    });
  } catch (err: any) {
    console.error("[ERRO] Falha ao ler documento:", err);
    res.status(500).json({ error: "Erro ao ler documento", details: err.message });
  }
});

// Atualizar documento RTF existente
router.put("/documents/:filename", (req: Request, res: Response) => {
  const { filename } = req.params;
  const { htmlContent } = req.body as { htmlContent: string };
  
  if (!htmlContent) {
    return res.status(400).json({ error: "Nenhum conteúdo recebido." });
  }
  
  try {
    const filePath = path.join(OUTPUT_DIR, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Documento não encontrado" });
    }
    
    updateRtfFile(filePath, htmlContent, convertHtmlToRtf);
    
    res.status(200).json({ 
      message: "Documento atualizado com sucesso!",
      filename,
      filePath
    });
  } catch (err: any) {
    console.error("[ERRO] Falha ao atualizar documento:", err);
    res.status(500).json({ error: "Erro ao atualizar documento", details: err.message });
  }
});

export default router;