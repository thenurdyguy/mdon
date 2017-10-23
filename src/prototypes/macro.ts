/** Low-overhead (less secure) sandbox suitable for evaluating directives. */
class Macro extends Function {
    constructor(public directive: string) {
        super(
            'context', 'global', 'require', 'process', 'module', 'exports',
            `return ${directive
                .replace(matchers.operations, 'context.$$$1')
                .replace(matchers.interpolations, '${context.$format(context.$1)}')
                .replace(matchers.properties, 'context.$1')
            };`
        );
        return Function.prototype.call.bind(this, this);
    }
}
