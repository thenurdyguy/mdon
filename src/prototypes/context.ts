class Context extends Base {
    path?: string;

    constructor(properties: object, path: string) {
        super(); define(this, properties, { path });
        this[LINKS] = {
            refs: {}, aliases: {}, length: 0, toString() {
                const entries = this.length && entriesOf(this.refs), result = [];
                for (let i = 0, n = entries.length; i < n; i++)
                    result.push(`[${entries[i][0]}]: ${entries[i][1]}`);
                return result.length ? result.join('\n') + '\n' : '';
            }
        };
    }
    $timestamp(date?: string | number | Date, { locale, ...options }: indexable<any> = timestamp) {
        return ((date && (date > 0 || string(date) ? new Date(date as any) : object(date)) || new Date()) as Date).toLocaleString(string(locale, timestamp.locale), options);
    }
    $format(string: string) {
        let type = typeof string;
        return type === 'string' || type === 'number' || type === 'boolean' ? `${string}` : `<!-- \`${string}\` -->`
    }
    $resolve(path: string) {
        if (!existsSync(path = resolve(this.path, `./${path}`))) throw Error(`The resolved path "${path}" for the specified path "${arguments[0]}" does not exist.`);
        return path;
    }
    $exists(path: string) {
        return this.$format(relative(this.path, this.$resolve(path)));
    }
    $include(path: string) {
        const content = this[READ](this.$resolve(path));
        // if (path) throw Error(`Not a real error!`);
        return matchers.fragments.test(content)
            ? this.$parse(content)
            : this.$format(content)
    }
    $parse(markdown: string) {
        return this.$format(this[PARSE](this, markdown, false));
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
