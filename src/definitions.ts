/* Settings */
const defaults = { backup: false, safe: true, output: true }, // false returns output, '.suffix' writes to <name>.suffix.md
    debugging: indexable<boolean | undefined> = '' as any;
// { parse: true, fragments: false, sprint: true, output: true };

/* Required Imports */
const fs = require('fs'), path = require('path'),
    { assign: define, entries: entriesOf, getPrototypeOf, setPrototypeOf: setPrototype } = Object,
    { readFileSync, existsSync, writeFileSync, renameSync } = fs,
    { resolve, dirname, basename, relative, parse: parsePath, extname } = path;

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
        invalidCallingContext: (method = 'Callee') => Error(`${method} cannot be called on "this" context (unsupported inheritance or Function#<bind|call|apply> use).`),
        invalidArgument: (method = 'Callee', argument = 'argument', value, reason = ` = ${value}`) => Error(`${method} does not support ${argument} ${reason}.`),
    },
    timestamp: Intl.DateTimeFormatOptions & { locale?: string } = {
        locale: 'en-US', timeZone: 'GMT', timeZoneName: 'short',
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
        hour: 'numeric', minute: '2-digit', second: '2-digit'
    };

declare interface Guard<T = any> {
    (value: T | any): T | undefined;
    <T>(value: T | any): T | undefined;
    <F>(value: T | any, fallback?: F): T | F;
    <T, F>(value: T | any, fallback?: F): T | F;
};

/* Helpers */
const
    VOID = Object.seal(Object.create(null)),
    NOOP = ((() => VOID) as ((...args: any[]) => any)),
    ANY = (type: any) => type !== 'undefined',
    prototypeOf = (value) => value === null || value === undefined ? undefined : getPrototypeOf(value),
    typeguard = (type: any, value: any, fallback: any) => typeof value === type ? value : fallback, // type.includes(typeof value)
    callable = typeguard.bind(null, 'function'),
    object = define(
        typeguard.bind(null, 'object') as Guard<object>,
        {
            flat: ((check = Array.prototype.includes.bind([null, Object.prototype])) =>
                (value, fallback: any) => check(prototypeOf(value)) ? value : fallback
            )() as (Guard<object>)
        }),
    boolean = typeguard.bind(null, 'boolean'),
    string = typeguard.bind(null, 'string'),
    { stdout, argv = [], hrtime } = ANY(typeof process) ? process : VOID,
    columns = stdout && stdout.columns > 0 ? Math.min(stdout.columns, 120) : 80,
    { now = (
        callable(hrtime) && ((t = hrtime()) => t[0] * 1000 + t[1] / 1000000)
    ) || Date.now } = ANY(typeof performance) ? performance : VOID,
    bind = (object, ...methods: string[]) => { for (const method of methods) callable(object[method]) && (object[method] = object[method].bind(object)); },
    reconcile = (
        (a?: Reconcilable | any, ...fallback: (Reconcilable | any)[]) => {
            try {
                const ƒ = callable(a) || callable(object(a, VOID).try);
                return ƒ && (!ƒ.name && ƒ.length === 0) ? ƒ() : a;
            } catch (exception) {
                return !callable(fallback[0]) ? fallback[0] : fallback.length === 1 ? reconcile(fallback[0]) : reconcile(...fallback);
            }
        }
    ) as {
            <T, U>(ƒ: Reconcilable<T>, fallback: Reconcilable<U>): T | U;
            <T, U>(ƒ: Reconcilable<T>, fallback: U): T | U;
            <T, U = Reconcilable | any>(ƒ: Reconcilable<T>, ...fallback: U[]): T | U;
            <T = Reconcilable | any>(...values: T[]): T;
        },
    normalizeAlias = value => string(matchers.alias.test(value) && value, '');

declare interface Any { }
declare interface Tryable<T = any> extends Any { (): T; name: undefined; length: 0; }
declare type Reconcilable<T = any, ƒ extends Tryable = Tryable<T>> = (ƒ | { try: ƒ }) & Partial<ƒ & { try: ƒ }>;
