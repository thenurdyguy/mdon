/* Imports */
const fs = require('fs'), path = require('path'),
    { assign: define, entries: entriesOf, getPrototypeOf: prototypeOf } = Object,
    { readFileSync, existsSync, writeFileSync, renameSync } = fs,
    { resolve, dirname, basename, relative, parse: parsePath, extname } = path;

/* Settings */
const defaults = {
    output: true, // false returns output, '.suffix' writes to <name>.suffix.md
    backup: false, safe: true
}, debugging = ['', { parse: true, fragments: false, sprint: true, output: true }][+false] as any as indexable<boolean | undefined>;

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
    },
    errors = {
        alreadySuffixed: (filename: string, suffix: string, abort = true, reason = `filename "${filename}" already includes the suffix "${suffix}"`) => define(Error(`MDon compiler cannot process a file if ${reason}.`), { reason, filename, suffix, abort }),
        invalidSuffix: (suffix: string, abort = true, reason = `suffix "${suffix}" is unsupported`) => define(Error(`The ${reason} — MDon only supports suffixes that start with a "." and do not include spaces, dots or any path-related characters.`), { reason, suffix, abort }),
    },
    timestamp: Intl.DateTimeFormatOptions & { locale?: string } = {
        locale: 'en-US', timeZone: 'GMT', timeZoneName: 'short',
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
        hour: 'numeric', minute: '2-digit', second: '2-digit'
    };

/* Helpers */
const
    VOID = Object.create(null),
    NOOP = ((() => VOID) as ((...args: any[]) => any)),
    ANY = (type: any) => type !== 'undefined',
    typeguard = (type: any, value: any, fallback: any) => typeof value === type ? value : fallback, // type.includes(typeof value)
    callable = typeguard.bind(null, 'function'),
    object = typeguard.bind(null, 'object'),
    boolean = typeguard.bind(null, 'boolean'),
    string = typeguard.bind(null, 'string'),
    { stdout, argv = [], hrtime } = ANY(typeof process) ? process : VOID,
    columns = stdout && stdout.columns > 0 ? Math.min(stdout.columns, 120) : 80,
    { now = (
        callable(hrtime) && ((t = hrtime()) => t[0] * 1000 + t[1] / 1000000)
    ) || Date.now } = ANY(typeof performance) ? performance : VOID,
    bind = (object, ...methods: string[]) => { for (const method of methods) callable(object[method]) && (object[method] = object[method].bind(object)); },
    normalizeAlias = value => string(matchers.alias.test(value) && value, '');
