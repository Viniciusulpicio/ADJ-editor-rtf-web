import express, { Request, Response } from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import multer from "multer";
import { decode } from "html-entities";
import sizeOf from "image-size";

const app = express();
const PORT = 3001;

const SERVER_ROOT = process.cwd();
const UPLOADS_DIR = path.join(SERVER_ROOT, "uploads");
const OUTPUT_DIR = path.join(SERVER_ROOT, "output");

// Cria os diretórios se eles não existirem
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

/**
 * [NOVA FUNÇÃO] Cria o bloco de imagem RTF a partir de um buffer de imagem.
 * Centraliza a lógica de conversão e aplica a correção de quebra de linha.
 * @param imageBuffer O buffer de dados da imagem.
 * @param imageType A extensão da imagem (ex: 'png', 'jpeg').
 * @returns A string formatada da imagem para RTF.
 */
function createRtfImageBlock(imageBuffer: Buffer, imageType: string): string {
  try {
    const dimensions = sizeOf(imageBuffer);
    const picType = imageType === 'png' ? 'pngblip' : 'jpegblip';

    // Converte o buffer para uma string hexadecimal
    const hexString = imageBuffer.toString('hex');

    // **A CORREÇÃO PRINCIPAL ESTÁ AQUI**
    // Quebra a string hexadecimal em linhas com no máximo 128 caracteres
    // para garantir a compatibilidade com leitores RTF.
    const hexChunks = hexString.match(/.{1,128}/g)?.join('\n') || '';

    // Converte as dimensões de pixels para twips (1 pixel ≈ 15 twips)
    const widthTwips = (dimensions.width || 300) * 15;
    const heightTwips = (dimensions.height || 300) * 15;

    // Monta o bloco da imagem RTF com as dimensões e os dados hexadecimais formatados
    const rtfImage = `{\\pict\\${picType}\\picw${dimensions.width}\\pich${dimensions.height}\\picwgoal${widthTwips}\\pichgoal${heightTwips}\n${hexChunks}}`;

    return rtfImage;
  } catch (err) {
    console.error(`[ERRO] Falha ao criar bloco de imagem RTF`, err);
    return '';
  }
}

/**
 * [ATUALIZADA] Converte um arquivo de imagem para seu formato hexadecimal RTF.
 * @param imagePath O caminho para o arquivo de imagem.
 * @returns A string formatada da imagem para RTF.
 */
function imageToRtfHex(imagePath: string): string {
  try {
    const imageBuffer = fs.readFileSync(imagePath);
    const ext = path.extname(imagePath).toLowerCase().replace('.', '');
    return createRtfImageBlock(imageBuffer, ext);
  } catch (err) {
    console.error(`[ERRO] Falha ao ler ou converter imagem: ${imagePath}`, err);
    return '';
  }
}

/**
 * [ATUALIZADA] Encontra tags <img> no HTML e as substitui pelo formato RTF.
 * @param html A string de conteúdo HTML.
 * @returns O HTML com as imagens substituídas por placeholders RTF.
 */
function processImagesInHtml(html: string): string {
  const imgRegex = /<img[^>]+src="([^">]+)"[^>]*>/gi;
  let processedHtml = html;
  const matches = Array.from(html.matchAll(imgRegex));

  for (const match of matches) {
    const fullImgTag = match[0];
    const imageUrl = match[1];
    let rtfImage = '';

    // Processa imagens salvas localmente via upload
    if (imageUrl && imageUrl.startsWith(`http://localhost:${PORT}/uploads/`)) {
      const filename = path.basename(imageUrl);
      const filepath = path.join(UPLOADS_DIR, filename);

      if (fs.existsSync(filepath)) {
        rtfImage = imageToRtfHex(filepath);
        console.log(`[INFO] Imagem de arquivo processada: ${filename}`);
      }
    // Processa imagens em base64
    } else if (imageUrl && imageUrl.startsWith('data:image/')) {
      const uriMatches = imageUrl.match(/^data:image\/(\w+);base64,(.+)$/);
      if (uriMatches) {
        try {
          const imageType = uriMatches[1]; // 'png', 'jpeg', etc.
          const base64Data = uriMatches[2];
          const imageBuffer = Buffer.from(base64Data, 'base64');
          
          rtfImage = createRtfImageBlock(imageBuffer, imageType);
          console.log(`[INFO] Imagem base64 processada`);
        } catch (err) {
          console.error('[ERRO] Falha ao processar imagem base64:', err);
        }
      }
    }

    if (rtfImage) {
        processedHtml = processedHtml.replace(fullImgTag, `__RTF_IMAGE__${rtfImage}__RTF_IMAGE_END__`);
    }
  }

  return processedHtml;
}

