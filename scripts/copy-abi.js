import { promises as fs } from 'node:fs';
import { resolve } from 'node:path';

async function main() {
  const src = resolve('src/abi');
  const dst = resolve('dist/abi');
  try {
    await fs.mkdir(dst, { recursive: true });
    const entries = await fs.readdir(src, { withFileTypes: true });
    for (const e of entries) {
      if (e.isFile()) {
        await fs.copyFile(resolve(src, e.name), resolve(dst, e.name));
      }
    }
    console.log('Copied ABI to dist/abi');
  } catch (err) {
    console.error('ABI copy failed:', err?.message || err);
    process.exit(1);
  }
}

main();


