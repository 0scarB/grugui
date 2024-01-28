// Read this file top to bottom. `outputSegment` is only used
// to group outputs. You can ignore it and just read the body of the
// closure passed to it. (Optionally use `dontRun: true` to toggle
// execution of the closure.)
//
// Run `node README.mjs` to execute the code.

import {registerStatements, beginExec} from "./grugui.mjs";

// Statements
// ==========
// Grug-UI is based on the concept of defining sets of "statements"
// that can be used to generate both HTML strings as well as the 
// corresponding in-browser DOM element, for example.

function main() {

    outputSegment("Simple Statements", {dontRun: false}, () => {

        // Simple Statements
        // -----------------
        //
        // Each set of "statements" are defined as methods on a javascript object. 
        // For example, we could define our own set of logging statements.

        const loggingStatements = {
            info(msg) {
                console.log(  `INFO...: ${msg}`);
            },
            warn(msg) {
                console.warn( `WARNING: ${msg}`);
            },
            error(msg) {
                console.error(`ERROR..: ${msg}`);
            }
        };

        // We can register this set of statements under the name "log"
        // by calling `registerStatements`:

        registerStatements("log", loggingStatements);

        // To execute the statements we begin an executaion with `beginExec`:

        const {log, end} = beginExec();
        log.info("All systems online");
        log.warn("Warp drive heat sensor offline");
        log.error("Core meltdown. Evacuate ship!");
        end();
        // OUTPUT: INFO...: All systems online
        //         WARNING: Warp drive heat sensor offline
        //         ERROR..: Core meltdown. Evacuate ship!

        // `log` in `const {log, end} = beginExec();` is the set of statement
        // methods that we registered.
        // `end` ends a compound statement which provides us with a mechanism
        // for emulating block-scoping in structured programming.
    });

    outputSegment("Compound Statements", {dontRun: false}, () => {

        // Compound Statements
        // -------------------
        //
        // For example, we can rewrite the logging statements, adding a
        // compound statement which prefixes the log messages with a datetime
        // string:

        registerStatements("log", {

            // First we use a state variable to track whether the log messages
            // should be prefixed:

            _prefixWithDate: false,

            // then implement new version of the logging methods `info`, `warn`
            // and `error` that conditionally prefix messages with a date
            // if `this._prefixWithDate === true`:

            _modifyMsg(msg) {
                if (this._prefixWithDate) {
                    const datetimeStr = (new Date()).toISOString();

                    return `${datetimeStr} ${msg}`;
                }

                return msg;
            },

            info(msg) {
                console.log(this._modifyMsg(`INFO...: ${msg}`));
            },
            warn(msg) {
                console.warn(this._modifyMsg(`WARNING: ${msg}`));
            },
            error(msg) {
                console.error(this._modifyMsg(`ERROR..: ${msg}`));
            },

            // Finally we implement a method to start the compound statement
            // that we will use to toggle whether or not log messages should
            // be prefixed:

            beginPrefixWithDate() {
                this._prefixWithDate = true;

                // `onCompoundEnd` is set on the object by `beginExec`
                // and MUST be called within the "begin" method of a
                // compound statement to register a callback that will
                // be execute when `end` is called.
                //
                // In this case we toggle off prefixing.
                this.onCompoundEnd(() => {
                    this._prefixWithDate = false;
                });
            },
        }, {replacePrev: true});
        // NOTE: We need to set `{replacePrev: true}` to override the
        //       the set of statements that we registered under the name "log"
        //       in the previous example.

        // We can now use `beginPrefixWithDate` within our logging logic
        // using indentation communicate the structure:

        const {log, end} =
        beginExec();
            log.info("All systems online");
            log.beginPrefixWithDate();
                log.warn("Warp drive heat sensor offline");
            end();
            log.error("Core meltdown. Evacuate ship!");
        end();
        // OUTPUT ~ INFO...: All systems online
        //          2024-01-25T21:54:19.655Z WARNING: Warp drive heat sensor offline
        //          ERROR..: Core meltdown. Evacuate ship!
    });

    outputSegment("Contextual Statement Sets", {dontRun: false}, () => {
        // TODO: Document contextual statement sets.
    });
}

// End of walkthrough! The rest is just utitily functions.
// ======================================================================

function outputSegment(name, opts, func) {
    if (!opts.dontRun) {
        console.log(name);
        console.log("------------------------------------------------------------");
        func();
        console.log();
    }
}

main();

