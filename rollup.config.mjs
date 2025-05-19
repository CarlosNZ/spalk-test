import typescript from '@rollup/plugin-typescript'
import sizes from 'rollup-plugin-sizes'
import terser from '@rollup/plugin-terser'
import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import json from '@rollup/plugin-json'

export default [
  {
    input: 'src/monitor.ts',
    output: [
      {
        file: 'dist/monitor.js',
        format: 'esm',
      },
    ],
    onwarn: hideUnfixableWarnings,
    plugins: [
      typescript(),
      json(),
      resolve({ preferBuiltins: true, exportConditions: ['node'] }),
      commonjs(),
      terser(),
      sizes(),
    ],
  },
]

export function hideUnfixableWarnings(warning, warn) {
  if (
    warning.message ===
    // Can't do anything about circ dependency in external package, so just
    // ignore it
    'Circular dependency: node_modules/pg/lib/index.js -> node_modules/pg-pool/index.js -> node_modules/pg/lib/index.js'
  )
    return
  warn(warning)
}
