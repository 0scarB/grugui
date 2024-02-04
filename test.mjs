async function testSuite() {
    const grugui = (await import("./grugui.mjs")).default;

    group("HTML"); {

        test("string generation"); {
            grugui.setCtx("strGen");

            const {html, head, script, body, main, span, trustedText, end} = grugui;

            html();
                head();
                    script({src: "./grugui.mjs", defer: true}); end();
                    script({src: "./mySrc.mjs", defer: true}); end();
                end();
                body();
                    main();
                        span(); trustedText("Hello, World!"); end();
                    end();
                end();
            end();

            expect(
                grugui.getHtmlStr()
            ).toBeStrictEq(
                "<html>" + 
                    "<head>" +
                        '<script src="./grugui.mjs" defer></script>' +
                        '<script src="./mySrc.mjs" defer></script>' +
                    "</head>" +
                    "<body>" +
                        "<main>" +
                            "<span>Hello, World!</span>" +
                        "</main>" +
                    "</body>" +
                "</html>"
            );

        }; end();

    }; end();

    // We use "anonymous" blocks. I.e. `{...}` without if/for/etc. for scoping.
    group("CSS"); {

        group("units"); {

            const {cm, mm, px, in: inch, pt, vw, percent} = grugui.css;

            group("conversions"); {

                test("px <-> pt"); {
                    // px -> pt
                    expect(
                        px(1).toString()
                    ).toBeStrictEq(
                        `${pt(0.75).toPx()}`
                    );

                    // pt -> px
                    expect(
                        pt(0.75).toString()
                    ).toBeStrictEq(
                        `${px(1).toPt()}`
                    );
                }; end();

                test("px <-> cm"); {
                    // px -> cm
                    expect(
                        px(37.795275591).approxEq(cm(1).toPx())
                    ).toBeTrue();

                    // cm -> px
                    expect(
                        cm(1).approxEq(px(37.795275591).toCm())
                    ).toBeTrue();
                }; end();

                test("cm <-> mm"); {
                    // cm -> mm
                    expect(
                        cm(1).toString()
                    ).toBeStrictEq(
                        `${mm(10).toCm()}`
                    );
                    expect(
                        cm(12.34).toString()
                    ).toBeStrictEq(
                        `${mm(123.4).toCm()}`
                    );

                    // mm -> cm
                    expect(
                        mm(10).toString()
                    ).toBeStrictEq(
                        `${cm(1).toMm()}`
                    );
                    expect(
                        mm(123.4).toString()
                    ).toBeStrictEq(
                        `${cm(12.34).toMm()}`
                    );
                }; end();

                test("cm <-> in"); {
                    // cm -> in
                    expect(
                        cm(2.54).toString()
                    ).toBeStrictEq(
                        `${inch(1).toCm()}`
                    );

                    // in -> cm
                    expect(
                        inch(1).toString()
                    ).toBeStrictEq(
                        `${cm(2.54).toIn()}`
                    );
                }; end();

            }; end();

            group("arithmetic"); {

                const {add, sub, mul, div} = grugui.css;

                test("add"); {
                    expect(
                        px(2).add(px(3)).toString()
                    ).toBeStrictEq(
                        px(5).toString()
                    );

                    expect(
                        add(px(2), px(3)).toString()
                    ).toBeStrictEq(
                        px(5).toString()
                    );

                    expect(
                        vw(2).add(vw(3)).toString()
                    ).toBeStrictEq("5vw");
                    expect(
                        add(vw(2), vw(3)).toString()
                    ).toBeStrictEq("5vw");

                    expect(
                        percent(2).add(percent(3)).toString()
                    ).toBeStrictEq("5%");
                    expect(
                        add(percent(2), percent(3)).toString()
                    ).toBeStrictEq("5%");
                }; end();

                test("sub"); {
                    expect(
                        px(2).sub(px(3)).toString()
                    ).toBeStrictEq(
                        px(-1).toString()
                    );

                    expect(
                        sub(px(2), px(3)).toString()
                    ).toBeStrictEq(
                        px(-1).toString()
                    );

                    expect(
                        vw(2).sub(vw(3)).toString()
                    ).toBeStrictEq("-1vw");
                    expect(
                        sub(vw(2), vw(3)).toString()
                    ).toBeStrictEq("-1vw");

                    expect(
                        percent(2).sub(percent(3)).toString()
                    ).toBeStrictEq("-1%");
                    expect(
                        sub(percent(2), percent(3)).toString()
                    ).toBeStrictEq("-1%");
                }; end();

                test("mul"); {
                    expect(
                        px(2).mul(3).toString()
                    ).toBeStrictEq(
                        px(6).toString()
                    );

                    expect(
                        mul(2, px(3)).toString()
                    ).toBeStrictEq(
                        px(6).toString()
                    );

                    expect(
                        vw(2).mul(3).toString()
                    ).toBeStrictEq("6vw");
                    expect(
                        mul(2, vw(3)).toString()
                    ).toBeStrictEq("6vw");

                    expect(
                        percent(2).mul(3).toString()
                    ).toBeStrictEq("6%");
                    expect(
                        mul(2, percent(3)).toString()
                    ).toBeStrictEq("6%");
                }; end();

                test("div"); {
                    expect(
                        px(12).div(3).toString()
                    ).toBeStrictEq(
                        px(4).toString()
                    );

                    expect(
                        div(px(12), px(3))
                    ).toBeStrictEq(4);

                    expect(
                        vw(12).div(3).toString()
                    ).toBeStrictEq("4vw");
                    expect(
                        div(vw(12), vw(3))
                    ).toBeStrictEq(4);

                    expect(
                        percent(12).div(percent(3))
                    ).toBeStrictEq(4);
                    expect(
                        div(percent(12), 3).toString()
                    ).toBeStrictEq("4%");
                }; end();

            }; end();

        }; end();

        group("colors"); {

            group("RGB(A)"); {
                
                const {rgb, hex, mul} = grugui.css;

                test("to hexadecimal representation"); {
                    expect(
                        rgb(255, 0, 0).toHexString()
                    ).toBeStrictEq("#F00");
                    expect(
                        rgb(0, 255, 0).toHexString()
                    ).toBeStrictEq("#0F0");
                    expect(
                        rgb(0, 0, 255).toHexString()
                    ).toBeStrictEq("#00F");
                    expect(
                        rgb(0, 0, 0, 7*16 + 7).toHexString()
                    ).toBeStrictEq("#0007");

                    expect(
                        rgb(128 + 15, 0, 0).toHexString()
                    ).toBeStrictEq("#8F0000");
                    expect(
                        rgb(0, 128 + 15, 0).toHexString()
                    ).toBeStrictEq("#008F00");
                    expect(
                        rgb(0, 0, 128 + 15).toHexString()
                    ).toBeStrictEq("#00008F");
                    expect(
                        rgb(0, 0, 0, 128 + 15).toHexString()
                    ).toBeStrictEq("#0000008F");

                    // Test top clamping
                    expect(
                        rgb(260, 0, 0).toHexString()
                    ).toBeStrictEq("#F00");
                    expect(
                        rgb(0, 260, 0).toHexString()
                    ).toBeStrictEq("#0F0");
                    expect(
                        rgb(0, 0, 260).toHexString()
                    ).toBeStrictEq("#00F");
                    expect(
                        rgb(0, 0, 0, 260).toHexString()
                    ).toBeStrictEq("#000");

                    // Test bottom clamping
                    expect(
                        rgb(-5, 0, 0).toHexString()
                    ).toBeStrictEq("#000");
                    expect(
                        rgb(0, -5, 0).toHexString()
                    ).toBeStrictEq("#000");
                    expect(
                        rgb(0, 0, -5).toHexString()
                    ).toBeStrictEq("#000");
                    expect(
                        rgb(0, 0, 0, -5).toHexString()
                    ).toBeStrictEq("#0000");
                }; end();

                test("from hexadecimal representation"); {
                    let color;

                    color = hex("#000");
                    expect(color.r).toBeStrictEq(0);
                    expect(color.g).toBeStrictEq(0);
                    expect(color.b).toBeStrictEq(0);
                    expect(color.a).toBeStrictEq(255);

                    color = hex("#FFF");
                    expect(color.r).toBeStrictEq(255);
                    expect(color.g).toBeStrictEq(255);
                    expect(color.b).toBeStrictEq(255);
                    expect(color.a).toBeStrictEq(255);

                    color = hex("#C84");
                    expect(color.r).toBeStrictEq(12*16 + 12);
                    expect(color.g).toBeStrictEq(8*16 + 8);
                    expect(color.b).toBeStrictEq(4*16 + 4);
                    expect(color.a).toBeStrictEq(255);

                    color = hex("#c84");
                    expect(color.r).toBeStrictEq(12*16 + 12);
                    expect(color.g).toBeStrictEq(8*16 + 8);
                    expect(color.b).toBeStrictEq(4*16 + 4);
                    expect(color.a).toBeStrictEq(255);

                    color = hex("c84");
                    expect(color.r).toBeStrictEq(12*16 + 12);
                    expect(color.g).toBeStrictEq(8*16 + 8);
                    expect(color.b).toBeStrictEq(4*16 + 4);
                    expect(color.a).toBeStrictEq(255);

                    color = hex("#c842");
                    expect(color.r).toBeStrictEq(12*16 + 12);
                    expect(color.g).toBeStrictEq(8*16 + 8);
                    expect(color.b).toBeStrictEq(4*16 + 4);
                    expect(color.a).toBeStrictEq(2*16 + 2);

                    color = hex("c842");
                    expect(color.r).toBeStrictEq(12*16 + 12);
                    expect(color.g).toBeStrictEq(8*16 + 8);
                    expect(color.b).toBeStrictEq(4*16 + 4);
                    expect(color.a).toBeStrictEq(2*16 + 2);

                    color = hex("#C84C84");
                    expect(color.r).toBeStrictEq(12*16 + 8);
                    expect(color.g).toBeStrictEq(4*16 + 12);
                    expect(color.b).toBeStrictEq(8*16 + 4);
                    expect(color.a).toBeStrictEq(255);

                    color = hex("#C84C84C8");
                    expect(color.r).toBeStrictEq(12*16 + 8);
                    expect(color.g).toBeStrictEq(4*16 + 12);
                    expect(color.b).toBeStrictEq(8*16 + 4);
                    expect(color.a).toBeStrictEq(12*16 + 8);
                }; end();

                test("multiplication"); {
                    let color;

                    color = hex("#FFF");
                    expect(
                        color.mul(0.5).toString()
                    ).toBeStrictEq(
                        hex("#808080").toString()
                    );

                    color = hex("#FFF");
                    expect(
                        color.mul([
                            0.751,  // +0.001 because float point things :(
                            0.5,
                            0.25,
                        ]).toString()
                    ).toBeStrictEq(
                        hex("#C08040").toString()
                    );

                    color = hex("#FFF");
                    expect(
                        mul(color, [
                            0.751,  // +0.001 because float point things :(
                            0.5,
                            0.25,
                        ]).toString()
                    ).toBeStrictEq(
                        hex("#C08040").toString()
                    );
                    color = hex("#FFF");
                    expect(
                        mul([
                            0.751,  // +0.001 because float point things :(
                            0.5,
                            0.25,
                        ], color).toString()
                    ).toBeStrictEq(
                        hex("#C08040").toString()
                    );

                    color = hex("#FFF");
                    expect(
                        color.mul([
                            0.751,  // +0.001 because float point things :(
                            0.5,
                            0.25,
                            0.125,
                        ]).toString()
                    ).toBeStrictEq(
                        hex("#C0804020").toString()
                    );

                    // Test top clamp
                    color = hex("#FFF");
                    expect(
                        color.mul(1.1).toString()
                    ).toBeStrictEq(
                        hex("#FFF").toString()
                    );

                    // Test bottom clamp
                    color = hex("#FFF");
                    expect(
                        color.mul(-1).toString()
                    ).toBeStrictEq(
                        hex("#000").toString()
                    );
                }; end();

            }; end();

        }; end();

    }; end();
}


