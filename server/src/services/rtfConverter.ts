import { processImagesInHtml } from "./imageProcessor";
import { escapeRtfText, processLists } from "../utils/textUtils";
import { cleanHtml, decodeHtml, applyHtmlReplacements } from "../utils/htmlProcessor";

export function convertHtmlToRtf(html: string): string {
  console.log("[INFO] Convertendo HTML para RTF");
  
  let content = cleanHtml(html);
  content = processImagesInHtml(content);
  content = decodeHtml(content);
  content = processLists(content);
  content = applyHtmlReplacements(content);
  
  const imagePlaceholders: { [key: string]: string } = {};
  let imageCounter = 0;
  
  content = content.replace(/__RTF_IMAGE__([\s\S]*?)__RTF_IMAGE_END__/g, (match, imageCode) => {
    const placeholder = `###IMAGE_PLACEHOLDER_${imageCounter}###`;
    imagePlaceholders[placeholder] = imageCode;
    imageCounter++;
    return placeholder;
  });
  
  content = escapeRtfText(content);
  content = applyRtfFormatting(content);
  
  for (const [placeholder, imageCode] of Object.entries(imagePlaceholders)) {
    content = content.replace(placeholder, `\\par ${imageCode} \\par`);
  }
  
  return buildRtfDocument(content);
}

function applyRtfFormatting(content: string): string {
  return content
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
}

function buildRtfDocument(content: string): string {
  let rtf = '{\\rtf1\\ansi\\deff0\n';
  rtf += '{\\fonttbl{\\f0\\fswiss\\fcharset0 Calibri;}{\\f1\\fmodern\\fcharset0 Courier New;}}\n';
  rtf += '{\\colortbl ;\\red0\\green0\\blue0;\\red0\\green0\\blue255;\\red128\\green128\\blue128;}\n';
  rtf += '\\viewkind4\\uc1\\pard\\sa200\\f0\\fs22\n';
  rtf += content;
  rtf += '\n}';
  
  return rtf;
}