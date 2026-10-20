/* ═══════════════════════════════════════════════════════
   SHOLO GUTI — AI OPPONENT
   Intelligent tactical AI with minimax + heuristics
   ═══════════════════════════════════════════════════════ */

const AIPlayer = (() => {
    const AI_PLAYER = SholoGuti.PLAYER_2; // AI plays as Emerald
    const HUMAN_PLAYER = SholoGuti.PLAYER_1;
    const MAX_DEPTH = 4;
    const CHAIN_DEPTH = 6; // Extended search for chain jumps

    // Positional weight: center nodes are more valuable
    const POSITION_WEIGHTS = (() => {
        const w = new Array(SholoGuti.TOTAL_NODES).fill(0);
        const pos = SholoGuti.NODE_POSITIONS;

        for (let i = 0; i < SholoGuti.TOTAL_NODES; i++) {
            // Distance from center (0.5, 0.5)
            const dx = pos[i][0] - 0.5;
            const dy = pos[i][1] - 0.5;
            const dist = Math.sqrt(dx * dx + dy * dy);
            // More central = higher weight (range ~0-5)
            w[i] = Math.max(0, 5 - dist * 10);
        }

        // Boost grid center nodes
        w[13] = 6; // Dead center
        w[12] = 5; w[14] = 5;
        w[8] = 4.5; w[18] = 4.5;
        w[17] = 5; w[19] = 5;

        return w;
    })();

    /**
     * Evaluate a board state from AI's perspective.
     * Positive = good for AI, negative = good for human.
     */
    function evaluate(state, capturedBy, currentPlayer) {
        let aiPieces = 0, humanPieces = 0;
        let aiMobility = 0, humanMobility = 0;
        let aiPosition = 0, humanPosition = 0;
        let aiCaptures = 0, humanCaptures = 0;

        for (let i = 0; i < SholoGuti.TOTAL_NODES; i++) {
            if (state[i] === AI_PLAYER) {
                aiPieces++;
                aiPosition += POSITION_WEIGHTS[i];
                // Count mobility
                for (const n of SholoGuti.ADJACENCY[i]) {
                    if (state[n] === SholoGuti.EMPTY) aiMobility++;
                }
                // Count capture opportunities
                for (const n of SholoGuti.ADJACENCY[i]) {
                    if (state[n] === HUMAN_PLAYER) {
                        const landing = SholoGuti.JUMP_MAP[i]?.[n];
                        if (landing !== undefined && state[landing] === SholoGuti.EMPTY) {
                            aiCaptures++;
                        }
                    }
                }
            } else if (state[i] === HUMAN_PLAYER) {
                humanPieces++;
                humanPosition += POSITION_WEIGHTS[i];
                for (const n of SholoGuti.ADJACENCY[i]) {
                    if (state[n] === SholoGuti.EMPTY) humanMobility++;
                }
                for (const n of SholoGuti.ADJACENCY[i]) {
                    if (state[n] === AI_PLAYER) {
                        const landing = SholoGuti.JUMP_MAP[i]?.[n];
                        if (landing !== undefined && state[landing] === SholoGuti.EMPTY) {
                            humanCaptures++;
                        }
                    }
                }
            }
        }

        // Terminal states
        if (humanPieces === 0) return 10000;
        if (aiPieces === 0) return -10000;

        const pieceDiff = (aiPieces - humanPieces) * 100;
        const mobilityDiff = (aiMobility - humanMobility) * 5;
        const positionDiff = (aiPosition - humanPosition) * 3;
        const captureDiff = (aiCaptures - humanCaptures) * 15;
        const captureCountDiff = ((capturedBy[AI_PLAYER] || 0) - (capturedBy[HUMAN_PLAYER] || 0)) * 20;

        // Vulnerability penalty: avoid positions where opponent can capture
        const vulnerabilityPenalty = humanCaptures * 12;

        return pieceDiff + mobilityDiff + positionDiff + captureDiff + captureCountDiff - vulnerabilityPenalty;
    }

    /**
     * Generate all possible moves for a player in a given state.
     */
    function generateMoves(state, player) {
        const moves = [];
        const opponent = player === SholoGuti.PLAYER_1 ? SholoGuti.PLAYER_2 : SholoGuti.PLAYER_1;

        // First: gather captures (higher priority)
        for (let i = 0; i < SholoGuti.TOTAL_NODES; i++) {
            if (state[i] !== player) continue;

            for (const n of SholoGuti.ADJACENCY[i]) {
                if (state[n] === opponent) {
                    const landing = SholoGuti.JUMP_MAP[i]?.[n];
                    if (landing !== undefined && state[landing] === SholoGuti.EMPTY) {
                        moves.push({ from: i, to: landing, over: n, type: 'capture' });
                    }
                }
            }
        }

        // Then: simple moves
        for (let i = 0; i < SholoGuti.TOTAL_NODES; i++) {
            if (state[i] !== player) continue;

            for (const n of SholoGuti.ADJACENCY[i]) {
                if (state[n] === SholoGuti.EMPTY) {
                    moves.push({ from: i, to: n, type: 'simple' });
                }
            }
        }

        return moves;
    }

    /**
     * Expand chain jumps: given a capture move, find all possible chain continuations.
     * Returns an array of complete move sequences.
     */
    function expandChainCaptures(state, player, fromNode, captureMove) {
        const sequences = [];

        function recurse(currentState, pieceNode, sequence) {
            const opponent = player === SholoGuti.PLAYER_1 ? SholoGuti.PLAYER_2 : SholoGuti.PLAYER_1;
            let foundMore = false;

            for (const n of SholoGuti.ADJACENCY[pieceNode]) {
                if (currentState[n] === opponent) {
                    const landing = SholoGuti.JUMP_MAP[pieceNode]?.[n];
                    if (landing !== undefined && currentState[landing] === SholoGuti.EMPTY) {
                        foundMore = true;
                        const newState = [...currentState];
                        newState[landing] = newState[pieceNode];
                        newState[pieceNode] = SholoGuti.EMPTY;
                        newState[n] = SholoGuti.EMPTY;
                        recurse(newState, landing, [...sequence, { from: pieceNode, to: landing, over: n }]);
                    }
                }
            }

            if (!foundMore && sequence.length > 0) {
                sequences.push(sequence);
            }
        }

        // Execute initial capture
        const newState = [...state];
        newState[captureMove.to] = newState[captureMove.from];
        newState[captureMove.from] = SholoGuti.EMPTY;
        newState[captureMove.over] = SholoGuti.EMPTY;

        const initial = [{ from: captureMove.from, to: captureMove.to, over: captureMove.over }];

        // Try extending
        recurse(newState, captureMove.to, initial);

        // If no extensions, return just the single capture
        if (sequences.length === 0) {
            sequences.push(initial);
        }

        return sequences;
    }

    /**
     * Minimax with alpha-beta pruning.
     */
    function minimax(state, capturedBy, depth, alpha, beta, maximizing, player) {
        // Terminal checks
        const aiCount = state.filter(n => n === AI_PLAYER).length;
        const humanCount = state.filter(n => n === HUMAN_PLAYER).length;

        if (aiCount === 0) return -10000 + (MAX_DEPTH - depth);
        if (humanCount === 0) return 10000 - (MAX_DEPTH - depth);

        if (depth === 0) {
            return evaluate(state, capturedBy, player);
        }

        const moves = generateMoves(state, player);
        if (moves.length === 0) {
            // Current player has no moves — they lose
            return player === AI_PLAYER ? -10000 + (MAX_DEPTH - depth) : 10000 - (MAX_DEPTH - depth);
        }

        const nextPlayer = player === SholoGuti.PLAYER_1 ? SholoGuti.PLAYER_2 : SholoGuti.PLAYER_1;

        if (maximizing) {
            let maxEval = -Infinity;
            for (const move of moves) {
                const newState = [...state];
                const newCaptured = { ...capturedBy };

                newState[move.to] = newState[move.from];
                newState[move.from] = SholoGuti.EMPTY;

                if (move.type === 'capture') {
                    newState[move.over] = SholoGuti.EMPTY;
                    newCaptured[player] = (newCaptured[player] || 0) + 1;
                }

                const evalScore = minimax(newState, newCaptured, depth - 1, alpha, beta, false, nextPlayer);
                maxEval = Math.max(maxEval, evalScore);
                alpha = Math.max(alpha, evalScore);
                if (beta <= alpha) break;
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            for (const move of moves) {
                const newState = [...state];
                const newCaptured = { ...capturedBy };

                newState[move.to] = newState[move.from];
                newState[move.from] = SholoGuti.EMPTY;

                if (move.type === 'capture') {
                    newState[move.over] = SholoGuti.EMPTY;
                    newCaptured[player] = (newCaptured[player] || 0) + 1;
                }

                const evalScore = minimax(newState, newCaptured, depth - 1, alpha, beta, true, nextPlayer);
                minEval = Math.min(minEval, evalScore);
                beta = Math.min(beta, evalScore);
                if (beta <= alpha) break;
            }
            return minEval;
        }
    }

    /**
     * Choose the best move for the AI.
     * Returns: { moves: [{ from, to, over? }] } — a sequence of moves (chain captures).
     */
    function chooseMove() {
        const state = GameEngine.getState();
        const captured = {
            1: GameEngine.getCapturedBy(1),
            2: GameEngine.getCapturedBy(2)
        };

        const allMoves = generateMoves(state, AI_PLAYER);
        if (allMoves.length === 0) return null;

        // Separate captures and simple moves
        const captures = allMoves.filter(m => m.type === 'capture');
        const simples = allMoves.filter(m => m.type === 'simple');

        let bestScore = -Infinity;
        let bestSequence = null;

        // Evaluate capture sequences (including chains)
        for (const cap of captures) {
            const chains = expandChainCaptures(state, AI_PLAYER, cap.from, cap);

            for (const chain of chains) {
                // Apply entire chain
                const newState = [...state];
                const newCaptured = { ...captured };

                for (const step of chain) {
                    newState[step.to] = newState[step.from];
                    newState[step.from] = SholoGuti.EMPTY;
                    newState[step.over] = SholoGuti.EMPTY;
                    newCaptured[AI_PLAYER]++;
                }

                const score = minimax(newState, newCaptured, MAX_DEPTH - 1, -Infinity, Infinity, false, HUMAN_PLAYER);

                // Bonus for longer chains
                const chainBonus = chain.length * 5;

                if (score + chainBonus > bestScore) {
                    bestScore = score + chainBonus;
                    bestSequence = chain;
                }
            }
        }

        // Evaluate simple moves
        for (const move of simples) {
            const newState = [...state];
            const newCaptured = { ...captured };
            newState[move.to] = newState[move.from];
            newState[move.from] = SholoGuti.EMPTY;

            const score = minimax(newState, newCaptured, MAX_DEPTH - 1, -Infinity, Infinity, false, HUMAN_PLAYER);

            if (score > bestScore) {
                bestScore = score;
                bestSequence = [{ from: move.from, to: move.to }];
            }
        }

        // Add some randomness among equally good moves
        if (bestSequence === null && allMoves.length > 0) {
            const m = allMoves[Math.floor(Math.random() * allMoves.length)];
            bestSequence = [{ from: m.from, to: m.to, over: m.over }];
        }

        return bestSequence;
    }

    /**
     * Choose a move during a chain jump continuation.
     */
    function chooseContinuation() {
        const chainPiece = GameEngine.getChainJumpPiece();
        if (chainPiece === null) return null;

        const captures = GameEngine.getCaptureMoves(chainPiece);
        if (captures.length === 0) return null;

        // Evaluate each capture option
        const state = GameEngine.getState();
        const captured = {
            1: GameEngine.getCapturedBy(1),
            2: GameEngine.getCapturedBy(2)
        };

        let bestScore = -Infinity;
        let bestCapture = captures[0];

        for (const cap of captures) {
            const newState = [...state];
            const newCaptured = { ...captured };

            newState[cap.to] = newState[chainPiece];
            newState[chainPiece] = SholoGuti.EMPTY;
            newState[cap.over] = SholoGuti.EMPTY;
            newCaptured[AI_PLAYER]++;

            const score = evaluate(newState, newCaptured, HUMAN_PLAYER);

            if (score > bestScore) {
                bestScore = score;
                bestCapture = cap;
            }
        }

        return { from: chainPiece, to: bestCapture.to, over: bestCapture.over };
    }

    return {
        chooseMove,
        chooseContinuation,
        AI_PLAYER,
        HUMAN_PLAYER
    };
})();