// Test "Framework"
//======================================================================

// Shared Constants
//----------------------------------------------------------------------

const testEventType = {
    EXPECT_FAILED       : Symbol("testInstuctionType.EXPECT_FAILED"         ),
    EXPECT_SUCCEEDED    : Symbol("testInstuctionType.EXPECT_SUCCEEDED"      ),
    ENTERED_TEST        : Symbol("testInstuctionType.ENTERED_TEST"          ),
    ENTERED_GROUP       : Symbol("testInstuctionType.ENTERED_GROUP"         ),
    EXITED_TEST_OR_GROUP: Symbol("testInstuctionType.EXITED_TEST_OR_GROUP"  ),
};

// group/test
//----------------------------------------------------------------------

const _expectFailedEventHandlers        = [];
const _expectSucceededEventHandlers     = [];
const _enteredTestEventHandlers         = [];
const _enteredGroupEventHandlers        = [];
const _exitedTestOrGroupEventHandlers   = [];

function registerTestEventHandler(eventType, handler) {
    switch (eventType) {
        case testEventType.EXPECT_FAILED:
            _expectFailedEventHandlers.push(handler);
            break;
        case testEventType.EXPECT_SUCCEEDED:
            _expectSucceededEventHandlers.push(handler);
            break;
        case testEventType.ENTERED_TEST:
            _enteredTestEventHandlers.push(handler);
            break;
        case testEventType.ENTERED_GROUP:
            _enteredGroupEventHandlers.push(handler);
            break;
        case testEventType.EXITED_TEST_OR_GROUP:
            _exitedTestOrGroupEventHandlers.push(handler);
            break;
        default:
            throw new Error(`Invalid test event type ${eventType}!`);
    }
}

