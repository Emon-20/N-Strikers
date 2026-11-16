/* ═══════════════════════════════════════════════════════════════════════════════
   GUTI STRATEGY BOARD GAMES — PIECE & HIGHLIGHT RENDERER
   Manages interactive piece tokens, fluid CSS transitions, and node highlights
   ═══════════════════════════════════════════════════════════════════════════════ */

const PieceRenderer = (() => {
    let piecesLayer, highlightsLayer;
    let boardSize = 0;
    let pieceSize = 0;
    let highlightSize = 0;
    let pieceElements = {}; // nodeIdx -> DOM element
    let highlightElements = []; // array of highlight DOM elements

    function init(pLayer, hLayer) {
        piecesLayer = pLayer;
        highlightsLayer = hLayer;
    }

    function resize(size) {
        boardSize = size;
        const level = GameEngine.getLevel();

        // 12 Guti has 5x5 grid so pieces can be slightly larger
        if (level && level.id === '12_guti') {
            pieceSize = Math.max(22, size * 0.072);
            highlightSize = Math.max(18, size * 0.054);
        } else {
            pieceSize = Math.max(18, size * 0.058);
            highlightSize = Math.max(15, size * 0.044);
        }

        updateAllPositions();
    }

    function clearAll() {
        if (piecesLayer) piecesLayer.innerHTML = '';
        if (highlightsLayer) highlightsLayer.innerHTML = '';
        pieceElements = {};
        highlightElements = [];
    }

    function renderPieces(state, animated = false) {
        const level = GameEngine.getLevel();
        const theme = level.theme;

        // Remove pieces that are no longer present
        for (const [nodeStr, el] of Object.entries(pieceElements)) {
            const node = parseInt(nodeStr);
            if (state[node] === GutiGames.EMPTY) {
                el.classList.add('captured');
                const elRef = el;
                setTimeout(() => {
                    elRef.remove();
                }, 380);
                delete pieceElements[node];
            }
        }

        // Add or update pieces
        for (let i = 0; i < level.totalNodes; i++) {
            if (state[i] === GutiGames.EMPTY) continue;

            if (!pieceElements[i]) {
                const el = document.createElement('div');
                const isP1 = state[i] === GutiGames.PLAYER_1;
                const pieceClass = isP1 ? theme.p1Class : theme.p2Class;

                el.className = `game-piece ${pieceClass} ${isP1 ? 'p1-piece' : 'p2-piece'}`;
                el.dataset.node = i;
                el.dataset.player = state[i];
                el.setAttribute('role', 'button');
                el.setAttribute('aria-label', `${isP1 ? theme.p1Name : theme.p2Name} piece at intersection ${i + 1}`);

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

    function updateAllPositions() {
        const level = GameEngine.getLevel();
        if (!level) return;

        for (const [nodeStr, el] of Object.entries(pieceElements)) {
            const node = parseInt(nodeStr);
            el.style.width = pieceSize + 'px';
            el.style.height = pieceSize + 'px';

            const [px, py] = BoardRenderer.getNodePixel(node);
            el.style.left = (px - pieceSize / 2) + 'px';
            el.style.top = (py - pieceSize / 2) + 'px';
        }

        for (const el of highlightElements) {
            const node = parseInt(el.dataset.target);
            el.style.width = highlightSize + 'px';
            el.style.height = highlightSize + 'px';

            const [px, py] = BoardRenderer.getNodePixel(node);
            el.style.left = (px - highlightSize / 2) + 'px';
            el.style.top = (py - highlightSize / 2) + 'px';
        }
    }

    function animateMove(fromNode, toNode, isJump = false, callback) {
        const el = pieceElements[fromNode];
        if (!el) {
            if (callback) callback();
            return;
        }

        el.classList.add('animating');
        if (isJump) el.classList.add('jumping');
        el.classList.remove('selected');

        const [px, py] = BoardRenderer.getNodePixel(toNode);
        el.style.left = (px - pieceSize / 2) + 'px';
        el.style.top = (py - pieceSize / 2) + 'px';

        delete pieceElements[fromNode];
        pieceElements[toNode] = el;
        el.dataset.node = toNode;

        setTimeout(() => {
            el.classList.remove('animating');
            el.classList.remove('jumping');
            if (callback) callback();
        }, 310);
    }

    function animateCapture(nodeIdx, callback) {
        const el = pieceElements[nodeIdx];
        if (!el) {
            if (callback) callback();
            return;
        }

        el.classList.add('captured');

        // Shockwave burst element at captured node
        const [px, py] = BoardRenderer.getNodePixel(nodeIdx);
        const burst = document.createElement('div');
        burst.className = 'capture-shockwave';
        burst.style.left = px + 'px';
        burst.style.top = py + 'px';
        piecesLayer.appendChild(burst);

        setTimeout(() => {
            burst.remove();
        }, 450);

        setTimeout(() => {
            el.remove();
            delete pieceElements[nodeIdx];
            if (callback) callback();
        }, 360);
    }

    function selectPiece(nodeIdx) {
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

    function showHighlights(simpleMoves = [], captureMoves = []) {
        clearHighlights();

        // 1. Simple move highlights (glowing ring)
        for (const toNode of simpleMoves) {
            const el = document.createElement('div');
            el.className = 'move-highlight move-simple';
            el.dataset.target = toNode;
            el.style.width = highlightSize + 'px';
            el.style.height = highlightSize + 'px';

            const [px, py] = BoardRenderer.getNodePixel(toNode);
            el.style.left = (px - highlightSize / 2) + 'px';
            el.style.top = (py - highlightSize / 2) + 'px';

            highlightsLayer.appendChild(el);
            highlightElements.push(el);
        }

        // 2. Capture move highlights (vibrant combat target)
        for (const cap of captureMoves) {
            const el = document.createElement('div');
            el.className = 'move-highlight move-capture';
            el.dataset.target = cap.to;
            el.dataset.over = cap.over;
            el.style.width = (highlightSize * 1.15) + 'px';
            el.style.height = (highlightSize * 1.15) + 'px';

            const [px, py] = BoardRenderer.getNodePixel(cap.to);
            el.style.left = (px - (highlightSize * 1.15) / 2) + 'px';
            el.style.top = (py - (highlightSize * 1.15) / 2) + 'px';

            // Inner crosshair icon
            const inner = document.createElement('span');
            inner.className = 'capture-target-icon';
            el.appendChild(inner);

            highlightsLayer.appendChild(el);
            highlightElements.push(el);
        }
    }

    function clearHighlights() {
        if (highlightsLayer) highlightsLayer.innerHTML = '';
        highlightElements = [];
    }

    /**
     * Hit-test nearest node to pixel coordinate (x, y) with generous tolerance.
     */
    function getNodeAtPosition(x, y) {
        const level = GameEngine.getLevel();
        if (!level) return -1;

        let closestNode = -1;
        let minDist = Infinity;
        const maxClickDist = Math.max(26, pieceSize * 0.72);

        for (let i = 0; i < level.totalNodes; i++) {
            const [nx, ny] = BoardRenderer.getNodePixel(i);
            const dist = Math.hypot(x - nx, y - ny);
            if (dist < minDist) {
                minDist = dist;
                closestNode = i;
            }
        }

        return minDist <= maxClickDist ? closestNode : -1;
    }

    return {
        init,
        resize,
        clearAll,
        renderPieces,
        animateMove,
        animateCapture,
        selectPiece,
        deselectAll,
        showHighlights,
        clearHighlights,
        getNodeAtPosition
    };
})();
