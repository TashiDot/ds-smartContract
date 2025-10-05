import { promises as fs } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  const artifactsPath = resolve(__dirname, '../artifacts/contracts/HashStore.sol/HashStore.json');
  const outDir = resolve(__dirname, '../src/abi');
  const outFile = resolve(outDir, 'HashStore.json');

  try {
    const raw = await fs.readFile(artifactsPath, 'utf8');
    const json = JSON.parse(raw);
    const abi = json.abi;
    if (!abi) throw new Error('ABI not found in artifacts JSON');
    await fs.mkdir(outDir, { recursive: true });
    await fs.writeFile(outFile, JSON.stringify({ abi }, null, 2));
    console.log('Exported ABI to', outFile);
  } catch (err) {
    console.error('Failed to export ABI:', err.message || err);
    process.exit(1);
  }
}

main();


