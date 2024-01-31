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

