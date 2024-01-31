/**
 * A list of callbacks that are called at the end of the module,
 * directly before the export statement.
 */
const postDeclarationCallbacks = [];

// This is JavaScript module 
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules.
// We export the publicApi object -- See end of file.
const publicApi = {
    _currentCtx: null,

    setCtx(ctx) {
        if (this._currentCtx === ctx) {
            return;
        }

        // Choose `ctxObj`. I.e. an object implementing the operations
        // 'reset', 'tag', 'end', 'trustedText', etc.
        let ctxObj;
        switch (ctx) {
            case "strGen":
                ctxObj = strGen;
                break;
            case "domGen":
                ctxObj = domGen;
                break;
            default:
                // TODO: Add error message
                throw new Error();
        }

        // Replace operation placeholders with contextual operations
        // from `ctxObj`.
        for (const propertyName in ctxObj) {
            const propertyValue = ctxObj[propertyName];
            if (typeof propertyValue === "function") {
                this[propertyName] = propertyValue.bind(this);
            } else {
                this[propertyName] = propertyValue;
            }
        }

        this._currentCtx = ctx;
    },

    // Operation placeholders
    reset()             {this._throwCtxNotSetError("reset"              );},
    tag()               {this._throwCtxNotSetError("tag"                );},
    end()               {this._throwCtxNotSetError("end"                );},
    trustedText()       {this._throwCtxNotSetError("trustedText"        );},
    untrustedText()     {this._throwCtxNotSetError("untrustedText"      );},
    domNode()           {this._throwCtxNotSetError("domNode"            );},
    getHtmlStr()        {this._throwCtxNotSetError("getHtmlStr"         );},
    getCssStr()         {this._throwCtxNotSetError("getCssStr"          );},
    getDomLastNode()    {this._throwCtxNotSetError("getDomLastNode"     );},
    getDomParentNode()  {this._throwCtxNotSetError("getDomParentNode"   );},

    _throwCtxNotSetError(callerName) {
        // TODO: Add error message
        throw new Error();
    },
};
postDeclarationCallbacks.push(
    // Add `strGen.<element name>(...args)` as a shorthand for
    // `strGen.tag("<element name>", ...args)`
    // for all elements defined by the the HTML standard, listed in `utils.EL_NAMES`.
    () => {
        for (const elName of utils.EL_NAMES) {
            publicApi[elName] = function () {
                this._throwCtxNotSetError(elName);
            };
        }
    },
);

/** 
 * Object for generating HTML and CSS strings.
 *
 * The primary use-case for this functionality is
 * Server-Side Generation / Rendering.
 */
