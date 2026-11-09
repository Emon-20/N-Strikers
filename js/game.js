/* ═══════════════════════════════════════════════════════════════════════════════
   GUTI STRATEGY BOARD GAMES — CORE GAME ENGINE
   Universal game rules engine for Level 1 (12 Guti) and Level 2 (16 Guti)
   ═══════════════════════════════════════════════════════════════════════════════ */

const GameEngine = (() => {
    let currentLevel = GutiGames.LEVEL_12;
    let boardState = [];
    let currentPlayer = GutiGames.PLAYER_1;
    let turnCount = 1;
    let capturedBy = { 1: 0, 2: 0 };
    let moveHistory = [];
    let chainJumpPiece = null;
    let gameOver = false;
    let winner = null;
    let gameMode = 'pvp'; // 'pvp' or 'ai'

    function init(levelId = '12_guti', mode = 'pvp') {
        currentLevel = GutiGames.getLevel(levelId);
        boardState = [...currentLevel.initialState];
        currentPlayer = GutiGames.PLAYER_1;
        turnCount = 1;
        capturedBy = { 1: 0, 2: 0 };
        moveHistory = [];
        chainJumpPiece = null;
        gameOver = false;
        winner = null;
        gameMode = mode || 'pvp';
    }

    function getLevel() {
        return currentLevel;
    }

    function getState() {
        return [...boardState];
    }

    function getCurrentPlayer() {
        return currentPlayer;
    }

    function getTurnCount() {
        return turnCount;
    }

    function getCapturedBy(player) {
        return capturedBy[player] || 0;
    }

    function isGameOver() {
        return gameOver;
    }

    function getWinner() {
        return winner;
    }

    function getGameMode() {
        return gameMode;
    }

    function getChainJumpPiece() {
        return chainJumpPiece;
    }

    function countPieces(player) {
        let count = 0;
        for (let i = 0; i < currentLevel.totalNodes; i++) {
            if (boardState[i] === player) count++;
        }
        return count;
    }

    /**
     * Get all simple (non-capture) adjacent moves for a piece at nodeIdx.
     */
    function getSimpleMoves(nodeIdx) {
        if (boardState[nodeIdx] === GutiGames.EMPTY) return [];
        if (chainJumpPiece !== null) return []; // In chain jump, only further captures are valid

        const moves = [];
        const neighbors = currentLevel.adjacency[nodeIdx] || [];
        for (const neighbor of neighbors) {
            if (boardState[neighbor] === GutiGames.EMPTY) {
                moves.push(neighbor);
            }
        }
        return moves;
    }

    /**
     * Get all capture jump moves for a piece at nodeIdx.
     */
    function getCaptureMoves(nodeIdx) {
        if (boardState[nodeIdx] === GutiGames.EMPTY) return [];

        const player = boardState[nodeIdx];
        const opponent = player === GutiGames.PLAYER_1 ? GutiGames.PLAYER_2 : GutiGames.PLAYER_1;
        const captures = [];

        const neighbors = currentLevel.adjacency[nodeIdx] || [];
        for (const neighbor of neighbors) {
            if (boardState[neighbor] === opponent) {
                const landing = currentLevel.jumpMap[nodeIdx]?.[neighbor];
                if (landing !== undefined && boardState[landing] === GutiGames.EMPTY) {
                    captures.push({ over: neighbor, to: landing });
                }
            }
        }
        return captures;
    }

    /**
     * Get all legal moves for a piece at nodeIdx for the current player.
     */
    function getValidMoves(nodeIdx) {
        if (gameOver) return { simple: [], captures: [] };
        if (boardState[nodeIdx] !== currentPlayer) return { simple: [], captures: [] };

        // If in chain jump mode, only the active jumping piece can move and only captures
        if (chainJumpPiece !== null) {
            if (nodeIdx !== chainJumpPiece) return { simple: [], captures: [] };
            return { simple: [], captures: getCaptureMoves(nodeIdx) };
        }

        const simple = getSimpleMoves(nodeIdx);
        const captures = getCaptureMoves(nodeIdx);

        return { simple, captures };
    }

    /**
     * Check if a player has any legal moves anywhere on the board.
     */
    function hasLegalMoves(player) {
        const opponent = player === GutiGames.PLAYER_1 ? GutiGames.PLAYER_2 : GutiGames.PLAYER_1;

        for (let i = 0; i < currentLevel.totalNodes; i++) {
            if (boardState[i] !== player) continue;

            const neighbors = currentLevel.adjacency[i] || [];
            for (const neighbor of neighbors) {
                // Check simple step
                if (boardState[neighbor] === GutiGames.EMPTY) return true;

                // Check jump capture
                if (boardState[neighbor] === opponent) {
                    const landing = currentLevel.jumpMap[i]?.[neighbor];
                    if (landing !== undefined && boardState[landing] === GutiGames.EMPTY) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    /**
     * Execute a move from node to node.
     */
    function executeMove(fromNode, toNode) {
        if (gameOver) return null;
        if (boardState[fromNode] !== currentPlayer) return null;

        const moves = getValidMoves(fromNode);

        // Check capture jump
        const captureMove = moves.captures.find(c => c.to === toNode);
        if (captureMove) {
            return executeCaptureMove(fromNode, captureMove);
        }

        // Check standard simple move
        if (moves.simple.includes(toNode)) {
            return executeSimpleMove(fromNode, toNode);
        }

        return null;
    }

    function executeSimpleMove(from, to) {
        const historyEntry = {
            type: 'simple',
            from,
            to,
            player: currentPlayer,
            turnCount
        };

        boardState[to] = boardState[from];
        boardState[from] = GutiGames.EMPTY;

        moveHistory.push(historyEntry);
        endTurn();

        return {
            type: 'simple',
            from,
            to,
            captured: null,
            chainContinues: false,
            gameOver,
            winner
        };
    }

    function executeCaptureMove(from, captureInfo) {
        const { over, to } = captureInfo;

        const historyEntry = {
            type: 'capture',
            from,
            to,
            over,
            player: currentPlayer,
            turnCount,
            chainStart: chainJumpPiece === null
        };

        boardState[to] = boardState[from];
        boardState[from] = GutiGames.EMPTY;
        boardState[over] = GutiGames.EMPTY;
        capturedBy[currentPlayer] = (capturedBy[currentPlayer] || 0) + 1;

        moveHistory.push(historyEntry);

        // Check if the same piece can continue jumping
        const furtherCaptures = getCaptureMoves(to);
        if (furtherCaptures.length > 0) {
            chainJumpPiece = to;
            checkWinCondition();
            return {
                type: 'capture',
                from,
                to,
                captured: over,
                chainContinues: true,
                gameOver,
                winner
            };
        }

        chainJumpPiece = null;
        endTurn();

        return {
            type: 'capture',
            from,
            to,
            captured: over,
            chainContinues: false,
            gameOver,
            winner
        };
    }

    function endChainJump() {
        if (chainJumpPiece === null) return;
        chainJumpPiece = null;
        endTurn();
    }

    function endTurn() {
        chainJumpPiece = null;
        currentPlayer = currentPlayer === GutiGames.PLAYER_1 ? GutiGames.PLAYER_2 : GutiGames.PLAYER_1;
        turnCount++;
        checkWinCondition();
    }

    function checkWinCondition() {
        const p1Pieces = countPieces(GutiGames.PLAYER_1);
        const p2Pieces = countPieces(GutiGames.PLAYER_2);

        // 1. All opponent pieces captured
        if (p1Pieces === 0) {
            gameOver = true;
            winner = GutiGames.PLAYER_2;
            return;
        }

        if (p2Pieces === 0) {
            gameOver = true;
            winner = GutiGames.PLAYER_1;
            return;
        }

        // 2. Trapped / completely blocked (no legal moves remaining)
        if (!hasLegalMoves(currentPlayer)) {
            gameOver = true;
            // The trapped player with no moves loses
            winner = currentPlayer === GutiGames.PLAYER_1 ? GutiGames.PLAYER_2 : GutiGames.PLAYER_1;
        }
    }

    function undo() {
        if (moveHistory.length === 0) return false;
        if (gameOver) {
            gameOver = false;
            winner = null;
        }

        const lastTurn = moveHistory[moveHistory.length - 1].turnCount;
        const lastPlayer = moveHistory[moveHistory.length - 1].player;

        while (moveHistory.length > 0) {
            const last = moveHistory[moveHistory.length - 1];
            if (last.turnCount !== lastTurn || last.player !== lastPlayer) break;

            moveHistory.pop();

            if (last.type === 'simple') {
                boardState[last.from] = last.player;
                boardState[last.to] = GutiGames.EMPTY;
            } else if (last.type === 'capture') {
                const opponent = last.player === GutiGames.PLAYER_1 ? GutiGames.PLAYER_2 : GutiGames.PLAYER_1;
                boardState[last.from] = last.player;
                boardState[last.to] = GutiGames.EMPTY;
                boardState[last.over] = opponent;
                capturedBy[last.player] = Math.max(0, (capturedBy[last.player] || 1) - 1);
            }
        }

        currentPlayer = lastPlayer;
        turnCount = lastTurn;
        chainJumpPiece = null;

        return true;
    }

    function snapshot() {
        return {
            levelId: currentLevel.id,
            boardState: [...boardState],
            currentPlayer,
            turnCount,
            capturedBy: { ...capturedBy },
            chainJumpPiece,
            gameOver,
            winner
        };
    }

    function restore(snap) {
        currentLevel = GutiGames.getLevel(snap.levelId);
        boardState = [...snap.boardState];
        currentPlayer = snap.currentPlayer;
        turnCount = snap.turnCount;
        capturedBy = { ...snap.capturedBy };
        chainJumpPiece = snap.chainJumpPiece;
        gameOver = snap.gameOver;
        winner = snap.winner;
    }

    return {
        init,
        getLevel,
        getState,
        getCurrentPlayer,
        getTurnCount,
        getCapturedBy,
        isGameOver,
        getWinner,
        getGameMode,
        getChainJumpPiece,
        getValidMoves,
        getSimpleMoves,
        getCaptureMoves,
        hasLegalMoves,
        countPieces,
        executeMove,
        endChainJump,
        undo,
        snapshot,
        restore
    };
})();
