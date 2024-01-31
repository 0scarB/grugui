# Grug-UI

Grug-UI is a set of light-weight JavaScript utilities for programmatically:
- Generating HTML and CSS -- SSR
- Creating DOM and CSSDOM (TBD) nodes
- Mutating the DOM (TBD)
- Enabling interactivity


## Examples

### [Counter](./examples/counter/index.mjs)
```js
import grugui from "./grugui.mjs";

let count = 0;

function render(update) {
    const {main, div, span, trustedText, button, end} = grugui;

    main({id: "app"});
        div(); 
            span();
                trustedText(`Count: ${count}`);
            end();
        end();
        
        button({onClick: () => {
            count--;
            update();
        }});
            trustedText("Decrement");
        end();
        button({onClick: () => {
            count++;
            update();
        }});
            trustedText("Increment");
        end();
    end();
}

function staticGen() {
    grugui.setCtx("strGen");
    render();
    return grugui.getHtmlStr();
}

function drawUi() {
    grugui.setCtx("domGen");
    render(drawUi);
    document.getElementById("app")
        .replaceWith(grugui.getDomLastNode());
    grugui.reset();
}

console.log(staticGen());
// Output: <main id="app"><div><span>Count: 0</span></div><button>Decrement</button><button>Increment</button></main>
drawUi();
```

### [Tic-Tac-Toe](./examples/tic-tac-toe/index.mjs)


## TODOs

- [ ] Add HTML statements set for DOM mutation
- [ ] Add CSS statements as wrapper around the CSSStyleSheet API
- [ ] Provide API for creation of reactive "components"
    - More or less just just add something that emulates an event loop
      by calling an `update` function
- [ ] Add JSDoc and generate `types.d.ts`

