const fs = require('fs'), path = require('path'), { assign: define, entries: entriesOf, getPrototypeOf: prototypeOf, setPrototypeOf: setPrototype } = Object, { readFileSync, existsSync, writeFileSync, renameSync } = fs, { resolve, dirname, basename, relative, parse: parsePath, extname } = path;
const defaults = {
    backup: false, safe: true, output: true,
}, debugging = ('');
const [READ, PARSE, LINKS] = ['READ', 'PARSE', 'LINKS'].map(Symbol), matchers = {
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
    invalidCallingContext: (method = 'Callee') => Error(`${method} cannot be called on "this" context (unsupported inheritance or Function#<bind|call|apply> use).`),
    invalidArgument: (method = 'Callee', argument = 'argument', value, reason = ` = ${value}`) => Error(`${method} does not support ${argument} ${reason}.`),
}, timestamp = {
    locale: 'en-US', timeZone: 'GMT', timeZoneName: 'short',
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: 'numeric', minute: '2-digit', second: '2-digit'
};
const VOID = Object.create(null), NOOP = (() => VOID), ANY = (type) => type !== 'undefined', typeguard = (type, value, fallback) => typeof value === type ? value : fallback, callable = typeguard.bind(null, 'function'), object = define(typeguard.bind(null, 'object'), {
    flat: (value, fallback) => typeof value === 'object' && [Object.prototype, null].includes(prototypeOf(value)) ? value : fallback
}), boolean = typeguard.bind(null, 'boolean'), string = typeguard.bind(null, 'string'), { stdout, argv = [], hrtime } = ANY(typeof process) ? process : VOID, columns = stdout && stdout.columns > 0 ? Math.min(stdout.columns, 120) : 80, { now = (callable(hrtime) && ((t = hrtime()) => t[0] * 1000 + t[1] / 1000000)) || Date.now } = ANY(typeof performance) ? performance : VOID, bind = (object, ...methods) => { for (const method of methods)
    callable(object[method]) && (object[method] = object[method].bind(object)); }, normalizeAlias = value => string(matchers.alias.test(value) && value, '');
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
        this.wrappers = new WeakMap();
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
    get cwd() {
        return dirname(string(this.src || this.path, ''));
    }
    wrap(wrapper) {
        const ƒ = 'Context#wrap', { $: context, $: { wrap: ƒwrap, wrappers } } = this;
        if ((wrapper = object(wrapper)) && !object.flat(wrapper))
            throw errors.invalidArgument(ƒ, 'wrapper', wrapper, 'which should be a flat object.');
        else if (ƒwrap !== Context.prototype.wrap || !object(wrappers) || wrappers.constructor !== WeakMap)
            throw errors.invalidCallingContext(ƒ);
        let wrapped = wrappers.get(wrapper = wrapper || {});
        if (!wrapped)
            wrappers.set(wrapper, wrapped = setPrototype(wrapper, context));
        return wrapped;
    }
    $timestamp(date, { locale, ...options } = timestamp) {
        return (date && (date > 0 || string(date) ? new Date(date) : object(date)) || new Date()).toLocaleString(string(locale, timestamp.locale), options);
    }
    $format(string) {
        let type = typeof string;
        return type === 'string' || type === 'number' || type === 'boolean' ? `${string}` : `<!-- \`${string}\` -->`;
    }
    $resolve(path, base) {
        base = string((base === true || /^\.\//.test(path)) && this.cwd || this.path);
        if (!existsSync(path = resolve(base, `./${string(path, '')}`)))
            throw Error(`The resolved path "${path}" for the specified path "${arguments[0]}" does not exist.`);
        return path;
    }
    $exists(path) {
        return this.$format(relative(this.path, this.$resolve(path)));
    }
    $include(path) {
        const content = this[READ](path = this.$resolve(path)).trim();
        return matchers.fragments.test(content)
            ? this.$parse(content, this.wrap({ src: path, document: parsePath(path) }))
            : this.$format(content);
    }
    $parse(markdown, context = this) {
        return this.$format(this[PARSE](context, markdown, false));
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
class Compiler extends Base {
    constructor() { bind(super(), 'fragment', 'parse', 'format', 'print'); }
    fragment(source) {
        const raw = this.normalize(source);
        const fragments = raw.split(matchers.fragments);
        this.log.fragments(fragments);
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
        for (let i = 0, n = fragments.length, fragment; fragment = fragments[i], i < n; i++) {
            const [, directive, body, ...rest] = matchers.parts.exec(fragment) || '';
            if (!directive)
                push(fragment);
            else if (directive === '!')
                push('\n');
            else
                try {
                    push(this.format({ directive, body: `\n${new Macro(directive)(context)}\n` }));
                }
                catch (exception) {
                    problems.push({ fragment, directive, body, rest, exception, index: i });
                    push(this.format({ directive, exception }));
                }
        }
        root && output.push(`\n\n<?!?>\n${context[LINKS]}\n---\nLast Updated: ${context.$timestamp()}\n<?!>\n`);
        if (problems.length) {
            for (const { fragment, index, exception, exception: { name, message } = '' } of problems)
                this.warn(define(Error(''), exception, { message: '\n' + this.pretty(fragment, message, index, name) }));
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
    [, mdpath.suffix] = matchers.suffix.exec(mdpath.name) || '';
    if (suffix && mdpath.name.endsWith(suffix))
        throw errors.alreadySuffixed(mdpath.base, mdpath.suffix || suffix);
    const firstLine = pkg.readUntil(mdpath.path, /(?:([\?\@\!\%])(--)?>)/) || '';
    const [, rawpath] = /(?:<\!--[\@\%])(.*?)$/.exec(firstLine) || '';
    mdpath.resolved = rawpath ? resolve(mdpath.dir, mdpath.raw = rawpath) : mdpath.path;
    outpath = outpath === true ? mdpath.path : suffix ? resolve(mdpath.dir, `${mdpath.name}${suffix}${mdpath.ext}`) : null;
    if (!mdpath.raw && outpath !== mdpath.resolved)
        mdpath.raw = relative(dirname(outpath), mdpath.resolved);
    const mdin = read(mdpath.resolved);
    const [, yaml = '', md = mdin] = /^(---\n.*?\n---\n|)((?:.*?\n?)*)$/.exec(mdin) || '';
    const { parse, pretty, log } = new Compiler(), started = now();
    const context = new Context({ ...info, [READ]: read, [PARSE]: parse, document: parsePath(mdpath.resolved), src: mdpath.resolved }, root);
    let mdout = (parse(context, md) || '');
    const elapsed = now() - started;
    if (defaults.safe || mdpath.raw)
        mdout = mdout.replace(matchers.shorttags, '<!--$1-->');
    mdout = (defaults.safe ? '' : yaml) + (mdpath.raw ? `<!--%${mdpath.raw}%-->\n<!--\t*** THIS FILE IS DYNAMICALLY GENERATED ***\t-->\n${mdout.replace(/^<\!--(\@.*?\@|\$.*?\$)-->\n?/mg, '')}` : mdout);
    outpath && write(mdpath.out = outpath, mdout), log.print(pretty(mdout, outpath));
    return { output: mdout, input: mdin, path: mdpath, elapsed };
}
(new class CLI extends Base {
    bootstrap(args) {
        if (!(object(args) && args.length >= 0))
            return;
        const started = now();
        const options = { p: '', m: [], o: null, b: null }, push = (k, arg) => options[k].push ? options[k].push(arg) : options[k] = arg, flagLike = /^(-\w|--\w+(\-\w+))/, pathLike = /[\.\\\/]/, fileLike = /\w+\.\w+$/, extLike = /^\.\w+$/;
        for (let i = 0, arg, k = ''; arg = args[i], i < args.length; i++) {
            flagLike.test(arg) ? (k = (k = /\w/.exec(arg)[0]) in options ? (k) : '',
                options[k] === null && (options[k] = true)) : k ? (push(k, arg), k === 'm' || (k = ''))
                : pathLike.test(arg) && (extLike.test(arg) ? options.o = arg
                    : !fileLike.test(arg) ? push('p', resolve(arg))
                        : push('m', resolve(arg)));
        }
        const pkg = string(options.p), out = boolean(options.o, string(options.o, defaults.output));
        if (string(out) && !/^\.[^\.\s\\\/\:]+$/.test(out))
            throw errors.invalidSuffix(out).message;
        let processed = 0, skipped = 0, errored = 0, files = options.m.length ? options.m : [undefined];
        for (const file of files)
            try {
                const started = now(), { elapsed: parsing, path: { path: mdpath } } = mdon(pkg, file, out), elpased = now() - started;
                this.log(`MDon: [DONE] ${mdpath} — compile ${parsing.toFixed(1)} ms — done ${elpased.toFixed(1)} ms`);
                processed++;
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
