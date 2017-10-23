/* Imports */
const fs = require('fs'), path = require('path'), { assign: define, entries: entriesOf, getPrototypeOf: prototypeOf } = Object, { readFileSync, existsSync, writeFileSync, renameSync } = fs, { resolve, dirname, basename, relative, parse: parsePath, extname } = path;
/* Settings */
const defaults = {
    output: true,
    backup: false, safe: true
}, debugging = ['', { parse: true, fragments: false, sprint: true, output: true }][+false];
/* Definitions */
const [READ, PARSE, LINKS] = ['READ', 'PARSE', 'LINKS'].map(Symbol), // Symbol('MDon::Links'),
matchers = {
    alias: /^[a-z0-9]+(\-[a-z0-9]+)*$/i,
    interpolations: /\$\{\s*(\w+|\w+(\.\w+|\[\s*(\d+|\'.*?\'|\".*?\")\s*\])+)\s*\}/g,
    operations: /\@(\w+)/g,
    properties: /\{\{\s*(\w+|\w+(\.\w+|\[\s*(\d+|\'.*?\'|\".*?\")\s*\])+)\s*\}\}/g,
    fragments: /^(<\?[ \t]*.*?\?>[ \t]*\n(?:(?:.*?\n)*?|)(?:<\?\!)>[ \t]*|<\!--\?[ \t]*.*?\?-->[ \t]*\n(?:(?:.*?\n)*?|)(?:<\!--\?\!)-->[ \t]*)$/m,
    parts: /^(?:(?:<\!--|<)\?[ \t]*(.*?)[ \t]*\?(?:-->|>)|)([ \t]*\n(?:.*?\n)*?)(?:<\?\!>|<\!--\?\!-->|)$/m,
    shorttags: /^<(\?.*?[^-])>$/mg,
    suffix: /(?:\.\d+|)(\.[a-z][^\.\s\\\/\:]*|)$/i,
    arg: /[\/\\](mdon[\/\\]lib[\/\\]index\.m?js|\.bin[\/\\]mdon\~?)$/,
    linebreaks: /(\r\n|\n|\r)/mg,
    extranousLinebreaks: /(\n)(\s*\n)+/gm,
}, errors = {
    alreadySuffixed: (filename, suffix, abort = true, reason = `filename "${filename}" already includes the suffix "${suffix}"`) => define(Error(`MDon compiler cannot process a file if ${reason}.`), { reason, filename, suffix, abort }),
    invalidSuffix: (suffix, abort = true, reason = `suffix "${suffix}" is unsupported`) => define(Error(`The ${reason} — MDon only supports suffixes that start with a "." and do not include spaces, dots or any path-related characters.`), { reason, suffix, abort }),
}, timestamp = {
    locale: 'en-US', timeZone: 'GMT', timeZoneName: 'short',
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: 'numeric', minute: '2-digit', second: '2-digit'
};
/* Helpers */
const VOID = Object.create(null), NOOP = (() => VOID), ANY = (type) => type !== 'undefined', typeguard = (type, value, fallback) => typeof value === type ? value : fallback, // type.includes(typeof value)
callable = typeguard.bind(null, 'function'), object = typeguard.bind(null, 'object'), boolean = typeguard.bind(null, 'boolean'), string = typeguard.bind(null, 'string'), { stdout, argv = [], hrtime } = ANY(typeof process) ? process : VOID, columns = stdout && stdout.columns > 0 ? Math.min(stdout.columns, 120) : 80, { now = (callable(hrtime) && ((t = hrtime()) => t[0] * 1000 + t[1] / 1000000)) || Date.now } = ANY(typeof performance) ? performance : VOID, bind = (object, ...methods) => { for (const method of methods)
    callable(object[method]) && (object[method] = object[method].bind(object)); }, normalizeAlias = value => string(matchers.alias.test(value) && value, '');
/* Prototypes */
/** Low-overhead (less secure) sandbox suitable for evaluating directives. */
class Macro extends Function {
    constructor(directive) {
        super('context', 'global', 'require', 'process', 'module', 'exports', `return ${directive
            .replace(matchers.operations, 'context.$$$1')
            .replace(matchers.interpolations, '${context.$format(context.$1)}')
            .replace(matchers.properties, 'context.$1')};`);
        this.directive = directive;
        return Function.prototype.call.bind(this, this);
    }
}
class Base {
    constructor() {
        this.$ = this;
        this.log = new Proxy(console.log, {
            get: (log, scope) => (log[scope] || (log[scope] = (debugging[scope] ? log : NOOP)))
        });
        this.warn = console.error;
    }
}
class Context extends Base {
    constructor(properties, path) {
        super();
        define(this, properties, { path });
        this[LINKS] = {
            refs: {}, aliases: {}, length: 0, toString() {
                const entries = this.length && entriesOf(this.refs), result = [];
                for (let i = 0, n = entries.length; i < n; i++)
                    result.push(`[${entries[i][0]}]: ${entries[i][1]}`);
                return result.length ? result.join('\n') + '\n' : '';
            }
        };
    }
    $timestamp(date, { locale, ...options } = timestamp) {
        return (date && (date > 0 || string(date) ? new Date(date) : object(date)) || new Date()).toLocaleString(string(locale, timestamp.locale), options);
    }
    $format(string) {
        let type = typeof string;
        return type === 'string' || type === 'number' || type === 'boolean' ? `${string}` : `<!-- \`${string}\` -->`;
    }
    $resolve(path) {
        if (!existsSync(path = resolve(this.path, `./${path}`)))
            throw Error(`The resolved path "${path}" for the specified path "${arguments[0]}" does not exist.`);
        return path;
    }
    $exists(path) {
        return this.$format(relative(this.path, this.$resolve(path)));
    }
    $include(path) {
        const content = this[READ](this.$resolve(path));
        // if (path) throw Error(`Not a real error!`);
        return matchers.fragments.test(content)
            ? this.$parse(content)
            : this.$format(content);
    }
    $parse(markdown) {
        return this.$format(this[PARSE](this, markdown, false));
    }
    $alias(ref, prefix = 'link') {
        if (!(ref = string(ref, '').trim()))
            throw Error(`Cannot create alias from reference: ${arguments[0]}`);
        else if (!(prefix = normalizeAlias(prefix)))
            throw Error(`Cannot create alias from reference: ${arguments[0]} with prefix: ${arguments[1]}`);
        let alias = this[LINKS].aliases[ref];
        if (!alias) {
            const { [LINKS]: links, [LINKS]: { aliases, refs } } = this;
            refs[alias = aliases[ref] = normalizeAlias(`${prefix}-${++links.length}`)] = ref;
        }
        return alias;
    }
    $ref(alias) {
        if (!(alias = normalizeAlias(alias)))
            throw Error(`Cannot create reference from alias: ${arguments[0]}`);
        const { [LINKS]: { refs: { [alias]: ref } } } = this;
        if (!string(ref))
            throw Error(`Cannot find reference from alias ${arguments[0]}.`);
        return ref;
    }
}
/** Exposes root, package.json fields, and file operations. */
class Package extends Base {
    constructor(path = '.') {
        super();
        this.resolve = resolve;
        const filename = resolve(string(path, '').replace(/[\\\/]package\.json$/i, ''), 'package.json');
        const root = dirname(filename), info = JSON.parse(this.read(filename));
        define(this, {
            root, filename, info, resolve: this.resolve.bind(null, root),
            read: this.read.bind(this), write: this.write.bind(this)
        });
    }
    read(filename) {
        filename = this.resolve(filename);
        return readFileSync(this.resolve(filename)).toString();
    }
    readUntil(file, until = /[\n\r]/, length = 128, position = 0, contents = '', buffer = new Buffer(length)) {
        if (string(file))
            file = fs.openSync(this.resolve(file), 'r');
        fs.readSync(file, buffer, 0, length, position), contents += buffer.toString();
        return until.test(contents)
            ? (fs.closeSync(file), contents.split(until)[0])
            : this.readUntil(file, until, length, position += length, contents, buffer);
    }
    write(filename, contents, { flag = 'w', backup = defaults.backup, ...options } = {}) {
        if (debugging && debugging.output === false)
            return;
        filename = this.resolve(filename), backup && this.backup(filename);
        return writeFileSync(filename, contents, { flag, ...options });
    }
    backup(filename, i = 0) {
        filename = this.resolve(filename);
        while (existsSync(filename))
            filename = `${arguments[0]}.${i++}`;
        return i > 0 ? (fs.renameSync(arguments[0], filename)) : null;
    }
}
/** Exposes normalize, fragment, parse, format, and print operations. */
class Compiler extends Base {
    constructor() { bind(super(), 'fragment', 'parse', 'format', 'print'); }
    fragment(source) {
        const raw = this.normalize(source);
        const fragments = raw.split(matchers.fragments);
        this.log.fragments(fragments); // ['fragments:', ...fragments].join(`\n${'-'.repeat(columns)}\n`), ...pagebreak);
        return fragments;
    }
    normalize(source) {
        return string(source, '') && source.replace(matchers.linebreaks, '\n').replace(matchers.extranousLinebreaks, '$1$1');
    }
    format({ directive = '!', body, exception }) {
        body = string(body) || '\n';
        if (directive && exception)
            body += `<!-- \`${(string(exception) || string(exception.message) || 'FAILED!')}\` -->\n`;
        return string(directive) ? `<? ${directive} ?>${body}<?!>` : body;
    }
    parse(context, source, root = true) {
        const fragments = this.fragment(string(source, ''));
        if (!fragments.length || !context)
            return '';
        const output = [], problems = [], push = output.push.bind(output);
        // for (const fragment of fragments) {
        for (let i = 0, n = fragments.length, fragment; fragment = fragments[i], i < n; i++) {
            const [, directive, body, ...rest] = matchers.parts.exec(fragment) || '';
            if (!directive)
                push(fragment);
            else if (directive === '!')
                push('\n');
            else
                try {
                    push(this.format({ directive, body: `\n${new Macro(directive)(context)}\n` })); // parts.result =
                }
                catch (exception) {
                    problems.push({ fragment, directive, body, rest, exception, index: i });
                    push(this.format({ directive, exception })); // parts.result =
                } // this.log.parts(parts);
        }
        root && output.push(`\n\n<?!?>\n${context[LINKS]}\n---\nLast Updated: ${context.$timestamp()}\n<?!>\n`);
        if (problems.length) {
            for (const { fragment, index, exception, exception: { name, message } = '' } of problems) {
                // this.warn({ ...exception, message: this.pretty(fragment, exception.message, index) });
                this.warn(define(Error(''), exception, { message: '\n' + this.pretty(fragment, message, index, name) }));
                // this.warn(exception, this.pretty(fragment, '', index));
            }
        }
        return this.normalize(output.join(''));
    }
    pretty(contents, filename, starting = 0, title = 'file') {
        if (!string(contents))
            return;
        if ((title = string(title, string(filename) ? 'FILE' : '   ')).length > 12)
            title = title.slice(0, 11) + '…';
        const margin = Math.max(6, title.length || 0 - 1);
        const pagebreak = '-'.repeat(columns), header = string(filename) ? [`${title.toUpperCase().padEnd(margin - 1)} | ${filename}`, `${'-'.repeat(margin)}|${pagebreak.slice(margin + 1)}`] : [], body = contents.split('\n').map((l, i) => `${`${++i + starting}`.padStart(margin - 1, '     ')} | ${l}`);
        return [pagebreak].concat(header, body, pagebreak).join('\n');
    }
}
function mdon(pkgpath = '', mdpath = './README.md', outpath = defaults.output) {
    const pkg = new Package(pkgpath), { resolve, read, write, root, info } = pkg;
    const [, suffix] = matchers.suffix.exec(outpath) || '';
    mdpath = { intended: mdpath, path: mdpath = pkg.resolve(string(mdpath)), ...parsePath(mdpath) };
    [, mdpath.suffix] = matchers.suffix.exec(mdpath.name) || ''; // console.log(mdpath);
    if (suffix && mdpath.name.endsWith(suffix))
        throw errors.alreadySuffixed(mdpath.base, mdpath.suffix || suffix); // ((error = ).stack, error);
    const firstLine = pkg.readUntil(mdpath.path, /(?:([\?\@\!\%])(--)?>)/) || '';
    const [, rawpath] = /(?:<\!--[\@\%])(.*?)$/.exec(firstLine) || '';
    mdpath.resolved = rawpath ? resolve(mdpath.dir, mdpath.raw = rawpath) : mdpath.path;
    outpath = outpath === true ? mdpath.path : suffix ? resolve(mdpath.dir, `${mdpath.name}${suffix}${mdpath.ext}`) : null;
    if (!mdpath.raw && outpath !== mdpath.resolved)
        mdpath.raw = relative(dirname(outpath), mdpath.resolved);
    const mdin = read(mdpath.resolved);
    const [, yaml = '', md = mdin] = /^(---\n.*?\n---\n|)((?:.*?\n?)*)$/.exec(mdin) || '';
    const { parse, pretty, log } = new Compiler(), started = now();
    const context = new Context({ ...info, [READ]: read, [PARSE]: parse }, root);
    let mdout = (parse(context, md) || '');
    const elapsed = now() - started;
    if (defaults.safe || mdpath.raw)
        mdout = mdout.replace(matchers.shorttags, '<!--$1-->');
    mdout = (defaults.safe ? '' : yaml) + (mdpath.raw ? `<!--%${mdpath.raw}%-->\n${mdout.replace(/^<\!--(\@.*?\@|\$.*?\$)-->\n?/mg, '')}` : mdout);
    outpath && write(mdpath.out = outpath, mdout), log.print(pretty(mdout, outpath)); // log(`MDon: ${mdpath.path} done in ${elapsed.toFixed(1)} ms`); // console.log({ mdpath, rawpath, outpath });
    return { output: mdout, input: mdin, path: mdpath, elapsed };
}
/* CLI */
(new class CLI extends Base {
    bootstrap(args) {
        if (!args)
            return;
        const started = now();
        const options = { p: '', m: [], o: null, b: null }, push = (k, arg) => options[k].push ? options[k].push(arg) : options[k] = arg, // !options[k] || options[k] === true && (options[k] = arg),
        flagLike = /^(-\w|--\w+(\-\w+))/, pathLike = /[\.\\\/]/, fileLike = /\w+\.\w+$/, extLike = /^\.\w+$/;
        for (let i = 0, arg, k = ''; arg = args[i], i < args.length; i++) {
            flagLike.test(arg) ? (k = (k = /\w/.exec(arg)[0]) in options ? (k) : '',
                options[k] === null && (options[k] = true)) : k ? (push(k, arg), k === 'm' || (k = ''))
                : pathLike.test(arg) && (extLike.test(arg) ? options.o = arg
                    : !fileLike.test(arg) ? push('p', resolve(arg))
                        : push('m', resolve(arg)));
        } // console.log({ ...options });
        const pkg = string(options.p), out = boolean(options.o, string(options.o, defaults.output));
        if (string(out) && !/^\.[^\.\s\\\/\:]+$/.test(out))
            throw errors.invalidSuffix(out).message;
        let processed = 0, skipped = 0, errored = 0, files = options.m.length ? options.m : [undefined];
        for (const file of files)
            try {
                const started = now(), { elapsed: parsing, path: { path: mdpath } } = mdon(pkg, file, out), elpased = now() - started;
                this.log(`MDon: [DONE] ${mdpath} — compile ${parsing.toFixed(1)} ms — done ${elpased.toFixed(1)} ms`);
                processed++;
                // } catch ({ message, reason = message, filename = file, abort, ...exception }) {
            }
            catch (exception) {
                const { message, reason = message, filename = file, abort } = exception;
                this.warn(define(exception, {
                    message: `MDon: [${abort ? ++skipped && 'SKIPPED' : ++errored && 'FAILED'}] ${filename} — ${reason}`
                }));
            }
        this.log(` ${errored ? '!' : '√'} MDon processed ${processed} of ${files.length} in ${(now() - started).toFixed(1)} ms`);
    }
}).bootstrap(matchers.arg.test(argv[1]) && argv.slice(2) || null);
module.exports = define(mdon, { mdon, Package, Compiler, Context, Macro });
