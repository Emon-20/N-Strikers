/* ═══════════════════════════════════════════════════════════════════════════════
   GUTI STRATEGY BOARD GAMES — UI CONTROLLER
   Full multi-level management, modal dialogs, HUD updates, and event wiring
   ═══════════════════════════════════════════════════════════════════════════════ */

const UIController = (() => {
    let els = {};
    let selectedNode = -1;
    let isAIThinking = false;
    let inputLocked = false;
    let chainComboCount = 0;
    let activeLevelId = '12_guti'; // Default starting level
    let activeGameMode = 'pvp'; // 'pvp' or 'ai'

    function cacheElements() {
        els = {
            // Screens
            menuScreen: document.getElementById('menu-screen'),
            gameScreen: document.getElementById('game-screen'),

            // Menu selection cards & buttons
            levelCards: document.querySelectorAll('.level-select-card'),
            modeCards: document.querySelectorAll('.mode-select-card'),
            btnStartGame: document.getElementById('btn-start-game'),
            btnQuick12Pvp: document.getElementById('btn-quick-12-pvp'),
            btnQuick12Ai: document.getElementById('btn-quick-12-ai'),
            btnQuick16Pvp: document.getElementById('btn-quick-16-pvp'),
            btnQuick16Ai: document.getElementById('btn-quick-16-ai'),
            btnRules: document.getElementById('btn-rules'),

            // Rules Modal & Tabs
            rulesModal: document.getElementById('rules-modal'),
            rulesClose: document.getElementById('rules-close'),
            rulesGotIt: document.getElementById('rules-got-it'),
            rulesTabs: document.querySelectorAll('.rules-tab-btn'),
            rulesContents: document.querySelectorAll('.rules-tab-pane'),

            // Game Board & Layers
            boardFrame: document.getElementById('board-frame'),
            boardCanvas: document.getElementById('board-canvas'),
            piecesLayer: document.getElementById('pieces-layer'),
            highlightsLayer: document.getElementById('highlights-layer'),
            chainActions: document.getElementById('chain-actions'),
            btnEndTurn: document.getElementById('btn-end-turn'),
            gameStatus: document.getElementById('game-status'),

            // HUD Elements
            currentLevelBadge: document.getElementById('hud-level-badge'),
            p1Avatar: document.getElementById('p1-avatar-icon'),
            p2Avatar: document.getElementById('p2-avatar-icon'),
            p1Name: document.getElementById('p1-name'),
            p2Name: document.getElementById('p2-name'),
            p1PiecesLeft: document.getElementById('p1-pieces-left'),
            p2PiecesLeft: document.getElementById('p2-pieces-left'),
            p1Captures: document.getElementById('p1-captures'),
            p2Captures: document.getElementById('p2-captures'),
            p1Indicator: document.getElementById('p1-indicator'),
            p2Indicator: document.getElementById('p2-indicator'),
            turnNumber: document.getElementById('turn-number'),

            // HUD Action Buttons
            btnSoundToggle: document.getElementById('btn-sound-toggle'),
            btnLevelSwitch: document.getElementById('btn-level-switch'),
            btnUndo: document.getElementById('btn-undo'),
            btnRestart: document.getElementById('btn-restart'),
            btnMenu: document.getElementById('btn-menu'),

            // Victory Modal
            victoryModal: document.getElementById('victory-modal'),
            victoryTitle: document.getElementById('victory-title'),
            victoryMessage: document.getElementById('victory-message'),
            victorySubtitle: document.getElementById('victory-subtitle'),
            statTurns: document.getElementById('stat-turns'),
            statLevel: document.getElementById('stat-level'),
            statCapturesP1: document.getElementById('stat-captures-p1'),
            statCapturesP2: document.getElementById('stat-captures-p2'),
            statCapturesP1Label: document.getElementById('stat-captures-p1-label'),
            statCapturesP2Label: document.getElementById('stat-captures-p2-label'),
            btnNextLevel: document.getElementById('btn-next-level'),
            btnPlayAgain: document.getElementById('btn-play-again'),
            btnVictoryMenu: document.getElementById('btn-victory-menu'),
            confettiCanvas: document.getElementById('confetti-canvas'),

            // Confirm Dialog
            confirmModal: document.getElementById('confirm-modal'),
            confirmTitle: document.getElementById('confirm-title'),
            confirmMessage: document.getElementById('confirm-message'),
            confirmYes: document.getElementById('confirm-yes'),
            confirmNo: document.getElementById('confirm-no'),

            // Ambient background particles
            particlesBg: document.getElementById('particles-bg')
        };
    }

    function init() {
        cacheElements();
        initParticles();
        initSoundUI();
        bindEvents();
    }

    function initSoundUI() {
        if (!els.btnSoundToggle) return;
        const muted = SoundFX.isSoundMuted();
        els.btnSoundToggle.innerHTML = muted ? '🔇' : '🔊';
        els.btnSoundToggle.title = muted ? 'Unmute Sound' : 'Mute Sound';
        els.btnSoundToggle.setAttribute('aria-label', muted ? 'Unmute Sound' : 'Mute Sound');
    }

    // ── Particle Background ──
    function initParticles() {
        const container = els.particlesBg;
        if (!container) return;
        const count = 28;

        for (let i = 0; i < count; i++) {
            const p = document.createElement('div');
            p.className = 'particle';
            const size = Math.random() * 4 + 2;
            p.style.width = size + 'px';
            p.style.height = size + 'px';
            p.style.left = Math.random() * 100 + '%';
            p.style.animationDuration = (Math.random() * 14 + 9) + 's';
            p.style.animationDelay = (Math.random() * 8) + 's';

            const colors = ['rgba(232,193,112,0.3)', 'rgba(132,204,22,0.25)', 'rgba(249,115,22,0.25)', 'rgba(16,185,129,0.2)'];
            p.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];

            container.appendChild(p);
        }
    }

    // ── Event Binding ──
    function bindEvents() {
        // Level selection cards in menu
        els.levelCards.forEach(card => {
            card.addEventListener('click', () => {
                SoundFX.playSelect();
                els.levelCards.forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                activeLevelId = card.dataset.level;
            });
        });

        // Mode selection cards in menu
        els.modeCards.forEach(card => {
            card.addEventListener('click', () => {
                SoundFX.playSelect();
                els.modeCards.forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                activeGameMode = card.dataset.mode;
            });
        });

        // Start Game button
        if (els.btnStartGame) {
            els.btnStartGame.addEventListener('click', () => {
                SoundFX.playSelect();
                startGame(activeLevelId, activeGameMode);
            });
        }

        // Quick Launch Buttons (12 Guti PvP / AI, 16 Guti PvP / AI)
        if (els.btnQuick12Pvp) els.btnQuick12Pvp.addEventListener('click', () => startGame('12_guti', 'pvp'));
        if (els.btnQuick12Ai) els.btnQuick12Ai.addEventListener('click', () => startGame('12_guti', 'ai'));
        if (els.btnQuick16Pvp) els.btnQuick16Pvp.addEventListener('click', () => startGame('16_guti', 'pvp'));
        if (els.btnQuick16Ai) els.btnQuick16Ai.addEventListener('click', () => startGame('16_guti', 'ai'));

        // Rules modal
        if (els.btnRules) els.btnRules.addEventListener('click', () => {
            SoundFX.playSelect();
            showModal(els.rulesModal);
        });
        if (els.rulesClose) els.rulesClose.addEventListener('click', () => hideModal(els.rulesModal));
        if (els.rulesGotIt) els.rulesGotIt.addEventListener('click', () => hideModal(els.rulesModal));

        // Rules modal tabs
        els.rulesTabs.forEach(btn => {
            btn.addEventListener('click', () => {
                SoundFX.playSelect();
                const targetTab = btn.dataset.tab;
                els.rulesTabs.forEach(b => b.classList.remove('active'));
                els.rulesContents.forEach(c => c.classList.remove('active'));
                btn.classList.add('active');
                const pane = document.getElementById(targetTab);
                if (pane) pane.classList.add('active');
            });
        });

        // Board interaction
        if (els.boardFrame) {
            els.boardFrame.addEventListener('click', handleBoardClick);
            els.boardFrame.addEventListener('touchend', handleBoardTouch, { passive: false });
        }

        // Highlights layer clicks
        if (els.highlightsLayer) {
            els.highlightsLayer.addEventListener('click', handleHighlightClick);
        }

        // Chain jump End Turn button
        if (els.btnEndTurn) {
            els.btnEndTurn.addEventListener('click', handleEndTurn);
        }

        // HUD Sound Toggle
        if (els.btnSoundToggle) {
            els.btnSoundToggle.addEventListener('click', () => {
                const muted = SoundFX.toggleMute();
                initSoundUI();
                if (!muted) SoundFX.playSelect();
            });
        }

        // HUD Level Switcher
        if (els.btnLevelSwitch) {
            els.btnLevelSwitch.addEventListener('click', () => {
                SoundFX.playSelect();
                const nextLevel = activeLevelId === '12_guti' ? '16_guti' : '12_guti';
                const nextName = nextLevel === '16_guti' ? 'Level 2 (16 Guti)' : 'Level 1 (12 Guti)';
                showConfirm('Switch Level', `Switch directly to ${nextName}? The current match will be reset.`, () => {
                    startGame(nextLevel, activeGameMode);
                });
            });
        }

        // HUD Action buttons
        if (els.btnUndo) els.btnUndo.addEventListener('click', handleUndo);
        if (els.btnRestart) {
            els.btnRestart.addEventListener('click', () => {
                SoundFX.playSelect();
                showConfirm('Restart Match', 'Are you sure you want to restart the current match?', () => {
                    startGame(activeLevelId, activeGameMode);
                });
            });
        }
        if (els.btnMenu) {
            els.btnMenu.addEventListener('click', () => {
                SoundFX.playSelect();
                showConfirm('Exit to Menu', 'Return to main menu? Current progress will be lost.', () => {
                    showScreen('menu-screen');
                });
            });
        }

        // Victory Modal Buttons
        if (els.btnNextLevel) {
            els.btnNextLevel.addEventListener('click', () => {
                hideModal(els.victoryModal);
                stopConfetti();
                startGame('16_guti', activeGameMode);
            });
        }
        if (els.btnPlayAgain) {
            els.btnPlayAgain.addEventListener('click', () => {
                hideModal(els.victoryModal);
                stopConfetti();
                startGame(activeLevelId, activeGameMode);
            });
        }
        if (els.btnVictoryMenu) {
            els.btnVictoryMenu.addEventListener('click', () => {
                hideModal(els.victoryModal);
                stopConfetti();
                showScreen('menu-screen');
            });
        }

        // Confirm Dialog Cancel
        if (els.confirmNo) {
            els.confirmNo.addEventListener('click', () => hideModal(els.confirmModal));
        }

        // Window resize
        window.addEventListener('resize', handleResize);

        // Modal backdrop dismiss
        [els.rulesModal, els.confirmModal].forEach(modal => {
            if (!modal) return;
            modal.addEventListener('click', (e) => {
                if (e.target === modal) hideModal(modal);
            });
        });
    }

    // ── Screen Management ──
    function showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        const screen = document.getElementById(screenId);
        if (screen) screen.classList.add('active');
    }

    function showModal(modalEl) {
        if (modalEl) modalEl.classList.add('active');
    }

    function hideModal(modalEl) {
        if (modalEl) modalEl.classList.remove('active');
    }

    function showConfirm(title, message, onYes) {
        if (!els.confirmModal) return;
        els.confirmTitle.textContent = title;
        els.confirmMessage.textContent = message;
        showModal(els.confirmModal);

        const newYes = els.confirmYes.cloneNode(true);
        els.confirmYes.replaceWith(newYes);
        els.confirmYes = newYes;

        els.confirmYes.addEventListener('click', () => {
            hideModal(els.confirmModal);
            if (onYes) onYes();
        });
    }

    // ── Game Start ──
    function startGame(levelId = '12_guti', mode = 'pvp') {
        activeLevelId = levelId;
        activeGameMode = mode;
        selectedNode = -1;
        isAIThinking = false;
        inputLocked = false;
        chainComboCount = 0;

        const levelConfig = GutiGames.getLevel(levelId);
        GameEngine.init(levelId, mode);
        BoardRenderer.setLevel(levelConfig);

        // Player Labels & Theme Setup
        const isAI = mode === 'ai';
        els.p1Name.textContent = isAI ? 'You (P1)' : 'Player 1';
        els.p2Name.textContent = isAI ? 'Computer (AI)' : 'Player 2';

        // Update Level Badge
        if (els.currentLevelBadge) {
            els.currentLevelBadge.textContent = `${levelConfig.name} · ${mode === 'ai' ? 'vs AI' : '2-Player'}`;
            els.currentLevelBadge.dataset.level = levelId;
        }

        // Update Avatar icons and colors
        if (els.p1Avatar) {
            els.p1Avatar.className = `piece-icon ${levelConfig.theme.p1Class}`;
        }
        if (els.p2Avatar) {
            els.p2Avatar.className = `piece-icon ${levelConfig.theme.p2Class}`;
        }

        // Clear previous board state
        PieceRenderer.clearAll();
        showScreen('game-screen');

        requestAnimationFrame(() => {
            handleResize();
            PieceRenderer.renderPieces(GameEngine.getState());
            updateHUD();
            setStatus(`${levelConfig.theme.p1Name} starts — select a piece to move`, 'info');
        });
    }

    // ── Board Resize & Layout ──
    function handleResize() {
        if (!els.boardFrame) return;
        const containerWidth = els.boardFrame.parentElement.clientWidth - 32;
        const containerHeight = window.innerHeight - 150;
        const size = Math.max(280, Math.min(containerWidth, containerHeight, 560));

        els.boardFrame.style.width = size + 'px';
        els.boardFrame.style.height = size + 'px';

        BoardRenderer.resize(size);
        PieceRenderer.resize(size);
    }

    // ── Input Handling ──
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
        const state = GameEngine.getState();
        const currentPlayer = GameEngine.getCurrentPlayer();
        const chainPiece = GameEngine.getChainJumpPiece();

        if (node < 0) {
            // Clicked outside any node — deselect if not mid-chain
            if (chainPiece === null && selectedNode >= 0) {
                selectedNode = -1;
                PieceRenderer.deselectAll();
                PieceRenderer.clearHighlights();
            }
            return;
        }

        // If currently in chain jump mode: can only click on valid next jumps
        if (chainPiece !== null) {
            const moves = GameEngine.getValidMoves(chainPiece);
            const cap = moves.captures.find(c => c.to === node);
            if (cap) {
                executePlayerMove(chainPiece, node);
            } else {
                SoundFX.playError();
            }
            return;
        }

        // Ignore user clicks during AI turn
        if (GameEngine.getGameMode() === 'ai' && currentPlayer === AIPlayer.AI_PLAYER) {
            return;
        }

        // Click on current player's piece: Select it
        if (state[node] === currentPlayer) {
            SoundFX.playSelect();
            selectedNode = node;
            PieceRenderer.selectPiece(node);

            const moves = GameEngine.getValidMoves(node);
            PieceRenderer.showHighlights(moves.simple, moves.captures);

            if (moves.simple.length === 0 && moves.captures.length === 0) {
                setStatus('This piece has no legal moves available', 'warning');
            } else if (moves.captures.length > 0) {
                setStatus('Capture jump available! Tap the red target to strike', 'success');
            }
            return;
        }

        // Click on destination while a piece is selected
        if (selectedNode >= 0) {
            const moves = GameEngine.getValidMoves(selectedNode);
            const isValidSimple = moves.simple.includes(node);
            const isValidCapture = moves.captures.some(c => c.to === node);

            if (isValidSimple || isValidCapture) {
                executePlayerMove(selectedNode, node);
            } else {
                // Invalid move
                SoundFX.playError();
            }
        }
    }

    function executePlayerMove(from, to) {
        inputLocked = true;
        const moves = GameEngine.getValidMoves(from);
        const isCapture = moves.captures.some(c => c.to === to);

        const result = GameEngine.executeMove(from, to);
        if (!result) {
            inputLocked = false;
            return;
        }

        // Sound effect
        if (isCapture) {
            chainComboCount++;
            if (chainComboCount > 1) {
                SoundFX.playChain(chainComboCount);
            } else {
                SoundFX.playCapture();
            }
        } else {
            chainComboCount = 0;
            SoundFX.playMove();
        }

        PieceRenderer.clearHighlights();
        PieceRenderer.animateMove(from, to, isCapture, () => {
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
            SoundFX.playVictory();
            showVictory(result.winner);
            return;
        }

        if (result.chainContinues) {
            // Keep chain piece selected and highlight further captures
            selectedNode = result.to;
            PieceRenderer.selectPiece(result.to);
            const moves = GameEngine.getValidMoves(result.to);
            PieceRenderer.showHighlights([], moves.captures);

            if (els.chainActions) els.chainActions.classList.remove('hidden');
            setStatus(`Chain Combo x${chainComboCount}! Continue capturing or End Turn`, 'success');
            inputLocked = false;
            return;
        }

        // Normal turn transition
        chainComboCount = 0;
        if (els.chainActions) els.chainActions.classList.add('hidden');
        selectedNode = -1;
        PieceRenderer.deselectAll();
        PieceRenderer.clearHighlights();
        inputLocked = false;

        // Check if AI turn
        if (GameEngine.getGameMode() === 'ai' && GameEngine.getCurrentPlayer() === AIPlayer.AI_PLAYER) {
            triggerAITurn();
        } else {
            const level = GameEngine.getLevel();
            const pName = GameEngine.getCurrentPlayer() === GutiGames.PLAYER_1
                ? level.theme.p1Name
                : level.theme.p2Name;
            setStatus(`${pName}'s turn — choose a piece`, 'info');
        }
    }

    function handleEndTurn() {
        SoundFX.playSelect();
        GameEngine.endChainJump();
        chainComboCount = 0;
        if (els.chainActions) els.chainActions.classList.add('hidden');
        selectedNode = -1;
        PieceRenderer.deselectAll();
        PieceRenderer.clearHighlights();
        updateHUD();

        if (GameEngine.isGameOver()) {
            SoundFX.playVictory();
            showVictory(GameEngine.getWinner());
            return;
        }

        if (GameEngine.getGameMode() === 'ai' && GameEngine.getCurrentPlayer() === AIPlayer.AI_PLAYER) {
            triggerAITurn();
        } else {
            const level = GameEngine.getLevel();
            const pName = GameEngine.getCurrentPlayer() === GutiGames.PLAYER_1
                ? level.theme.p1Name
                : level.theme.p2Name;
            setStatus(`${pName}'s turn — choose a piece`, 'info');
        }
    }

    // ── AI Turn Execution ──
    function triggerAITurn() {
        isAIThinking = true;
        setStatus('Computer is analyzing tactical lines...', 'info');

        setTimeout(() => {
            executeAISequence();
        }, 550);
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
                // If the piece can jump even further, query continuation
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
                if (els.chainActions) els.chainActions.classList.add('hidden');

                if (GameEngine.isGameOver()) {
                    SoundFX.playVictory();
                    showVictory(GameEngine.getWinner());
                } else {
                    const level = GameEngine.getLevel();
                    setStatus(`Your turn (${level.theme.p1Name}) — select a piece`, 'info');
                }
                return;
            }

            const step = sequence[stepIdx];
            const isCapture = step.type === 'capture' || step.over !== undefined;
            const result = GameEngine.executeMove(step.from, step.to);

            if (!result) {
                isAIThinking = false;
                return;
            }

            if (isCapture) {
                SoundFX.playCapture();
            } else {
                SoundFX.playMove();
            }

            PieceRenderer.animateMove(step.from, step.to, isCapture, () => {
                if (result.captured !== null) {
                    PieceRenderer.animateCapture(result.captured, () => {
                        updateHUD();
                        stepIdx++;

                        if (result.gameOver) {
                            isAIThinking = false;
                            SoundFX.playVictory();
                            showVictory(result.winner);
                            return;
                        }

                        if (stepIdx < sequence.length) {
                            setTimeout(executeNextStep, 350);
                        } else {
                            executeNextStep();
                        }
                    });
                } else {
                    updateHUD();
                    stepIdx++;
                    if (result.gameOver) {
                        isAIThinking = false;
                        SoundFX.playVictory();
                        showVictory(result.winner);
                        return;
                    }
                    executeNextStep();
                }
            });
        }

        executeNextStep();
    }

    // ── Undo Last Move ──
    function handleUndo() {
        if (inputLocked || isAIThinking) return;

        // In AI mode, undo twice to revert computer's move and human's move
        if (GameEngine.getGameMode() === 'ai') {
            GameEngine.undo();
            GameEngine.undo();
        } else {
            GameEngine.undo();
        }

        SoundFX.playSelect();
        selectedNode = -1;
        chainComboCount = 0;
        if (els.chainActions) els.chainActions.classList.add('hidden');
        PieceRenderer.deselectAll();
        PieceRenderer.clearHighlights();
        PieceRenderer.clearAll();
        PieceRenderer.renderPieces(GameEngine.getState());
        updateHUD();
        setStatus('Move undone', 'info');
    }

    // ── HUD Updates ──
    function updateHUD() {
        const level = GameEngine.getLevel();
        const p1Count = GameEngine.countPieces(GutiGames.PLAYER_1);
        const p2Count = GameEngine.countPieces(GutiGames.PLAYER_2);
        const p1Caps = GameEngine.getCapturedBy(GutiGames.PLAYER_1);
        const p2Caps = GameEngine.getCapturedBy(GutiGames.PLAYER_2);
        const currentP = GameEngine.getCurrentPlayer();

        if (els.p1PiecesLeft) els.p1PiecesLeft.textContent = `${p1Count} / ${level.piecesPerPlayer}`;
        if (els.p2PiecesLeft) els.p2PiecesLeft.textContent = `${p2Count} / ${level.piecesPerPlayer}`;
        if (els.p1Captures) els.p1Captures.textContent = p1Caps;
        if (els.p2Captures) els.p2Captures.textContent = p2Caps;
        if (els.turnNumber) els.turnNumber.textContent = GameEngine.getTurnCount();

        // Turn indicator active classes
        if (els.p1Indicator) {
            els.p1Indicator.classList.toggle('active', currentP === GutiGames.PLAYER_1);
        }
        if (els.p2Indicator) {
            els.p2Indicator.classList.toggle('active', currentP === GutiGames.PLAYER_2);
        }
    }

    function setStatus(text, type = 'info') {
        if (!els.gameStatus) return;
        els.gameStatus.textContent = text;
        els.gameStatus.className = `game-status status-${type}`;
    }

    // ── Victory Presentation ──
    function showVictory(winner) {
        const level = GameEngine.getLevel();
        const isAI = GameEngine.getGameMode() === 'ai';
        const isP1Winner = winner === GutiGames.PLAYER_1;

        let titleText = 'Victory!';
        let messageText = '';

        if (isAI) {
            if (isP1Winner) {
                titleText = '🏆 Outstanding Victory!';
                messageText = `You defeated the computer in ${level.name}!`;
            } else {
                titleText = 'Computer Triumphs!';
                messageText = `The AI out-maneuvered your forces on this battlefield.`;
            }
        } else {
            const winnerName = isP1Winner ? level.theme.p1Name : level.theme.p2Name;
            titleText = `🏆 ${isP1Winner ? 'Player 1' : 'Player 2'} Wins!`;
            messageText = `${winnerName} claims total supremacy!`;
        }

        // Winning reason (all captured or blocked)
        const opponent = isP1Winner ? GutiGames.PLAYER_2 : GutiGames.PLAYER_1;
        const opponentRemaining = GameEngine.countPieces(opponent);
        const subtitleText = opponentRemaining === 0
            ? 'Complete elimination of all enemy soldiers.'
            : 'Enemy commander trapped with zero legal moves remaining.';

        if (els.victoryTitle) els.victoryTitle.textContent = titleText;
        if (els.victoryMessage) els.victoryMessage.textContent = messageText;
        if (els.victorySubtitle) els.victorySubtitle.textContent = subtitleText;

        if (els.statTurns) els.statTurns.textContent = GameEngine.getTurnCount();
        if (els.statLevel) els.statLevel.textContent = level.name;
        if (els.statCapturesP1) els.statCapturesP1.textContent = GameEngine.getCapturedBy(GutiGames.PLAYER_1);
        if (els.statCapturesP2) els.statCapturesP2.textContent = GameEngine.getCapturedBy(GutiGames.PLAYER_2);
        if (els.statCapturesP1Label) els.statCapturesP1Label.textContent = `${level.theme.p1Name} Captures`;
        if (els.statCapturesP2Label) els.statCapturesP2Label.textContent = `${level.theme.p2Name} Captures`;

        // If player won Level 1, show "Play Level 2: 16 Guti" promotion button!
        if (els.btnNextLevel) {
            if (level.id === '12_guti') {
                els.btnNextLevel.classList.remove('hidden');
                els.btnNextLevel.querySelector('.btn-label').textContent = 'Advance to Level 2 (16 Guti)';
            } else {
                els.btnNextLevel.classList.add('hidden');
            }
        }

        showModal(els.victoryModal);
        startConfetti();
    }

    // ── Confetti Animation ──
    let confettiAnimationId = null;
    function startConfetti() {
        const canvas = els.confettiCanvas;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        canvas.width = canvas.parentElement.clientWidth || 400;
        canvas.height = canvas.parentElement.clientHeight || 500;

        const pieces = [];
        const colors = ['#e8c170', '#84cc16', '#f97316', '#10b981', '#38bdf8', '#fbbf24'];

        for (let i = 0; i < 90; i++) {
            pieces.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height - canvas.height,
                size: Math.random() * 8 + 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                speedY: Math.random() * 3 + 2,
                speedX: Math.random() * 2 - 1,
                rot: Math.random() * 360,
                rotSpeed: Math.random() * 6 - 3
            });
        }

        function renderConfetti() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (const p of pieces) {
                p.y += p.speedY;
                p.x += p.speedX;
                p.rot += p.rotSpeed;

                if (p.y > canvas.height) {
                    p.y = -10;
                    p.x = Math.random() * canvas.width;
                }

                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate((p.rot * Math.PI) / 180);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
                ctx.restore();
            }
            confettiAnimationId = requestAnimationFrame(renderConfetti);
        }

        renderConfetti();
    }

    function stopConfetti() {
        if (confettiAnimationId) {
            cancelAnimationFrame(confettiAnimationId);
            confettiAnimationId = null;
        }
        if (els.confettiCanvas) {
            const ctx = els.confettiCanvas.getContext('2d');
            ctx.clearRect(0, 0, els.confettiCanvas.width, els.confettiCanvas.height);
        }
    }

    return {
        init,
        startGame,
        showScreen,
        showModal,
        hideModal
    };
})();
