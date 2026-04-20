let boardSize = 3;
let board = [];
let currentPlayer = 'X';
let gameMode = 'pvp';
let aiDifficulty = 'hard';
let gameOver = false;
let moveHistory = [];
let timerInterval = null;
let gameTime = 0;
let lastMoveTime = 0;
const UNDO_TIME_LIMIT = 10000; // 10秒悔棋时间限制

const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');
const boardElement = document.getElementById('game-board');
const startBtn = document.getElementById('start-btn');
const currentPlayerElement = document.getElementById('current-player');
const gameResultElement = document.getElementById('game-result');
const resetBtn = document.getElementById('reset-btn');
const exitBtn = document.getElementById('exit-btn');
const undoBtn = document.getElementById('undo-btn');
const undoTimerElement = document.getElementById('undo-timer');
const timerElement = document.getElementById('timer');
const moveHistoryElement = document.getElementById('move-history');

startBtn.addEventListener('click', startGame);
resetBtn.addEventListener('click', resetGame);
exitBtn.addEventListener('click', exitGame);
undoBtn.addEventListener('click', undoMove);

/* ================= 启动 ================= */

function startGame() {
    boardSize = parseInt(document.getElementById('board-size').value);
    gameMode = document.getElementById('game-mode').value;
    aiDifficulty = document.getElementById('ai-level').value;
    currentPlayer = document.getElementById('first-player').value;

    board = [];
    gameOver = false;
    moveHistory = [];
    gameTime = 0;
    lastMoveTime = 0;
    gameResultElement.innerText = '';

    startScreen.style.display = 'none';
    gameScreen.style.display = 'flex';

    createBoard();
    updateStatus();
    updateHistory();
    startTimer();

    if (gameMode === 'ai' && currentPlayer === 'O') {
        setTimeout(aiMove, 150);
    }
}

/* ================= 棋盘 ================= */

function createBoard() {
    board = [];
    boardElement.innerHTML = '';
    boardElement.style.gridTemplateColumns =
        `repeat(${boardSize}, 60px)`;

    for (let i = 0; i < boardSize * boardSize; i++) {
        const cell = document.createElement('div');
        cell.className = 'board-cell';
        cell.dataset.index = i;
        cell.onclick = handleClick;

        boardElement.appendChild(cell);
        board.push(null);
    }
}

/* ================= 玩家操作 ================= */

function handleClick(e) {
    if (gameOver) return;

    const i = e.target.dataset.index;
    if (board[i]) return;

    board[i] = currentPlayer;
    e.target.innerText = currentPlayer;
    e.target.classList.add("placed");

    // 记录移动
    const row = Math.floor(i / boardSize) + 1;
    const col = (i % boardSize) + 1;
    moveHistory.push({ player: currentPlayer, position: [row, col], index: i });
    lastMoveTime = Date.now();
    updateHistory();

    setTimeout(() => {
        e.target.classList.remove("placed");
    }, 200);
    const result = checkWinner(board);

    if (result) return endGame(result);
    if (board.every(v => v !== null)) return endGame(null);

    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    updateStatus();

    if (gameMode === 'ai' && currentPlayer === 'O') {
        setTimeout(aiMove, 150);
    }
}

/* ================= 状态 ================= */

function updateStatus() {
    currentPlayerElement.innerText =
        `当前玩家：${currentPlayer === 'X' ? '黑棋' : '白棋'}`;
}

function resetGame() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    undoTimerElement.innerText = '';
    gameScreen.style.display = 'none';
    startScreen.style.display = 'flex';
}

function exitGame() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    undoTimerElement.innerText = '';
    gameScreen.style.display = 'none';
    startScreen.style.display = 'flex';
}

/* ================= 计时器 ================= */

function startTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    gameTime = 0;
    timerElement.innerText = `时间：0s`;
    timerInterval = setInterval(() => {
        gameTime++;
        timerElement.innerText = `时间：${gameTime}s`;
        updateUndoTimer();
    }, 1000);
}

