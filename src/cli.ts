/* CLI */

(new class CLI extends Base {
    private _args: string[];
    get args() {
        let i; return this._args = this._args || (i = argv.findIndex(arg => matchers.arg.test(arg))) > -1 && argv.slice(i + 1) || null;
    }
    bootstrap() {
        if (!this.args) return;
        const started = now();
        const { args } = this,
            options = { p: '', m: [], o: null, b: null },
            push = (k, arg) => options[k].push ? options[k].push(arg) : options[k] = arg, // !options[k] || options[k] === true && (options[k] = arg),
            flagLike = /^(-\w|--\w+(\-\w+))/, pathLike = /[\.\\\/]/, fileLike = /\w+\.\w+$/, extLike = /^\.\w+$/;
        for (let i = 0, arg, k = ''; arg = args[i], i < args.length; i++) {
            flagLike.test(arg) ? (
                k = (k = /\w/.exec(arg)[0]) in options ? (k) : '',
                options[k] === null && (options[k] = true)
            ) : k ? (push(k, arg), k === 'm' || (k = ''))
                    : pathLike.test(arg) && (
                        extLike.test(arg) ? options.o = arg
                            : !fileLike.test(arg) ? push('p', resolve(arg))
                                : push('m', resolve(arg))
                    );
        } // console.log({ ...options });
        const pkg = string(options.p), out = boolean(options.o, string(options.o, defaults.output));

        if (string(out) && !/^\.[^\.\s\\\/\:]+$/.test(out)) throw errors.invalidSuffix(out).message;

        let processed = 0, skipped = 0, errored = 0, files = options.m.length ? options.m : [undefined];
        for (const file of files) try {
            const started = now(),
                { elapsed: parsing, path: { path: mdpath } } = mdon(pkg, file, out),
                elpased = now() - started;
            this.log(`MDon: [DONE] ${mdpath} — compile ${parsing.toFixed(1)} ms — done ${elpased.toFixed(1)} ms`);
            processed++;
            // } catch ({ message, reason = message, filename = file, abort, ...exception }) {
        } catch (exception) {
            const { message, reason = message, filename = file, abort } = exception;
            this.warn(define(exception, {
                message: `MDon: [${abort ? ++skipped && 'SKIPPED' : ++errored && 'FAILED'}] ${filename} — ${reason}`
            }));
        }

        this.log(` ${errored ? '!' : '√'} MDon${extname(module.filename)} processed ${processed} of ${files.length} in ${(now() - started).toFixed(1)} ms`);
    }
}).bootstrap();
