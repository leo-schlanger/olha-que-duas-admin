// Empacota src/lib/financeReport.ts (relatório Excel + email) num único ficheiro
// para a edge function finance-monthly-report, que corre em Deno.
// Uso: npm run build:report  (correr sempre que mudar o Excel ou os cálculos)
import { build } from 'esbuild';
import { readFileSync, writeFileSync } from 'node:fs';

const out = 'supabase/functions/finance-monthly-report/report.bundle.js';

await build({
  entryPoints: ['src/lib/financeReport.ts'],
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  target: 'es2022',
  external: ['exceljs'],
  outfile: out,
  logLevel: 'warning',
});

// No Deno o exceljs vem do npm; o import dinâmico (lazy no browser) passa a estático.
let code = readFileSync(out, 'utf8');
const dynamic = /import\(\s*["']exceljs["']\s*\)/g;
if (!dynamic.test(code)) throw new Error('import("exceljs") não encontrado no bundle');
code = code.replace(dynamic, 'Promise.resolve({ default: __ExcelJS })');
code =
  '// GERADO por scripts/build-report.mjs a partir de src/lib/financeReport.ts — não editar.\n' +
  'import __ExcelJS from "npm:exceljs@4.4.0";\n' +
  code;
writeFileSync(out, code);
console.log(`ok ${out} (${(code.length / 1024).toFixed(1)} KB)`);