function updateUndoTimer() {
    if (moveHistory.length === 0) {
        undoTimerElement.innerText = '';
        return;
    }
    const elapsed = Date.now() - lastMoveTime;
    const remaining = Math.max(0, UNDO_TIME_LIMIT - elapsed);
    const seconds = Math.ceil(remaining / 1000);
    undoTimerElement.innerText = `${seconds}s`;
    if (seconds <= 3) {
        undoTimerElement.classList.add('warning');
    } else {
        undoTimerElement.classList.remove('warning');
    }
}

/* ================= 历史记录 ================= */

function updateHistory() {
    moveHistoryElement.innerHTML = '';
    moveHistory.forEach((move, index) => {
        const li = document.createElement('li');
        li.innerText = `第${index + 1}步: ${move.player === 'X' ? '黑棋' : '白棋'} 在 (${move.position[0]}, ${move.position[1]})`;
        moveHistoryElement.appendChild(li);
    });
}

/* ================= 悔棋 ================= */

function undoMove() {
    if (gameOver) return;
    
    // 检查是否在悔棋时间限制内
    if (Date.now() - lastMoveTime > UNDO_TIME_LIMIT) {
        alert('悔棋时间已过（超过10秒）');
        return;
    }
    
    // 检查是否有可悔的棋
    if (moveHistory.length === 0) {
        alert('没有可悔的棋');
        return;
    }
    
    // 人机对战时，只能悔玩家自己的棋子
    if (gameMode === 'ai') {
        // 找到最后一个玩家的棋子
        let lastPlayerMoveIndex = -1;
        for (let i = moveHistory.length - 1; i >= 0; i--) {
            if (moveHistory[i].player === 'X') {
                lastPlayerMoveIndex = i;
                break;
            }
        }
        
        if (lastPlayerMoveIndex === -1) {
            alert('没有可悔的玩家棋子');
            return;
        }
        
        // 移除从最后一个玩家棋子开始的所有移动
        while (moveHistory.length > lastPlayerMoveIndex) {
            const move = moveHistory.pop();
            board[move.index] = null;
            boardElement.children[move.index].innerText = '';
        }
        
        // 重置游戏状态
        gameOver = false;
        currentPlayer = 'X';
        updateStatus();
        updateHistory();
    } else {
        // 玩家对战时，可以悔最后一步
        const move = moveHistory.pop();
        board[move.index] = null;
        boardElement.children[move.index].innerText = '';
        
        // 重置游戏状态
        gameOver = false;
        currentPlayer = move.player; // 回到上一个玩家的回合
        updateStatus();
        updateHistory();
    }
}

/* ================= 胜利 ================= */

function endGame(result) {
    gameOver = true;
    
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    undoTimerElement.innerText = '';

    if (result && result.winner) {
        gameResultElement.innerText =
            `${result.winner === 'X' ? '黑棋' : '白棋'} 获胜！`;

        highlight(result.line);
    } else {
        gameResultElement.innerText = "平局！";
    }
}

function highlight(line) {
    line.forEach(i => {
        boardElement.children[i].classList.add('win-cell');
    });
}

/* ================= AI入口 ================= */

function aiMove() {
    if (gameOver) return;

    let move;

    if (aiDifficulty === 'easy') {
        console.time("简单AI耗时");
        move = randomMove();
        console.timeEnd("简单AI耗时");
    } else if (aiDifficulty === 'medium') {
        console.time("中等AI耗时");
        move = shallowMove(board, 2);
        console.timeEnd("中等AI耗时");
    } else {
        console.time("困难AI耗时");
        move = bestMove(board);
        console.timeEnd("困难AI耗时");
    }

    board[move] = 'O';
    boardElement.children[move].innerText = 'O';

    // 记录移动
    const row = Math.floor(move / boardSize) + 1;
    const col = (move % boardSize) + 1;
    moveHistory.push({ player: 'O', position: [row, col], index: move });
    lastMoveTime = Date.now();
    updateHistory();

    const result = checkWinner(board);
    if (result) return endGame(result);
    if (board.every(v => v !== null)) return endGame(null);

    currentPlayer = 'X';
    updateStatus();
}

/* ================= AI策略 ================= */

function randomMove() {
    const empty = [];
    board.forEach((v, i) => {
        if (!v) empty.push(i);
    });
    return empty[Math.floor(Math.random() * empty.length)];
}

