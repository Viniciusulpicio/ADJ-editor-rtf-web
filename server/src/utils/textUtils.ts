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
  html = html.replace(/<ul[^>]*>/gi, '__UL_START__');
  html = html.replace(/<\/ul>/gi, '__UL_END__');
  html = html.replace(/<ol[^>]*>/gi, '__OL_START__');
  html = html.replace(/<\/ol>/gi, '__OL_END__');
  html = html.replace(/<li[^>]*>(.*?)<\/li>/gi, '__LI__$1__LI_END__');
  return html;
}