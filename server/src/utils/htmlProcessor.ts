export function cleanHtml(html: string): string {
  return html
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

export function decodeHtml(html: string): string {
  return html
    .replace(/&aacute;/g, 'á')
    .replace(/&eacute;/g, 'é')
    .replace(/&iacute;/g, 'í')
    .replace(/&oacute;/g, 'ó')
    .replace(/&uacute;/g, 'ú')
    .replace(/&atilde;/g, 'ã')
    .replace(/&otilde;/g, 'õ')
    .replace(/&ccedil;/g, 'ç')
    .replace(/&agrave;/g, 'à')
    .replace(/&egrave;/g, 'è')
    .replace(/&igrave;/g, 'ì')
    .replace(/&ograve;/g, 'ò')
    .replace(/&ugrave;/g, 'ù')
    .replace(/&Aacute;/g, 'Á')
    .replace(/&Eacute;/g, 'É')
    .replace(/&Iacute;/g, 'Í')
    .replace(/&Oacute;/g, 'Ó')
    .replace(/&Uacute;/g, 'Ú')
    .replace(/&Atilde;/g, 'Ã')
    .replace(/&Otilde;/g, 'Õ')
    .replace(/&Ccedil;/g, 'Ç');
}

// Mapa de fontes para códigos RTF
const fontMap: { [key: string]: string } = {
  'arial': '\\f0',
  'courier new': '\\f1',
  'times new roman': '\\f2',
  'helvetica': '\\f3',
  'verdana': '\\f4',
  'georgia': '\\f5',
  'calibri': '\\f6',
  'tahoma': '\\f7',
  'comic sans ms': '\\f8',
  'trebuchet ms': '\\f9',
};

// Função para extrair font-family de um atributo style
function extractFontFamily(styleAttr: string): string | null {
  const match = styleAttr.match(/font-family:\s*([^;'"]+)/i);
  if (match) {
    let fontName = match[1].trim().toLowerCase();
    // Remover aspas se houver
    fontName = fontName.replace(/["']/g, '');
    // Pegar apenas a primeira fonte se houver fallback
    fontName = fontName.split(',')[0].trim();
    return fontName;
  }
  return null;
}

// Função para extrair font-size de um atributo style (em pt)
function extractFontSize(styleAttr: string): string | null {
  const match = styleAttr.match(/font-size:\s*(\d+)pt/i);
  if (match) {
    const pts = parseInt(match[1]);
    const halfPts = pts * 2; // RTF usa half-points
    return `\\fs${halfPts}`;
  }
  return null;
}

// Função para extrair cores de texto
function extractColor(styleAttr: string): string | null {
  const match = styleAttr.match(/color:\s*rgb\((\d+),\s*(\d+),\s*(\d+)\)/i);
  if (match) {
    // Por enquanto retornar null, você pode implementar tabela de cores dinâmica
    return null;
  }
  return null;
}

export function applyHtmlReplacements(html: string): string {
  let content = html;

  // NOVO: Processar spans com estilos inline (fontes, tamanhos, cores)
  content = content.replace(/<span([^>]*style="([^"]*)"[^>]*)>(.*?)<\/span>/gi, (match, attrs, styleAttr, innerText) => {
    const fontFamily = extractFontFamily(styleAttr);
    const fontSize = extractFontSize(styleAttr);
    const color = extractColor(styleAttr);

    let rtfCodes = '';
    
    // Adicionar código de fonte
    if (fontFamily && fontMap[fontFamily]) {
      rtfCodes += fontMap[fontFamily];
    }
    
    // Adicionar tamanho de fonte
    if (fontSize) {
      rtfCodes += fontSize;
    }
    
    if (fontFamily) {
      rtfCodes += fontMap[fontFamily] || fontMap['arial']; // fallback
    }

    
    // Se não tem estilos reconhecidos, retornar apenas o texto interno
    return innerText;
  });

  // Headings
  content = content.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '__H1_START__$1__H1_END__');
  content = content.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '__H2_START__$1__H2_END__');
  content = content.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '__H3_START__$1__H3_END__');
  content = content.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '__H4_START__$1__H4_END__');
  content = content.replace(/<h5[^>]*>(.*?)<\/h5>/gi, '__H5_START__$1__H5_END__');
  content = content.replace(/<h6[^>]*>(.*?)<\/h6>/gi, '__H6_START__$1__H6_END__');

  // Parágrafos com alinhamento
  content = content.replace(/<p[^>]*style="[^"]*text-align:\s*center[^"]*"[^>]*>(.*?)<\/p>/gi, '__P_CENTER_START__$1__P_CENTER_END__');
  content = content.replace(/<p[^>]*style="[^"]*text-align:\s*right[^"]*"[^>]*>(.*?)<\/p>/gi, '__P_RIGHT_START__$1__P_RIGHT_END__');
  content = content.replace(/<p[^>]*style="[^"]*text-align:\s*justify[^"]*"[^>]*>(.*?)<\/p>/gi, '__P_JUSTIFY_START__$1__P_JUSTIFY_END__');

  // Parágrafos normais
  content = content.replace(/<p[^>]*>/gi, '__P_START__');
  content = content.replace(/<\/p>/gi, '__P_END__');

  // Quebras de linha
  content = content.replace(/<br\s*\/?>/gi, '__BR__');

  // Formatação inline
  content = content.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '__STRONG_START__$1__STRONG_END__');
  content = content.replace(/<b[^>]*>(.*?)<\/b>/gi, '__B_START__$1__B_END__');
  content = content.replace(/<em[^>]*>(.*?)<\/em>/gi, '__EM_START__$1__EM_END__');
  content = content.replace(/<i[^>]*>(.*?)<\/i>/gi, '__I_START__$1__I_END__');
  content = content.replace(/<u[^>]*>(.*?)<\/u>/gi, '__U_START__$1__U_END__');
  content = content.replace(/<s[^>]*>(.*?)<\/s>/gi, '__STRIKE_START__$1__STRIKE_END__');
  content = content.replace(/<strike[^>]*>(.*?)<\/strike>/gi, '__STRIKE_START__$1__STRIKE_END__');
  content = content.replace(/<del[^>]*>(.*?)<\/del>/gi, '__STRIKE_START__$1__STRIKE_END__');
  content = content.replace(/<sub[^>]*>(.*?)<\/sub>/gi, '__SUB_START__$1__SUB_END__');
  content = content.replace(/<sup[^>]*>(.*?)<\/sup>/gi, '__SUP_START__$1__SUP_END__');

  // Links
  content = content.replace(/<a[^>]*>(.*?)<\/a>/gi, '__LINK_START__$1__LINK_END__');

  // Citações
  content = content.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, '__QUOTE_START__$1__QUOTE_END__');

  // Código
  content = content.replace(/<code[^>]*>(.*?)<\/code>/gi, '__CODE_START__$1__CODE_END__');
  content = content.replace(/<pre[^>]*>(.*?)<\/pre>/gi, '__PRE_START__$1__PRE_END__');

  // Divisórias horizontais
  content = content.replace(/<hr\s*\/?>/gi, '__HR__');

  // Divs
  content = content.replace(/<div[^>]*>/gi, '__DIV_START__');
  content = content.replace(/<\/div>/gi, '__DIV_END__');

  // Listas não ordenadas
  content = content.replace(/<ul[^>]*>/gi, '__UL_START__');
  content = content.replace(/<\/ul>/gi, '__UL_END__');

  // Listas ordenadas
  content = content.replace(/<ol[^>]*>/gi, '__OL_START__');
  content = content.replace(/<\/ol>/gi, '__OL_END__');

  // Itens de lista
  content = content.replace(/<li[^>]*>/gi, '__LI__');
  content = content.replace(/<\/li>/gi, '__LI_END__');

  // Tabelas
  content = content.replace(/<table[^>]*>/gi, '__TABLE_START__');
  content = content.replace(/<\/table>/gi, '__TABLE_END__');
  content = content.replace(/<tr[^>]*>/gi, '__TR_START__');
  content = content.replace(/<\/tr>/gi, '__TR_END__');
  content = content.replace(/<td[^>]*>/gi, '__TD__');
  content = content.replace(/<\/td>/gi, '__TD_END__');
  content = content.replace(/<th[^>]*>/gi, '__TH__');
  content = content.replace(/<\/th>/gi, '__TH_END__');

  return content;
}