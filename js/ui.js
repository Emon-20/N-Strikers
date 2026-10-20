/* ═══════════════════════════════════════════════════════
   SHOLO GUTI — UI CONTROLLER
   Screen management, event handling, HUD updates
   ═══════════════════════════════════════════════════════ */

const UIController = (() => {
    // DOM references
    let els = {};
    let selectedNode = -1;
    let isAIThinking = false;
    let inputLocked = false;

    function cacheElements() {
        els = {
            // Screens
            menuScreen: document.getElementById('menu-screen'),
            gameScreen: document.getElementById('game-screen'),
            // Menu
            btnPvp: document.getElementById('btn-pvp'),
            btnAi: document.getElementById('btn-ai'),
            btnRules: document.getElementById('btn-rules'),
            // Rules
            rulesModal: document.getElementById('rules-modal'),
            rulesClose: document.getElementById('rules-close'),
            rulesGotIt: document.getElementById('rules-got-it'),
            // Game
            boardFrame: document.getElementById('board-frame'),
            boardCanvas: document.getElementById('board-canvas'),
            piecesLayer: document.getElementById('pieces-layer'),
            highlightsLayer: document.getElementById('highlights-layer'),
            chainActions: document.getElementById('chain-actions'),
            btnEndTurn: document.getElementById('btn-end-turn'),
            gameStatus: document.getElementById('game-status'),
            // HUD
            p1Name: document.getElementById('p1-name'),
            p2Name: document.getElementById('p2-name'),
            p1Captures: document.getElementById('p1-captures'),
            p2Captures: document.getElementById('p2-captures'),
            p1Indicator: document.getElementById('p1-indicator'),
            p2Indicator: document.getElementById('p2-indicator'),
            turnNumber: document.getElementById('turn-number'),
            // HUD buttons
            btnUndo: document.getElementById('btn-undo'),
            btnRestart: document.getElementById('btn-restart'),
            btnMenu: document.getElementById('btn-menu'),
            // Victory
            victoryModal: document.getElementById('victory-modal'),
            victoryTitle: document.getElementById('victory-title'),
            victoryMessage: document.getElementById('victory-message'),
            victoryConfetti: document.getElementById('victory-confetti'),
            statTurns: document.getElementById('stat-turns'),
            statCapturesW: document.getElementById('stat-captures-w'),
            statCapturesB: document.getElementById('stat-captures-b'),
            btnPlayAgain: document.getElementById('btn-play-again'),
            btnVictoryMenu: document.getElementById('btn-victory-menu'),
            // Confirm
            confirmModal: document.getElementById('confirm-modal'),
            confirmTitle: document.getElementById('confirm-title'),
            confirmMessage: document.getElementById('confirm-message'),
            confirmYes: document.getElementById('confirm-yes'),
            confirmNo: document.getElementById('confirm-no'),
            // Particles
            particlesBg: document.getElementById('particles-bg'),
        };
    }

    function init() {
        cacheElements();
        initParticles();
        bindEvents();
    }

    // ── Screen Management ──
    function showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        const screen = document.getElementById(screenId);
        if (screen) screen.classList.add('active');
    }

    function showModal(modalEl) {
        modalEl.classList.add('active');
    }

    function hideModal(modalEl) {
        modalEl.classList.remove('active');
    }

    // ── Particles ──
    function initParticles() {
        const container = els.particlesBg;
        const count = 30;

        for (let i = 0; i < count; i++) {
            const p = document.createElement('div');
            p.className = 'particle';
            const size = Math.random() * 4 + 2;
            p.style.width = size + 'px';
            p.style.height = size + 'px';
            p.style.left = Math.random() * 100 + '%';
            p.style.animationDuration = (Math.random() * 15 + 10) + 's';
            p.style.animationDelay = (Math.random() * 10) + 's';

            // Random colors from palette
            const colors = ['rgba(232,184,48,0.3)', 'rgba(16,185,129,0.2)', 'rgba(255,255,255,0.15)'];
            p.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];

            container.appendChild(p);
        }
    }

    // ── Event Binding ──
    function bindEvents() {
        // Menu
        els.btnPvp.addEventListener('click', () => startGame('pvp'));
        els.btnAi.addEventListener('click', () => startGame('ai'));
        els.btnRules.addEventListener('click', () => showModal(els.rulesModal));
        els.rulesClose.addEventListener('click', () => hideModal(els.rulesModal));
        els.rulesGotIt.addEventListener('click', () => hideModal(els.rulesModal));

        // Game board input
        els.boardFrame.addEventListener('click', handleBoardClick);
        els.boardFrame.addEventListener('touchend', handleBoardTouch, { passive: false });

        // Highlight clicks
        els.highlightsLayer.addEventListener('click', handleHighlightClick);

        // Chain jump
        els.btnEndTurn.addEventListener('click', handleEndTurn);

        // HUD
        els.btnUndo.addEventListener('click', handleUndo);
        els.btnRestart.addEventListener('click', () => {
            showConfirm('Restart Game', 'Are you sure you want to restart?', () => {
                startGame(GameEngine.getGameMode());
            });
        });
        els.btnMenu.addEventListener('click', () => {
            showConfirm('Return to Menu', 'Leave the current game?', () => {
                showScreen('menu-screen');
            });
        });

        // Victory
        els.btnPlayAgain.addEventListener('click', () => {
            hideModal(els.victoryModal);
            startGame(GameEngine.getGameMode());
        });
        els.btnVictoryMenu.addEventListener('click', () => {
            hideModal(els.victoryModal);
            showScreen('menu-screen');
        });

        // Confirm
        els.confirmNo.addEventListener('click', () => hideModal(els.confirmModal));

        // Window resize
        window.addEventListener('resize', handleResize);

        // Close modals on backdrop click
        [els.rulesModal, els.confirmModal].forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) hideModal(modal);
            });
        });
    }

    // ── Confirm Dialog ──
    function showConfirm(title, message, onYes) {
        els.confirmTitle.textContent = title;
        els.confirmMessage.textContent = message;
        showModal(els.confirmModal);

        // Replace the yes button to clear old listeners
        const newYes = els.confirmYes.cloneNode(true);
        els.confirmYes.replaceWith(newYes);
        els.confirmYes = newYes;

        els.confirmYes.addEventListener('click', () => {
            hideModal(els.confirmModal);
            onYes();
        });
    }

    // ── Game Start ──
    function startGame(mode) {
        GameEngine.init(mode);
        selectedNode = -1;
        isAIThinking = false;
        inputLocked = false;

        // Set player names
        els.p1Name.textContent = 'Player 1';
        els.p2Name.textContent = mode === 'ai' ? 'Computer' : 'Player 2';

        // Initialize renderers
        PieceRenderer.clearAll();
        showScreen('game-screen');

        // Need a frame for layout to compute
        requestAnimationFrame(() => {
            handleResize();
            PieceRenderer.renderPieces(GameEngine.getState());
            updateHUD();
            setStatus('Gold moves first — select a piece', 'info');
        });
    }

    // ── Board Sizing ──
    function handleResize() {
        const frame = els.boardFrame;
        const containerWidth = frame.parentElement.clientWidth - 32;
        const containerHeight = window.innerHeight - 140;
        const size = Math.min(containerWidth, containerHeight, 560);

        frame.style.width = size + 'px';
        frame.style.height = size + 'px';

        BoardRenderer.resize(size);
        PieceRenderer.resize(size);
    }

    // ── Board Click Handling ──
    function handleBoardClick(e) {
        if (inputLocked || isAIThinking) return;

        const rect = els.boardFrame.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        processInput(x, y);
    }

    function handleBoardTouch(e) {
        if (inputLocked || isAIThinking) return;
        e.preventDefault();

        const touch = e.changedTouches[0];
        const rect = els.boardFrame.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;

        processInput(x, y);
    }

    function handleHighlightClick(e) {
        if (inputLocked || isAIThinking) return;

        const highlight = e.target.closest('.move-highlight');
        if (!highlight) return;

        const targetNode = parseInt(highlight.dataset.target);
        if (selectedNode >= 0 && targetNode >= 0) {
            executePlayerMove(selectedNode, targetNode);
        }
    }

    function processInput(x, y) {
        const node = PieceRenderer.getNodeAtPosition(x, y);
        if (node < 0) {
            // Clicked empty space — deselect
            if (GameEngine.getChainJumpPiece() === null) {
                selectedNode = -1;
                PieceRenderer.deselectAll();
                PieceRenderer.clearHighlights();
            }
            return;
        }

        const state = GameEngine.getState();
        const currentPlayer = GameEngine.getCurrentPlayer();
        const chainPiece = GameEngine.getChainJumpPiece();

        // If in chain jump mode
        if (chainPiece !== null) {
            // Can only click on valid jump destinations
            const moves = GameEngine.getValidMoves(chainPiece);
            const cap = moves.captures.find(c => c.to === node);
            if (cap) {
                executePlayerMove(chainPiece, node);
            }
            return;
        }

        // If AI's turn, ignore
        if (GameEngine.getGameMode() === 'ai' && currentPlayer === AIPlayer.AI_PLAYER) return;

        // Click on own piece — select it
        if (state[node] === currentPlayer) {
            selectedNode = node;
            PieceRenderer.selectPiece(node);

            const moves = GameEngine.getValidMoves(node);
            PieceRenderer.showHighlights(moves.simple, moves.captures);

            if (moves.simple.length === 0 && moves.captures.length === 0) {
                setStatus('No valid moves for this piece', 'warning');
            }
            return;
        }

        // Click on destination (if piece is selected)
        if (selectedNode >= 0) {
            executePlayerMove(selectedNode, node);
        }
    }

    function executePlayerMove(from, to) {
        inputLocked = true;

        const result = GameEngine.executeMove(from, to);
        if (!result) {
            inputLocked = false;
            return;
        }

        // Animate the move
        PieceRenderer.clearHighlights();
        PieceRenderer.animateMove(from, to, () => {
            if (result.captured !== null) {
                PieceRenderer.animateCapture(result.captured, () => {
                    afterMoveComplete(result);
                });
            } else {
                afterMoveComplete(result);
            }
        });
    }

    function afterMoveComplete(result) {
        updateHUD();

        if (result.gameOver) {
            inputLocked = false;
            showVictory(result.winner);
            return;
        }

        if (result.chainContinues) {
            // Show chain jump UI
            selectedNode = result.to;
            PieceRenderer.selectPiece(result.to);
            const moves = GameEngine.getValidMoves(result.to);
            PieceRenderer.showHighlights([], moves.captures);
            els.chainActions.classList.remove('hidden');
            setStatus('Chain jump! Continue capturing or end turn', 'info');
            inputLocked = false;
            return;
        }

        // Hide chain UI
        els.chainActions.classList.add('hidden');
        selectedNode = -1;
        PieceRenderer.deselectAll();
        PieceRenderer.clearHighlights();
        inputLocked = false;

        // Check if it's AI's turn
        if (GameEngine.getGameMode() === 'ai' && GameEngine.getCurrentPlayer() === AIPlayer.AI_PLAYER) {
            triggerAITurn();
        } else {
            const playerName = GameEngine.getCurrentPlayer() === SholoGuti.PLAYER_1 ? 'Gold' : 'Emerald';
            setStatus(`${playerName}'s turn — select a piece`, 'info');
        }
    }

    function handleEndTurn() {
        GameEngine.endChainJump();
        els.chainActions.classList.add('hidden');
        selectedNode = -1;
        PieceRenderer.deselectAll();
        PieceRenderer.clearHighlights();
        updateHUD();

        if (GameEngine.isGameOver()) {
            showVictory(GameEngine.getWinner());
            return;
        }

        if (GameEngine.getGameMode() === 'ai' && GameEngine.getCurrentPlayer() === AIPlayer.AI_PLAYER) {
            triggerAITurn();
        } else {
            const playerName = GameEngine.getCurrentPlayer() === SholoGuti.PLAYER_1 ? 'Gold' : 'Emerald';
            setStatus(`${playerName}'s turn — select a piece`, 'info');
        }
    }

    // ── AI Turn ──
    function triggerAITurn() {
        isAIThinking = true;
        setStatus('Computer is thinking...', 'info');

        setTimeout(() => {
            executeAISequence();
        }, 600);
    }

    function executeAISequence() {
        const sequence = AIPlayer.chooseMove();
        if (!sequence || sequence.length === 0) {
            isAIThinking = false;
            return;
        }

        let stepIdx = 0;

        function executeNextStep() {
            if (stepIdx >= sequence.length) {
                // If there's a chain jump continuing, check for more
                if (GameEngine.getChainJumpPiece() !== null) {
                    const cont = AIPlayer.chooseContinuation();
                    if (cont) {
                        sequence.push(cont);
                        setTimeout(executeNextStep, 400);
                        return;
                    } else {
                        GameEngine.endChainJump();
                        updateHUD();
                    }
                }

                isAIThinking = false;
                els.chainActions.classList.add('hidden');

                if (GameEngine.isGameOver()) {
                    showVictory(GameEngine.getWinner());
                } else {
                    setStatus("Gold's turn — select a piece", 'info');
                }
                return;
            }

            const step = sequence[stepIdx];
            const result = GameEngine.executeMove(step.from, step.to);

            if (!result) {
                isAIThinking = false;
                return;
            }

            PieceRenderer.animateMove(step.from, step.to, () => {
                if (result.captured !== null) {
                    PieceRenderer.animateCapture(result.captured, () => {
                        updateHUD();
                        stepIdx++;

                        if (result.gameOver) {
                            isAIThinking = false;
                            showVictory(result.winner);
                            return;
                        }

                        if (result.chainContinues) {
                            // Continue chain
                            const cont = AIPlayer.chooseContinuation();
                            if (cont) {
                                sequence.push(cont);
                            } else {
                                GameEngine.endChainJump();
                                updateHUD();
                            }
                        }

                        setTimeout(executeNextStep, 350);
                    });
                } else {
                    updateHUD();
                    stepIdx++;
                    setTimeout(executeNextStep, 300);
                }
            });
        }

        executeNextStep();
    }

    // ── HUD Updates ──
    function updateHUD() {
        const currentPlayer = GameEngine.getCurrentPlayer();

        els.p1Captures.innerHTML = `Captured: <strong>${GameEngine.getCapturedBy(1)}</strong>`;
        els.p2Captures.innerHTML = `Captured: <strong>${GameEngine.getCapturedBy(2)}</strong>`;
        els.turnNumber.textContent = GameEngine.getTurnCount();

        // Turn indicators
        els.p1Indicator.className = 'hud-turn-indicator' +
            (currentPlayer === SholoGuti.PLAYER_1 ? ' active-gold' : '');
        els.p2Indicator.className = 'hud-turn-indicator' +
            (currentPlayer === SholoGuti.PLAYER_2 ? ' active-emerald' : '');
    }

    function setStatus(text, type) {
        els.gameStatus.textContent = text;
        els.gameStatus.className = 'game-status ' + (type || '');
    }

    // ── Undo ──
    function handleUndo() {
        if (isAIThinking) return;

        // In AI mode, undo twice (undo AI + human)
        const wasAI = GameEngine.getGameMode() === 'ai';
        const success = GameEngine.undo();

        if (success && wasAI) {
            GameEngine.undo(); // Undo AI's move too
        }

        if (success) {
            selectedNode = -1;
            PieceRenderer.clearAll();
            PieceRenderer.renderPieces(GameEngine.getState());
            PieceRenderer.clearHighlights();
            els.chainActions.classList.add('hidden');
            updateHUD();
            setStatus('Move undone', 'info');
        }
    }

    // ── Victory ──
    function showVictory(winner) {
        const mode = GameEngine.getGameMode();
        let winnerName;

        if (mode === 'ai') {
            winnerName = winner === SholoGuti.PLAYER_1 ? 'You' : 'Computer';
        } else {
            winnerName = winner === SholoGuti.PLAYER_1 ? 'Gold (Player 1)' : 'Emerald (Player 2)';
        }

        els.victoryTitle.textContent = winner === SholoGuti.PLAYER_1 && mode === 'ai' ? 'Victory!' : 
                                       winner === SholoGuti.PLAYER_2 && mode === 'ai' ? 'Defeated!' :
                                       'Victory!';
        els.victoryMessage.textContent = `${winnerName} wins the game!`;
        els.statTurns.textContent = GameEngine.getTurnCount();
        els.statCapturesW.textContent = GameEngine.getCapturedBy(1);
        els.statCapturesB.textContent = GameEngine.getCapturedBy(2);

        // Spawn confetti
        spawnConfetti();

        setTimeout(() => showModal(els.victoryModal), 500);
    }

    function spawnConfetti() {
        const container = els.victoryConfetti;
        container.innerHTML = '';

        const colors = ['#f5c842', '#10b981', '#e8c170', '#34d399', '#f85149', '#ffffff', '#d29922'];

        for (let i = 0; i < 60; i++) {
            const p = document.createElement('div');
            p.className = 'confetti-particle';
            p.style.left = Math.random() * 100 + '%';
            p.style.top = '-10px';
            p.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            p.style.animationDuration = (Math.random() * 2 + 1.5) + 's';
            p.style.animationDelay = (Math.random() * 1) + 's';
            p.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';

            const size = Math.random() * 8 + 4;
            p.style.width = size + 'px';
            p.style.height = size + 'px';

            container.appendChild(p);
        }
    }

    return {
        init,
        showScreen,
        startGame
    };
})();
