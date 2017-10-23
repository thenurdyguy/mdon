#!/usr/bin/env node --
// "use exports {}"
// const fs = global.fs = require('fs'), path = global.path = require('path');
module.exports = require('./mdon.js');
// module.exports = global[Symbol.for('mdon')]; // Object.assign(mdon, { mdon, Package, Compiler, Context, Macro });
