import { Router, Request, Response } from "express";
import fs from "fs";
import path from "path";
import { convertHtmlToRtf } from "../services/rtfConverter";
import { readRtfFile, updateRtfFile } from "../services/rtfParser";
import { OUTPUT_DIR } from "../config/constants";

const router = Router();

// Configuração: Máximo de páginas por livro (esta no .env para ficar mais facil de ajustar)
if (!process.env.MAX_PAGES_PER_BOOK) {
  throw new Error("❌ Variável de ambiente MAX_PAGES_PER_BOOK não está definida no .env");
}

const MAX_PAGES_PER_BOOK = parseInt(process.env.MAX_PAGES_PER_BOOK, 10);

if (isNaN(MAX_PAGES_PER_BOOK)) {
  throw new Error("❌ MAX_PAGES_PER_BOOK no .env precisa ser um número válido");
}


// Estrutura de metadata para cada documento
interface DocumentMetadata {
  filename: string;
  bookName: string;
  pageNumber: number;
  filePath: string;
  size: number;
  createdAt: Date;
  modifiedAt: Date;
}

// Função auxiliar: Carregar todos os documentos com metadata
function loadAllDocuments(): DocumentMetadata[] {
  const documents: DocumentMetadata[] = [];
  
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    return documents;
  }

  // Ler todas as pastas (livros)
  const bookFolders = fs.readdirSync(OUTPUT_DIR, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  bookFolders.forEach(bookName => {
    const bookPath = path.join(OUTPUT_DIR, bookName);
    const files = fs.readdirSync(bookPath)
      .filter(file => file.endsWith('.rtf'));

    files.forEach(file => {
      const filePath = path.join(bookPath, file);
      const stats = fs.statSync(filePath);
      
      // Extrair número da página do nome do arquivo: "3_introducao.rtf" -> 3
      const match = file.match(/^(\d+)_/);
      const pageNumber = match ? parseInt(match[1]) : 0;

      documents.push({
        filename: file,
        bookName,
        pageNumber,
        filePath,
        size: stats.size,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime
      });
    });
  });

  return documents;
}

// Função auxiliar: Obter todos os livros existentes
function getAllBooks(): string[] {
  if (!fs.existsSync(OUTPUT_DIR)) {
    return [];
  }

  return fs.readdirSync(OUTPUT_DIR, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)
    .sort((a, b) => {
      // Ordenar livros numericamente: Livro-1, Livro-2, etc
      const numA = parseInt(a.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.replace(/\D/g, '')) || 0;
      return numA - numB;
    });
}

// Função auxiliar: Contar páginas em um livro
function countPagesInBook(bookName: string): number {
  const bookPath = path.join(OUTPUT_DIR, bookName);
  
  if (!fs.existsSync(bookPath)) {
    return 0;
  }

  return fs.readdirSync(bookPath)
    .filter(file => file.endsWith('.rtf'))
    .length;
}

// Função auxiliar: Obter ou criar próximo livro disponível
function getOrCreateNextBook(): { bookName: string; pageNumber: number } {
  const existingBooks = getAllBooks();

  if (existingBooks.length === 0) {
    // Criar primeiro livro
    const newBookName = "Livro-1";
    const bookPath = path.join(OUTPUT_DIR, newBookName);
    fs.mkdirSync(bookPath, { recursive: true });
    return { bookName: newBookName, pageNumber: 1 };
  }

  // Verificar o último livro
  const lastBook = existingBooks[existingBooks.length - 1];
  const pagesInLastBook = countPagesInBook(lastBook);

  if (pagesInLastBook < MAX_PAGES_PER_BOOK) {
    // Adicionar ao último livro existente
    return { bookName: lastBook, pageNumber: pagesInLastBook + 1 };
  }

  // Criar novo livro
  const lastBookNumber = parseInt(lastBook.replace(/\D/g, '')) || 0;
  const newBookName = `Livro-${lastBookNumber + 1}`;
  const bookPath = path.join(OUTPUT_DIR, newBookName);
  fs.mkdirSync(bookPath, { recursive: true });
  
  return { bookName: newBookName, pageNumber: 1 };
}

// ==================== ROTAS ====================

// GET /api/books - Listar todos os livros existentes
router.get("/books", (req: Request, res: Response) => {
  try {
    const books = getAllBooks();
    res.status(200).json({ books });
  } catch (err: any) {
    console.error("[ERRO] Falha ao listar livros:", err);
    res.status(500).json({ error: "Erro ao listar livros", details: err.message });
  }
});

