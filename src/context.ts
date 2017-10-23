class Context extends Base {
    path?: string; src: string;
    document?: indexable<any>;
    wrappers = new WeakMap();

    get cwd() {
        return dirname(string(this.src || this.path, ''));
    }

    constructor(properties: object, path: string) {
        super();
        define(this, properties, { path }); // cwd: string(path) && dirname(path) || ''
        this[LINKS] = {
            refs: {}, aliases: {}, length: 0, toString() {
                const entries = this.length && entriesOf(this.refs), result = [];
                for (let i = 0, n = entries.length; i < n; i++)
                    result.push(`[${entries[i][0]}]: ${entries[i][1]}`);
                return result.length ? result.join('\n') + '\n' : '';
            }
        };
    }

    wrap(wrapper?: object) {
        const ƒ = 'Context#wrap', { $: context, $: { wrap: ƒwrap, wrappers } } = this;
        if ((wrapper = object(wrapper)) && !object.flat(wrapper)) throw errors.invalidArgument(ƒ, 'wrapper', wrapper, 'which should be a flat object.');
        else if (ƒwrap !== Context.prototype.wrap || !object(wrappers) || wrappers.constructor !== WeakMap) throw errors.invalidCallingContext(ƒ);
        let wrapped = wrappers.get(wrapper = wrapper || {});
        if (!wrapped) wrappers.set(wrapper, wrapped = setPrototype(wrapper, context));
        return wrapped;
    }

    $timestamp(date?: string | number | Date, { locale, ...options }: indexable<any> = timestamp) {
        return ((date && (date > 0 || string(date) ? new Date(date as any) : object(date)) || new Date()) as Date).toLocaleString(string(locale, timestamp.locale), options);
    }

    $format(string: string) {
        let type = typeof string;
        return type === 'string' || type === 'number' || type === 'boolean' ? `${string}` : `<!-- \`${string}\` -->`
    }

    $resolve(path: string, base?: boolean | string) {
        base = string((base === true || /^\.\//.test(path)) && this.cwd || this.path);
        // console.log(`resolve(${[...arguments].join(', ')}) from ${base}`);
        if (!existsSync(path = resolve(base, `./${string(path, '')}`))) throw Error(`The resolved path "${path}" for the specified path "${arguments[0]}" does not exist.`);
        return path;
    }

    $exists(path: string) {
        return this.$format(relative(this.path, this.$resolve(path)));
    }

    $include(path: string) {
        const content = this[READ](path = this.$resolve(path)).trim();
        // console.log(`include(${[...arguments].join(', ')}) [${path}]: ${content}`);
        return matchers.fragments.test(content)
            ? this.$parse(content, this.wrap({ src: path, document: parsePath(path) }))
            : this.$format(content)
    }

    $parse(markdown: string, context = this) {
        return this.$format(this[PARSE](context, markdown, false));
    }

    $alias(ref: string, prefix = 'link') {
        if (!(ref = string(ref, '').trim())) throw Error(`Cannot create alias from reference: ${arguments[0]}`);
        else if (!(prefix = normalizeAlias(prefix))) throw Error(`Cannot create alias from reference: ${arguments[0]} with prefix: ${arguments[1]}`);
        let alias = this[LINKS].aliases[ref];
        if (!alias) {
            const { [LINKS]: links, [LINKS]: { aliases, refs } } = this;
            refs[alias = aliases[ref] = normalizeAlias(`${prefix}-${++links.length}`)] = ref;
        }
        return alias;
    }

    $ref(alias: string) {
        if (!(alias = normalizeAlias(alias))) throw Error(`Cannot create reference from alias: ${arguments[0]}`);
        const { [LINKS]: { refs: { [alias]: ref } } } = this;
        if (!string(ref)) throw Error(`Cannot find reference from alias ${arguments[0]}.`);
        return ref;
    }
}
