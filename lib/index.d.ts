/// <reference types='node' />

export declare interface Path {
    root: string; dir: string; name: string; ext: string; base: string; suffix?: string;
    path: string; intended?: string; resolved?: string; raw?: string; out?: string;
    [name: string]: string;
}

export declare function mdon(pkgpath?: string, mdpath?: string & Partial<Path>, outpath?: string | boolean): {
    output: string; input: string; elapsed: number; path: Path;
}

export declare namespace mdon {
    export class Base {
        log: Console['log'] & { [scope: string]: Console['log']; };
        warn: Console['warn'];
    }

    export const Macro: new (directive: string) => (context: Context) => any;

    export class Context extends Base {
        path: string;

        constructor(properties: object, path: string);
        $format(body: any): string;
        $resolve(path: string): string;
        $exists(path: string): string;
        $include(path: string): string;
        $parse(markdown: string): string;
        $alias(ref: string, prefix?: string): string;
        $ref(alias: string): string;
    }

    export class Package extends Base {
        root: string;
        info: object;
        constructor(path?: string);
        read(filename: string): string;
        readUntil(file: string | number, until?: RegExp, length?: number, position?: number): string;
        readUntil(file: string | number, until?: RegExp, length?: number, position?: number, contents?: string, buffer?: Buffer): string;
        write(filename: string, contents: string, options?: { backup?: boolean, flag?: 'w' | 'wx' | 'w+', encoding?: string | null, mode?: number }): string;
        backup(filename: string, suffix?: number): string | null;
        resolve(...path: string[]): string;
    }

    export class Compiler extends Base {
        fragment(source: string): string[];
        normalize(source: string): string;
        format(fragment: { directive?: string, body?: string, exception?: { message?: string; } }): string;
        parse(context: Context, source: string, root?: boolean): string;
        print(contents: string, filename?: string): void;
    }
}

export default mdon;
export import Macro = mdon.Macro;
export import Context = mdon.Context;
export import Package = mdon.Package;
export import Compiler = mdon.Compiler;