const strGen = {
    // These properties hold strings that when concatenated to a string 
    // produce parts of HTML and CSS files.
    _htmlStrSegments: [],
    _cssStrSegments: [],

    // Used when adding closing tag HTML string segments
    _tagNameStack: [],

    reset() {
        this._htmlStrSegments = [];
        this._cssStrSegments = [];
        this._currentTagName = null;
    },

    /** 
     * Adds segments for the HTML opening tag.
     *
     * For example, the call
     * `strGen.tag("input", {class: "my-checkbox", checked: true})`
     * will add segments that when concatenated produce the string
     * '<input class="my-checkbox" checked>'.
     */
    tag(name, attrs) {
        this._tagNameStack.push(name);

        // Segments for opening tag start string. E.g.: '<input'
        this._htmlStrSegments.push("<");
        this._htmlStrSegments.push(name);

        // Segments for attributes string. E.g.: ' class="my-checkbox" checked'
        for (const [attrName, attrData] of utils.preprocessAttrs(attrs)) {
            switch (attrData.type) {
                case "valuedHtmlAttr":
                    this._htmlStrSegments.push(" ");
                    this._htmlStrSegments.push(attrName);
                    this._htmlStrSegments.push('="');
                    this._htmlStrSegments.push(attrData.value);
                    this._htmlStrSegments.push('"');
                    break;
                case "boolHtmlAttr":
                    this._htmlStrSegments.push(" ");
                    this._htmlStrSegments.push(attrName);
                    break;
            }
        }

        // End of opening tag
        this._htmlStrSegments.push(">");
    },

    /**
     * Adds segments for the HTML closing tag 
     * or does nothing if the current HTML element is a void element.
     */
    end() {
        const tagName = this._tagNameStack.pop();

        if (typeof tagName === "undefined") {
            // TODO: Add error message
            throw new Error();
        }

        // Void elements don't need a closing tag
        const isVoidEl = utils.VOID_EL_NAMES.has(tagName);
        if (!isVoidEl) {
            // Add segments for closing tag string. E.g.: '</div>'
            this._htmlStrSegments.push("</");
            this._htmlStrSegments.push(tagName);
            this._htmlStrSegments.push(">");
        }

        this._currentTagName = null;
    },

    trustedText(str) {
        for (const char of str.toString()) {
            switch (char) {
                case "&":
                    this._htmlStrSegments.push("&amp;");
                    break;
                case "<":
                    this._htmlStrSegments.push("&lt;");
                    break;
                case ">":
                    this._htmlStrSegments.push("&gt;");
                    break;
                case '"':
                    this._htmlStrSegments.push("&quot;");
                    break;
                case "'":
                    this._htmlStrSegments.push("&#x27;");
                    break;
                default:
                    this._htmlStrSegments.push(char);
                    break;
            }
        }
    },

    untrustedText(str) {
        throw new Error("Not implemented yet!");
    },

    domNode(node) {
        // TODO: Add error message
        throw new Error();
    },

    /** 
     * Return a string, created by concatenating the HTML string
     * segments that have been created by calling `strGen.tag(...)`, 
     * `strGen.end()`, etc.
     *
     * The returned string can then be used to create a part of
     * or even a whole HTML document.
     *
     * For example, the value of the variable `html` in the following
     * ```
     * strGen.reset();
     * strGen.tag("main", {id: "app"});
     * strGen.trustedText("Hello, World!");
     * strGen.end();
     * const html = strGen.getHtmlStr();
     * ```
     * is
     * '<main id="app">Hello, World!</main>'
     */
    getHtmlStr() {
        return this._htmlStrSegments.join("");
    },

    getCssStr() {
        return this._cssStrSegments.join("");
    },

    getDomLastNode() {
        // TODO: Add error message.
        throw new Error();
    },

    getDomParentNode() {
        // TODO: Add error message.
        throw new Error();
    },
};
postDeclarationCallbacks.push(
    // Add `strGen.<element name>(...args)` as a shorthand for
    // `strGen.tag("<element name>", ...args)`
    // for all elements defined by the the HTML standard, listed in `utils.EL_NAMES`.
    () => {
        for (const elName of utils.EL_NAMES) {
            strGen[elName] = function (...args) {this.tag(elName, ...args);};
        }
    },
);

const domGen = {
    _lastNode: null,
    _parentNode: null,

    reset() {
        this._lastNode = null;
        this._parentNode = null;
    },

    tag(name, attrs) {
        // Create element
        const el = document.createElement(name);
        if (this._parentNode !== null) {
            this._parentNode.appendChild(el);
        }

        this._lastNode = null;
        this._parentNode = el;

        // Set attributes
        for (const [attrName, attrData] of utils.preprocessAttrs(attrs)) {
            switch (attrData.type) {
                case "valuedHtmlAttr":
                    el.setAttribute(attrName, attrData.value);
                    break;
                case "boolHtmlAttr":
                    el.setAttribute(attrName, "");
                    break;
                case "eventListener":
                    el.addEventListener(
                        attrData.eventName, 
                        ...attrData.addEventListenerArgs,
                    );
                    break;
            }
        }
    },

    end() {
        if (this._parentNode === null) {
            // TODO: Add error message
            throw new Error();
        }

        const currentNode = this._parentNode;
        this._lastNode = currentNode;
        this._parentNode = currentNode.parentNode;
    },

    trustedText(str) {
        const node = document.createTextNode(str);

        return this.domNode(node);
    },

    untrustedText(str) {
        return this.trustedText(str);
    },

    domNode(node) {
        if (this._parentNode !== null) {
            this._parentNode.appendChild(node);
        }

        this._lastNode = node;
    },

    getHtmlStr() {
        // TODO: Add error message.
        throw new Error();
    },

    getCssStr() {
        // TODO: Add error message.
        throw new Error();
    },

    getDomLastNode() {
        return this._lastNode;
    },

    getDomParentNode() {
        return this._parentNode;
    },
};
postDeclarationCallbacks.push(
    // Add `domGen.<element name>(...args)` as a shorthand for
    // `domGen.tag("<element name>", ...args)`
    // for all elements defined by the the HTML standard, listed in `utils.EL_NAMES`.
    () => {
        for (const elName of utils.EL_NAMES) {
            domGen[elName] = function (...args) {this.tag(elName, ...args);};
        }
    },
);