function handleTestEvent(testEvent) {
    let eventTypeHandlers;
    switch (testEvent.type) {
        case testEventType.EXPECT_FAILED:
            eventTypeHandlers = _expectFailedEventHandlers;
            break;
        case testEventType.EXPECT_SUCCEEDED:
            eventTypeHandlers = _expectSucceededEventHandlers;
            break;
        case testEventType.ENTERED_TEST:
            eventTypeHandlers = _enteredTestEventHandlers;
            break;
        case testEventType.ENTERED_GROUP:
            eventTypeHandlers = _enteredGroupEventHandlers;
            break;
        case testEventType.EXITED_TEST_OR_GROUP:
            eventTypeHandlers = _exitedTestOrGroupEventHandlers;
            break;
        default:
            throw new Error(`Invalid test event type ${eventType}!`);
    }

    for (const handler of eventTypeHandlers) {
        handler(testEvent);
    }
}

function group(groupName) {
    handleTestEvent({type: testEventType.ENTERED_GROUP, groupName});
}

function test(testName) {
    handleTestEvent({type: testEventType.ENTERED_TEST, testName});
}

function end() {
    handleTestEvent({type: testEventType.EXITED_TEST_OR_GROUP});
}

// Expectations
//----------------------------------------------------------------------

const expectationProto = {
    _onFailure: () => {
        throw new Error("`expectationProto._onFailure` must be set!");
    },
    _onSuccess: () => {
        throw new Error("`expectationProto._onSuccess` must be set!");
    },

    setOnFailure(callback) {
        this._onFailure = callback;
    },

    setOnSuccess(callback) {
        this._onSuccess = callback;
    },

    /** Checks equality using the stricty equality operator `===`. */
    toBeStrictEq(otherValue) {
        if (this.value === otherValue) {
            this._onSuccess({
                shortMsg:
                    `${toHumanString(this.value, {shorten: true})} `
                    + `=== ${toHumanString(otherValue, {shorten: true})}`,
                fullMsg:
                    `${toHumanString(this.value)}\n`
                    + `===\n`
                    + `${toHumanString(otherValue)}`,
            });
        } else {
            this._onFailure({
                shortMsg:
                    `${toHumanString(this.value, {shorten: true})} `
                    + `!== ${toHumanString(otherValue, {shorten: true})}`,
                fullMsg:
                    `${toHumanString(this.value)}\n`
                    + `!==\n`
                    + `${toHumanString(otherValue)}`,
            });
        }
    },

    /** Checks equality by comparing the strings produced by JSON.stringify. */
    toBeJsonEq(otherValue) {
        const thisJsonStr = JSON.stringify(this.value);
        const otherJsonStr = JSON.stringify(otherValue);

        if (thisJsonStr === otherJsonStr) {
            this._onSuccess({
                shortMsg:
                    `JSON Str: ${toHumanString(thisJsonStr, {shorten: true})} `
                    + `=== JSON Str: ${toHumanString(otherJsonStr, {shorten: true})}`,
                fullMsg:
                    `${thisJsonStr}\n`
                    + `!==\n`
                    + `${otherJsonStr}`,
            });
        } else {
            this._onFailure({
                shortMsg:
                    `JSON Str: ${toHumanString(thisJsonStr, {shorten: true})} `
                    + `!== JSON Str: ${toHumanString(otherJsonStr, {shorten: true})}`,
                fullMsg:
                    `${thisJsonStr}\n`
                    + `!==\n`
                    + `${otherJsonStr}`,
            });
        }
    },

    /**
     * Checks for deep equality, meaning nested collections must have the
     * same contents but not necessarily use references to the same objects
     * (sameness refering to identity).
     */
    toBeDeepEq(other) {
        throw new Error(
            "Not implemented yet. Consider using `toBeJsonEq` or implementing "
            + "if necessary. Also consider removing `toBeJsonEq` entirely "
            + "once implemented."
        );
    },

    toBeTrue() {
        return this.toBeStrictEq(true);
    },

    toBeFalse() {
        return this.toBeStrictEq(false);
    },

    toBeNull() {
        return this.toBeStrictEq(null);
    },
};

