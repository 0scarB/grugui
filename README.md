# Grug-UI

The `grugui.mjs` module provides utilities for generating HTML/CSS DOM/strings
and creating interactive page elements.

## Examples

### [Counter](./examples/counter/src.mjs)

The code below illustrates the module's core functionality, including Server-Side Rendering
and interactivity. (It's very much a toy example to keep it brief.)

```js
import grugui from "./grugui.mjs";

// Application State
let count = 0;

/** Procedure that creates a counter component. */
function counter(update) {
    const {button, css, div, end, main, span, trustedText} = grugui;

    main({id: "app"});
        div(); 
            span();
                trustedText(`Count: ${count}`);
            end();
        end();

        // Because `div()`, `end()`, etc. are single, sequentially operations,
        // you can just use regular control flow. No need for map/filter/reduce,
        // ternary expressions, or template specific syntax.
        for (const [buttonText, operation] of [
            ["-"    , () => count--  ],
            ["reset", () => count = 0],
            ["+"    , () => count++  ],
        ]) {
            button({class: "counter-btn", onClick: () => {
                operation();
                update();
            }});
                trustedText(buttonText);
            end();
        }

        css.rule(".counter-btn", {
            fontFamily: "monospace",
            fontSize: css.pt(18),
            marginTop: css.px(16),
        });
    end();
}

// We use `genHtmlPage` for Server-Side Rendering (see bottom of file)
function genHtmlPage() {
    grugui.setCtx("strGen");
    grugui.reset();

    const {doctype, html, head, script, body, style, trustedHtmlStr, end, css} = grugui;

    doctype();
    html({lang: "en"});
        head();
            script({src: "/grugui.mjs", type: "module", defer: true}); end();
            script({src: "/src.mjs", type: "module", defer: true}); end();
        end();
        body();
            css.rule("body", {
                display         : "flex",
                margin          : 0,
                padding         : 0,
                height          : css.vh(100),
                justifyContent  : "center",
                alignItems      : "center",
                fontSize        : css.pt(24),
                color           : css.rgb(255, 255, 255),
                backgroundColor : css.hex("#000"),
            });
            // Statically generate the HTML string for the counter
            counter();
            style();
                trustedHtmlStr(
                    grugui.css.getStr()
                );
            end();
        end();
    end();

    return grugui.getHtmlStr();
}

/**
 * Creates a counter DOM element and replaces the element id="app"
 * with the counter element.
 */
function createWebUi() {
    grugui.setCtx("domGen");

    counter(createWebUi);
    document.getElementById("app")
        .replaceWith(grugui.getDomLastNode());

    grugui.reset();
}

async function main() {
    let isNode = typeof process !== "undefined";

    if (isNode) {
        const fs = await import("node:fs");
        const http = await import("node:http");

        const server = http.createServer((request, response) => {
            let responseBody;
            switch (request.url) {
                case "/":
                    console.log("Rendering HTML...");
                    responseBody = genHtmlPage();
                    console.log("Rendered HTML.");

                    response.writeHead(200, {"Content-Type": "text/html"});
                    response.end(responseBody);
                    console.log("Served HTML.")
                    break;
                case "/grugui.mjs":
                case "/src.mjs":
                    responseBody = fs.readFileSync(`.${request.url}`, "utf8");

                    response.writeHead(200, {"Content-Type": "text/javascript"});
                    response.end(responseBody);
                    console.log(`Served JavaScript file '.${request.url}'.`);
                    break;
            }
        });

        server.listen(8080, "localhost");
        console.log("Server listening on http://localhost:8080...");
    } else {
        createWebUi();
    }
}

await main();
```

You can run the example above by:
1. Copying the above code to `src.mjs`
2. Copying `grugui.mjs` to the same directory as `src.mjs`
3. Running `node src.mjs`
4. Opening `http://localhost:8080` in your browser

### [Tic-Tac-Toe](./examples/tic-tac-toe/index.mjs)

