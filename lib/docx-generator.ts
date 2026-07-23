import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import { saveAs } from "file-saver";

/**
 * Generates a .docx file from a template URL and data object, then triggers browser download.
 * 
 * @param templateUrl Path to template file (e.g. '/templates/visa/introduction-letter.docx')
 * @param data Object containing data for placeholder replacement
 * @param outputFilename Name of the file to download (e.g. 'Introduction_Letter_John_Doe.docx')
 */
export async function generateDocx(
  templateUrl: string,
  data: Record<string, any>,
  outputFilename: string
): Promise<void> {
  // Fetch template array buffer from public directory
  const response = await fetch(templateUrl);
  if (!response.ok) {
    throw new Error(`Failed to load template from ${templateUrl} (${response.statusText})`);
  }
  const arrayBuffer = await response.arrayBuffer();

  // Load zip content via PizZip
  const zip = new PizZip(arrayBuffer);

  // Instantiate Docxtemplater with linebreaks, loop support, and fallback nullGetter
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    nullGetter() {
      return "";
    },
  });

  // Replace tags with provided data
  doc.render(data);

  // Output as blob and trigger download
  const blob = doc.getZip().generate({
    type: "blob",
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });

  // Append .docx extension if missing
  const finalFilename = outputFilename.endsWith(".docx")
    ? outputFilename
    : `${outputFilename}.docx`;

  saveAs(blob, finalFilename);
}
