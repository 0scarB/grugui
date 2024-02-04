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
    getDomLastNode()    {this._throwCtxNotSetError("getDomLastNode"     );},
    getDomParentNode()  {this._throwCtxNotSetError("getDomParentNode"   );},

    css: {
        _cssStrSegments: [],

        rule(selectorListStr, propertiesObj) {
            this._cssStrSegments.push(`${selectorListStr} {\n`);
            for (let propertyName in propertiesObj) {
                let propertyValue = propertiesObj[propertyName];
                if (typeof propertyValue !== "string") {
                    propertyValue = propertyValue.toString();
                }

                propertyName = utils.ensureHyphenCase(propertyName);

                this._cssStrSegments.push(`    ${propertyName}: ${propertyValue};\n`);
            }
            this._cssStrSegments.push("}\n\n");
        },

        getStr() {
            return this._cssStrSegments.join("");
        },

        // Unit Values
        //------------------------------------------------------------

        _unitValueProto: {
            cssUnit: "",
            isAbs: false,
            valueFrac: [1, 1],
            toString() {
                return `${this.valueFrac[0]/this.valueFrac[1]}${this.cssUnit}`;
            },

            unit() {
                return this.cssUnit;
            },

            value() {
                return this.valueFrac[0] / this.valueFrac[1];
            },

            eq(other) {
                if (!publicApi.css._isUnitValue(other)) {
                    // TODO: Add error message
                    throw new utils.Error();
                }

                return (
                    this.cssUnit === other.cssUnit
                    && this.valueFrac[0]*other.valueFrac[1]
                        === other.valueFrac[0]*this.valueFrac[1]
                    && this.valueFrac[1]*other.valueFrac[0]
                        === other.valueFrac[1]*this.valueFrac[0]
                );
            },

            approxEq(other, opts) {
                if (!publicApi.css._isUnitValue(other)) {
                    // TODO: Add error message
                    throw new utils.Error();
                }

                if (this.cssUnit !== other.cssUnit) {
                    return false;
                }

                const places = (opts && opts.places) || 4;

                const tenPowPlaces = Math.pow(10, places);
                const thisValueRounded =
                    Math.round(tenPowPlaces * this.value()) / tenPowPlaces;
                const otherValueRounded =
                    Math.round(tenPowPlaces * other.value()) / tenPowPlaces;

                return thisValueRounded === otherValueRounded;
            },

            neg() {
                return {
                    ...this,
                    __proto__: publicApi.css._unitValueProto,
                    valueFrac: [-this.valueFrac[0], this.valueFrac[1]],
                };
            },

            add(other) {
                this._throwIfNotUseableForAddSub("add", other);

                const result = {
                    ...this,
                    __proto__: publicApi.css._unitValueProto,
                    valueFrac: [
                        // a/b + c/d = (ad+cb)/bd
                        this.valueFrac[0]*other.valueFrac[1]
                        + other.valueFrac[0]*this.valueFrac[1]
                        ,
                        this.valueFrac[1]*other.valueFrac[1]
                    ],
                };

                utils.inplaceFracNormalization(result.valueFrac);

                return result;
            },

            sub(other) {
                this._throwIfNotUseableForAddSub("sub", other);

                return this.add(other.neg());
            },

            mul(scalar) {
                // NOTE: Unit value with unit value multiplication doesn't really make
                //       sense for CSS and we don't have support for squared units
                if (typeof scalar !== "number") {
                    // TODO: Improve error message
                    throw new utils.Error(
                        "A Grug-UI CSS unit value can only be multiplied with a "
                        + "scalar value!"
                    );
                }

                const result = {
                    ...this,
                    __proto__: publicApi.css._unitValueProto,
                    valueFrac: [scalar*this.valueFrac[0], this.valueFrac[1]],
                };

                utils.inplaceFracNormalization(result.valueFrac);

                return result;
            },

            div(divisor) {
                if (typeof divisor === "number") {
                    return {
                        ...this,
                        __proto__: publicApi.css._unitValueProto,
                        valueFrac: [this.valueFrac[0], this.valueFrac[1]*divisor],
                    };
                }

                if (publicApi.css._isUnitValue(divisor)) {
                    if (this.cssUnit === divisor.cssUnit) {
                        return (
                            (this.valueFrac[0]*divisor.valueFrac[1])
                            / (this.valueFrac[1]*divisor.valueFrac[0])
                        );
                    } else if (this.isAbs && divisor.isAbs) {
                        const thisRatioIdx = 
                            utils.ABS_CSS_UNITS.indexOf(this.cssUnit);
                        const divisorRatioIdx = 
                            utils.ABS_CSS_UNITS.indexOf(divisor.cssUnit);
                        const ratio =
                            utils.absCssUnitRatioTable[thisRatioIdx][divisorRatioIdx];

                        return (
                            (ratio[1]*this.valueFrac[0]*divisor.valueFrac[1])
                            / (ratio[0]*this.valueFrac[1]*divisor.valueFrac[0])
                        );
                    } else {
                        // TODO: Add error message
                        throw new utils.Error();
                    }
                }

                // TODO: Add error message
                throw new utils.Error();
            },

            _throwIfNotUseableForAddSub(opName, other) {
                if (!publicApi.css._isUnitValue(other)) {
                    // TODO: Improve error message
                    throw new utils.Error(
                        `${utils.toHumanString(other, {showType: true})} is not `
                        + "a Grug-UI CSS unit value object!"
                    );
                }

                if (other.cssUnit !== this.cssUnit) {
                    let hint = "";
                    if (this.isAbs) {
                        hint = " Use the "
                            + `'to${this.cssUnit[0].toUpperCase()}`
                            + `${this.cssUnit.slice(1)}'`
                            + `or 'to${other.cssUnit[0].toUpperCase()}`
                            + `${other.cssUnit.slice(1)}' `
                            + "methods to cast the left or the right hand instance to "
                            + "a compatible unit.";
                    }

                    throw new utils.Error(
                        `A Grug-UI CSS unit value can only be used in the '${opName}' `
                        + "binary operation with another unit value of the same type! "
                        + `The right hand instance in '<left hand>.${opName}`
                        + `(<right hand>)' had a different CSS Unit '${other.cssUnit}' `
                        + `than the left hand instance '${this.cssUnit}' where `
                        + `<left hand>='${this.toString()}' `
                        + `and <right hand>='${other.toString()}'.${hint}`
                    );
                }
            },
        },

        _isUnitValue(value) {
            return value.__proto__ === this._unitValueProto;
        },

        // Colors
        //------------------------------------------------------------
        _rgbaColorProto: {
            r: 255,
            g: 255,
            b: 255,
            a: 255,

            mul(scalar) {
                let scalarVec;
                if (typeof scalar === "number") {
                    scalarVec = [scalar, scalar, scalar, 1];
                } else if (Array.isArray(scalar)) {
                    switch (scalar.length) {
                        case 3:
                            scalarVec = [scalar[0], scalar[1], scalar[2], 1];
                            break;
                        case 4:
                            scalarVec = [...scalar];
                            break;
                        default:
                            // TODO: Add error message
                            throw new utils.Error();
                    }
                } else {
                    // TODO: Add error message
                    throw new utils.Error();
                }

                const newColor = {
                    __proto__: publicApi.css._rgbaColorProto,
                    r: this.r * scalarVec[0],
                    g: this.g * scalarVec[1],
                    b: this.b * scalarVec[2],
                    a: this.a * scalarVec[3],
                };
                newColor._clamp();

                return newColor;
            },

            toString() {
                return this.toHexString();
            },

            _HEX_DIGITS: [
                "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
                "A", "B", "C", "D", "E", "F"
            ],
            toHexString() {
                // Round channels to integers so we can perform bitwise
                // operations on them
                const r = Math.round(this.r);
                const g = Math.round(this.g);
                const b = Math.round(this.b);

                const rDig1Idx = (r & 0xF0) >> 4;
                const rDig2Idx = r & 0x0F;
                const gDig1Idx = (g & 0xF0) >> 4;
                const gDig2Idx = g & 0x0F;
                const bDig1Idx = (b & 0xF0) >> 4;
                const bDig2Idx = b & 0x0F;

                if (this.a === 255) {
                    if (rDig1Idx === rDig2Idx
                        && gDig1Idx === gDig2Idx
                        && bDig1Idx === bDig2Idx
                    ) {
                        return `#${
                            this._HEX_DIGITS[rDig1Idx]
                        }${
                            this._HEX_DIGITS[gDig1Idx]
                        }${
                            this._HEX_DIGITS[bDig1Idx]
                        }`
                    } else {
                        return `#${
                            this._HEX_DIGITS[rDig1Idx]
                        }${
                            this._HEX_DIGITS[rDig2Idx]
                        }${
                            this._HEX_DIGITS[gDig1Idx]
                        }${
                            this._HEX_DIGITS[gDig2Idx]
                        }${
                            this._HEX_DIGITS[bDig1Idx]
                        }${
                            this._HEX_DIGITS[bDig2Idx]
                        }`
                    }
                } else {
                    const a = Math.round(this.a);

                    const aDig1Idx = (a & 0xF0) >> 4;
                    const aDig2Idx = a & 0x0F;

                    if (rDig1Idx === rDig2Idx
                        && gDig1Idx === gDig2Idx
                        && bDig1Idx === bDig2Idx
                        && aDig1Idx === aDig2Idx
                    ) {
                        return `#${
                            this._HEX_DIGITS[rDig1Idx]
                        }${
                            this._HEX_DIGITS[gDig1Idx]
                        }${
                            this._HEX_DIGITS[bDig1Idx]
                        }${
                            this._HEX_DIGITS[aDig1Idx]
                        }`
                    } else {
                        return `#${
                            this._HEX_DIGITS[rDig1Idx]
                        }${
                            this._HEX_DIGITS[rDig2Idx]
                        }${
                            this._HEX_DIGITS[gDig1Idx]
                        }${
                            this._HEX_DIGITS[gDig2Idx]
                        }${
                            this._HEX_DIGITS[bDig1Idx]
                        }${
                            this._HEX_DIGITS[bDig2Idx]
                        }${
                            this._HEX_DIGITS[aDig1Idx]
                        }${
                            this._HEX_DIGITS[aDig2Idx]
                        }`
                    }
                }
            },

            /** Clamp all channels (r, g, b, a) to the valid range 0-255. */
            _clamp() {
                if (this.r > 255) {
                    this.r = 255;
                }
                if (this.g > 255) {
                    this.g = 255;
                }
                if (this.b > 255) {
                    this.b = 255;
                }
                if (this.a > 255) {
                    this.a = 255;
                }

                if (this.r < 0) {
                    this.r = 0;
                }
                if (this.g < 0) {
                    this.g = 0;
                }
                if (this.b < 0) {
                    this.b = 0;
                }
                if (this.a < 0) {
                    this.a = 0;
                }
            },
        },

        _isRgbaColor(value) {
            return value.__proto__ === this._rgbaColorProto;
        },

        rgb(r, g, b, optA) {
            let a = optA;
            if (typeof optA === "undefined") {
                a = 255;
            }
            const color = {
                __proto__: publicApi.css._rgbaColorProto,
                r, g, b, a
            };
            color._clamp();
            return color;
        },

        hex(hexString) {
            if (hexString[0] !== "#") {
                hexString = "#" + hexString;
            }

            let r, g, b, a;
            switch (hexString.length) {
                case 7:
                    r = parseInt(hexString.slice(1, 3), 16);
                    g = parseInt(hexString.slice(3, 5), 16);
                    b = parseInt(hexString.slice(5, 7), 16);
                    a = 255;
                    break;
                case 4:
                    r = parseInt(hexString[1], 16);
                    g = parseInt(hexString[2], 16);
                    b = parseInt(hexString[3], 16);
                    r = (r << 4) + r;
                    g = (g << 4) + g;
                    b = (b << 4) + b;
                    a = 255;
                    break;
                case 9:
                    r = parseInt(hexString.slice(1, 3), 16);
                    g = parseInt(hexString.slice(3, 5), 16);
                    b = parseInt(hexString.slice(5, 7), 16);
                    a = parseInt(hexString.slice(7, 9), 16);
                    break;
                case 5:
                    r = parseInt(hexString[1], 16);
                    g = parseInt(hexString[2], 16);
                    b = parseInt(hexString[3], 16);
                    a = parseInt(hexString[4], 16);
                    r = (r << 4) + r;
                    g = (g << 4) + g;
                    b = (b << 4) + b;
                    a = (a << 4) + a;
                    break;
                default:
                    // TODO: Add error message
                    throw new utils.Error();
            }

            return {
                __proto__: publicApi.css._rgbaColorProto,
                r, g, b, a
            };
        },

        // Arithmetic Operation Helpers
        //------------------------------------------------------------

        neg(unitValue) {
            if (!publicApi.css._isUnitValue(unitValue)) {
                // TODO: Add error message
                throw new utils.Error();
            }

            return unitValue.neg();
        },

        add(lUnitValue, rUnitValue) {
            if (!publicApi.css._isUnitValue(lUnitValue)) {
                // TODO: Add error message
                throw new utils.Error();
            }

            return lUnitValue.add(rUnitValue);
        },

        sub(lUnitValue, rUnitValue) {
            if (!publicApi.css._isUnitValue(lUnitValue)) {
                // TODO: Add error message
                throw new utils.Error();
            }

            return lUnitValue.sub(rUnitValue);
        },

        mul(l, r) {
            if (publicApi.css._isUnitValue(l) 
                || publicApi.css._isRgbaColor(l)
            ) {
                return l.mul(r);
            } else if (
                publicApi.css._isUnitValue(r)
                || publicApi.css._isRgbaColor(r)
            ) {
                return r.mul(l);
            }

            // TODO: Add error message
            throw new utils.Error();
        },

        div(lUnitValue, r) {
            if (!publicApi.css._isUnitValue(lUnitValue)) {
                // TODO: Add error message
                throw new utils.Error();
            }

            return lUnitValue.div(r);
        },
    },

    _throwCtxNotSetError(callerName) {
        throw new utils.Error(
            `Operation 'grugui.${callerName}' cannot be executed without `
            + "a context being set! "
            + "Set the context with 'grugui.setCtx(\"domGen\"|\"strGen\")'."
        );
    },
};
postDeclarationCallbacks.push(
    // Add `publicApi.<element name>(...args)` as a shorthand for
    // `publicApi.tag("<element name>", ...args)`
    // for all elements defined by the the HTML standard, listed in `utils.EL_NAMES`.
    () => {
        for (const elName of utils.EL_NAMES) {
            publicApi[elName] = (function () {
                this._throwCtxNotSetError(elName);
            }).bind(publicApi);
        }
    },
    // Add CSS Unit constructors and absolute unit conversion methods
    () => {
        // Absolute CSS Units
        for (const cssUnit of utils.ABS_CSS_UNITS) {
            // Add constructor. E.g. `.px(...)` method
            publicApi.css[cssUnit] = (value) => ({
                __proto__: publicApi.css._unitValueProto, 
                cssUnit, 
                isAbs: true, 
                valueFrac: utils.toFrac(value),
            });

            // Add absolute conversion method. E.g. `.pxToPt(...)`
            publicApi.css._unitValueProto[
                `to${cssUnit[0].toUpperCase()}${cssUnit.slice(1)}`
            ] = function () {
                if (!this.isAbs) {
                    // TODO: Add error message
                    throw new utils.Error();
                }

                const fromIdx = utils.ABS_CSS_UNITS.indexOf(this.cssUnit);
                const toIdx = utils.ABS_CSS_UNITS.indexOf(cssUnit);

                const ratio = utils.absCssUnitRatioTable[fromIdx][toIdx];

                return {
                    __proto__: publicApi.css._unitValueProto,
                    cssUnit,
                    isAbs: true,
                    valueFrac: [
                        this.valueFrac[0]*ratio[1], 
                        this.valueFrac[1]*ratio[0]
                    ],
                };
            };
        }

        // Relative CSS Units
        for (const cssUnit of utils.REL_CSS_UNITS) {
            publicApi.css[cssUnit] = (value) => ({
                __proto__: publicApi.css._unitValueProto, 
                cssUnit, 
                isAbs: false, 
                valueFrac: utils.toFrac(value),
            });
        }
        // We treat percentages similar to relative units
        publicApi.css.percent = (value) => ({
            __proto__: publicApi.css._unitValueProto, 
            cssUnit: "%", 
            isAbs: false, 
            valueFrac: utils.toFrac(value),
        });
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

    // Used when adding closing tag HTML string segments
    _tagNameStack: [],

    reset() {
        this._htmlStrSegments = [];
        this.css._cssStrSegments = [];
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
                + "The number of calls to open a tag must match the number of "
                + "calls to 'end'."
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

    trustedHtmlStr(str) {
        this._htmlStrSegments.push(str);
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

    doctype() {
        this._htmlStrSegments.push("<!DOCTYPE html>");
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

    getDomLastNode() {
        throw new utils.Error(
            "Attempted to call 'grugui.getDomLastNode' in the 'strGen' context. "
            + "This query can only be called in the 'domGen' context! "
            + "You can use conditional logic to execute code based on the context "
            + "when necessary. "
            + "I.e. 'let ctx = \"strGen\"; setCtx(ctx); "
            + "if (ctx === \"domGen\") {getLastNode();}'."
        );
    },

    getDomParentNode() {
        throw new utils.Error(
            "Attempted to call 'grugui.getDomParentNode' in the 'strGen' context. "
            + "This query can only be called in the 'domGen' context! "
            + "You can use conditional logic to execute code based on the context "
            + "when necessary. "
            + "I.e. 'let ctx = \"strGen\"; setCtx(ctx); "
            + "if (ctx === \"domGen\") {getLastNode();}'."
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
                + "The number of calls to open a tag must match the number "
                + "of calls to 'end'."
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

    trustedHtmlStr(str) {
        this._parentNode.innerHTML += str;
    },

    domNode(node) {
        if (this._parentNode !== null) {
            this._parentNode.appendChild(node);
        }

        this._lastNode = node;
    },

    doctype() {
        // NOTE: Maybe this should be an error ¯\_(ツ)_/¯
    },

    getHtmlStr() {
        throw new utils.Error(
            "Attempted to call 'grugui.getHtmlStr' in the 'domGen' context. "
            + "This query can only be called in the 'strGen' context! "
            + "You can use conditional logic to execute code based on the context "
            + "when necessary. "
            + "I.e. 'let ctx = \"domGen\"; setCtx(ctx); "
            + "if (ctx === \"strGen\") {getHtmlStr();}'."
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

    ASCII_CODE_UPPER_A: "A".charCodeAt(0),
    ASCII_CODE_UPPER_Z: "Z".charCodeAt(0),

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

                throw new utils.Error(
                    `Failed to add event listener for key '${attrName}'! `
                    + `Value of type '${typeof attrValue}' was not `
                    + "a) a function representing the listener callback "
                    + "or b) an array of arguments that would be passed "
                    + "to 'addEventListener' -> "
                    + `'addEventListener(${eventName}, ...<argument array>'). `
                    + "Got invalid value "
                    + `'${utils.toHumanString(attrValue, {showType: true})}'.`
                );
            }

            // Handle boolean HTML attributes
            const isBooleanAttr = utils.BOOLEAN_ATTR_NAMES.has(attrName);
            if (isBooleanAttr) {
                switch (attrValue) {
                    case true:
                        result.push([attrName, {type: "boolHtmlAttr"}]);
                        continue;
                    case false:
                    case null:
                        continue;
                    default:
                        throw new utils.Error(
                            `'${attrName}' is a boolean attribute (represented as `
                            + "a valueless attribute name in native HTML). "
                            + "In Grug-UI it must have the value 'true : boolean' "
                            + "to signify existence and optionally value 'false : boolean' "
                            + "or 'null' to signify omission! "
                            + "Got invalid value "
                            + `'${utils.toHumanString(attrValue, {showType: true})}'.`
                        );
                }
            }

            // Handle valued HTML attributes
            if (typeof attrValue !== "string") {
                throw new utils.Error(
                    `Attribute '${attrName}' was set to a value of type `
                    + `'${typeof attrValue}'. Expected a string! `
                    + "Got invalid value "
                    + `'${utils.toHumanString(attrValue, {showType: true})}'.`
                );
            }

            result.push([attrName, {type: "valuedHtmlAttr", value: attrValue}]);
        }

        return result;
    },

    /** Create a readable string from a value */
    toHumanString(value, opts) {
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

    // We define this array in the object scope to save on heap allocations.
    _hyphenCaseWords: [],
    ensureHyphenCase(str) {
        // Effectively "remove" all elements from the array.
        this._hyphenCaseWords.length = 0;

        // a) Populate `this._hypenCaseWords` with lowercased words.
        // b) Return input string if hyphens are found in the string.
        let wordStart = 0;
        for (let i = 0; i < str.length - 1; i++) {
            const isAlreadyHyphenCase = str[i] === "-" || str[i + 1] === "-";
            if (isAlreadyHyphenCase) {
                return str;
            }

            const transitionsToUpper = 
                !this.charAtIsUpper(str, i) && this.charAtIsUpper(str, i + 1);
            if (transitionsToUpper) {
                const wordEnd = i + 1;
                this._hyphenCaseWords.push(str.slice(wordStart, wordEnd).toLowerCase());

                wordStart = wordEnd;
            }
        }
        this._hyphenCaseWords.push(str.slice(wordStart).toLowerCase());

        return this._hyphenCaseWords.join("-");
    },

    charAtIsUpper(str, i) {
        const asciiCode = str.charCodeAt(i);
        return (
            this.ASCII_CODE_UPPER_A <= asciiCode
            && asciiCode <= this.ASCII_CODE_UPPER_Z
        );
    },

    // Source: https://developer.mozilla.org/en-US/docs/Learn/CSS/Building_blocks/Values_and_units
    REL_CSS_UNITS: new Set([
        "em",
        "ex",
        "ch",
        "rem",
        "lh",
        "rlh",
        "vw",
        "vh",
        "vmin",
        "vmax",
        "vb",
        "vi",
        "svw",
        "svh",
        "lvw",
        "lvh",
        "dvw",
        "dvh",
    ]),
    ABS_CSS_UNITS: [
        // Order matches order in table below
        "cm", "mm", "Q", "in", "pc", "pt", "px",
    ],
    // Table containing ratios used for conversion between CSS units
    // as specified in CSS Values and Units Module Level 4
    // https://drafts.csswg.org/css-values/#absolute-length.
    absCssUnitRatioTable: [
        //           cm          mm       Q        in         pc      pt       px
        /*   cm */ [[ 1,    1], [1, 10], [1, 40], [2.54, 1],  null ,  null  ,  null  ],
        /*   mm */ [ null     , [1,  1],  null  ,  null    ,  null ,  null  ,  null  ],
        /*    Q */ [ null     ,  null  , [1,  1],  null    ,  null ,  null  ,  null  ],
        /*   in */ [ null     ,  null  ,  null  , [   1, 1], [1, 6], [1, 72], [1, 96]],
        /*   pc */ [ null     ,  null  ,  null  ,  null    , [1, 1],  null  ,  null  ],
        /*   pt */ [ null     ,  null  ,  null  ,  null    ,  null , [1,  1],  null  ],
        /*   px */ [[96, 2.54],  null  ,  null  , [  96, 1],  null ,  null  , [1,  1]],
    ],
    // `_finalizeAbsUnitRatioTable` is called before exporting the public API to
    // a) normalize ratios b) fill missing ratios
    _finalizeAbsCssUnitRatioTable() {
        const table = this.absCssUnitRatioTable;
        const tableSize = table.length;

        let i, j, k;

        // Run multiple passes over the table until all ratios are populated.
        let hasUnpopulatedRatios = true;
        while (hasUnpopulatedRatios) {
            hasUnpopulatedRatios = false;
            for (i = 0; i < tableSize; i++) {
                rowLoop: for (j = 0; j < tableSize; j++) {
                    // Do nothing if the ratio is already populated
                    if (table[i][j] !== null) {
                        continue;
                    }

                    // Else check whether the ratio containing the inverse
                    // is populated and use that to populate the ratio
                    const inverse = table[j][i];
                    if (inverse !== null) {
                        table[i][j] = [inverse[1], inverse[0]];
                        continue;
                    }

                    // Else check whether two factors for the ratio exist
                    // and use them to populate the ratio
                    for (k = 0; k < tableSize; k++) {
                        if (table[i][k] !== null && table[k][j] !== null) {
                            const fac1 = table[i][k];
                            const fac2 = table[k][j];
                            table[i][j] = [fac1[0]*fac2[0], fac1[1]*fac2[1]];
                            continue rowLoop;
                        }
                    }

                    // Otherwise set `hasUnpopulatedCells = true` to signal
                    // that another pass should be done over the table
                    hasUnpopulatedRatios = true;
                }
            }
        }

        // Set any fractional values in ratio to whole integer values.
        for (i = 0; i < tableSize; i++) {
            for (j = 0; j < tableSize; j++) {
                const ratio = table[i][j];
                if (ratio === null) {
                    continue;
                }
                utils.inplaceFracNormalization(ratio);
                utils.inplaceFracGcd(ratio);
            }
        }
    },

    _FRAC_MAX_DECIMAL_PLACES: 12,
    _FRAC_COMPONENT_MAX_WITHOUT_GCD: Math.pow(2, 8),
    inplaceFracNormalization(frac) {
        // We attempt to remove decimal places to avoid floating point
        // arithmetic errors.
        const componentsAreDecimal =
            frac[0] % 1 !== 0
            || frac[1] % 1 !== 0;
        if (componentsAreDecimal) {
            let remainingIterN = this._FRAC_MAX_DECIMAL_PLACES;
            do {
                frac[0] *= 10;
                frac[1] *= 10;
                remainingIterN--;
            } while ((frac[0] % 1 !== 0 || frac[1] % 1 !== 0) && remainingIterN > 0);
            // We give up after a certain number of iterations and truncate the
            // decimal places to avoid an overflow to (IEEE 754) (+/-)Infinity
            // in one of the components.
            if (remainingIterN === 0) {
                frac[0] = Math.trunc(frac[0]);
                frac[1] = Math.trunc(frac[1]);
            }
        }

        // When one of the fractional components exceeds a certain maximum value,
        // we calculate a greatest common factor and divide the components by
        // this factor in an attempt to keep the components small.
        const needsGcd =
            frac[0] > this._FRAC_COMPONENT_MAX_WITHOUT_GCD
            || frac[1] > this._FRAC_COMPONENT_MAX_WITHOUT_GCD;
        if (needsGcd) {
            utils.inplaceFracGcd(frac);
        }
    },

    _FRAC_MAX_GCD_ITER_N: Math.pow(2, 16),
    inplaceFracGcd(frac) {
        let a = frac[0];
        let b = frac[1];
        
        switch (b) {
            case 0:
                // TODO: Add better error message
                throw new utils.Error(
                    "'grugui' fractional value has 0 denominator!"
                );
            case 1:
                return;
        }

        let remainingIterN = this._FRAC_MAX_GCD_ITER_N;
        while (a !== b) {
            if (a > b) {
                a -= b;
            } else {
                b -= a;
            }

            remainingIterN--;
            if (remainingIterN === 0) {
                return;
            }
        }

        frac[0] /= a;
        frac[1] /= a;
    },

    toFrac(num) {
        const frac = [num, 1];
        utils.inplaceFracNormalization(frac);
        return frac;
    },
};
utils._finalizeAbsCssUnitRatioTable();

for (const callback of postDeclarationCallbacks) {
    callback();
}

export default publicApi;

