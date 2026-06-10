import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: { module: 'src/index.ts' },
  format: 'esm',
  target: 'node18',
  outDir: 'dist',
  platform: 'node',
  fixedExtension: false,
  hash: false,
  sourcemap: true,
  dts: {
    sourcemap: true,
  },
});
