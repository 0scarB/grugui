import {beginExec} from "/grugui.mjs";

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

function main() {
    let appEl = document.getElementById("app");

    const update = () => {
        if (state.status === "inPlay" && state.nextPlayer === state.aiPlayer) {
            makeAiMove();
        }

        const newAppEl = createAppEl(update);
        appEl.replaceWith(newAppEl);
        appEl = newAppEl;
    };

    update();
}

function createAppEl(update) {
    const render = () => {
        html.main(() => {
            if (state.status === "startScreen") {
                renderStartScreen();
            } else {
                renderBoard();
                renderStatus();
                if (state.status !== "inPlay") {
                    renderNewGameBtn();
                }
            }
        });
    };

    const renderStartScreen = () => {
        // Start Player Selection
        html.beginFieldset();
            html.legend(() => html.trustedText("Start Player: "));
            html.input({
                type: "radio", 
                id: "X", 
                checked: state.nextPlayer === "X",
                onClick: () => {
                    state.nextPlayer = "X";
                    update();
                },
            });
            html.label({for: "X"}, () => html.trustedText("X"));
            html.input({
                type: "radio", 
                id: "O", 
                checked: state.nextPlayer === "O",
                onClick: () => {
                    state.nextPlayer = "O";
                    update();
                },
            });
            html.label({for: "O"}, () => html.trustedText("O"));
        end();

        // AI Player Selection
        html.beginFieldset();
            html.legend(() => html.trustedText("AI Player: "));
            html.input({
                type: "radio", 
                id: "None", 
                checked: !state.aiPlayer,
                onClick: () => {
                    state.aiPlayer = "None";
                    update();
                },
            });
            html.label({for: "None"}, () => html.trustedText("None"));
            html.input({
                type: "radio", 
                id: "X", 
                checked: state.aiPlayer === "X",
                onClick: () => {
                    state.aiPlayer = "X";
                    update();
                },
            });
            html.label({for: "X"}, () => html.trustedText("X"));
            html.input({
                type: "radio", 
                id: "O", 
                checked: state.aiPlayer === "O",
                onClick: () => {
                    state.aiPlayer = "O";
                    update();
                },
            });
            html.label({for: "O"}, () => html.trustedText("O"));
        end();

        // Start Game Button
        html.button({
            onClick: () => {
                state.status = "inPlay";
                update();
            },
        }, () => html.trustedText("Start Game"));
    };

    const renderBoard = () => {
        html.beginDiv();
            for (let rowIdx = 0; rowIdx < 3; rowIdx++) {
                const row = state.currentBoard[rowIdx];
                html.beginDiv();
                    for (let colIdx = 0; colIdx < 3; colIdx++) {
                        const cell = row[colIdx];
                        html.beginButton({
                            onClick: () => {
                                if (state.status !== "inPlay" 
                                    || state.currentBoard[rowIdx][colIdx] !== " ") {
                                    return;
                                }
                                makeMove(rowIdx, colIdx);
                                update();
                            },
                        });
                            html.beginCode();
                                if (cell === " ") {
                                    html.unsafeInnerHtml("&nbsp;");
                                } else {
                                    html.trustedText(cell);
                                }
                            end();
                        end();
                    }
                end();
            }
        end();
    };

    const renderStatus = () => {
        html.div(() => {
            switch (state.status) {
                case "inPlay":
                    if (state.nextPlayer === state.aiPlayer) {
                        html.trustedText(`${state.aiPlayer}'s move (super advanced AI!)`);
                    } else {
                        html.trustedText(`${state.nextPlayer}'s move`);
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
                        html.trustedText(`Evil AI (${state.aiPlayer}) wins :(`);
                    } else {
                        html.trustedText(`${winningPlayer} wins!`);
                    }
                    break;
                case "draw":
                    html.trustedText("Draw.");
                    break;
            }
        });
    };

    const renderNewGameBtn = () => {
        html.button({
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
        }, () => html.trustedText("New Game"));
    };

    const {html, end} = beginExec("domGen");
        render();
    end();

    return html.getDomNode();
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

main();

