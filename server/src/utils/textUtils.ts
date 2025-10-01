export function escapeRtfText(text: string): string {
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
    } else if (charCode > 127) {
      result += `\\u${charCode}?`;
    } else {
      result += char;
    }
  }
  return result;
}

export function processLists(html: string): string {
  // Processar listas não ordenadas
  html = html.replace(/<ul[^>]*>/gi, '__UL_START__');
  html = html.replace(/<\/ul>/gi, '__UL_END__');
  
  // Processar listas ordenadas
  html = html.replace(/<ol[^>]*>/gi, '__OL_START__');
  html = html.replace(/<\/ol>/gi, '__OL_END__');
  
  // Processar itens de lista
  // Precisamos distinguir entre itens de listas ordenadas e não ordenadas
  // Primeiro, marcamos todos os <li> dentro de <ol>
  html = html.replace(/__OL_START__([\s\S]*?)__OL_END__/g, (match, content) => {
    const processedContent = content.replace(/<li[^>]*>(.*?)<\/li>/gi, '__OLI__$1__OLI_END__');
    return `__OL_START__${processedContent}__OL_END__`;
  });
  
  // Depois processamos os <li> restantes (que estão em <ul>)
  html = html.replace(/<li[^>]*>(.*?)<\/li>/gi, '__LI__$1__LI_END__');
  
  return html;
}