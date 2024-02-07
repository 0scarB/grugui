import grugui from "./grugui.mjs";

// Application state
let count = 0;

/** (Re)render function. */
function render() {
    grugui.setCtx("domGen");

    const {main, button, trustedText, end} = grugui;

    main({id: "app"});
        trustedText(`Count: ${count}`);
        button({onClick: () => {
            count++;
            render();
        }}); 
            trustedText("Increment");
        end();
    end();

    document.getElementById("app").replaceWith(
        grugui.getDomLastNode()
    );
}

render();
