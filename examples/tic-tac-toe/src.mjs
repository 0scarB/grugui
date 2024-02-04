import grugui from "./grugui.mjs";

const state = {
    status: "startScreen",
    nextPlayer: "X",
    aiPlayer: null,
    currentBoard: [
        [" ", " ", " "],
        [" ", " ", " "],
        [" ", " ", " "],
    ],
};

function ticTacToe(update) {
    if (state.status === "inPlay" && state.nextPlayer === state.aiPlayer) {
        makeAiMove();
    }

    const {
        main,
        fieldset,
        input,
        legend,
        trustedText,
        label,
        button,
        div,
        code,
        trustedHtmlStr,
        end,
    } = grugui;

    const render = () => {
        main({id: "app"});
            if (state.status === "startScreen") {
                renderStartScreen();
            } else {
                renderBoard();
                renderStatus();
                if (state.status !== "inPlay") {
                    renderNewGameBtn();
                }
            }
        end();
    };

    const renderStartScreen = () => {
        // Start Player Selection
        fieldset();
            legend(); trustedText("Start Player: "); end();
            input({
                type: "radio", 
                id: "X", 
                checked: state.nextPlayer === "X",
                onClick: () => {
                    state.nextPlayer = "X";
                    update();
                },
            }); end();
            label({for: "X"}); trustedText("X"); end();
            input({
                type: "radio", 
                id: "O", 
                checked: state.nextPlayer === "O",
                onClick: () => {
                    state.nextPlayer = "O";
                    update();
                },
            }); end();
            label({for: "O"}); trustedText("O"); end();
        end();

        // AI Player Selection
        fieldset();
            legend(); trustedText("AI Player: "); end();
            input({
                type: "radio", 
                id: "None", 
                checked: !state.aiPlayer,
                onClick: () => {
                    state.aiPlayer = "None";
                    update();
                },
            }); end();
            label({for: "None"}); trustedText("None"); end();
            input({
                type: "radio", 
                id: "X", 
                checked: state.aiPlayer === "X",
                onClick: () => {
                    state.aiPlayer = "X";
                    update();
                },
            }); end();
            label({for: "X"}); trustedText("X"); end();
            input({
                type: "radio", 
                id: "O", 
                checked: state.aiPlayer === "O",
                onClick: () => {
                    state.aiPlayer = "O";
                    update();
                },
            }); end();
            label({for: "O"}); trustedText("O"); end();
        end();

        // Start Game Button
        button({
            onClick: () => {
                state.status = "inPlay";
                update();
            },
        }); trustedText("Start Game"); end();
    };

    const renderBoard = () => {
        div();
            for (let rowIdx = 0; rowIdx < 3; rowIdx++) {
                const row = state.currentBoard[rowIdx];
                div();
                    for (let colIdx = 0; colIdx < 3; colIdx++) {
                        const cell = row[colIdx];
                        button({
                            onClick: () => {
                                if (state.status !== "inPlay" 
                                    || state.currentBoard[rowIdx][colIdx] !== " ") {
                                    return;
                                }
                                makeMove(rowIdx, colIdx);
                                update();
                            },
                        });
                            code();
                                if (cell === " ") {
                                    trustedHtmlStr("&nbsp;");
                                } else {
                                    trustedText(cell);
                                }
                            end();
                        end();
                    }
                end();
            }
        end();
    };

    const renderStatus = () => {
        div();
            switch (state.status) {
                case "inPlay":
                    if (state.nextPlayer === state.aiPlayer) {
                        trustedText(`${state.aiPlayer}'s move (super advanced AI!)`);
                    } else {
                        trustedText(`${state.nextPlayer}'s move`);
                    }
                    break;
                case "won":
                    let winningPlayer;
                    if (state.nextPlayer === "X") {
                        winningPlayer = "O";
                    } else {
                        winningPlayer = "X";
                    }
                    if (winningPlayer === state.aiPlayer) {
                        trustedText(`Evil AI (${state.aiPlayer}) wins :(`);
                    } else {
                        trustedText(`${winningPlayer} wins!`);
                    }
                    break;
                case "draw":
                    trustedText("Draw.");
                    break;
            }
        end();
    };

    const renderNewGameBtn = () => {
        button({
            onClick: () => {
                state.status = "startScreen";
                state.nextPlayer = "X";
                state.aiPlayer = null;
                for (let rowIdx = 0; rowIdx < 3; rowIdx++) {
                    for (let colIdx = 0; colIdx < 3; colIdx++) {
                        state.currentBoard[rowIdx][colIdx] = " ";
                    }
                }
                update();
            },
        }); trustedText("New Game"); end();
    };

    render();
}