function expect(value) {
    return {
        __proto__: expectationProto,
        value,
    };
}

expectationProto.setOnFailure((partialEvent) => handleTestEvent({
    type: testEventType.EXPECT_FAILED,
    shortMsg: partialEvent.shortMsg,
    fullMsg: partialEvent.fullMsg,
}));
expectationProto.setOnSuccess((partialEvent) => handleTestEvent({
    type: testEventType.EXPECT_SUCCEEDED,
    shortMsg: partialEvent.shortMsg,
    fullMsg: partialEvent.fullMsg,
}));

// String Representation
//----------------------------------------------------------------------

const _FUNC_PARAMS_REGEX = RegExp("\\([^)]*\\)");
/** Attempt to create the most human readable string representation of a value */
function toHumanString(value, opts) {
    // Resolve options
    opts = {
        // Default Options
        shorten: false,
        strAttemptShortenAfterLen: 30,
        funcStrAttemptShortenAfterLen: 30,
        arrStrAttemptShortenAfterLen: 30,
        objStrAttemptShortenAfterLen: 30,
        showObjToString: false,
        // Override defaults if `opts` is an object and contains overrides
        ...(opts || {}),
    };
    if (!opts.shorten) {
        opts.strAttemptShortenAfterLen = Infinity;
        opts.funcStrAttemptShortenAfterLen = Infinity;
        opts.arrStrAttemptShortenAfterLen = Infinity;
        opts.objStrAttemptShortenAfterLen = Infinity;
    }

    // Attempt custom logic
    try {
        if (value === null) {
            return "null";
        }

        const jsTypeStr = typeof value;
        let result;
        switch (typeof value) {
            case "string":
                if (value.length > opts.strAttemptShortenAfterLen) {
                    return `${value.slice(0, opts.strAttemptShortenAfterLen - 3)}...`;
                }
                return value;
            case "number":
            case "boolean":
                return value.toString();
            case "function":
                result = value.toString();

                // If the value is an arrow function and has a name
                // then add the name to the string representation
                const isArrowFunc = result[0] === "(";
                const funcName = value.name;
                const hasName = typeof funcName === "string";
                if (hasName) {
                    result = `${value.name} = ${result}`;
                }

                // Shorten the string representation if it's too long
                if (result.length > opts.funcStrAttemptShortenAfterLen) {
                    const paramsStr = _FUNC_PARAMS_REGEX.exec(result)[0];
                    if (isArrowFunc) {
                        if (hasName) {
                            result = `${funcName} = ${paramsStr} => {...}`;
                        } else {
                            result = `${paramsStr} => {...}`;
                        }
                    } else {
                        result = `function ${funcName || ""}${paramsStr} {...}`;
                    }
                }

                return result;

            case "object":
                result;
                if (Array.isArray(value)) {
                    const createArrStr = (shorten) => {
                        if (shorten) {
                            return "[...]";
                        }
                        const strSegments = ["["];
                        let isFirst = true;
                        for (const itemValue of value) {
                            if (isFirst) {
                                isFirst = false;
                            } else {
                                strSegments.push(", ");
                            }
                            strSegments.push(toHumanString(itemValue));
                        }
                        strSegments.push("]");
                        return strSegments.join("");
                    };

                    result = createArrStr(false);
                    if (result.length > opts.objStrAttemptShortenAfterLen) {
                        result = createArrStr(true);
                    }
                } else if (value instanceof Map || value instanceof Set) {
                    throw new Error(
                        "`test.mjs > toHumanString` does not currently handle "
                        + "Maps or Sets! Add this functionality if needed!"
                    );
                } else {
                    const createObjStr = (shorten) => {
                        if (shorten) {
                            return "{...}";
                        }
                        const strSegments = ["{"];
                        let isFirst = true;
                        for (const propKey in value) {
                            if (isFirst) {
                                isFirst = false;
                            } else {
                                strSegments.push(", ");
                            }
                            const propValue = value[propKey];
                            strSegments.push(toHumanString(propKey));
                            strSegments.push(": ");
                            strSegments.push(toHumanString(propValue));
                        }
                        strSegments.push("}");
                        return strSegments.join("");
                    };

                    result = createObjStr(false);
                    const hasToStringMeth = typeof value.toString === "function";
                    if (opts.showObjToString && hasToStringMeth) {
                        result = `${result}.toString() === `
                            + JSON.stringify(value.toString());
                    }

                    if (result.length > opts.objStrAttemptShortenAfterLen) {
                        result = createObjStr(true);
                        if (opts.showObjToString && hasToStringMeth) {
                            result = `${result}.toString() === `
                                + JSON.stringify(value.toString());
                        }
                    }
                }

                return result;

            case "undefined":
                return "undefined";

            case "bigint":
            case "symbol":
                throw new Error(
                    "`test.mjs > toHumanString` does not currently handle "
                    + "BigInts or Symbols! Add this functionality if needed!"
                );
        }
    } catch (e) {
        console.error(`Custom 'test.mjs > toHumanString' logic failed: ${e}. Fix!`);
    }


    // Attempt JSON stringify
    try {
        return JSON.stringify(value);
    } catch (e) {
        console.error(`Custom 'test.mjs > toHumanString' logic failed harder: ${e}. Fix!`);
    }

    // Attempt .toString
    try {
        return value.toString();
    } catch (e) {
        console.error(`Custom 'test.mjs > toHumanString' logic failed even harder: ${e}. Fix!`);
    }

    // Fall back on String.prototype.toString(value) if all else fails
    return String.prototype.toString(value);
}

