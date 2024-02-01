import grugui from "./grugui.mjs";

// Application State
let count = 0;

/** Procedure that creates a counter component. */
function counter(update) {
    const {button, div, end, main, span, trustedText} = grugui;

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
            button({onClick: () => {
                operation();
                update();
            }});
                trustedText(buttonText);
            end();
        }
    end();
}

// We use `genHtmlPage` for Server-Side Rendering (see bottom of file)
function genHtmlPage() {
    grugui.setCtx("strGen");
    grugui.reset();

    const {doctype, html, head, script, body, end} = grugui;

    doctype();
    html({lang: "en"});
        head();
            script({src: "/grugui.mjs", type: "module", defer: true}); end();
            script({src: "/src.mjs", type: "module", defer: true}); end();
        end();
        body();
            // Statically generate the HTML string for the counter
            counter();
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

