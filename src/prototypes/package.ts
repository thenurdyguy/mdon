/** Exposes root, package.json fields, and file operations. */
class Package extends Base {
    resolve = resolve;
    root: string;
    info: indexable<any>;
    constructor(path: string = '.') {
        super();
        const filename = resolve(string(path, '').replace(/[\\\/]package\.json$/i, ''), 'package.json');
        const root = dirname(filename), info = JSON.parse(this.read(filename));
        define(this, {
            root, filename, info, resolve: this.resolve.bind(null, root),
            read: this.read.bind(this), write: this.write.bind(this)
        });
    }
    read(filename: string) {
        filename = this.resolve(filename);
        return readFileSync(this.resolve(filename)).toString();
    }
    readUntil(file: string | number, until = /[\n\r]/, length = 128, position = 0, contents = '', buffer = new Buffer(length)) {
        if (string(file)) file = fs.openSync(this.resolve(file), 'r');
        fs.readSync(file, buffer, 0, length, position), contents += buffer.toString();
        return until.test(contents)
            ? (fs.closeSync(file), contents.split(until)[0])
            : this.readUntil(file, until, length, position += length, contents, buffer);
    }
    write(filename: string, contents: string, { flag = 'w', backup = defaults.backup, ...options } = {}) {
        if (debugging && debugging.output === false) return;
        filename = this.resolve(filename), backup && this.backup(filename);
        return writeFileSync(filename, contents, { flag, ...options });
    }
    backup(filename: string, i = 0) {
        filename = this.resolve(filename);
        while (existsSync(filename)) filename = `${arguments[0]}.${i++}`;
        return i > 0 ? (fs.renameSync(arguments[0], filename)) : null;
    }
}
