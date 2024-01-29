// HTML
// ======================================================================

const htmlStatementsBase = {
    _VOID_EL_NAMES: new Set([
        // List source: 
        //   https://developer.mozilla.org/en-US/docs/Glossary/Void_element
        "area",
        "base",
        "br",
        "col",
        "embed",
        "hr",
        "img",
        "input",
        "link",
        "meta",
        "param",
        "source",
        "track",
        "wbr",
    ]),
    _BOOLEAN_ATTR_NAMES: new Set([
        "allowfullscreen",
        "async",
        "autofocus",
        "autoplay",
        "checked",
        "controls",
        "default",
        "defer",
        "disabled",
        "formnovalidate",
        "inert",
        "ismap",
        "itemscope",
        "loop",
        "multiple",
        "muted",
        "nomodule",
        "novalidate",
        "open",
        "readonly",
        "required",
        "reversed",
        "selected",
    ]),

    el(tagName, ...restArgs) {
        let attrs = {};
        let body = () => {};
        if (typeof restArgs[0] === "function") {
            body = restArgs[0];
        } else if (typeof restArgs[0] === "object") {
            attrs = restArgs[0];
            if (typeof restArgs[1] === "function") {
                body = restArgs[1];
            }
        }

        this.beginEl(tagName, attrs);
            body();
        this.end();
    },
};
for (const htmlTagName of [
    "a",
    "abbr",
    "acronym",
    "address",
    "area",
    "article",
    "aside",
    "audio",
    "b",
    "base",
    "bdi",
    "bdo",
    "big",
    "blockquote",
    "body",
    "br",
    "button",
    "canvas",
    "caption",
    "center",
    "cite",
    "code",
    "col",
    "colgroup",
    "data",
    "datalist",
    "dd",
    "del",
    "details",
    "dfn",
    "dialog",
    "dir",
    "div",
    "dl",
    "dt",
    "em",
    "embed",
    "fieldset",
    "figcaption",
    "figure",
    "font",
    "footer",
    "form",
    "frame",
    "frameset",
    "h1",
    "head",
    "header",
    "hgroup",
    "hr",
    "html",
    "i",
    "iframe",
    "image",
    "img",
    "input",
    "ins",
    "kbd",
    "label",
    "legend",
    "li",
    "link",
    "main",
    "map",
    "mark",
    "marques",
    "menu",
    "menuitem",
    "meta",
    "meter",
    "nav",
    "nobr",
    "noembed",
    "noframes",
    "noscript",
    "object",
    "ol",
    "optgroup",
    "option",
    "output",
    "p",
    "param",
    "picture",
    "plaintext",
    "portal",
    "pre",
    "progress",
    "q",
    "rb",
    "rp",
    "rt",
    "rtc",
    "ruby",
    "s",
    "samp",
    "script",
    "search",
    "select",
    "slot",
    "small",
    "source",
    "span",
    "strike",
    "strong",
    "style",
    "sub",
    "summary",
    "sup",
    "table",
    "tbody",
    "td",
    "template",
    "textarea",
    "tfoot",
    "th",
    "thead",
    "time",
    "title",
    "tr",
    "track",
    "tt",
    "u",
    "var",
    "video",
    "wbr",
    "xmp",
]) {
    const htmlStatementsMethod = function (...args) {
        this.el(htmlTagName, ...args);
    };
    htmlStatementsBase[htmlTagName] = htmlStatementsMethod;
}