const utils = {
    EL_NAMES: [
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
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
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
    ],

    VOID_EL_NAMES: new Set([
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

    BOOLEAN_ATTR_NAMES: new Set([
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

    /** 
     * Handles 'attr' objects and returns an array containing
     * items: '[<attrName>, {type: valuedHtmlAttr|boolHtmlAttr|eventListener, ...<data>}]'.
     */
    preprocessAttrs(attrs) {
        const result = [];

        // Handle undefined or null
        attrs ||= {};

        for (const attrName in attrs) {
            const attrValue = attrs[attrName];

            // Handle event listeners
            const isEventListener = attrName.slice(0, 2) === "on";
            if (isEventListener) {
                const eventName = attrName.slice(2).toLowerCase();
                
                const isListenerFunc = typeof attrValue === "function";
                if (isListenerFunc) {
                    const listenerFunc = attrValue;
                    result.push([
                        attrName, 
                        {
                            type: "eventListener", 
                            eventName, 
                            addEventListenerArgs: [listenerFunc]
                        }
                    ]);
                    continue;
                }

                const isAddEventListenerArgsArr = Array.isArray(attrValue);
                if (isAddEventListenerArgsArr) {
                    const addEventListenerArgs = attrValue;
                    result.push([
                        attrName, 
                        {
                            type: "eventListener", 
                            eventName, 
                            addEventListenerArgs,
                        }
                    ]);
                    continue;
                }

                throw new Error(
                    `Failed to add event listener for key '${attrName}'! `
                    + `Value of type '${typeof attrValue}' was not `
                    + "a) a function representing the listener callback "
                    + "or b) an array of arguments that would be passed "
                    + "to 'addEventListener' -> "
                    + `'addEventListener(${eventName}, ...<argument array>'). `
                    + `Found invalid value: '${attrValue}'.`
                );
            }

            // Handle boolean HTML attributes
            const isBooleanAttr = this.BOOLEAN_ATTR_NAMES.has(attrName);
            if (isBooleanAttr) {
                switch (attrValue) {
                    case true:
                        result.push([attrName, {type: "boolHtmlAttr"}]);
                        continue;
                    case false:
                    case null:
                        continue;
                    default:
                        throw new Error(
                            `'${attrName}' is a boolean attribute and must have value `
                            + "which is valueless in native HTML. "
                            + "In Grug-UI it must have value 'true: boolean' "
                            + "to signify existence and optionally value 'false: boolean'"
                            + "or 'null' to signify omission! "
                            + `Found invalid value '${attrValue}: ${typeof attrValue}'.`
                        );
                }
            }

            // Handle valued HTML attributes
            if (typeof attrValue !== "string") {
                throw new Error(
                    `Attribute '${attrName}' recieved an value of type '${typeof attrValue}. `
                    + "Expected a string! "
                    + `Found invalid value: '${attrValue}'`
                );
            }

            result.push([attrName, {type: "valuedHtmlAttr", value: attrValue}]);
        }

        return result;
    },
};

for (const callback of postDeclarationCallbacks) {
    callback();
}

export default publicApi;
