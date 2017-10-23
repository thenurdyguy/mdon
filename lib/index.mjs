#!/usr/bin/env node --experimental-modules --no-warnings --

// import fs from 'fs'; import path from 'path'; const module = { filename: 'mdon/lib/index.mjs' };
// global.fs = fs, global.path = path;
import mdon from './index.js';
const { Package, Compiler, Context, Macro } = mdon; // mdon = global[Symbol.for('mdon')],
// export { mdon, Package, Compiler, Context, Macro }; export default mdon;
export { mdon, Package, Compiler, Context, Macro }; export default mdon;
