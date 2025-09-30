import fs from "fs";
import path from "path";
import sizeOf from "image-size";
import { RTF_CONFIG, PORT, UPLOADS_DIR } from "../config/constants";

export function createRtfImageBlock(imageBuffer: Buffer, imageType: string): string {
  try {
    const dimensions = sizeOf(imageBuffer);
    const picType = imageType === 'png' ? 'pngblip' : 'jpegblip';

    const hexString = imageBuffer.toString('hex');
    const hexChunks = hexString.match(new RegExp(`.{1,${RTF_CONFIG.hexChunkSize}}`, 'g'))?.join('\n') || '';

    const widthPx = dimensions.width || 300;
    const heightPx = dimensions.height || 300;

    let finalWidthPx = widthPx;
    let finalHeightPx = heightPx;

    if (widthPx > RTF_CONFIG.maxImageWidth) {
      const ratio = RTF_CONFIG.maxImageWidth / widthPx;
      finalWidthPx = RTF_CONFIG.maxImageWidth;
      finalHeightPx = Math.round(heightPx * ratio);
    }

    const widthTwips = finalWidthPx * RTF_CONFIG.pixelToTwips;
    const heightTwips = finalHeightPx * RTF_CONFIG.pixelToTwips;

    return `{\\pict\\${picType}\\picw${widthPx}\\pich${heightPx}\\picwgoal${widthTwips}\\pichgoal${heightTwips}\n${hexChunks}}`;
  } catch (err) {
    console.error(`[ERRO] Falha ao criar bloco de imagem RTF`, err);
    return '';
  }
}

export function imageToRtfHex(imagePath: string): string {
  try {
    const imageBuffer = fs.readFileSync(imagePath);
    const ext = path.extname(imagePath).toLowerCase().replace('.', '');
    return createRtfImageBlock(imageBuffer, ext);
  } catch (err) {
    console.error(`[ERRO] Falha ao ler ou converter imagem: ${imagePath}`, err);
    return '';
  }
}

export function processImagesInHtml(html: string): string {
  const imgRegex = /<img[^>]+src="([^">]+)"[^>]*>/gi;
  let processedHtml = html;
  const matches = Array.from(html.matchAll(imgRegex));

  for (const match of matches) {
    const fullImgTag = match[0];
    const imageUrl = match[1];
    let rtfImage = '';

    if (imageUrl && imageUrl.startsWith(`http://localhost:${PORT}/uploads/`)) {
      const filename = path.basename(imageUrl);
      const filepath = path.join(UPLOADS_DIR, filename);

      if (fs.existsSync(filepath)) {
        rtfImage = imageToRtfHex(filepath);
        console.log(`[INFO] Imagem de arquivo processada: ${filename}`);
      }
    } else if (imageUrl && imageUrl.startsWith('data:image/')) {
      const uriMatches = imageUrl.match(/^data:image\/(\w+);base64,(.+)$/);
      if (uriMatches) {
        try {
          const imageType = uriMatches[1];
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