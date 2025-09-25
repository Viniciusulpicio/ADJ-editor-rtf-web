import express, { Request, Response } from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import htmlToRtf from "html-to-rtf";
import multer from "multer";

const app = express();
const PORT = 3001;

// --- 1. CONFIGURAÇÃO DE CAMINHOS (MAIS ROBUSTA) ---
// Usamos 'process.cwd()' que aponta para a raiz do projeto do servidor (a pasta 'server').
// Isso é mais estável do que '__dirname', especialmente em projetos TypeScript.
const SERVER_ROOT = process.cwd();

// A pasta 'uploads' agora será criada DENTRO da pasta 'server'. Fica mais organizado.
const UPLOADS_DIR = path.join(SERVER_ROOT, 'uploads');
const OUTPUT_DIR = path.join(SERVER_ROOT, 'output');

// Log de depuração: Mostra o caminho exato que será usado assim que o servidor iniciar.
console.log(`[INFO] Diretório de uploads configurado em: ${UPLOADS_DIR}`);

// Garante que as pastas de uploads e output existam.
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}


// --- 2. CONFIGURAÇÃO DO MULTER PARA UPLOAD (MAIS SEGURO) ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Filtro de segurança para aceitar apenas arquivos de imagem.
const imageFileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.mimetype.startsWith("image/")) {
        // null no primeiro argumento significa "sem erro".
        cb(null, true);
    } else {
        // Passa um Error para rejeitar o arquivo e informar o motivo.
        cb(new Error('Apenas arquivos de imagem são permitidos!'));
    }
};

const upload = multer({
    storage: storage,
    fileFilter: imageFileFilter, // Aplica o filtro de segurança
    limits: { fileSize: 10 * 1024 * 1024 } // Limita o tamanho dos arquivos para 10MB
});


// --- 3. CONFIGURAÇÃO DOS MIDDLEWARES DO EXPRESS ---
app.use(cors());


app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Middleware para servir os arquivos estáticos (imagens) da pasta 'uploads'
// Quando o navegador pedir por '/uploads/imagem.png', o Express vai procurar na pasta UPLOADS_DIR.
app.use('/uploads', express.static(UPLOADS_DIR));


// --- 4. DEFINIÇÃO DAS ROTAS DA API ---

// Rota para salvar o conteúdo do editor como RTF
app.post("/api/documents", (req: Request, res: Response) => {
  const { htmlContent } = req.body as { htmlContent: string };
  if (!htmlContent) {
    return res.status(400).send("Nenhum conteúdo recebido.");
  }
  try {
    const timestamp = Date.now();
    const filePath = path.join(OUTPUT_DIR, `document_${timestamp}.rtf`);
    const rtfContent = htmlToRtf.convertHtmlToRtf(htmlContent);

    fs.writeFileSync(filePath, rtfContent);

    res.status(201).json({
      message: "Documento salvo com sucesso!",
      filePath
    });
  } catch (err) {
    console.error("Erro ao salvar o documento:", err);
    res.status(500).send("Erro interno do servidor.");
  }
});

// Rota para upload de imagens do CKEditor
app.post("/api/upload-image", upload.single("upload"), (req: Request, res: Response) => {
  if (!req.file) {
    // Este erro pode acontecer se o filtro rejeitar o arquivo.
    return res.status(400).json({ error: "Nenhuma imagem recebida ou tipo de arquivo inválido." });
  }

  // A URL que o CKEditor usará para exibir a imagem
  const imageUrl = `http://localhost:${PORT}/uploads/${req.file.filename}`;

  // Resposta JSON esperada pelo CKEditor
  res.status(200).json({
    url: imageUrl
  });
});

// Rota de teste para verificar se o servidor está no ar
app.get("/api/ping", (_req: Request, res: Response) => {
  res.send("Servidor está no ar ✅");
});


// --- 5. INICIALIZAÇÃO DO SERVIDOR ---
app.listen(PORT, () => {
  console.log(`🚀 Servidor está rodando em http://localhost:${PORT}`);
});