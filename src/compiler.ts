/** Exposes normalize, fragment, parse, format, and print operations. */
class Compiler extends Base {
    constructor() { bind(super(), 'fragment', 'parse', 'format', 'print'); }

    fragment(source: string) {
        const raw = this.normalize(source);
        const fragments = raw.split(matchers.fragments);
        this.log.fragments(fragments); // ['fragments:', ...fragments].join(`\n${'-'.repeat(columns)}\n`), ...pagebreak);
        return fragments;
    }

    normalize(source: string) {
        return string(source, '') && source.replace(matchers.linebreaks, '\n').replace(matchers.extranousLinebreaks, '$1$1');
    }

    format(fragment: { directive?: string, body?: string, exception?: { message?: string; } }): string;
    format({ directive = '!', body, exception }) {
        body = string(body) || '\n';
        if (directive && exception) body += `<!-- \`${(string(exception) || string(exception.message) || 'FAILED!')}\` -->\n`;
        return string(directive) ? `<? ${directive} ?>${body}<?!>` : body;
    }

    parse(context: Context, source: string, root: boolean = true) {
        const fragments = this.fragment(string(source, ''));
        if (!fragments.length || !context) return '';
        const output = [], problems = [], push = output.push.bind(output);
        // for (const fragment of fragments) {
        for (let i = 0, n = fragments.length, fragment; fragment = fragments[i], i < n; i++) {
            const [, directive, body, ...rest] = matchers.parts.exec(fragment) || '';
            if (!directive) push(fragment);
            else if (directive === '!') push('\n');
            else try { // const parts: indexable<any> = { fragment, directive, body, rest };
                push(this.format({ directive, body: `\n${new Macro(directive)(context)}\n` })); // parts.result =
            } catch (exception) {
                problems.push({ fragment, directive, body, rest, exception, index: i });
                push(this.format({ directive, exception })); // parts.result =
            } // this.log.parts(parts);
        }
        root && output.push(`\n\n<?!?>\n${context[LINKS]}\n---\nLast Updated: ${context.$timestamp()}\n<?!>\n`);
        if (problems.length) {
            for (const { fragment, index, exception, exception: { name, message } = '' as any } of problems) { // : { name, message, stack }
                // this.warn({ ...exception, message: this.pretty(fragment, exception.message, index) });
                this.warn(define(Error(''), exception, { message: '\n' + this.pretty(fragment, message, index, name) }));
                // this.warn(exception, this.pretty(fragment, '', index));
            }
        }
        return this.normalize(output.join(''));
    }

    pretty(contents: string, filename?: string, starting: number = 0, title: string = 'file') {
        if (!string(contents)) return;
        if ((title = string(title, string(filename) ? 'FILE' : '   ')).length > 12) title = title.slice(0, 11) + '…';
        const margin = Math.max(6, title.length || 0 - 1);
        const pagebreak = '-'.repeat(columns),
            header = string(filename) ? [`${title.toUpperCase().padEnd(margin - 1)} | ${filename}`, `${'-'.repeat(margin)}|${pagebreak.slice(margin + 1)}`] : [],
            body = contents.split('\n').map((l, i) => `${`${++i + starting}`.padStart(margin - 1, '     ')} | ${l}`);
        return [pagebreak].concat(header, body, pagebreak).join('\n');
    }

}
