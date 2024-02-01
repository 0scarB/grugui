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
            case "domGen":
                ctxObj = domGen;
                break;
            case "strGen":
                ctxObj = strGen;
                break;
            default:
                throw new utils.Error(
                    "'grugui.setCtx(<ctx>)' expected <ctx> to be "
                    + `'strGen' or 'domGen', but got '${ctx}'!`
                );
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
        throw new utils.Error(
            `Operation 'grugui.${callerName}' cannot be executed without `
            + "a context being set! "
            + "Set the context with 'grugui.setCtx(\"domGen\"|\"strGen\")'."
        );
    },
};
postDeclarationCallbacks.push(
    // Add `strGen.<element name>(...args)` as a shorthand for
    // `strGen.tag("<element name>", ...args)`
    // for all elements defined by the the HTML standard, listed in `utils.EL_NAMES`.
    () => {
        for (const elName of utils.EL_NAMES) {
            publicApi[elName] = (function () {
                this._throwCtxNotSetError(elName);
            }).bind(publicApi);
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
            throw new utils.Error(
                "Too many calls to 'grugui.end()' while generating a HTML string! "
                + "Check that all tags are closed. I.e. 'div(); span();' "
                + "must be closed with 'end(); end();'. "
                + "The number of calls to open a tag must match the number of calls to 'end'."
            );
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
        throw new utils.Error("Not implemented yet!");
    },

    domNode(node) {
        switch (node.nodeType) {
            case Node.ELEMENT_NODE:
                this._htmlStrSegments.push(node.outerHTML);
                break;
            case Node.TEXT_NODE:
                this._htmlStrSegments.push(node.innerHTML);
                break;
            default:
                throw new utils.Error(
                    "'grugui.domNode(...)' could not handle node type "
                    + `of DOM node '${node}' while generating a HTML string! `
                    + "Currently only DOM elements and text nodes are supported."
                );
        }
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
        throw new utils.Error(
            "Attempted to call 'grugui.getDomLastNode' in the 'strGen' context. "
            + "This query can only be called in the 'domGen' context! "
            + "You can use conditional logic to execute code based on the context "
            + "when necessary. "
            + "I.e. 'let ctx = \"strGen\"; setCtx(ctx); if (ctx === \"domGen\") {getLastNode();}'. "
        );
    },

    getDomParentNode() {
        throw new utils.Error(
            "Attempted to call 'grugui.getDomParentNode' in the 'strGen' context. "
            + "This query can only be called in the 'domGen' context! "
            + "You can use conditional logic to execute code based on the context "
            + "when necessary. "
            + "I.e. 'let ctx = \"strGen\"; setCtx(ctx); if (ctx === \"domGen\") {getLastNode();}'. "
        );
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
            throw new utils.Error(
                "Too many calls to 'grugui.end()' while generating DOM! "
                + "Check that all tags are closed. I.e. 'div(); span();' "
                + "must be closed with 'end(); end();'. "
                + "The number of calls to open a tag must match the number of calls to 'end'."
            );
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
        throw new utils.Error(
            "Attempted to call 'grugui.getHtmlStr' in the 'domGen' context. "
            + "This query can only be called in the 'strGen' context! "
            + "You can use conditional logic to execute code based on the context "
            + "when necessary. "
            + "I.e. 'let ctx = \"domGen\"; setCtx(ctx); if (ctx === \"strGen\") {getHtmlStr();}'. "
        );
    },

    getCssStr() {
        throw new utils.Error(
            "Attempted to call 'grugui.getCssStr' in the 'domGen' context. "
            + "This query can only be called in the 'strGen' context! "
            + "You can use conditional logic to execute code based on the context "
            + "when necessary. "
            + "I.e. 'let ctx = \"domGen\"; setCtx(ctx); if (ctx === \"strGen\") {getCssStr();}'. "
        );
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

    Error: class GruguiError extends Error {
        constructor(msg) {
            super(msg);
            this.name = "GruguiError";
        }
    },

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

                throw new this.Error(
                    `Failed to add event listener for key '${attrName}'! `
                    + `Value of type '${typeof attrValue}' was not `
                    + "a) a function representing the listener callback "
                    + "or b) an array of arguments that would be passed "
                    + "to 'addEventListener' -> "
                    + `'addEventListener(${eventName}, ...<argument array>'). `
                    + "Got invalid value "
                    + `'${this.humanToString(attrValue, {showType: true})}'.`
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
                        throw new this.Error(
                            `'${attrName}' is a boolean attribute (represented as `
                            + "a valueless attribute name in native HTML). "
                            + "In Grug-UI it must have the value 'true : boolean' "
                            + "to signify existence and optionally value 'false : boolean' "
                            + "or 'null' to signify omission! "
                            + "Got invalid value "
                            + `'${this.humanToString(attrValue, {showType: true})}'.`
                        );
                }
            }

            // Handle valued HTML attributes
            if (typeof attrValue !== "string") {
                throw new this.Error(
                    `Attribute '${attrName}' was set to a value of type `
                    + `'${typeof attrValue}'. Expected a string! `
                    + "Got invalid value "
                    + `'${this.humanToString(attrValue, {showType: true})}'.`
                );
            }

            result.push([attrName, {type: "valuedHtmlAttr", value: attrValue}]);
        }

        return result;
    },

    /** Create a readable string from a value */
    humanToString(value, opts) {
        opts = {showType: false, ...opts};

        let result = JSON.stringify(value);

        if (opts.showType) {
            result = `${result} : ${this.humanTypeof(value)}`;
        }

        return result;
    },

    /** More readable version of `typeof`. */
    humanTypeof(value) {
        if (Array.isArray(value)) {
            return "array";
        }

        if (value === null) {
            return "null";
        }

        return typeof value;
    },
};

for (const callback of postDeclarationCallbacks) {
    callback();
}

export default publicApi;
