import typescript from '@rollup/plugin-typescript'
import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import json from '@rollup/plugin-json'
import run from '@rollup/plugin-run'
import { hideUnfixableWarnings } from './rollup.config.mjs'

export default [
  {
    input: 'src/monitor.ts',
    output: [
      {
        file: 'dev/index.js',
        format: 'esm',
      },
    ],
    onwarn: hideUnfixableWarnings,
    plugins: [
      typescript(),
      json(),
      resolve({ preferBuiltins: true, exportConditions: ['node'] }),
      commonjs(),
      run({ args: ['start'] }),
    ],
  },
]
