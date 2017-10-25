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

    let frontmatter = []; const properties = {}, append = yaml.safeLoad ? (matter) =>
        string(matter) && (matter = matter.replace(/^(?:<\!)?---\n((?:.*?\n)*?|)---(?:>)?\n?$/, '$1')) && (
            define(properties, yaml.safeLoad(matter)), frontmatter.push(matter), true
        ) : NOOP;

    const firstLine = pkg.readUntil(mdpath.path, /(?:([\?\@\!\%])(--)?>)/) || '';
    // let [, extramatter = '', rawpath] = /(?:<\!--\n+|)(---\n(?:.*?\n)*?---\n|)(?:.*?\n)*?(?:<\!--[\@\%])(.*?)$/.exec(firstLine) || '';
    // let [, extramatter = '', rawpath] = /(?:<\!--\n+|<\!(?=---)|)(---\n(?:.*?\n)*?---(?=\n|>\n)|)(?:.*?\n)*?(?:<\!--[\@\%])(.*?)$/.exec(firstLine) || '';
    let [, extramatter = '', rawpath] = /(<\!---\n(?:.*?\n)*?--->\n|---\n(?:.*?\n)*?---\n|)(?:.*?\n)*?(?:<\!--[\@\%])(.*?)$/.exec(firstLine) || '';

    if (extramatter) extramatter = extramatter.replace(/^<\!/, '').replace(/>\n$/, '\n');

    mdpath.resolved = rawpath ? resolve(mdpath.dir, mdpath.raw = rawpath) : mdpath.path;
    outpath = outpath === true ? mdpath.path as string : suffix ? resolve(mdpath.dir, `${mdpath.name}${suffix}${mdpath.ext}`) as string : null;

    if (!mdpath.raw && outpath !== mdpath.resolved) mdpath.raw = relative(dirname(outpath), mdpath.resolved);

    const mdin = read(mdpath.resolved);
    let [, rawmatter = '', md = mdin] = /^(---\n(?:.*?\n)*?---\n|)((?:.*?\n?)*)$/.exec(mdin) || '';

    append(rawmatter), append(extramatter);

    const { parse, pretty, log } = new Compiler(), started = now();
    const context = new Context({ ...info, ...properties, [READ]: read, [PARSE]: parse, document: parsePath(mdpath.resolved), src: mdpath.resolved }, root); // cwd: dirname(mdpath.resolved)
    let mdout = (parse(context, md) || '');
    const elapsed = now() - started;

    if (defaults.safe || mdpath.raw) mdout = mdout.replace(matchers.shorttags, '<!--$1-->');
    let outmatter = extramatter ? extramatter + '\n' : ''; //|| (!defaults.safe && frontmatter.length ? frontmatter.join('\n') + '\n' : '');
    if (outmatter && mdpath.raw) outmatter = `<!${outmatter.replace(/[\s\n]+$/, '').trim()}>\n`;
    mdout = outmatter + (mdpath.raw ? `<!--%${mdpath.raw}%-->\n<!--\t*** THIS FILE IS DYNAMICALLY GENERATED ***\t-->\n${mdout.replace(/^<\!--(\@.*?\@|\$.*?\$)-->\n?/mg, '')}` : mdout);
    outpath && write(mdpath.out = outpath, mdout), log.print(pretty(mdout, outpath)); // log(`MDon: ${mdpath.path} done in ${elapsed.toFixed(1)} ms`); // console.log({ mdpath, rawpath, outpath });

    return { output: mdout, input: mdin, path: mdpath as Path, elapsed };
}