// CLI Fontend
//----------------------------------------------------------------------

const _CLI_FRONTEND_SINGLE_INDENT = "│ ";
const _PREFERRED_MAX_LINE_LEN = 60;

const _cliFrontendLinePrefixType = {
    CHECKMARK   : Symbol("_cliFrontendLinePrefixType.CHECKMARK" ),
    XMARK       : Symbol("_cliFrontendLinePrefixType.XMARK"     ),
    NOTHING     : Symbol("_cliFrontendLinePrefixType.NOTHING"   ),
};

const _cliFrontendStack = [
    {
        succeeded: true,
        indent: null,
        blockDescription: "",
        blockFailureSummary: "",
        showBlockFailureSummary: true,
        blockBodyLines: [],
    },
];

function cliFrontendHandleExpectFailed(testEvent) {
    const parentStackItem = _cliFrontendStack[_cliFrontendStack.length - 1];

    let indent;
    if (parentStackItem.indent === null) {
        indent = "";
    } else {
        indent = parentStackItem.indent + _CLI_FRONTEND_SINGLE_INDENT;
    }

    const lines = [];

    let isFirstLine = true;
    for (const lineText of testEvent.fullMsg.split("\n")) {
        if (isFirstLine) {
            lines.push({
                indent,
                prefix: _cliFrontendLinePrefixType.XMARK,
                text: lineText,
            });
            isFirstLine = false;
        } else {
            lines.push({
                indent, 
                prefix: _cliFrontendLinePrefixType.NOTHING,
                text: lineText,
            });
        }
    }

    parentStackItem.succeeded = false;
    if (parentStackItem.indent.length + 2 +
        parentStackItem.blockDescription.length + 4 +
        testEvent.shortMsg.length + 2 +
        parentStackItem.blockDescription.length + 4
        <= _PREFERRED_MAX_LINE_LEN
    ) {
        parentStackItem.blockFailureSummary =
            "> " + parentStackItem.blockDescription
            + "  ✘ " + testEvent.shortMsg;
    }
    parentStackItem.blockBodyLines.push(...lines);
}