/**
 * Escapa apenas o conteúdo de texto (não os comandos RTF)
 */
function escapeRtfText(text: string): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const charCode = text.charCodeAt(i);
    
    if (char === '\\') {
      result += '\\\\';
    } else if (char === '{') {
      result += '\\{';
    } else if (char === '}') {
      result += '\\}';
    } 
    else if (charCode > 127) {
      result += `\\u${charCode}?`;
    } else {
      result += char;
    }
  }
  return result;
}

/**
 * Processa listas HTML mantendo hierarquia
 */
function processLists(html: string): string {
  html = html.replace(/<ul[^>]*>/gi, '__UL_START__');
  html = html.replace(/<\/ul>/gi, '__UL_END__');
  html = html.replace(/<ol[^>]*>/gi, '__OL_START__');
  html = html.replace(/<\/ol>/gi, '__OL_END__');
  html = html.replace(/<li[^>]*>(.*?)<\/li>/gi, '__LI__$1__LI_END__');
  return html;
}

function convertHtmlToRtf(html: string): string {
  console.log("[INFO] Convertendo HTML para RTF");
  
  let content = html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  
  content = processImagesInHtml(content);
  content = decode(content);
  content = processLists(content);
  
  const replacements: Array<[RegExp, string]> = [
    [/<h1[^>]*>(.*?)<\/h1>/gi, '__H1_START__$1__H1_END__'],
    [/<h2[^>]*>(.*?)<\/h2>/gi, '__H2_START__$1__H2_END__'],
    [/<h3[^>]*>(.*?)<\/h3>/gi, '__H3_START__$1__H3_END__'],
    [/<h4[^>]*>(.*?)<\/h4>/gi, '__H4_START__$1__H4_END__'],
    [/<h5[^>]*>(.*?)<\/h5>/gi, '__H5_START__$1__H5_END__'],
    [/<h6[^>]*>(.*?)<\/h6>/gi, '__H6_START__$1__H6_END__'],
    [/<p[^>]*>/gi, '__P_START__'],
    [/<\/p>/gi, '__P_END__'],
    [/<br\s*\/?>/gi, '__BR__'],
    [/<strong[^>]*>(.*?)<\/strong>/gi, '__STRONG_START__$1__STRONG_END__'],
    [/<b[^>]*>(.*?)<\/b>/gi, '__B_START__$1__B_END__'],
    [/<em[^>]*>(.*?)<\/em>/gi, '__EM_START__$1__EM_END__'],
    [/<i[^>]*>(.*?)<\/i>/gi, '__I_START__$1__I_END__'],
    [/<u[^>]*>(.*?)<\/u>/gi, '__U_START__$1__U_END__'],
    [/<s[^>]*>(.*?)<\/s>/gi, '__STRIKE_START__$1__STRIKE_END__'],
    [/<strike[^>]*>(.*?)<\/strike>/gi, '__STRIKE_START__$1__STRIKE_END__'],
    [/<del[^>]*>(.*?)<\/del>/gi, '__STRIKE_START__$1__STRIKE_END__'],
    [/<sub[^>]*>(.*?)<\/sub>/gi, '__SUB_START__$1__SUB_END__'],
    [/<sup[^>]*>(.*?)<\/sup>/gi, '__SUP_START__$1__SUP_END__'],
    [/<a[^>]*>(.*?)<\/a>/gi, '__LINK_START__$1__LINK_END__'],
    [/<blockquote[^>]*>(.*?)<\/blockquote>/gi, '__QUOTE_START__$1__QUOTE_END__'],
    [/<code[^>]*>(.*?)<\/code>/gi, '__CODE_START__$1__CODE_END__'],
    [/<pre[^>]*>(.*?)<\/pre>/gi, '__PRE_START__$1__PRE_END__'],
    [/<div[^>]*>/gi, '__DIV_START__'],
    [/<\/div>/gi, '__DIV_END__'],
    [/<span[^>]*>/gi, ''],
    [/<\/span>/gi, ''],
    [/<table[^>]*>/gi, '__TABLE_START__'],
    [/<\/table>/gi, '__TABLE_END__'],
    [/<thead[^>]*>|<tbody[^>]*>|<tfoot[^>]*>/gi, ''],
    [/<\/thead>|<\/tbody>|<\/tfoot>/gi, ''],
    [/<tr[^>]*>/gi, '__TR_START__'],
    [/<\/tr>/gi, '__TR_END__'],
    [/<td[^>]*>(.*?)<\/td>/gi, '__TD__$1__TD_END__'],
    [/<th[^>]*>(.*?)<\/th>/gi, '__TH__$1__TH_END__'],
  ];
  
  for (const [regex, replacement] of replacements) {
    content = content.replace(regex, replacement);
  }
  
  content = content.replace(/<[^>]+>/g, '');
  content = escapeRtfText(content);
  
  content = content
    .replace(/__H1_START__/g, '\\par\\pard\\sb240\\sa120{\\b\\fs48 ')
    .replace(/__H1_END__/g, '}\\par\\pard\\sa200\\sl276\\slmult1\n')
    .replace(/__H2_START__/g, '\\par\\pard\\sb200\\sa100{\\b\\fs36 ')
    .replace(/__H2_END__/g, '}\\par\\pard\\sa200\\sl276\\slmult1\n')
    .replace(/__H3_START__/g, '\\par\\pard\\sb160\\sa80{\\b\\fs32 ')
    .replace(/__H3_END__/g, '}\\par\\pard\\sa200\\sl276\\slmult1\n')
    .replace(/__H4_START__/g, '\\par\\pard\\sb120\\sa60{\\b\\fs28 ')
    .replace(/__H4_END__/g, '}\\par\\pard\\sa200\\sl276\\slmult1\n')
    .replace(/__H5_START__/g, '\\par\\pard\\sb100\\sa50{\\b\\fs26 ')
    .replace(/__H5_END__/g, '}\\par\\pard\\sa200\\sl276\\slmult1\n')
    .replace(/__H6_START__/g, '\\par\\pard\\sb80\\sa40{\\b\\fs24 ')
    .replace(/__H6_END__/g, '}\\par\\pard\\sa200\\sl276\\slmult1\n')
    .replace(/__P_START__/g, '\\par ')
    .replace(/__P_END__/g, '\n')
    .replace(/__BR__/g, '\\line ')
    .replace(/__STRONG_START__/g, '{\\b ')
    .replace(/__STRONG_END__/g, '}')
    .replace(/__B_START__/g, '{\\b ')
    .replace(/__B_END__/g, '}')
    .replace(/__EM_START__/g, '{\\i ')
    .replace(/__EM_END__/g, '}')
    .replace(/__I_START__/g, '{\\i ')
    .replace(/__I_END__/g, '}')
    .replace(/__U_START__/g, '{\\ul ')
    .replace(/__U_END__/g, '}')
    .replace(/__STRIKE_START__/g, '{\\strike ')
    .replace(/__STRIKE_END__/g, '}')
    .replace(/__SUB_START__/g, '{\\sub ')
    .replace(/__SUB_END__/g, '}')
    .replace(/__SUP_START__/g, '{\\super ')
    .replace(/__SUP_END__/g, '}')
    .replace(/__LINK_START__/g, '{\\ul\\cf2 ')
    .replace(/__LINK_END__/g, '}')
    .replace(/__QUOTE_START__/g, '\\par\\pard\\li720\\ri720\\sb120\\sa120{\\i\\cf3 ')
    .replace(/__QUOTE_END__/g, '}\\par\\pard\\sa200\\sl276\\slmult1\n')
    .replace(/__CODE_START__/g, '{\\f1\\fs20 ')
    .replace(/__CODE_END__/g, '}')
    .replace(/__PRE_START__/g, '\\par\\pard\\sb120\\sa120{\\f1\\fs20\n')
    .replace(/__PRE_END__/g, '}\\par\\pard\\sa200\\sl276\\slmult1\n')
    .replace(/__DIV_START__/g, '\\par ')
    .replace(/__DIV_END__/g, '\\par\n')
    .replace(/__UL_START__/g, '\\par\n')
    .replace(/__UL_END__/g, '\\par\n')
    .replace(/__OL_START__/g, '\\par\n')
    .replace(/__OL_END__/g, '\\par\n')
    .replace(/__LI__/g, '\\pard\\li720\\fi-360\\bullet\\tab ')
    .replace(/__LI_END__/g, '\\par\\pard\\sa200\\sl276\\slmult1\n')
    .replace(/__TABLE_START__/g, '\\par\n')
    .replace(/__TABLE_END__/g, '\\par\n')
    .replace(/__TR_START__/g, '')
    .replace(/__TR_END__/g, '\\par\n')
    .replace(/__TD__/g, '')
    .replace(/__TD_END__/g, ' \\tab ')
    .replace(/__TH__/g, '{\\b ')
    .replace(/__TH_END__/g, '} \\tab ');
  
    content = content.replace(/__RTF_IMAGE__(.*?)__RTF_IMAGE_END__/g, (match, imageCode) => {
      let cleanImageCode = imageCode.replace(/\\\\/g, '\\').replace(/\\{/g, '{').replace(/\\}/g, '}');

      cleanImageCode = cleanImageCode.replace(/\n/g, '');

      return `\\par ${cleanImageCode} \\par`;
    });
  
  let rtf = '{\\rtf1\\ansi\\ansicpg1252\\deff0\\nouicompat\\deflang1046\n';
  rtf += '{\\fonttbl{\\f0\\fnil\\fcharset0 Calibri;}{\\f1\\fnil\\fcharset0 Courier New;}}\n';
  rtf += '{\\colortbl ;\\red0\\green0\\blue0;\\red0\\green0\\blue255;\\red128\\green128\\blue128;}\n';
  rtf += '\\viewkind4\\uc1\\pard\\sa200\\sl276\\slmult1\\f0\\fs22\n';
  rtf += content;
  rtf += '\n}';
  
  return rtf;
}

console.log("[OK] Conversor RTF carregado!");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use("/uploads", express.static(UPLOADS_DIR));

app.post("/api/upload-image", upload.single("upload"), (req, res) => {
  if (!req.file) {
    console.error("[ERRO] Upload sem arquivo");
    return res.status(400).json({ error: "Nenhuma imagem recebida." });
  }

  const imageUrl = `http://localhost:${PORT}/uploads/${req.file.filename}`;
  console.log(`[INFO] Imagem salva: ${req.file.filename}`);
  res.status(200).json({ url: imageUrl });
});

app.post("/api/documents", (req: Request, res: Response) => {
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

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", uploadsDir: UPLOADS_DIR, outputDir: OUTPUT_DIR });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`📁 Uploads: ${UPLOADS_DIR}`);
  console.log(`📄 Output: ${OUTPUT_DIR}`);
});