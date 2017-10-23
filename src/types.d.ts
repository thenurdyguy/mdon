/// <reference types="node" />
declare type indexable<T = (...args) => any & indexable> = { [name: string]: T };
// declare module "node" {
//     import * as fs from "fs"; import * as path from "path";
//     //     type fs = typeof fs; type path = typeof path;
//     // export {fs, path};
// }
// declare global {
//     type fs_exports = fs;
//     type path_exports = path;
//     // declare global { const fs: typeof _fs_; const path: typeof _path_; }
//     type indexable<T = (...args) => any & indexable> = { [name: string]: T };
//     // declare type fs = indexable; // typeof fs;
//     // declare const fs: fs;
//     // declare type path = indexable; // typeof path;
//     // declare const path: path & {
//     //     resolve: (...parts: string[]) => string & Partial<indexable<string>>;
//     // };
// }

// declare namespace mdon {
//     declare const exports:
// }

declare type mdon = typeof mdon & {
    Compiler: typeof Compiler,
    Context: typeof Context,
    Macro: typeof Macro,
    Package: typeof Package,
    mdon: mdon,
};

// export { fs, path };
declare module "mdon" {
    export const mdon: mdon;
    export const Compiler: mdon['Compiler'];
    export const Context: mdon['Context'];
    export const Macro: mdon['Macro'];
    export const Package: mdon['Package'];
    export default mdon;
    // const _default: typeof mdon & {
    // };
    // const _Compiler: typeof Compiler;
    // const _Context: typeof Context;
    // const _Macro: typeof Macro;
    // const _Package: typeof Package;
    // export {
    //     _Compiler as Compiler,
    //     _Context as Context,
    //     _Macro as Macro,
    //     _Package as Package,
    //     _default as mdon,
    //     _default as default,
    // };
    // export const Package: Package;
}
