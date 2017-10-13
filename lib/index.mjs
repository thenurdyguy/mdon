#!/usr/bin/env sh
':' //; exec "$(command -v "`dirname $0`/node" || command -v node)" "--no-warnings" "--experimental-modules" "$0" "$@"

const debugging = { parse: false };

// const { readFileSync, existsSync, writeFileSync } = require('fs');
import fs from 'fs';
import path from 'path';
import util from 'util';
import module from 'module';

const { readFileSync, existsSync, writeFileSync } = fs; // require('fs');
const { resolve, dirname, basename, relative } = path; // require('path');
const { Module: { _resolveFilename: resolveModule } } = module;

// const { inspect: inspectObject } = require('util');

/**
 * Isomorphic high-resolution timestamp in milliseconds
 */
export const now = typeof performance !== 'undefined' && performance.now
    || typeof process !== 'undefined' && process.hrtime
    ? (hrTime = process.hrtime()) => hrTime[0] * 1000 + hrTime[1] / 1000000
    : Date.now; // var _counter, _start = now(); _counter = (clearInterval(_counter), setInterval(() => console.log(now() - _start), 1000));


const
    { assign: define } = Object,
    stdout = typeof process !== 'undefined' && process.stdout && process.stdout.columns > 0,
    // inspect = stdout
    //     ? (object) => object !== undefined && object !== null && inspectObject(object, false, null, true) || ''
    //     : (object) => object,
    pagebreak = stdout ? ['\n\n--------------------------------------------------\n\n'] : []