const htmlStrGenStatements = {
    ...htmlStatementsBase,

    _strSegments: [],
    _currentElIsVoid: false,

    _beforeExec() {
        this._strSegments = [];
    },

    beginEl(name, attrs) {
        attrs ||= {};

        // Opening tag
        this._strSegments.push("<");
        this._strSegments.push(name);

        // Attributes
        for (const attrName in attrs) {
            // Ignore event listeners
            const isEventListener = attrName.slice(0, 2) === "on";
            const isStaticAttr = attrName.slice(0, 6) === "static";
            if (isEventListener || isStaticAttr) {
                continue;
            }

            const attrValue = attrs[attrName];

            const isBooleanAttr = this._BOOLEAN_ATTR_NAMES.has(attrName);
            if (isBooleanAttr) {
                if (attrValue === true) {
                    this._strSegments.push(" ");
                    this._strSegments.push(attrName);
                }
            } else {
                this._strSegments.push(" ");
                this._strSegments.push(attrName);
                this._strSegments.push('="');
                this._strSegments.push(attrValue);
                this._strSegments.push('"');
            }
        }

        this._strSegments.push(">");

        // Closing tag
        this._currentElIsVoid = this._VOID_EL_NAMES.has(name);
        if (this._currentElIsVoid) {
            this.onCompoundEnd(() => {});
        } else {
            this.onCompoundEnd(() => {
                this._strSegments.push("</");
                this._strSegments.push(name);
                this._strSegments.push(">");
            });
        }
    },

    trustedText(value) {
        for (const char of value.toString()) {
            switch (char) {
                case "&":
                    this._strSegments.push("&amp;");
                    break;
                case "<":
                    this._strSegments.push("&lt;");
                    break;
                case ">":
                    this._strSegments.push("&gt;");
                    break;
                case '"':
                    this._strSegments.push("&quot;");
                    break;
                case "'":
                    this._strSegments.push("&#x27;");
                    break;
                default:
                    this._strSegments.push(char);
                    break;
            }
        }
    },

    untrusedText(str) {
        throw new Error("Not implemented!");
    },

    unsafeInnerHtml(str) {
        this._strSegments.push(str);
    },

    getStr() {
        return this._strSegments.join("");
    },
};

const htmlDomGenStatements = {
    ...htmlStatementsBase,

    _rootNode: null,
    _parentNode: null,
    _currentNode: null,
    _staticNodes: new Map(),
    _staticIdx: 0,

    _beforeExec() {
        this._rootNode = null;
        this._parentNode = null;
        this._currentNode = null;
        this._staticIdx = 0;
    },

    beginEl(tagName, attrs) {
        attrs = {...(attrs || {})};

        this.onCompoundEnd(() => {
            if (this._parentNode !== null) {
                this._currentNode = this._parentNode.nextSibling;
                this._parentNode = this._parentNode.parentNode;
            }
        });

        let el;
        if (attrs.static === true) {  // Handle elements marked as static
            let staticKey;
            if (typeof attrs.staticKey !== "undefined") {
                staticKey = attrs.staticKey;
                delete attrs.staticKey;
            } else {
                staticKey = `__staticIdx__:${this._staticIdx}`;
                this._staticIdx++;
            }

            if (this._staticNodes.has(staticKey)) {
                el = this._staticNodes.get(staticKey);
                if (this._currentNode !== el) {
                    this._replaceCurrentNodeWith(el);
                }
                this._parentNode = el;
                this._currentNode = el.firstChild;
                return;
            } else {
                el = document.createElement(tagName);
                this._staticNodes.set(staticKey, el);
            }

            delete attrs.static;
        } else {
            el = document.createElement(tagName);
        }

        this._setElAttrsAndEventHandlers(el, attrs);

        this._replaceCurrentNodeWith(el);

        this._parentNode = el;
        this._currentNode = null;
    },

    trustedText(str) {
        const textNode = document.createTextNode(str);

        this._replaceCurrentNodeWith(textNode);

        if (this._currentNode !== null) {
            this._currentNode = this._currentNode.nextSibling;
        }
    },

    untrustedText(str) {
        this.trustedText(str);
    },

    unsafeInnerHtml(str) {
        if (this._staticAlreadyGenerated) {
            return;
        }

        this._currentNode.innerHTML += str;
    },

    getDomNode() {
        return this._rootNode;
    },

    _replaceCurrentNodeWith(newNode) {
        if (this._currentNode === null) {
            if (this._parentNode !== null) {
                this._parentNode.appendChild(newNode);
            }
        } else {
            this._currentNode.replaceWith(newNode);
        }

        if (this._rootNode === null) {
            this._rootNode = newNode;
        }
    },
    
    _setElAttrsAndEventHandlers(el, attrs) {
        for (const attrName in attrs) {
            const attrValue = attrs[attrName];

            const isEventListener = attrName.slice(0, 2) === "on";
            const isBooleanAttr = this._BOOLEAN_ATTR_NAMES.has(attrName);
            if (isEventListener) {
                const eventName = attrName.slice(2).toLowerCase();
                const eventListener = attrValue;
                el.addEventListener(eventName, eventListener);
            } else if (isBooleanAttr) {
                if (attrValue === true) {
                    el.setAttribute(attrName, "");
                }
            } else {
                el.setAttribute(attrName, attrValue.toString());
            }
        }
    },
};


