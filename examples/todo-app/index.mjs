import {beginExec} from "/grugui.mjs";

const todos = [];
for (let i = 1; i <= 100; i++) {
    todos.push(`Todo ${i}`);
}
let isFirst = true;
let even = true;

function main() {
    update();
}

function update() {
    const render = () => {
        html.main({static: true}, () => {
            html.h1({static: true}, () => html.trustedText("TODOs"));
            html.ol({static: true, style: "max-height:600px; overflow-y:scroll"}, () => {
                for (let i = 0; i < todos.length; i++) {
                    renderTodoListItem(i);
                }
            });
        });
    };

    const renderTodoListItem = (i) => {
        html.li(() => {
            html.div(() => {
                if (i > 0) {
                    renderMoveUpBtn(i);
                }
            });
            html.div(() => {
                html.p(() => {
                    html.trustedText(todos[i]);
                });
            });
            html.div(() => {
                if (i < todos.length - 1) {
                    renderMoveDownBtn(i);
                }
            });
        });
    };

    const renderMoveUpBtn = (i) => {
        html.button({
            onClick: () => {
                const tmp = todos[i];
                todos[i] = todos[i - 1];
                todos[i - 1] = tmp;
                update();
            },
        }, () => html.trustedText("^"));
    };

    const renderMoveDownBtn = (i) => {
        html.button({
            onClick: () => {
                const tmp = todos[i];
                todos[i] = todos[i + 1];
                todos[i + 1] = tmp;
                update();
            },
        }, () => html.trustedText("v"));
    };

    const {html, end} = beginExec("domGen");
        render();
    end();

    if (isFirst) {
        const appEl = html.getDomNode();
        document.getElementById("app").replaceWith(appEl);
        isFirst = false;
    }
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

