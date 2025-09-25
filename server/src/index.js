"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const html_to_rtf_1 = __importDefault(require("html-to-rtf"));
const multer_1 = __importDefault(require("multer"));
const app = (0, express_1.default)();
const PORT = 3001;
// --- 1. CONFIGURAÇÃO DE CAMINHOS (PATHS) ---
// Define um caminho absoluto e confiável para a raiz do projeto.
const PROJECT_ROOT = path_1.default.join(__dirname, '..', '..');
// Define o caminho absoluto para a pasta de uploads.
const UPLOADS_DIR = path_1.default.join(PROJECT_ROOT, 'uploads');
// Garante que a pasta de uploads exista antes de o servidor iniciar.
if (!fs_1.default.existsSync(UPLOADS_DIR)) {
    fs_1.default.mkdirSync(UPLOADS_DIR, { recursive: true });
}
// --- 2. CONFIGURAÇÃO DO MULTER PARA UPLOAD ---
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        // Usa o caminho absoluto e estável
        cb(null, UPLOADS_DIR);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path_1.default.extname(file.originalname));
    }
});
const upload = (0, multer_1.default)({ storage: storage });
// --- 3. CONFIGURAÇÃO DOS MIDDLEWARES DO EXPRESS ---
// IMPORTANTE: O 'cors' deve vir antes de todas as rotas.
app.use((0, cors_1.default)({
    origin: "http://localhost:5173" // Permite requisições apenas do seu frontend
}));
// Middlewares para interpretar o corpo das requisições (JSON e formulários)
app.use(express_1.default.json({ limit: "50mb" }));
app.use(express_1.default.urlencoded({ limit: "50mb", extended: true }));
// Middleware para servir os arquivos estáticos (imagens) da pasta 'uploads'
app.use('/uploads', express_1.default.static(UPLOADS_DIR));
// --- 4. DEFINIÇÃO DAS ROTAS DA API ---
// Rota para salvar o conteúdo do editor como RTF
app.post("/api/documents", (req, res) => {
    const { htmlContent } = req.body;
    if (!htmlContent) {
        return res.status(400).send("No content received.");
    }
    try {
        const outputDir = path_1.default.join(__dirname, "output");
        if (!fs_1.default.existsSync(outputDir)) {
            fs_1.default.mkdirSync(outputDir, { recursive: true });
        }
        const timestamp = Date.now();
        const filePath = path_1.default.join(outputDir, `document_${timestamp}.rtf`);
        const rtfContent = html_to_rtf_1.default.convertHtmlToRtf(htmlContent);
        fs_1.default.writeFileSync(filePath, rtfContent);
        res.status(201).json({
            message: "Document saved successfully!",
            filePath
        });
    }
    catch (err) {
        console.error("Error saving document:", err);
        res.status(500).send("Internal server error.");
    }
});
// Rota para upload de imagens do CKEditor
app.post("/api/upload-image", upload.single("upload"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No image received." });
    }
    const imageUrl = `http://localhost:${PORT}/uploads/${req.file.filename}`;
    // Resposta JSON esperada pelo CKEditor
    res.status(200).json({
        url: imageUrl
    });
});
// Rota de teste para verificar se o servidor está no ar
app.get("/api/ping", (_req, res) => {
    res.send("Server is running ✅");
});
// --- 5. INICIALIZAÇÃO DO SERVIDOR ---
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
//# sourceMappingURL=index.js.map