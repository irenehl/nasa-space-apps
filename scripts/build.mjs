import { cp, mkdir, rm } from 'node:fs/promises';

const OUTPUT_DIR = 'dist';
const ENTRIES = ['index.html', 'src', 'assets'];

await rm(OUTPUT_DIR, { recursive: true, force: true });
await mkdir(OUTPUT_DIR, { recursive: true });
for (const entry of ENTRIES) {
  await cp(entry, `${OUTPUT_DIR}/${entry}`, { recursive: true });
}
console.log(`Static site generated in ${OUTPUT_DIR}/`);