// CSS
// ======================================================================

const cssStrGenStatements = {
    _strSegments: [],

    _beforeExec() {
        this._strSegments = [];
    },

    beginRule(...selectorStrs) {
        this._strSegments.push(selectorStrs.join(" "));
        this._strSegments.push(" {\n");

        this.onCompoundEnd(() => {
            this._strSegments.push("}");
        });
    },

    property(name, value) {
        this._strSegments.push("    ");
        this._strSegments.push(name);
        this._strSegments.push(": ");
        this._strSegments.push(value);
        this._strSegments.push(";\n");
    },

    getStr() {
        return this._strSegments.join("");
    },
};


// Statement Registering
// ======================================================================

const _statementSets = new Map();
const _contextualStatementSets = new Map();

function registerStatements(...args) {
    let ctx     = null;
    let setName = null;
    let impl    = null;
    let opts    = null
    if (typeof args[1] === "string") {
        ctx     = args[0];
        setName = args[1];
        impl    = args[2];
        opts    = args[4];
    } else {
        setName = args[0];
        impl    = args[1];
        opts    = args[2];
    }
    opts = {replacePrev: false, ...opts};

    let statementSets;
    if (ctx === null) {
        statementSets = _statementSets;
    } else {
        statementSets = _contextualStatementSets.get(ctx);
        if (typeof statementSets === "undefined") {
            statementSets = new Map();
            _contextualStatementSets.set(ctx, statementSets);
        }
    }

    opts = {replacePrev: false, ...(opts || {})};

    const hasPrevImpl = statementSets.has(setName);
    if (hasPrevImpl && !opts.replacePrev) {
        throw new createError(
            `An implementation the statement set '${setName}' `
            + "has already been registered!",
            {
                detailedMsg: 
                    `An implementation of the statement set '${setName}' `
                    + "has already been registered by calling "
                    + `'grugui.registerStatements("${setName}", ...)'! `,
                hintMsg:
                    "Set the 'replacePrev' option to 'true' "
                    + "to replace the existing implementation: "
                    + `'grugui.registerStatements("${setName}", `
                    + "{...}, {replacePrev: true})'."
            },
        );
    }

    statementSets.set(setName, impl);
}

registerStatements("strGen", "html", htmlStrGenStatements);
registerStatements("domGen", "html", htmlDomGenStatements);
registerStatements("strGen", "css", cssStrGenStatements);

function beginExec(ctx) {
    const result = {
        _compoundEndFuncStack: [() => {}],

        end() {
            if (this._compoundEndFuncStack.length === 0) {
                
            }

            const endFunc = this._compoundEndFuncStack.pop();
            endFunc();
        },
    };
    result.end = result.end.bind(result);

    const stmtSetsMaps = [_statementSets];
    const contextualStmtSets = _contextualStatementSets.get(ctx);
    if (typeof contextualStmtSets !== "undefined") {
        stmtSetsMaps.push(contextualStmtSets);
    }

    for (const stmtSets of stmtSetsMaps) {
        for (const [stmtSetName, stmtSetObj] of stmtSets.entries()) {
            stmtSetObj.end = result.end;
            stmtSetObj.onCompoundEnd = (callback) => {
                result._compoundEndFuncStack.push(callback);
            }

            if (typeof stmtSetObj._beforeExec !== "undefined") {
                stmtSetObj._beforeExec();
            }

            result[stmtSetName] = stmtSetObj;
        }
    }

    return result;
}


// Utils
// ======================================================================

function createError(shortMsg, opts) {
    opts = {
        type: Error,
        detailedMsg: null,
        hintMsg: null,
        ...opts,
    };

    let msg = shortMsg;
    if (opts.detailedMsg !== null) {
        // We add 4 spaces to make this more readable is
        // JSON logs, etc.
        msg += "    \nDETAILED: ";
        msg += opts.detailedMsg;
    }
    if (opts.hint !== null) {
        // We add 4 spaces to make this more readable is
        // JSON logs, etc.
        msg += "    \nHINT: ";
        msg += opts.hintMsg;
    }

    throw new opts.type(msg);
}


// Public API
// ======================================================================

export {registerStatements, beginExec};