// POST /api/documents - Criar novo documento (livro e página automáticos)
router.post("/documents", (req: Request, res: Response) => {
  const { htmlContent, filename } = req.body as { 
    htmlContent: string; 
    filename?: string;
  };
  
  if (!htmlContent) {
    console.error("[ERRO] Requisição sem conteúdo HTML");
    return res.status(400).json({ error: "Nenhum conteúdo recebido." });
  }

  if (!filename || !filename.trim()) {
    return res.status(400).json({ error: "Nome do arquivo é obrigatório." });
  }

  try {
    const rtfContent = convertHtmlToRtf(htmlContent);

    if (!rtfContent || typeof rtfContent !== "string") {
      throw new Error("Conversão RTF retornou conteúdo inválido");
    }

    // Sanitizar nome do arquivo
    const sanitizedFilename = filename.trim().replace(/[^a-zA-Z0-9-_]/g, '_');

    // Obter ou criar livro e página automaticamente
    const { bookName, pageNumber } = getOrCreateNextBook();

    // Montar nome final do arquivo: "15_introducao.rtf"
    const finalFilename = `${pageNumber}_${sanitizedFilename}.rtf`;
    const bookPath = path.join(OUTPUT_DIR, bookName);
    const filePath = path.join(bookPath, finalFilename);
    
    // Verificar se arquivo já existe (improvável, mas por segurança)
    if (fs.existsSync(filePath)) {
      return res.status(409).json({ 
        error: "Erro interno: arquivo já existe. Tente novamente." 
      });
    }
    
    fs.writeFileSync(filePath, rtfContent, "utf-8");

    console.log(`[SUCESSO] RTF salvo: ${bookName}/Página ${pageNumber} (${filePath})`);
    
    res.status(201).json({ 
      message: "Documento RTF salvo com sucesso!", 
      filePath,
      filename: finalFilename,
      bookName,
      pageNumber,
      size: rtfContent.length,
      location: `${bookName}, Página ${pageNumber}` // Informação para localização física
    });
  } catch (err: any) {
    console.error("[ERRO] Falha ao gerar RTF:", err);
    res.status(500).json({ error: "Erro ao gerar RTF", details: err.message });
  }
});

// GET /api/documents - Listar todos os documentos
router.get("/documents", (req: Request, res: Response) => {
  try {
    const documents = loadAllDocuments();
    res.status(200).json({ documents });
  } catch (err: any) {
    console.error("[ERRO] Falha ao listar documentos:", err);
    res.status(500).json({ error: "Erro ao listar documentos", details: err.message });
  }
});

// GET /api/documents/:filename - Ler documento específico
router.get("/documents/:filename", (req: Request, res: Response) => {
  const { filename } = req.params;
  
  try {
    // Procurar o arquivo em todos os livros
    const allDocs = loadAllDocuments();
    const doc = allDocs.find(d => d.filename === filename);
    
    if (!doc) {
      return res.status(404).json({ error: "Documento não encontrado" });
    }
    
    const htmlContent = readRtfFile(doc.filePath);
    
    res.status(200).json({ 
      filename: doc.filename,
      bookName: doc.bookName,
      pageNumber: doc.pageNumber,
      filePath: doc.filePath,
      location: `${doc.bookName}, Página ${doc.pageNumber}`,
      htmlContent 
    });
  } catch (err: any) {
    console.error("[ERRO] Falha ao ler documento:", err);
    res.status(500).json({ error: "Erro ao ler documento", details: err.message });
  }
});

// PUT /api/documents/:filename - Atualizar documento existente
router.put("/documents/:filename", (req: Request, res: Response) => {
  const { filename } = req.params;
  const { htmlContent } = req.body as { htmlContent: string };
  
  if (!htmlContent) {
    return res.status(400).json({ error: "Nenhum conteúdo recebido." });
  }
  
  try {
    // Procurar o arquivo em todos os livros
    const allDocs = loadAllDocuments();
    const doc = allDocs.find(d => d.filename === filename);
    
    if (!doc) {
      return res.status(404).json({ error: "Documento não encontrado" });
    }
    
    updateRtfFile(doc.filePath, htmlContent, convertHtmlToRtf);
    
    res.status(200).json({ 
      message: "Documento atualizado com sucesso!",
      filename: doc.filename,
      bookName: doc.bookName,
      pageNumber: doc.pageNumber,
      filePath: doc.filePath,
      location: `${doc.bookName}, Página ${doc.pageNumber}`
    });
  } catch (err: any) {
    console.error("[ERRO] Falha ao atualizar documento:", err);
    res.status(500).json({ error: "Erro ao atualizar documento", details: err.message });
  }
});

// DELETE /api/documents/:filename - Deletar documento
router.delete("/documents/:filename", (req: Request, res: Response) => {
  const { filename } = req.params;
  
  try {
    // Procurar o arquivo em todos os livros
    const allDocs = loadAllDocuments();
    const doc = allDocs.find(d => d.filename === filename);
    
    if (!doc) {
      return res.status(404).json({ error: "Documento não encontrado" });
    }
    
    fs.unlinkSync(doc.filePath);
    console.log(`[SUCESSO] Documento deletado: ${doc.filePath}`);
    
    // Nota: NÃO remover pasta do livro mesmo se vazia (para manter numeração física)
    
    res.status(200).json({ 
      message: "Documento excluído com sucesso!",
      filename: doc.filename
    });
  } catch (err: any) {
    console.error("[ERRO] Falha ao deletar documento:", err);
    res.status(500).json({ error: "Erro ao deletar documento", details: err.message });
  }
});

// GET /api/stats - Estatísticas do sistema
router.get("/stats", (req: Request, res: Response) => {
  try {
    const books = getAllBooks();
    const totalDocuments = loadAllDocuments().length;
    
    const bookStats = books.map(bookName => ({
      bookName,
      pageCount: countPagesInBook(bookName),
      isFull: countPagesInBook(bookName) >= MAX_PAGES_PER_BOOK
    }));

    res.status(200).json({
      totalBooks: books.length,
      totalDocuments,
      maxPagesPerBook: MAX_PAGES_PER_BOOK,
      books: bookStats
    });
  } catch (err: any) {
    console.error("[ERRO] Falha ao obter estatísticas:", err);
    res.status(500).json({ error: "Erro ao obter estatísticas", details: err.message });
  }
});

export default router;