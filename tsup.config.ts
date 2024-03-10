import { defineConfig } from 'tsup'

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/base/index.ts'
  ],
  dts: true,
  outDir: 'dist',
  clean: true,
  format: ['cjs', 'esm'],
  treeshake: true,
  splitting: false,
  cjsInterop: true,
  minify: true
})  