function cliFrontendHandleExpectSucceed(testEvent) {
    // We currently don't log anything when an expect succeed.
}

function cliFrontendHandleEnteredTest(testEvent) {
    const parentStackItem = _cliFrontendStack[_cliFrontendStack.length - 1];

    let indent;
    if (parentStackItem.indent === null) {
        indent = "";
    } else {
        indent = parentStackItem.indent + _CLI_FRONTEND_SINGLE_INDENT;
    }

    const newStackItem = {
        succeeded: true,
        indent,
        blockDescription: testEvent.testName,
        blockFailureSummary: "",
        showBlockFailureSummary: false,
        blockBodyLines: [],
    };

    _cliFrontendStack.push(newStackItem);
}

function cliFrontendHandleEnteredGroup(testEvent) {
    const parentStackItem = _cliFrontendStack[_cliFrontendStack.length - 1];

    let indent;
    if (parentStackItem.indent === null) {
        indent = "";
    } else {
        indent = parentStackItem.indent + _CLI_FRONTEND_SINGLE_INDENT;
    }

    const newStackItem = {
        succeeded: true,
        indent,
        blockDescription: testEvent.groupName,
        blockFailureSummary: "",
        showBlockFailureSummary: true,
        blockBodyLines: [],
    };

    _cliFrontendStack.push(newStackItem);
}

