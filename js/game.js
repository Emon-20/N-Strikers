/* ═══════════════════════════════════════════════════════
   SHOLO GUTI — GAME LOGIC ENGINE
   Core game state, move validation, capture logic
   ═══════════════════════════════════════════════════════ */

const GameEngine = (() => {
    let boardState = [];
    let currentPlayer = SholoGuti.PLAYER_1;
    let turnCount = 1;
    let capturedBy = { 1: 0, 2: 0 }; // captures made BY each player
    let moveHistory = [];
    let chainJumpPiece = null; // node index of piece doing chain jump
    let gameOver = false;
    let winner = null;
    let gameMode = 'pvp'; // 'pvp' or 'ai'

    function init(mode) {
        boardState = [...SholoGuti.INITIAL_STATE];
        currentPlayer = SholoGuti.PLAYER_1;
        turnCount = 1;
        capturedBy = { 1: 0, 2: 0 };
        moveHistory = [];
        chainJumpPiece = null;
        gameOver = false;
        winner = null;
        gameMode = mode || 'pvp';
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
        return capturedBy[player];
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

    /**
     * Get all simple (non-capture) moves for a piece at nodeIdx.
     * Returns array of destination node indices.
     */
    function getSimpleMoves(nodeIdx) {
        if (boardState[nodeIdx] === SholoGuti.EMPTY) return [];
        if (chainJumpPiece !== null) return []; // During chain jump, no simple moves

        const moves = [];
        for (const neighbor of SholoGuti.ADJACENCY[nodeIdx]) {
            if (boardState[neighbor] === SholoGuti.EMPTY) {
                moves.push(neighbor);
            }
        }
        return moves;
    }

    /**
     * Get all capture (jump) moves for a piece at nodeIdx.
     * Returns array of { over: nodeIdx, to: nodeIdx }.
     */
    function getCaptureMoves(nodeIdx) {
        if (boardState[nodeIdx] === SholoGuti.EMPTY) return [];

        const player = boardState[nodeIdx];
        const opponent = player === SholoGuti.PLAYER_1 ? SholoGuti.PLAYER_2 : SholoGuti.PLAYER_1;
        const captures = [];

        for (const neighbor of SholoGuti.ADJACENCY[nodeIdx]) {
            if (boardState[neighbor] === opponent) {
                // Check if there's a landing spot beyond
                const landing = SholoGuti.JUMP_MAP[nodeIdx]?.[neighbor];
                if (landing !== undefined && boardState[landing] === SholoGuti.EMPTY) {
                    captures.push({ over: neighbor, to: landing });
                }
            }
        }
        return captures;
    }

    /**
     * Get all valid moves for a piece at nodeIdx.
     * If in chain jump mode, only capture moves for the chain piece.
     */
    function getValidMoves(nodeIdx) {
        if (gameOver) return { simple: [], captures: [] };
        if (boardState[nodeIdx] !== currentPlayer) return { simple: [], captures: [] };

        // During chain jump, only the chain piece can move, and only captures
        if (chainJumpPiece !== null) {
            if (nodeIdx !== chainJumpPiece) return { simple: [], captures: [] };
            return { simple: [], captures: getCaptureMoves(nodeIdx) };
        }

        // Check if any piece of current player has a capture available
        // (Forced capture rule is optional — we'll make captures preferred but not forced)
        const simple = getSimpleMoves(nodeIdx);
        const captures = getCaptureMoves(nodeIdx);

        return { simple, captures };
    }

    /**
     * Check if a player has any legal moves.
     */
    function hasLegalMoves(player) {
        for (let i = 0; i < SholoGuti.TOTAL_NODES; i++) {
            if (boardState[i] !== player) continue;

            // Check simple moves
            for (const neighbor of SholoGuti.ADJACENCY[i]) {
                if (boardState[neighbor] === SholoGuti.EMPTY) return true;
            }

            // Check captures
            const opponent = player === SholoGuti.PLAYER_1 ? SholoGuti.PLAYER_2 : SholoGuti.PLAYER_1;
            for (const neighbor of SholoGuti.ADJACENCY[i]) {
                if (boardState[neighbor] === opponent) {
                    const landing = SholoGuti.JUMP_MAP[i]?.[neighbor];
                    if (landing !== undefined && boardState[landing] === SholoGuti.EMPTY) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    /**
     * Count pieces for a player.
     */
    function countPieces(player) {
        return boardState.filter(n => n === player).length;
    }

    /**
     * Execute a move. Returns a move result object.
     */
    function executeMove(fromNode, toNode) {
        if (gameOver) return null;
        if (boardState[fromNode] !== currentPlayer) return null;

        const moves = getValidMoves(fromNode);

        // Check capture moves
        const captureMove = moves.captures.find(c => c.to === toNode);
        if (captureMove) {
            return executeCaptureMove(fromNode, captureMove);
        }

        // Check simple moves
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
        boardState[from] = SholoGuti.EMPTY;

        moveHistory.push(historyEntry);
        endTurn();

        return {
            type: 'simple',
            from,
            to,
            captured: null,
            chainContinues: false,
            gameOver: gameOver,
            winner: winner
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
        boardState[from] = SholoGuti.EMPTY;
        boardState[over] = SholoGuti.EMPTY;
        capturedBy[currentPlayer]++;

        moveHistory.push(historyEntry);

        // Check for chain jumps
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
                gameOver: gameOver,
                winner: winner
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
            gameOver: gameOver,
            winner: winner
        };
    }

    /**
     * End chain jump early (player chooses to stop).
     */
    function endChainJump() {
        if (chainJumpPiece === null) return;
        chainJumpPiece = null;
        endTurn();
    }

    function endTurn() {
        chainJumpPiece = null;
        currentPlayer = currentPlayer === SholoGuti.PLAYER_1 ? SholoGuti.PLAYER_2 : SholoGuti.PLAYER_1;
        turnCount++;
        checkWinCondition();
    }

    function checkWinCondition() {
        // Check if opponent has no pieces
        const opponent = currentPlayer === SholoGuti.PLAYER_1 ? SholoGuti.PLAYER_2 : SholoGuti.PLAYER_1;

        if (countPieces(SholoGuti.PLAYER_1) === 0) {
            gameOver = true;
            winner = SholoGuti.PLAYER_2;
            return;
        }

        if (countPieces(SholoGuti.PLAYER_2) === 0) {
            gameOver = true;
            winner = SholoGuti.PLAYER_1;
            return;
        }

        // Check if current player (after turn switch) has no legal moves
        if (!hasLegalMoves(currentPlayer)) {
            gameOver = true;
            // The player who CAN'T move loses
            winner = currentPlayer === SholoGuti.PLAYER_1 ? SholoGuti.PLAYER_2 : SholoGuti.PLAYER_1;
        }
    }

    /**
     * Undo the last move (or chain of captures in the same turn).
     */
    function undo() {
        if (moveHistory.length === 0) return false;
        if (gameOver) {
            gameOver = false;
            winner = null;
        }

        // Undo all moves in the current chain
        const lastTurn = moveHistory[moveHistory.length - 1].turnCount;
        const lastPlayer = moveHistory[moveHistory.length - 1].player;

        while (moveHistory.length > 0) {
            const last = moveHistory[moveHistory.length - 1];

            // Only undo moves from the same turn
            if (last.turnCount !== lastTurn || last.player !== lastPlayer) break;

            moveHistory.pop();

            if (last.type === 'simple') {
                boardState[last.from] = last.player;
                boardState[last.to] = SholoGuti.EMPTY;
            } else if (last.type === 'capture') {
                const opponent = last.player === SholoGuti.PLAYER_1 ? SholoGuti.PLAYER_2 : SholoGuti.PLAYER_1;
                boardState[last.from] = last.player;
                boardState[last.to] = SholoGuti.EMPTY;
                boardState[last.over] = opponent;
                capturedBy[last.player]--;
            }
        }

        currentPlayer = lastPlayer;
        turnCount = lastTurn;
        chainJumpPiece = null;

        return true;
    }

    /**
     * Create a snapshot of the game state for AI evaluation.
     */
    function snapshot() {
        return {
            boardState: [...boardState],
            currentPlayer,
            capturedBy: { ...capturedBy },
            chainJumpPiece,
            gameOver,
            winner
        };
    }

    /**
     * Restore from a snapshot.
     */
    function restore(snap) {
        boardState = [...snap.boardState];
        currentPlayer = snap.currentPlayer;
        capturedBy = { ...snap.capturedBy };
        chainJumpPiece = snap.chainJumpPiece;
        gameOver = snap.gameOver;
        winner = snap.winner;
    }

    return {
        init,
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
