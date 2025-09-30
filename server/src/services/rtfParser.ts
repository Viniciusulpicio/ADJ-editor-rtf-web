import fs from "fs";

export function parseRtfToHtml(rtfContent: string): string {
  console.log("[INFO] Parseando RTF para HTML");
  
  let content = rtfContent;
  
  // 1. Extrair e substituir imagens por placeholders
  const images: { placeholder: string; base64: string }[] = [];
  let imageCounter = 0;
  
  content = content.replace(/\{\\pict\\(jpegblip|pngblip)\\picw(\d+)\\pich(\d+)\\picwgoal(\d+)\\pichgoal(\d+)\n([\s\S]*?)\}/g, 
    (match, type, picw, pich, picwgoal, pichgoal, hexData) => {
      try {
        const cleanHex = hexData.replace(/\n/g, '').replace(/\s/g, '');
        const buffer = Buffer.from(cleanHex, 'hex');
        const base64 = buffer.toString('base64');
        const imageType = type === 'pngblip' ? 'png' : 'jpeg';
        const dataUri = `data:image/${imageType};base64,${base64}`;
        
        const placeholder = `###IMAGE_${imageCounter}###`;
        images.push({ placeholder, base64: dataUri });
        imageCounter++;
        
        return ` ${placeholder} `;
      } catch (err) {
        console.error('[ERRO] Falha ao converter imagem:', err);
        return '';
      }
    }
  );
  
  // 2. Remover cabeçalhos RTF
  content = content.replace(/\{\\rtf1[^\n]*\n/g, '');
  content = content.replace(/\{\\fonttbl[\s\S]*?\}\n/g, '');
  content = content.replace(/\{\\colortbl[\s\S]*?\}\n/g, '');
  content = content.replace(/\\viewkind\d+\\uc\d+\\pard\\sa\d+\\f\d+\\fs\d+\n/g, '');
  
  // 3. Converter headings
  content = content.replace(/\\par\\pard\\sb240\\sa120\{\\b\\fs48\s+(.*?)\}\\par\\pard\\sa200\\sl276\\slmult1\n/g, '<h1>$1</h1>\n');
  content = content.replace(/\\par\\pard\\sb200\\sa100\{\\b\\fs36\s+(.*?)\}\\par\\pard\\sa200\\sl276\\slmult1\n/g, '<h2>$1</h2>\n');
  content = content.replace(/\\par\\pard\\sb160\\sa80\{\\b\\fs32\s+(.*?)\}\\par\\pard\\sa200\\sl276\\slmult1\n/g, '<h3>$1</h3>\n');
  content = content.replace(/\\par\\pard\\sb120\\sa60\{\\b\\fs28\s+(.*?)\}\\par\\pard\\sa200\\sl276\\slmult1\n/g, '<h4>$1</h4>\n');
  content = content.replace(/\\par\\pard\\sb100\\sa50\{\\b\\fs26\s+(.*?)\}\\par\\pard\\sa200\\sl276\\slmult1\n/g, '<h5>$1</h5>\n');
  content = content.replace(/\\par\\pard\\sb80\\sa40\{\\b\\fs24\s+(.*?)\}\\par\\pard\\sa200\\sl276\\slmult1\n/g, '<h6>$1</h6>\n');
  
  // 4. Formatação inline (antes de remover chaves)
  content = content.replace(/\{\\b\s+([^}]+)\}/g, '<strong>$1</strong>');
  content = content.replace(/\{\\i\s+([^}]+)\}/g, '<em>$1</em>');
  content = content.replace(/\{\\ul\s+([^}]+)\}/g, '<u>$1</u>');
  content = content.replace(/\{\\strike\s+([^}]+)\}/g, '<s>$1</s>');
  content = content.replace(/\{\\sub\s+([^}]+)\}/g, '<sub>$1</sub>');
  content = content.replace(/\{\\super\s+([^}]+)\}/g, '<sup>$1</sup>');
  content = content.replace(/\{\\ul\\cf2\s+([^}]+)\}/g, '<a href="#">$1</a>');
  
  // 5. Citações
  content = content.replace(/\\par\\pard\\li720\\ri720\\sb120\\sa120\{\\i\\cf3\s+(.*?)\}\\par\\pard\\sa200\\sl276\\slmult1\n/g, '<blockquote>$1</blockquote>\n');
  
  // 6. Código
  content = content.replace(/\{\\f1\\fs20\s+([^}]+)\}/g, '<code>$1</code>');
  content = content.replace(/\\par\\pard\\sb120\\sa120\{\\f1\\fs20\n(.*?)\}\\par\\pard\\sa200\\sl276\\slmult1\n/gs, '<pre>$1</pre>\n');
  
  // 7. Listas
  content = content.replace(/\\pard\\li720\\fi-360\\bullet\\tab\s+([^\\]+)\\par\\pard\\sa200\\sl276\\slmult1\n/g, '<li>$1</li>\n');
  content = content.replace(/(<li>.*?<\/li>\n)+/g, '<ul>$&</ul>\n');
  
  // 8. Remover comandos RTF e chaves
  content = content.replace(/\\[a-z]+\d*/g, ' ');
  content = content.replace(/[{}]/g, '');
  
  // 9. Converter \par em quebras de parágrafo
  // Dividir por \par, processar cada linha
  const lines = content.split(/\\par\s*/);
  const processedLines = lines.map(line => {
    line = line.trim();
    if (!line) return '';
    
    // Se já tem tags HTML, não envolver em <p>
    if (line.match(/^<(h[1-6]|ul|ol|blockquote|pre|li|img)/)) {
      return line;
    }
    
    // Caso contrário, envolver em <p>
    return `<p>${line}</p>`;
  }).filter(line => line.length > 0);
  
  content = processedLines.join('\n');
  
  // 10. Converter \line em <br>
  content = content.replace(/\\line\s+/g, '<br>\n');
  
  // 11. Unescape caracteres especiais RTF
  content = content.replace(/\\u(\d+)\?/g, (match, code) => {
    const charCode = parseInt(code);
    // \u160 é espaço não-quebrável, converter para &nbsp;
    if (charCode === 160) return '&nbsp;';
    return String.fromCharCode(charCode);
  });
  content = content.replace(/\\\\/g, '\\');
  
  // 12. Limpar espaços extras e linhas vazias
  content = content.replace(/<p>\s*<\/p>/g, '');
  content = content.replace(/<p>\s*&nbsp;\s*<\/p>/g, '');
  content = content.replace(/\n{3,}/g, '\n\n');
  content = content.trim();
  
  // 13. Restaurar imagens
  images.forEach(({ placeholder, base64 }) => {
    content = content.replace(placeholder, `<img src="${base64}" alt="Imagem" style="max-width: 100%;" />`);
  });
  
  console.log("[INFO] HTML gerado:", content.substring(0, 500));
  
  return content;
}

export function readRtfFile(filePath: string): string {
  try {
    console.log(`[INFO] Lendo arquivo RTF: ${filePath}`);
    const rtfContent = fs.readFileSync(filePath, 'utf-8');
    const html = parseRtfToHtml(rtfContent);
    console.log(`[INFO] HTML final:`, html);
    return html;
  } catch (err) {
    console.error('[ERRO] Falha ao ler arquivo RTF:', err);
    throw new Error('Não foi possível ler o arquivo RTF');
  }
}

export function updateRtfFile(filePath: string, htmlContent: string, rtfConverter: (html: string) => string): void {
  try {
    const rtfContent = rtfConverter(htmlContent);
    fs.writeFileSync(filePath, rtfContent, 'utf-8');
    console.log(`[SUCESSO] RTF atualizado: ${filePath}`);
  } catch (err) {
    console.error('[ERRO] Falha ao atualizar arquivo RTF:', err);
    throw new Error('Não foi possível atualizar o arquivo RTF');
  }
}