function cliFrontendHandleExitedTestOrGroup(testEvent) {
    const stackItem = _cliFrontendStack.pop();
    const parentStackItem = _cliFrontendStack[_cliFrontendStack.length - 1];

    let prefix;
    if (stackItem.succeeded) {
        prefix = _cliFrontendLinePrefixType.CHECKMARK;
    } else {
        prefix = _cliFrontendLinePrefixType.XMARK;
        parentStackItem.succeeded = false;
    }

    let lineText;
    if (stackItem.showBlockFailureSummary) {
        lineText =
            stackItem.blockDescription
            + " ".repeat(
                _PREFERRED_MAX_LINE_LEN - (
                    stackItem.indent.length + 2 
                    + stackItem.blockDescription.length + 4
                    + stackItem.blockFailureSummary.length
                )
            )
            + stackItem.blockFailureSummary;
    } else {
        lineText = stackItem.blockDescription;
    }
    if (stackItem.blockFailureSummary !== "" 
        && parentStackItem.blockFailureSummary === ""
    ) {
        parentStackItem.blockFailureSummary = stackItem.blockFailureSummary;
    }

    parentStackItem.blockBodyLines.push({
        indent: stackItem.indent,
        prefix,
        text: lineText,
    });
    parentStackItem.blockBodyLines.push(...stackItem.blockBodyLines);
}

function cliFrontendLogLines() {
    const lines = _cliFrontendStack[0].blockBodyLines;

    for (const line of lines) {
        let lineStr = line.indent;
        switch (line.prefix) {
            case _cliFrontendLinePrefixType.CHECKMARK:
                lineStr += "├╴✔ ";
                break;
            case _cliFrontendLinePrefixType.XMARK:
                lineStr += "├╴✘ ";
                break;
            default:
                lineStr += _CLI_FRONTEND_SINGLE_INDENT + "  ";
                break;
        }
        lineStr += line.text;
        console.log(lineStr);
    }
}

function registerCliFrontendEventHandlers() {
    registerTestEventHandler(
        testEventType.EXPECT_FAILED,
        cliFrontendHandleExpectFailed
    );
    registerTestEventHandler(
        testEventType.EXPECT_SUCCEEDED,
        cliFrontendHandleExpectSucceed
    );
    registerTestEventHandler(
        testEventType.ENTERED_TEST,
        cliFrontendHandleEnteredTest
    );
    registerTestEventHandler(
        testEventType.ENTERED_GROUP,
        cliFrontendHandleEnteredGroup
    );
    registerTestEventHandler(
        testEventType.EXITED_TEST_OR_GROUP,
        cliFrontendHandleExitedTestOrGroup
    );
}


// Run tests
//======================================================================

async function main() {
    registerCliFrontendEventHandlers();
    await testSuite();
    cliFrontendLogLines();
}

await main();

