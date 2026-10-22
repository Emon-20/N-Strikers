/* ═══════════════════════════════════════════════════════
   SHOLO GUTI — PIECE & HIGHLIGHT RENDERER
   Manages DOM elements for pieces and move highlights
   ═══════════════════════════════════════════════════════ */

const PieceRenderer = (() => {
    let piecesLayer, highlightsLayer;
    let boardSize = 0;
    let pieceSize = 0;
    let highlightSize = 0;
    let pieceElements = {}; // nodeIdx -> DOM element
    let highlightElements = []; // array of DOM elements

    function init(pLayer, hLayer) {
        piecesLayer = pLayer;
        highlightsLayer = hLayer;
    }

    function resize(size) {
        boardSize = size;
        pieceSize = Math.max(16, size * 0.058);
        highlightSize = Math.max(14, size * 0.042);
        updateAllPositions();
    }

    /**
     * Render all pieces based on game state.
     */
    function renderPieces(state, animated = false) {
        // Remove pieces that are no longer present
        for (const [nodeStr, el] of Object.entries(pieceElements)) {
            const node = parseInt(nodeStr);
            if (state[node] === SholoGuti.EMPTY) {
                el.classList.add('captured');
                const elRef = el;
                setTimeout(() => {
                    elRef.remove();
                }, 400);
                delete pieceElements[node];
            }
        }

        // Add/update pieces
        for (let i = 0; i < SholoGuti.TOTAL_NODES; i++) {
            if (state[i] === SholoGuti.EMPTY) continue;

            if (!pieceElements[i]) {
                // Create new piece element
                const el = document.createElement('div');
                el.className = `game-piece ${state[i] === SholoGuti.PLAYER_1 ? 'p1-piece' : 'p2-piece'}`;
                el.dataset.node = i;
                el.style.width = pieceSize + 'px';
                el.style.height = pieceSize + 'px';

                const [px, py] = BoardRenderer.getNodePixel(i);
                el.style.left = (px - pieceSize / 2) + 'px';
                el.style.top = (py - pieceSize / 2) + 'px';

                piecesLayer.appendChild(el);
                pieceElements[i] = el;
            }
        }
    }

    /**
     * Move a piece element from one node to another with animation.
     */
    function animateMove(fromNode, toNode, callback) {
        const el = pieceElements[fromNode];
        if (!el) {
            if (callback) callback();
            return;
        }

        el.classList.add('animating');
        el.classList.remove('selected');

        const [px, py] = BoardRenderer.getNodePixel(toNode);
        el.style.left = (px - pieceSize / 2) + 'px';
        el.style.top = (py - pieceSize / 2) + 'px';

        // Update tracking
        delete pieceElements[fromNode];
        pieceElements[toNode] = el;
        el.dataset.node = toNode;

        setTimeout(() => {
            el.classList.remove('animating');
            if (callback) callback();
        }, 320);
    }

    /**
     * Animate capturing (removing) a piece.
     */
    function animateCapture(nodeIdx, callback) {
        const el = pieceElements[nodeIdx];
        if (!el) {
            if (callback) callback();
            return;
        }

        el.classList.add('captured');
        delete pieceElements[nodeIdx];

        setTimeout(() => {
            el.remove();
            if (callback) callback();
        }, 400);
    }

    /**
     * Select a piece (visual highlight).
     */
    function selectPiece(nodeIdx) {
        // Deselect all first
        deselectAll();
        const el = pieceElements[nodeIdx];
        if (el) {
            el.classList.add('selected');
        }
    }

    function deselectAll() {
        for (const el of Object.values(pieceElements)) {
            el.classList.remove('selected');
        }
    }

    /**
     * Show move highlights for valid moves.
     */
    function showHighlights(simpleMoves, captureMoves) {
        clearHighlights();

        for (const node of simpleMoves) {
            createHighlight(node, 'simple-move');
        }

        for (const cap of captureMoves) {
            createHighlight(cap.to, 'capture-move');
        }
    }

    function createHighlight(nodeIdx, className) {
        const el = document.createElement('div');
        el.className = `move-highlight ${className}`;
        el.dataset.target = nodeIdx;
        el.style.width = highlightSize + 'px';
        el.style.height = highlightSize + 'px';

        const [px, py] = BoardRenderer.getNodePixel(nodeIdx);
        el.style.left = (px - highlightSize / 2) + 'px';
        el.style.top = (py - highlightSize / 2) + 'px';

        highlightsLayer.appendChild(el);
        highlightElements.push(el);
    }

    function clearHighlights() {
        for (const el of highlightElements) {
            el.remove();
        }
        highlightElements = [];
    }

    /**
     * Update all piece positions (after resize).
     */
    function updateAllPositions() {
        for (const [nodeStr, el] of Object.entries(pieceElements)) {
            const node = parseInt(nodeStr);
            el.style.width = pieceSize + 'px';
            el.style.height = pieceSize + 'px';
            const [px, py] = BoardRenderer.getNodePixel(node);
            el.style.left = (px - pieceSize / 2) + 'px';
            el.style.top = (py - pieceSize / 2) + 'px';
        }

        // Update highlight positions too
        for (const el of highlightElements) {
            const node = parseInt(el.dataset.target);
            el.style.width = highlightSize + 'px';
            el.style.height = highlightSize + 'px';
            const [px, py] = BoardRenderer.getNodePixel(node);
            el.style.left = (px - highlightSize / 2) + 'px';
            el.style.top = (py - highlightSize / 2) + 'px';
        }
    }

    /**
     * Clear all pieces from the DOM.
     */
    function clearAll() {
        for (const el of Object.values(pieceElements)) {
            el.remove();
        }
        pieceElements = {};
        clearHighlights();
    }

    /**
     * Get node index from a click/touch position relative to the board.
     */
    function getNodeAtPosition(x, y, threshold) {
        threshold = threshold || pieceSize * 0.8;
        let closest = -1;
        let closestDist = Infinity;

        for (let i = 0; i < SholoGuti.TOTAL_NODES; i++) {
            const [px, py] = BoardRenderer.getNodePixel(i);
            const dist = Math.sqrt((x - px) ** 2 + (y - py) ** 2);
            if (dist < threshold && dist < closestDist) {
                closest = i;
                closestDist = dist;
            }
        }

        return closest;
    }

    return {
        init,
        resize,
        renderPieces,
        animateMove,
        animateCapture,
        selectPiece,
        deselectAll,
        showHighlights,
        clearHighlights,
        clearAll,
        getNodeAtPosition,
        get pieceSize() { return pieceSize; }
    };
})();
