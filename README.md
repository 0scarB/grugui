# Grug-UI

Grug-UI is a set of light-weight JavaScript utilities for programmatically:
- Generating HTML and CSS -- SSR
- Creating DOM and CSSDOM (TBD) nodes
- Mutating the DOM (TBD)
- Enabling interactivity


## Examples

### [Counter](./examples/counter/index.mjs)
```js
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
```

### [Tic-Tac-Toe](./examples/tic-tac-toe/index.mjs)


## TODOs

- [ ] Add HTML statements set for DOM mutation
- [ ] Add CSS statements as wrapper around the CSSStyleSheet API
- [ ] Provide API for creation of reactive "components"
    - More or less just just add something that emulates an event loop
      by calling an `update` function
- [ ] Add JSDoc and generate `types.d.ts`

