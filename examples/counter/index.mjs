import {beginExec} from "./grugui.mjs";

let count = 0;

function createAppEl(update) {
    const {html, end} = beginExec("domGen");
        html.main({id: "app"}, () => {
            html.div(() => {
                html.span(() => html.trustedText(`Count: ${count}`));
            });

            html.button({
                onClick: () => {
                    count--;
                    update();
                },
            }, () => html.trustedText("Decrement"))
            html.button({
                onClick: () => {
                    count++;
                    update();
                },
            }, () => html.trustedText("Increment"))
        });
    end();

    return html.getDomNode();
}

function update() {
    const newAppEl = createAppEl(update);
    document.getElementById("app").replaceWith(newAppEl);
}

update();

