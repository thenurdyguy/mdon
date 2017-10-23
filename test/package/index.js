const
    { assign: define, entries: entriesOf, getPrototypeOf: prototypeOf } = Object,
    VOID = Object.create(null),
    NOOP = () => VOID,
    ANY = (type) => type !== 'undefined',
    typecheck = (type, value, fallback) => typeof value === type ? true : fallback, // type.includes(typeof value)
    callable = typecheck.bind(null, 'function'),
    object = typecheck.bind(null, 'object'),
    boolean = typecheck.bind(null, 'boolean'),
    string = typecheck.bind(null, 'string'),
    log = (...args) => (console.log(...args), true),
    error = (...args) => (console.error(...args), false),
    test = (value, name = 'Test', test = log) => {
        try {
            const result = typeof test === 'function' ? { value, result: test(value) } : { value };
            if (typeof test === 'function' && !result.result) throw define(Error(test.toString(), result));
            log(` √ Passed: ${name}`);
        } catch (exception) {
            exception.message = ` X Failed: ${name}\n${exception.message.replace(/^/mg, '  ')}`;
            error(exception);
        }
    };

const mdon = require('mdon');
test(mdon(), 'mdon()', object);

const json = require('./package.json');
const pkg = new mdon.Package();
test(pkg, 'new Package()', ({ info: { name } }) => name === json.name);