function makeMove(rowIdx, colIdx) {
    state.currentBoard[rowIdx][colIdx] = state.nextPlayer;
    if (state.nextPlayer === "X") {
        state.nextPlayer = "O";
    } else {
        state.nextPlayer = "X";
    }

    state.status = "draw";
    checkNotDrawLoop: for (const row of state.currentBoard) {
        for (const cell of row) {
            if (cell === " ") {
                state.status = "inPlay";
                break checkNotDrawLoop;
            }
        }
    }
    if (state.status === "draw") {
        return;
    }

    if (wasWinningMove(state.currentBoard, rowIdx, colIdx)) {
        state.status = "won";
    }
}

function makeAiMove() {
    let bestMoveRowIdx = 0;
    let bestMoveColIdx = 0;
    let bestMoveScore = -Infinity;
    for (let rowIdx = 0; rowIdx < 3; rowIdx++) {
        for (let colIdx = 0; colIdx < 3; colIdx++) {
            if (state.currentBoard[rowIdx][colIdx] !== " ") {
                continue;
            }

            const moveScore = scoreMove(state.currentBoard, state.aiPlayer, rowIdx, colIdx);
            if (moveScore > bestMoveScore) {
                bestMoveRowIdx = rowIdx;
                bestMoveColIdx = colIdx;
                bestMoveScore = moveScore;
            }
        }
    }

    makeMove(bestMoveRowIdx, bestMoveColIdx);
}

function scoreMove(board, player, rowIdx, colIdx) {
    const nextBoard = [[...board[0]], [...board[1]], [...board[2]]];
    nextBoard[rowIdx][colIdx] = player;

    if (wasWinningMove(nextBoard, rowIdx, colIdx)) {
        if (player === state.aiPlayer) {
            return 1000;
        } else {
            return -1000;
        }
    }

    let humanPlayer;
    if (state.aiPlayer === "X") {
        humanPlayer = "O";
    } else {
        humanPlayer = "X";
    }

    // Modified minimax
    let score = 0;
    for (rowIdx = 0; rowIdx < 3; rowIdx++) {
        for (let colIdx = 0; colIdx < 3; colIdx++) {
            if (nextBoard[rowIdx][colIdx] !== " ") {
                continue;
            }

            let restScore;
            if (player === state.aiPlayer) {
                restScore = scoreMove(nextBoard, humanPlayer, rowIdx, colIdx);
                if (restScore < score) {
                    score = restScore;
                }
            } else {
                restScore = scoreMove(nextBoard, state.aiPlayer, rowIdx, colIdx);
                if (restScore > score) {
                    score = restScore;
                }
            }
            score += 0.001 * restScore;
        }
    }
    return score;
};

function wasWinningMove(board, rowIdx, colIdx) {
    return ((
        // Check row
        board[rowIdx][0] === board[rowIdx][1] 
        && board[rowIdx][1] === board[rowIdx][2]
    ) || (
        // Check column
        board[0][colIdx] === board[1][colIdx]
        && board[1][colIdx] === board[2][colIdx]
    ) || (
        // Check diagonals
        board[1][1] !== " " && (
            (
                board[0][0] === board[1][1]
                && board[1][1] === board[2][2]
            ) || (
                board[0][2] === board[1][1]
                && board[1][1] === board[2][0]
            )
        )
    ));
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
            // Statically generate the HTML string for the counter
            ticTacToe();
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

    ticTacToe(createWebUi);
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

