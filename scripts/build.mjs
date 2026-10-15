import { mkdir, cp, rm } from 'node:fs/promises';
await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
for (const file of ['index.html', 'styles.css', 'app.js', 'config.js', 'assets']) {
  await cp(file, `dist/${file}`, { recursive: true });
}
console.log('Sitio estático generado en dist/');
