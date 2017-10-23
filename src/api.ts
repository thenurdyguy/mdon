/* API */
declare interface Path {
    root: string; dir: string; name: string; ext: string; base: string; suffix?: string;
    path: string; intended?: string; resolved?: string; raw?: string; out?: string;
    [name: string]: string;
}

function mdon(pkgpath?: string, mdpath?: string, outpath?: string | boolean);
function mdon(pkgpath: string = '', mdpath: any = './README.md' as any, outpath: string | boolean = defaults.output) {
    const pkg = new Package(pkgpath), { resolve, read, write, root, info } = pkg;
    const [, suffix] = matchers.suffix.exec(outpath as any) || '';

    mdpath = { intended: mdpath, path: mdpath = pkg.resolve(string(mdpath)), ...parsePath(mdpath) };
    [, mdpath.suffix] = matchers.suffix.exec(mdpath.name) || ''; // console.log(mdpath);

    if (suffix && mdpath.name.endsWith(suffix)) //  : mdpath.suffix
        throw errors.alreadySuffixed(mdpath.base, mdpath.suffix || suffix); // ((error = ).stack, error);

    const firstLine = pkg.readUntil(mdpath.path, /(?:([\?\@\!\%])(--)?>)/) || '';
    const [, rawpath] = /(?:<\!--[\@\%])(.*?)$/.exec(firstLine) || '';
    mdpath.resolved = rawpath ? resolve(mdpath.dir, mdpath.raw = rawpath) : mdpath.path;
    outpath = outpath === true ? mdpath.path as string : suffix ? resolve(mdpath.dir, `${mdpath.name}${suffix}${mdpath.ext}`) as string : null;

    if (!mdpath.raw && outpath !== mdpath.resolved) mdpath.raw = relative(dirname(outpath), mdpath.resolved);

    const mdin = read(mdpath.resolved);
    const [, yaml = '', md = mdin] = /^(---\n.*?\n---\n|)((?:.*?\n?)*)$/.exec(mdin) || '';

    const { parse, pretty, log } = new Compiler(), started = now();
    const context = new Context({ ...info, [READ]: read, [PARSE]: parse }, root);
    let mdout = (parse(context, md) || '');
    const elapsed = now() - started;

    if (defaults.safe || mdpath.raw) mdout = mdout.replace(matchers.shorttags, '<!--$1-->');
    mdout = (defaults.safe ? '' : yaml) + (mdpath.raw ? `<!--%${mdpath.raw}%-->\n${mdout.replace(/^<\!--(\@.*?\@|\$.*?\$)-->\n?/mg, '')}` : mdout);
    outpath && write(mdpath.out = outpath, mdout), log.print(pretty(mdout, outpath)); // log(`MDon: ${mdpath.path} done in ${elapsed.toFixed(1)} ms`); // console.log({ mdpath, rawpath, outpath });

    return { output: mdout, input: mdin, path: mdpath as Path, elapsed };
}