function shallowMove(state, depthLimit) {
    let best = -Infinity;
    let move = -1;

    for (let i = 0; i < state.length; i++) {
        if (!state[i]) {
            state[i] = 'O';
            const score = minimax(state, 0, false, -Infinity, Infinity, depthLimit);
            state[i] = null;

            if (score > best) {
                best = score;
                move = i;
            }
        }
    }
    return move;
}

function bestMove(state) {
    let best = -Infinity;
    let move = -1;

    for (let i = 0; i < state.length; i++) {
        if (!state[i]) {
            state[i] = 'O';
            const score = minimax(state, 0, false, -Infinity, Infinity, 3);
            state[i] = null;

            if (score > best) {
                best = score;
                move = i;
            }
        }
    }
    return move;
}

/* ================= Minimax ================= */

function minimax(state, depth, isMax, alpha, beta, limit) {

    const result = checkWinner(state);

    if (result?.winner === 'O') return 10000 - depth;
    if (result?.winner === 'X') return depth - 10000;

    if (state.every(v => v !== null)) return 0;
    if (depth >= limit) return evaluate(state);

    if (isMax) {
        let best = -Infinity;

        for (let i = 0; i < state.length; i++) {
            if (!state[i]) {
                state[i] = 'O';
                best = Math.max(best,
                    minimax(state, depth + 1, false, alpha, beta, limit));
                state[i] = null;

                alpha = Math.max(alpha, best);
                if (beta <= alpha) break;
            }
        }
        return best;
    } else {
        let best = Infinity;

        for (let i = 0; i < state.length; i++) {
            if (!state[i]) {
                state[i] = 'X';
                best = Math.min(best,
                    minimax(state, depth + 1, true, alpha, beta, limit));
                state[i] = null;

                beta = Math.min(beta, best);
                if (beta <= alpha) break;
            }
        }
        return best;
    }
}

/* ================= 评估函数 ================= */

function evaluate(state) {
    const lines = getLines(state);
    let score = 0;

    for (let l of lines) {
        const o = l.filter(v => v === 'O').length;
        const x = l.filter(v => v === 'X').length;

        if (o && x) continue;

        if (o) score += Math.pow(10, o);
        if (x) score -= Math.pow(12, x);
    }

    return score;
}

/* ================= 胜负判断 ================= */

function checkWinner(state) {
    const n = boardSize;

    const same = (arr) =>
        arr[0] && arr.every(v => v === arr[0]);

    for (let i = 0; i < n; i++) {
        const row = state.slice(i * n, i * n + n);
        if (same(row)) return { winner: row[0], line: rowLine(i) };

        const col = [];
        for (let j = 0; j < n; j++) {
            col.push(state[j * n + i]);
        }
        if (same(col)) return { winner: col[0], line: colLine(i) };
    }

    const d1 = [], d2 = [];

    for (let i = 0; i < n; i++) {
        d1.push(state[i * n + i]);
        d2.push(state[i * n + (n - i - 1)]);
    }

    if (same(d1)) return { winner: d1[0], line: diag1Line() };
    if (same(d2)) return { winner: d2[0], line: diag2Line() };

    return null;
}

/* ================= 线生成 ================= */

function rowLine(r) {
    return Array.from({ length: boardSize }, (_, i) => r * boardSize + i);
}

function colLine(c) {
    return Array.from({ length: boardSize }, (_, i) => i * boardSize + c);
}

function diag1Line() {
    return Array.from({ length: boardSize }, (_, i) => i * boardSize + i);
}

function diag2Line() {
    return Array.from({ length: boardSize }, (_, i) =>
        i * boardSize + (boardSize - i - 1));
}

/* ================= 所有线 ================= */

function getLines(state) {
    const n = boardSize;
    const lines = [];

    for (let i = 0; i < n; i++) {
        lines.push(state.slice(i * n, i * n + n));

        const col = [];
        for (let j = 0; j < n; j++) {
            col.push(state[j * n + i]);
        }
        lines.push(col);
    }

    const d1 = [], d2 = [];

    for (let i = 0; i < n; i++) {
        d1.push(state[i * n + i]);
        d2.push(state[i * n + (n - i - 1)]);
    }

    lines.push(d1, d2);

    return lines;
}
