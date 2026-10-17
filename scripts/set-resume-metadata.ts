import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { PDFDocument, PDFName } from "pdf-lib";
import { portfolio } from "../src/content/portfolio";

// The résumé PDF is what search engines show for "Darshil Jain résumé", and
// its title came from the editor ("Copy of Resume", by someone else). This
// rewrites only the document properties; the pages are left untouched.
const file = fileURLToPath(
  new URL(`../public${portfolio.candidate.resumeUrl}`, import.meta.url),
);
const { candidate } = portfolio;

const pdf = await PDFDocument.load(readFileSync(file), {
  updateMetadata: false,
});
const pages = pdf.getPageCount();

pdf.setTitle(`${candidate.name} — Résumé`, { showInWindowTitleBar: true });
pdf.setAuthor(candidate.name);
pdf.setSubject(`${candidate.name}: ${candidate.headline}`);
pdf.setKeywords([
  candidate.name,
  "résumé",
  "CV",
  ...candidate.skills.slice(0, 6),
]);
pdf.setCreator(candidate.name);
pdf.setProducer("Darshify");
pdf.setLanguage("en-IN");
// An old XMP packet would still name the editor's file; drop it so readers
// use the properties above.
pdf.catalog.delete(PDFName.of("Metadata"));

const bytes = await pdf.save({ useObjectStreams: false });
const check = await PDFDocument.load(bytes);
if (
  check.getPageCount() !== pages ||
  check.getTitle() !== `${candidate.name} — Résumé`
) {
  throw new Error("Résumé metadata update did not round-trip");
}
writeFileSync(file, bytes);
console.log(`Updated ${file}: ${pages} page(s), title "${check.getTitle()}"`);
