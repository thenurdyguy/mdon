// declare type Logger<M extends keyof Console = 'log'> = Console[M] & { [name: string]: Console[M] };
declare type Logger<M extends keyof Console = 'log'> = Console[M] & indexable<Console[M] & indexable<Console[M]>>;

class Base {
    $ = this;
    log = new Proxy(console.log, {
        get: (log, scope: string) => (log[scope] || (log[scope] = (debugging[scope] ? log : NOOP)))
    }) as any as Logger['log'];
    warn = console.error;
}
