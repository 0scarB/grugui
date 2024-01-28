// Read this file top to bottom. `outputSegment` is only used
// to group outputs. You can ignore it and just read the body of the
// closure passed to it. (Optionally use `dontRun: true` to toggle
// execution of the closure.)
//
// Run `node README.mjs` to execute the code.

import {registerStatements, beginExec} from "./grugui.mjs";

// Static Content
// ==============

// TODO: Document!

function main() {

    outputSegment("", {dontRun: false}, () => {
        const score = 80;

        const {html, css, end} =
        beginExec("strGen");
            html.beginEl("div");
                html.beginEl("span");
                    html.trustedText("Score: ");
                end();
                html.beginEl("span");
                    html.trustedText(score);
                end();

                html.beginEl("strong", {class: "win-lose"});
                css.beginRule(".win-lose");
                    if (score > 50) {
                        html.trustedText("You win!");
                        css.property("background-color", "green");
                    } else {
                        html.trustedText("You lose!");
                        css.property("background-color", "red");
                    }
                end();
                end();
            end();
        end();

        console.log(html.getStr());
        console.log(css.getStr());
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

