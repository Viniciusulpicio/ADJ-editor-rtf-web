import { decode } from "html-entities";

export const HTML_REPLACEMENTS: Array<[RegExp, string]> = [
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

export function cleanHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
}

export function decodeHtml(html: string): string {
  return decode(html);
}

export function applyHtmlReplacements(content: string): string {
  let result = content;
  for (const [regex, replacement] of HTML_REPLACEMENTS) {
    result = result.replace(regex, replacement);
  }
  return result.replace(/<[^>]+>/g, '');
}