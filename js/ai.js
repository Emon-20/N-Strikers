/* ═══════════════════════════════════════════════════════════════════════════════
   GUTI STRATEGY BOARD GAMES — TACTICAL AI OPPONENT
   Minimax with Alpha-Beta pruning, chain jump lookahead, and positional heuristics
   Supports both Level 1 (12 Guti) and Level 2 (16 Guti)
   ═══════════════════════════════════════════════════════════════════════════════ */

const AIPlayer = (() => {
    const AI_PLAYER = GutiGames.PLAYER_2;
    const HUMAN_PLAYER = GutiGames.PLAYER_1;

    let aiDifficulty = 'tactical'; // 'casual', 'tactical', 'master'

    function setDifficulty(diff) {
        if (['casual', 'tactical', 'master'].includes(diff)) {
            aiDifficulty = diff;
        }
    }

    function getDifficulty() {
        return aiDifficulty;
    }

    function getMaxDepth(level) {
        if (aiDifficulty === 'casual') return 2;
        if (aiDifficulty === 'master') {
            return level.id === '12_guti' ? 5 : 4;
        }
        // Tactical (default)
        return level.id === '12_guti' ? 4 : 3;
    }

    /**
     * Evaluate board state from AI's perspective.
     */
    function evaluate(state, level, capturedBy) {
        let aiPieces = 0, humanPieces = 0;
        let aiMobility = 0, humanMobility = 0;
        let aiPosition = 0, humanPosition = 0;
        let aiCaptures = 0, humanCaptures = 0;

        const weights = level.positionWeights;
        const total = level.totalNodes;
        const adj = level.adjacency;
        const jm = level.jumpMap;

        for (let i = 0; i < total; i++) {
            const piece = state[i];
            if (piece === AI_PLAYER) {
                aiPieces++;
                aiPosition += weights[i] || 0;

                const neighbors = adj[i] || [];
                for (const n of neighbors) {
                    if (state[n] === GutiGames.EMPTY) aiMobility++;
                    else if (state[n] === HUMAN_PLAYER) {
                        const landing = jm[i]?.[n];
                        if (landing !== undefined && state[landing] === GutiGames.EMPTY) {
                            aiCaptures++;
                        }
                    }
                }
            } else if (piece === HUMAN_PLAYER) {
                humanPieces++;
                humanPosition += weights[i] || 0;

                const neighbors = adj[i] || [];
                for (const n of neighbors) {
                    if (state[n] === GutiGames.EMPTY) humanMobility++;
                    else if (state[n] === AI_PLAYER) {
                        const landing = jm[i]?.[n];
                        if (landing !== undefined && state[landing] === GutiGames.EMPTY) {
                            humanCaptures++;
                        }
                    }
                }
            }
        }

        // Terminal game outcomes
        if (humanPieces === 0) return 10000;
        if (aiPieces === 0) return -10000;
        if (aiMobility === 0 && aiCaptures === 0) return -9000;
        if (humanMobility === 0 && humanCaptures === 0) return 9000;

        const pieceDiff = (aiPieces - humanPieces) * 110;
        const captureDiff = (aiCaptures - humanCaptures) * 22;
        const mobilityDiff = (aiMobility - humanMobility) * 4;
        const positionDiff = (aiPosition - humanPosition) * 3;
        const captureCountDiff = ((capturedBy[AI_PLAYER] || 0) - (capturedBy[HUMAN_PLAYER] || 0)) * 15;
        const vulnerabilityPenalty = humanCaptures * 16;

        return pieceDiff + captureDiff + mobilityDiff + positionDiff + captureCountDiff - vulnerabilityPenalty;
    }

    /**
     * Generate all possible single moves (captures prioritized over simple moves).
     */
    function generateMoves(state, level, player) {
        const moves = [];
        const opponent = player === GutiGames.PLAYER_1 ? GutiGames.PLAYER_2 : GutiGames.PLAYER_1;
        const total = level.totalNodes;
        const adj = level.adjacency;
        const jm = level.jumpMap;

        // 1. First priority: Gather all capture jumps
        for (let i = 0; i < total; i++) {
            if (state[i] !== player) continue;
            const neighbors = adj[i] || [];
            for (const n of neighbors) {
                if (state[n] === opponent) {
                    const landing = jm[i]?.[n];
                    if (landing !== undefined && state[landing] === GutiGames.EMPTY) {
                        moves.push({ from: i, to: landing, over: n, type: 'capture' });
                    }
                }
            }
        }

        // 2. Second priority: Standard adjacent steps
        for (let i = 0; i < total; i++) {
            if (state[i] !== player) continue;
            const neighbors = adj[i] || [];
            for (const n of neighbors) {
                if (state[n] === GutiGames.EMPTY) {
                    moves.push({ from: i, to: n, type: 'simple' });
                }
            }
        }

        return moves;
    }

    /**
     * Minimax with Alpha-Beta pruning.
     */
    function minimax(state, level, capturedBy, depth, alpha, beta, maximizing, player) {
        const aiCount = state.filter(n => n === AI_PLAYER).length;
        const humanCount = state.filter(n => n === HUMAN_PLAYER).length;

        if (aiCount === 0) return -10000 + (10 - depth);
        if (humanCount === 0) return 10000 - (10 - depth);

        if (depth === 0) {
            return evaluate(state, level, capturedBy);
        }

        const moves = generateMoves(state, level, player);
        if (moves.length === 0) {
            return player === AI_PLAYER ? -10000 + (10 - depth) : 10000 - (10 - depth);
        }

        const nextPlayer = player === GutiGames.PLAYER_1 ? GutiGames.PLAYER_2 : GutiGames.PLAYER_1;

        if (maximizing) {
            let maxEval = -Infinity;
            for (const move of moves) {
                const newState = [...state];
                const newCaptured = { ...capturedBy };

                newState[move.to] = newState[move.from];
                newState[move.from] = GutiGames.EMPTY;

                if (move.type === 'capture') {
                    newState[move.over] = GutiGames.EMPTY;
                    newCaptured[player] = (newCaptured[player] || 0) + 1;
                }

                const score = minimax(newState, level, newCaptured, depth - 1, alpha, beta, false, nextPlayer);
                maxEval = Math.max(maxEval, score);
                alpha = Math.max(alpha, score);
                if (beta <= alpha) break; // Beta cutoff
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            for (const move of moves) {
                const newState = [...state];
                const newCaptured = { ...capturedBy };

                newState[move.to] = newState[move.from];
                newState[move.from] = GutiGames.EMPTY;

                if (move.type === 'capture') {
                    newState[move.over] = GutiGames.EMPTY;
                    newCaptured[player] = (newCaptured[player] || 0) + 1;
                }

                const score = minimax(newState, level, newCaptured, depth - 1, alpha, beta, true, nextPlayer);
                minEval = Math.min(minEval, score);
                beta = Math.min(beta, score);
                if (beta <= alpha) break; // Alpha cutoff
            }
            return minEval;
        }
    }

    /**
     * Expand full chain jumps from an initial capture jump.
     */
    function expandChainCaptures(state, level, player, captureMove) {
        const sequences = [];
        const opponent = player === GutiGames.PLAYER_1 ? GutiGames.PLAYER_2 : GutiGames.PLAYER_1;
        const adj = level.adjacency;
        const jm = level.jumpMap;

        function recurse(currentState, currentPos, sequence) {
            let foundFurther = false;
            const neighbors = adj[currentPos] || [];

            for (const n of neighbors) {
                if (currentState[n] === opponent) {
                    const landing = jm[currentPos]?.[n];
                    if (landing !== undefined && currentState[landing] === GutiGames.EMPTY) {
                        foundFurther = true;
                        const nextState = [...currentState];
                        nextState[landing] = nextState[currentPos];
                        nextState[currentPos] = GutiGames.EMPTY;
                        nextState[n] = GutiGames.EMPTY;

                        recurse(nextState, landing, [
                            ...sequence,
                            { from: currentPos, to: landing, over: n, type: 'capture' }
                        ]);
                    }
                }
            }

            if (!foundFurther && sequence.length > 0) {
                sequences.push(sequence);
            }
        }

        const nextState = [...state];
        nextState[captureMove.to] = nextState[captureMove.from];
        nextState[captureMove.from] = GutiGames.EMPTY;
        nextState[captureMove.over] = GutiGames.EMPTY;

        const initialSeq = [{ from: captureMove.from, to: captureMove.to, over: captureMove.over, type: 'capture' }];
        recurse(nextState, captureMove.to, initialSeq);

        return sequences.length > 0 ? sequences : [initialSeq];
    }

    /**
     * Choose the best move sequence for AI.
     */
    function chooseMove() {
        const level = GameEngine.getLevel();
        const state = GameEngine.getState();
        const maxDepth = getMaxDepth(level);

        const availableMoves = generateMoves(state, level, AI_PLAYER);
        if (availableMoves.length === 0) return null;

        // Check if capture jumps exist
        const captureMoves = availableMoves.filter(m => m.type === 'capture');

        if (captureMoves.length > 0) {
            // Find best chain capture sequence
            let bestSequence = null;
            let bestScore = -Infinity;

            for (const cap of captureMoves) {
                const chains = expandChainCaptures(state, level, AI_PLAYER, cap);

                for (const seq of chains) {
                    // Simulate entire chain
                    const simState = [...state];
                    const simCaptured = {
                        [AI_PLAYER]: GameEngine.getCapturedBy(AI_PLAYER),
                        [HUMAN_PLAYER]: GameEngine.getCapturedBy(HUMAN_PLAYER)
                    };

                    for (const step of seq) {
                        simState[step.to] = simState[step.from];
                        simState[step.from] = GutiGames.EMPTY;
                        simState[step.over] = GutiGames.EMPTY;
                        simCaptured[AI_PLAYER]++;
                    }

                    // Evaluate position after chain
                    const score = minimax(
                        simState,
                        level,
                        simCaptured,
                        Math.max(1, maxDepth - 1),
                        -Infinity,
                        Infinity,
                        false,
                        HUMAN_PLAYER
                    );

                    // Add bonus for multiple captures
                    const totalScore = score + (seq.length - 1) * 60;

                    if (totalScore > bestScore) {
                        bestScore = totalScore;
                        bestSequence = seq;
                    }
                }
            }

            return bestSequence;
        }

        // Casual mode: occasionally add slight variation among top moves
        if (aiDifficulty === 'casual' && Math.random() < 0.35 && availableMoves.length > 1) {
            const randomPick = availableMoves[Math.floor(Math.random() * availableMoves.length)];
            return [randomPick];
        }

        // Minimax evaluation across simple moves
        let bestMove = null;
        let bestVal = -Infinity;

        for (const move of availableMoves) {
            const simState = [...state];
            simState[move.to] = simState[move.from];
            simState[move.from] = GutiGames.EMPTY;

            const capturedBy = {
                [AI_PLAYER]: GameEngine.getCapturedBy(AI_PLAYER),
                [HUMAN_PLAYER]: GameEngine.getCapturedBy(HUMAN_PLAYER)
            };

            const score = minimax(
                simState,
                level,
                capturedBy,
                maxDepth - 1,
                -Infinity,
                Infinity,
                false,
                HUMAN_PLAYER
            );

            // Add center attraction tiebreaker
            const posBonus = (level.positionWeights[move.to] || 0) * 0.5;
            const evalScore = score + posBonus;

            if (evalScore > bestVal) {
                bestVal = evalScore;
                bestMove = move;
            }
        }

        return bestMove ? [bestMove] : [availableMoves[0]];
    }

    /**
     * Choose continuation if mid-chain jump.
     */
    function chooseContinuation() {
        const chainPiece = GameEngine.getChainJumpPiece();
        if (chainPiece === null) return null;

        const moves = GameEngine.getValidMoves(chainPiece);
        if (!moves.captures || moves.captures.length === 0) return null;

        return { from: chainPiece, to: moves.captures[0].to, over: moves.captures[0].over };
    }

    return {
        AI_PLAYER,
        HUMAN_PLAYER,
        setDifficulty,
        getDifficulty,
        chooseMove,
        chooseContinuation
    };
})();
