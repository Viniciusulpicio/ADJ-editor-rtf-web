import fs from "fs";

export function parseRtfToHtml(rtfContent: string): string {
  console.log("[INFO] Parseando RTF para HTML");

  let content = rtfContent;

  // 1. Extrair e substituir imagens por placeholders
  const images: { placeholder: string; base64: string }[] = [];
  let imageCounter = 0;

  content = content.replace(
    /\{\\pict\\(jpegblip|pngblip)\\picw(\d+)\\pich(\d+)\\picwgoal(\d+)\\pichgoal(\d+)\n([\s\S]*?)\}/g,
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

        return `\n${placeholder}\n`;
      } catch (err) {
        console.error('[ERRO] Falha ao converter imagem:', err);
        return '';
      }
    }
  );

  // 2. Unescape caracteres unicode
  content = content.replace(/\\u(\d+)\?/g, (match, code) => {
    const charCode = parseInt(code);
    if (charCode === 160) return '&nbsp;';
    return String.fromCharCode(charCode);
  });

  // 3. Remover cabeçalhos RTF
  content = content.replace(/\{\\rtf1[^\n]*\n/g, '');
  content = content.replace(/\{\\fonttbl[\s\S]*?\}\n?/g, '');
  content = content.replace(/\{\\f\d+[^}]*\}/g, '');
  content = content.replace(/\{\\colortbl[\s\S]*?\}\n?/g, '');
  content = content.replace(/\\viewkind\d+\\uc\d+/g, '');
  content = content.replace(/\\pard\\plain\\f\d+\\fs\d+\s*/g, '');

  // 4. NOVA: Processar TABELAS primeiro (antes de outros elementos)
  content = content.replace(/\\trowd[\s\S]*?\\row/g, (match) => {
    // Extrair células da linha
    const cells = match.match(/\\intbl\s*([\s\S]*?)\\cell/g) || [];
    const cellContents = cells.map(cell => {
      let cellText = cell.replace(/\\intbl\s*/, '').replace(/\\cell/, '').trim();
      // Preservar formatação básica nas células
      cellText = cellText.replace(/\{\\b\s+([^}]+)\}/g, '<strong>$1</strong>');
      cellText = cellText.replace(/\{\\i\s+([^}]+)\}/g, '<em>$1</em>');
      // Remover comandos RTF da célula
      cellText = cellText.replace(/\\[a-z]+\d*/gi, ' ');
      cellText = cellText.replace(/[{}]/g, '');
      cellText = cellText.trim();
      return cellText;
    });
    
    if (cellContents.length === 0) return '';
    const cellsHtml = cellContents.map(c => `<td>${c}</td>`).join('');
    return `\n###TABLE_ROW###${cellsHtml}###TABLE_ROW_END###\n`;
  });

  // 5. NOVA: Divisória horizontal (detectar bordas RTF)
  content = content.replace(/\\pard\\brdrb\\brdrs\\brdrw\d+\\brsp\d+\\par/g, '\n###HR###\n');
  content = content.replace(/\\par\s*[-—_]{3,}\s*\\par/g, '\n###HR###\n');

  // 6. Alinhamento de parágrafos (ANTES dos headings genéricos)
  content = content.replace(/\\pard\\qc\s+(.*?)\\par/g, '<p style="text-align:center">$1</p>');
  content = content.replace(/\\pard\\qr\s+(.*?)\\par/g, '<p style="text-align:right">$1</p>');
  content = content.replace(/\\pard\\qj\s+(.*?)\\par/g, '<p style="text-align:justify">$1</p>');

  // 7. Converter headings (com marcadores de parágrafo)
  content = content.replace(/\\par\\pard\\sb240\\sa120\{\\b\\fs48\s+(.*?)\}\\par\\pard\\sa200\\sl276\\slmult1/g, '\n<h1>$1</h1>\n');
  content = content.replace(/\\par\\pard\\sb200\\sa100\{\\b\\fs36\s+(.*?)\}\\par\\pard\\sa200\\sl276\\slmult1/g, '\n<h2>$1</h2>\n');
  content = content.replace(/\\par\\pard\\sb160\\sa80\{\\b\\fs32\s+(.*?)\}\\par\\pard\\sa200\\sl276\\slmult1/g, '\n<h3>$1</h3>\n');
  content = content.replace(/\\par\\pard\\sb120\\sa60\{\\b\\fs28\s+(.*?)\}\\par\\pard\\sa200\\sl276\\slmult1/g, '\n<h4>$1</h4>\n');
  content = content.replace(/\\par\\pard\\sb100\\sa50\{\\b\\fs26\s+(.*?)\}\\par\\pard\\sa200\\sl276\\slmult1/g, '\n<h5>$1</h5>\n');
  content = content.replace(/\\par\\pard\\sb80\\sa40\{\\b\\fs24\s+(.*?)\}\\par\\pard\\sa200\\sl276\\slmult1/g, '\n<h6>$1</h6>\n');
  
  // 8. Citações
  content = content.replace(/\\par\\pard\\li720\\ri720\\sb120\\sa120\{\\i\\cf3\s+(.*?)\}\\par\\pard\\sa200\\sl276\\slmult1/g, '\n<blockquote>$1</blockquote>\n');

  // 9. Código em bloco
  content = content.replace(/\\par\\pard\\sb120\\sa120\{\\f1\\fs20\n([\s\S]*?)\}\\par\\pard\\sa200\\sl276\\slmult1/g, '\n<pre><code>$1</code></pre>\n');

  // 10. MELHORADO: Listas ordenadas (múltiplos padrões)
  // Padrão 1: Com estrutura completa de numeração
  content = content.replace(
    /\\pard\\li720\\fi-360\{\\\*\\pn\\pnlvlbody[^}]*\\pndec[^}]*\}[^\\]*\\tab\s*([\s\S]*?)\\par/g,
    '\n###OL_ITEM###$1###OL_ITEM_END###\n'
  );
  
  // Padrão 2: Numeração simples (1. 2. 3.)
  content = content.replace(
    /\\pard\\li\d+\\fi-\d+\s*\d+\.\s*\\tab\s*([\s\S]*?)\\par/g,
    '\n###OL_ITEM###$1###OL_ITEM_END###\n'
  );

  // 11. MELHORADO: Listas não ordenadas (múltiplos padrões)
  // Padrão 1: Com bullet explícito
  content = content.replace(
    /\\pard\\li\d+\\fi-\d+\{\\\*\\pn\\pnlvlblt[^}]+\}\\bullet\\tab\s*([\s\S]*?)\\par/g,
    '\n###UL_ITEM###$1###UL_ITEM_END###\n'
  );
  
  // Padrão 2: Apenas com \bullet
  content = content.replace(
    /\\pard\\li\d+\\fi-\d+\\bullet\\tab\s*([\s\S]*?)\\par/g,
    '\n###UL_ITEM###$1###UL_ITEM_END###\n'
  );
  
  // Padrão 3: Sem bullet mas com indentação de lista
  content = content.replace(
    /\\pard\\li720\\fi-360\\tab\s*([\s\S]*?)\\par/g,
    '\n###UL_ITEM###$1###UL_ITEM_END###\n'
  );

  // 12. Remover \\pard genérico (DEPOIS de processar listas e headings)
  content = content.replace(/\\pard[^\n\\{]*/g, '');

  // 13. Converter \par em quebras de linha duplas
  content = content.replace(/\\par\s*/g, '\n\n');

  // 14. Formatação inline (antes de remover chaves)
  content = content.replace(/\{\\b\s+([^}]+)\}/g, '<strong>$1</strong>');
  content = content.replace(/\{\\i\s+([^}]+)\}/g, '<em>$1</em>');
  content = content.replace(/\{\\ul\s+([^}]+)\}/g, '<u>$1</u>');
  content = content.replace(/\{\\strike\s+([^}]+)\}/g, '<s>$1</s>');
  content = content.replace(/\{\\sub\s+([^}]+)\}/g, '<sub>$1</sub>');
  content = content.replace(/\{\\super\s+([^}]+)\}/g, '<sup>$1</sup>');
  content = content.replace(/\{\\ul\\cf2\s+([^}]+)\}/g, '<a href="#">$1</a>');
  content = content.replace(/\{\\f1\\fs20\s+([^}]+)\}/g, '<code>$1</code>');

  // 15. Remover todos os comandos RTF restantes e chaves
  content = content.replace(/\\([a-z\*]+)(-?\d+)?\s?|\\'([0-9a-f]{2})|\\([\~\-\_])/gi, (match, word, arg, hex, symbol) => {
    if (hex) {
      return String.fromCharCode(parseInt(hex, 16));
    }
    return '';
  });

  content = content.replace(/[{}]/g, '');

  // 16. Processar parágrafos
  const lines = content.split(/\n/);
  const processedLines: string[] = [];
  let paragraphBuffer: string[] = [];

  for (let line of lines) {
    line = line.trim();
    
    if (!line) {
      if (paragraphBuffer.length > 0) {
        processedLines.push(`<p>${paragraphBuffer.join(' ')}</p>`);
        paragraphBuffer = [];
      }
      continue;
    }

    // Processar marcadores especiais
    if (line.includes('###TABLE_ROW###')) {
      if (paragraphBuffer.length > 0) {
        processedLines.push(`<p>${paragraphBuffer.join(' ')}</p>`);
        paragraphBuffer = [];
      }
      line = line.replace(/###TABLE_ROW###/g, '<tr>');
      line = line.replace(/###TABLE_ROW_END###/g, '</tr>');
      processedLines.push(line);
      continue;
    }

    if (line.includes('###HR###')) {
      if (paragraphBuffer.length > 0) {
        processedLines.push(`<p>${paragraphBuffer.join(' ')}</p>`);
        paragraphBuffer = [];
      }
      processedLines.push('<hr>');
      continue;
    }

    if (line.includes('###OL_ITEM###')) {
      if (paragraphBuffer.length > 0) {
        processedLines.push(`<p>${paragraphBuffer.join(' ')}</p>`);
        paragraphBuffer = [];
      }
      line = line.replace(/###OL_ITEM###/g, '<li>');
      line = line.replace(/###OL_ITEM_END###/g, '</li>');
      processedLines.push(line);
      continue;
    }

    if (line.includes('###UL_ITEM###')) {
      if (paragraphBuffer.length > 0) {
        processedLines.push(`<p>${paragraphBuffer.join(' ')}</p>`);
        paragraphBuffer = [];
      }
      line = line.replace(/###UL_ITEM###/g, '<li>');
      line = line.replace(/###UL_ITEM_END###/g, '</li>');
      processedLines.push(line);
      continue;
    }

    // Se já é uma tag HTML de bloco, adicionar diretamente
    if (line.match(/^<(h[1-6]|ul|ol|li|blockquote|pre|img|hr|p\s|tr|table)/)) {
      if (paragraphBuffer.length > 0) {
        processedLines.push(`<p>${paragraphBuffer.join(' ')}</p>`);
        paragraphBuffer = [];
      }
      processedLines.push(line);
      continue;
    }

    // Se termina com tag de bloco, adicionar diretamente
    if (line.match(/<\/(h[1-6]|ul|ol|li|blockquote|pre|p|tr|table)>$/)) {
      if (paragraphBuffer.length > 0) {
        processedLines.push(`<p>${paragraphBuffer.join(' ')}</p>`);
        paragraphBuffer = [];
      }
      processedLines.push(line);
      continue;
    }

    // Adicionar ao buffer do parágrafo
    paragraphBuffer.push(line);
  }

  // Fechar último parágrafo se houver
  if (paragraphBuffer.length > 0) {
    processedLines.push(`<p>${paragraphBuffer.join(' ')}</p>`);
  }

  content = processedLines.join('\n');

  // 17. Agrupar listas ordenadas e não ordenadas
  content = content.replace(/((?:<li>.*?<\/li>\s*)+)/g, (match) => {
    // Verifica se vem de ###OL_ITEM### ou ###UL_ITEM###
    const isOrdered = content.substring(
      Math.max(0, content.indexOf(match) - 50), 
      content.indexOf(match)
    ).includes('OL_ITEM');
    
    if (isOrdered) {
      return '<ol>\n' + match + '</ol>\n';
    }
    return '<ul>\n' + match + '</ul>\n';
  });

  // 18. Agrupar linhas de tabela em <table>
  content = content.replace(/((?:<tr>.*?<\/tr>\s*)+)/g, '<table>\n$1</table>\n');

  // 19. Limpar espaços extras
  content = content.replace(/<p>\s*<\/p>/g, '');
  content = content.replace(/<p>\s*&nbsp;\s*<\/p>/g, '');
  content = content.replace(/\s{2,}/g, ' ');
  content = content.replace(/\n{3,}/g, '\n\n');
  
  // 20. Restaurar imagens
  images.forEach(({ placeholder, base64 }) => {
    content = content.replace(
      placeholder, 
      `<p><img src="${base64}" alt="Imagem" style="max-width: 100%; height: auto;" /></p>`
    );
  });

  // 21. Limpeza final
  content = content.trim();

  console.log("[INFO] HTML gerado com sucesso");

  if (content.length === 0) {
    return '<p>Documento vazio ou formato RTF não reconhecido</p>';
  }

  return content;
}

export function readRtfFile(filePath: string): string {
  try {
    console.log(`[INFO] Lendo arquivo RTF: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`Arquivo não encontrado: ${filePath}`);
    }
    
    const rtfContent = fs.readFileSync(filePath, 'utf-8');
    
    if (rtfContent.trim().length === 0) {
      throw new Error('Arquivo RTF está vazio');
    }
    
    const html = parseRtfToHtml(rtfContent);
    
    return html;
  } catch (err) {
    console.error('[ERRO] Falha ao ler arquivo RTF:', err);
    throw new Error(`Não foi possível ler o arquivo RTF: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
  }
}

export function updateRtfFile(
  filePath: string, 
  htmlContent: string, 
  rtfConverter: (html: string) => string
): void {
  try {
    console.log(`[INFO] Atualizando arquivo RTF: ${filePath}`);
    
    const rtfContent = rtfConverter(htmlContent);
    fs.writeFileSync(filePath, rtfContent, 'utf-8');
    
    console.log(`[SUCESSO] RTF atualizado: ${filePath}`);
  } catch (err) {
    console.error('[ERRO] Falha ao atualizar arquivo RTF:', err);
    throw new Error(`Não foi possível atualizar o arquivo RTF: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
  }
}