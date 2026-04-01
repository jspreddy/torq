import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: { module: 'src/index.ts' },
  format: 'esm',
  outDir: 'dist',
  platform: 'node',
  fixedExtension: false,
  hash: false,
});
