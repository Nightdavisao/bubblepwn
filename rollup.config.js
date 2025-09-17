import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import copy from '@rollup-extras/plugin-copy';
import nodePolyfills from 'rollup-plugin-polyfill-node'
import inject from '@rollup/plugin-inject';
import stdLibBrowser from 'node-stdlib-browser'
import alias from '@rollup/plugin-alias';

const plugins = [
    //nodePolyfills(),
    copy('assets/**'),
    commonjs(),
    alias({
        entries: {
            ...stdLibBrowser,
            "react": "preact/compat",
            "react-dom": "preact/compat"
        }
    }),
    resolve({ browser: true, preferBuiltins: false }),
    inject({
        process: stdLibBrowser.process,
    }),
    typescript({
        tsconfig: './tsconfig.json'
    }),
];

export default [
    {
        input: 'src/inject.ts',
        output: {
            file: 'dist/inject.js',
            format: 'iife',
            sourcemap: true
        },
        plugins
    },
    {
        input: 'src/content.ts',
        output: {
            file: 'dist/content.js',
            format: 'iife',
            sourcemap: true
        },
        plugins
    },
    {
        input: 'src/background.ts',
        output: {
            file: 'dist/background.js',
            format: 'iife',
            sourcemap: true,
            // globals: {
            //     'node:os': 'os',
            //     'node:module': 'module'
            // }
        },
        plugins
    },
    {
        input: 'src/popup.tsx',
        output: {
            file: 'dist/popup.js',
            format: 'iife',
            sourcemap: true
        },
        plugins
    }
];