const
    matchers = {
        alias: /^[a-z0-9]+(\-[a-z0-9]+)*$/,
        methods: /\@(\w+)/g,
        interpolations: /\$\{\s*(\w+|\w+(\.\w+|\[\s*(\d+|\'.*?\'|\".*?\")\s*\])+)\s*\}/g,
        properties: /\{\{\s*(\w+|\w+(\.\w+|\[\s*(\d+|\'.*?\'|\".*?\")\s*\])+)\s*\}\}/g,
        parts: /^(?:<\?\s*(`.*?`|\!)\s*\?\>|)(.*?)(?:<\?\s*\/\s*\?>|)$/,
        fragments: /(<\?(?:\s*).*?(?:\s*\/\s*)\?>)/m,
        closers: define(/<\?\s*\/\s*\?>/g, {
            alias: /<\s*\?\!?\s*>/g,
        }),
        linebreaks: define(/\n/g, {
            text: '\n',
            alias: define(/<br n \/>/g, { text: '<br n />' }),
            any: /(\r\n|\n|\r)/mg,
            extranous: /(\n)(\s*\n)+/gm,
        }),
    },
    LINKS = Symbol('MDon::Links'),
    aliasClosingTags = string => string
        .replace(matchers.closers.alias, '<?/?>'),
    unaliasClosingTags = (string) => string
        .replace(matchers.closers, '<?!>'),
    normalizeLineBreaks = string => string
        .replace(matchers.linebreaks.any, '\n')
        .replace(matchers.linebreaks.extranous, '$1$1'),
    aliasLineBreaks = string => string
        .replace(matchers.linebreaks, matchers.linebreaks.alias.text),
    unaliasLineBreaks = string => string
        .replace(matchers.linebreaks.alias, matchers.linebreaks.text),
    formatException = exception =>
        `\n<!-- \`${(
            typeof exception === 'string' ? exception
                : exception && typeof exception.message === 'string' && exception.message || 'FAILED!'
        ).replace('`', '\`')}\` -->\n`,
    formatBody = ({ macro, body }) =>
        macro ? `<? ${macro} ?>${body}<?/?>` : body,
    toString = string => typeof string === 'string' && string || '',
    toAlias = string =>
        matchers.alias.test((string = toString(string).trim().toLowerCase())) && string || '',
    tryMacro = (macro, context) => {
        try { return macro.call(context) } catch (exception) { return exception }
    };

function Macro(macro) {
    return new Function('global', 'require', 'process', 'module', 'exports', `return ${macro};`);
}

class Context {
    constructor(properties, path = process.cwd()) {
        Object.assign(this, properties, { path });
        this[LINKS] = { refs: {}, aliases: {}, length: 0 };
    }

    $exception(exception) {
        return formatException(exception);
    }

    $format(string) {
        let type = typeof string;
        return type === 'string' || type === 'number' || type === 'boolean' ? `${string}` : `<!-- \`${string}\` -->`
    }

    $resolve(ref) {
        return resolveModule(resolve(this.path, `./${ref}`));
        // return require.resolve(resolve(this.path, `./${ref}`));
    }

    $alias(ref, prefix = 'link') {
        if (!(ref = toString(ref).trim()))
            throw `Cannot create alias from reference: ${arguments[0]}`;
        else if (!(prefix = toAlias(prefix))) // typeof prefix !== 'string' || !(prefix = prefix.trim()) || /[a-z]+(\-[a-z]+)+/.test(prefix = prefix.toLowerCase()))
            throw `Cannot create alias from reference: ${arguments[0]} with prefix: ${arguments[1]}`;

        let alias = this[LINKS].aliases[ref];

        if (!alias) {
            const { [LINKS]: links, [LINKS]: { aliases, refs } } = this;
            refs[alias = aliases[ref] = toAlias(`${prefix}-${++links.length}`)] = ref;
        }

        return alias;
    }

    $ref(alias) {
        if (!(alias = toAlias(alias)))
            throw `Cannot create reference from alias: ${arguments[0]}`;

        const { [LINKS]: { aliases } } = this;
        const ref = aliases[ref];

        if (!ref)
            throw `Cannot find reference from alias ${arguments[0]}.`

        return ref;
    }

    $exists(ref) {
        return this.$format(relative(this.path, this.$resolve(ref)));
    }

    $include(ref) {
        return this.$format(readFileSync(this.$resolve(ref)).toString());
    }

    $parse(md) {
        return this.$format(parse(md, this, false));
    }

}

function parse(source, context, root = true) {
    const fragments = aliasLineBreaks(aliasClosingTags(normalizeLineBreaks(source))).split(matchers.fragments);
    const output = [];

    const log = debugging && debugging.parse && console.log || (() => { });

    log({ source, fragments }), log(...pagebreak);

    for (const fragment of fragments) {
        let [, macro, body, ...rest] = matchers.parts.exec(fragment) || '';
        let parts = { fragment, macro, body, rest };
        if (macro === '!') {
        } else if (macro) {
            const ƒ = new Macro(
                macro
                    .replace(matchers.methods, 'this.$$$1')
                    .replace(matchers.interpolations, '${this.$format(this.$1)}')
                    .replace(matchers.properties, 'this.$1')
            );
            const result = tryMacro(ƒ, context);
            const newBody = formatBody({ macro, body: result.message ? formatException(result) : result });
            parts.substitute = newBody;
            output.push(newBody);
        } else {
            output.push(fragment);
        }

        log(parts);
    }

    const { [LINKS]: { length: links, aliases, refs } } = context;

    if (root && links) {
        output.push('\n\n<?!?>')
        for (const [alias, ref] of Object.entries(refs))
            output.push(`\n[${alias}]: ${ref}`);
        output.push('\n<?/?>\n')
    }

    const result = unaliasClosingTags(normalizeLineBreaks(unaliasLineBreaks(output.join(''))));

    log(...pagebreak);
    log(result);

    return result;
}

export function mdon(pkgpath = './package.json', mdpath = './README.md', outpath = true) {
    // pkgpath = require.resolve(resolve(process.cwd(), pkgpath || './package.json'));

    pkgpath = resolveModule(resolve(process.cwd(), pkgpath || './package.json'));
    const pkgdir = dirname(pkgpath);
    // const pkginfo = require(pkgpath);
    const pkginfo = JSON.parse(readFileSync(pkgpath).toString()); // .toJSON(); //require(pkgpath);

    mdpath = resolve(process.cwd(), pkgdir, mdpath || './README.md');

    const mdin = readFileSync(mdpath).toString();

    const started = now();

    const context = new Context(pkginfo, pkgdir);
    const mdout = parse(mdin, context);

    outpath = outpath && (
        outpath === true
            ? mdpath
            : /^\.\w+$/.test(outpath) && mdpath.replace(/(\..*?$)/, `${outpath}$1`)
    ) || false;

    const elapsed = now() - started;

    outpath && writeFileSync(outpath, mdout, { flag: 'w' });


    console.log(`MDon: ${mdpath} done in ${elapsed.toFixed(1)} ms`);

    return mdout;
}


export default mdon;

// const
//     argi = process.argv.findIndex(arg => /mdon.m?js$/.test(arg)),
//     args = argi > -1 && process.argv.slice(argi + 1) || null;

// if (args) {
//     let pkgpath;
//     if (args.length === 1) {
//         pkgpath = resolve(process.cwd(), args[0], 'package.json');

//         if (!existsSync(pkgpath))
//             throw `The specified path does not resolve to a valid package.json: ${pkgpath}`;
//     }
//     mdon(pkgpath);
// }
