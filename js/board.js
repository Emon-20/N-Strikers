/* ═══════════════════════════════════════════════════════
   SHOLO GUTI — BOARD RENDERER
   Draws the board lines/grid on canvas
   ═══════════════════════════════════════════════════════ */

const BoardRenderer = (() => {
    let canvas, ctx;
    let boardSize = 0;

    /**
     * Initialize the renderer with the canvas element.
     */
    function init(canvasEl) {
        canvas = canvasEl;
        ctx = canvas.getContext('2d');
    }

    /**
     * Resize and redraw the board.
     */
    function resize(size) {
        boardSize = size;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = size * dpr;
        canvas.height = size * dpr;
        canvas.style.width = size + 'px';
        canvas.style.height = size + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        draw();
    }

    /**
     * Convert fractional position to pixel coordinates.
     */
    function toPixel(frac) {
        return [frac[0] * boardSize, frac[1] * boardSize];
    }

    /**
     * Get pixel position for a node index.
     */
    function getNodePixel(nodeIdx) {
        return toPixel(SholoGuti.NODE_POSITIONS[nodeIdx]);
    }

    /**
     * Draw the complete board: background regions, lines, and node dots.
     */
    function draw() {
        ctx.clearRect(0, 0, boardSize, boardSize);

        // Draw triangular region fills
        drawTriangleRegion('top');
        drawTriangleRegion('bottom');
        drawGridRegion();

        // Draw edges (lines)
        drawEdges();

        // Draw node intersections
        drawNodes();
    }

    function drawTriangleRegion(side) {
        ctx.save();
        ctx.globalAlpha = 0.08;

        if (side === 'top') {
            const [ax, ay] = toPixel(SholoGuti.NODE_POSITIONS[0]);
            const [bx, by] = toPixel(SholoGuti.NODE_POSITIONS[3]);
            const [cx, cy] = toPixel(SholoGuti.NODE_POSITIONS[5]);
            ctx.fillStyle = '#e8c170';
            ctx.beginPath();
            ctx.moveTo(ax, ay);
            ctx.lineTo(bx, by);
            ctx.lineTo(cx, cy);
            ctx.closePath();
            ctx.fill();
        } else {
            const [ax, ay] = toPixel(SholoGuti.NODE_POSITIONS[36]);
            const [bx, by] = toPixel(SholoGuti.NODE_POSITIONS[31]);
            const [cx, cy] = toPixel(SholoGuti.NODE_POSITIONS[33]);
            ctx.fillStyle = '#10b981';
            ctx.beginPath();
            ctx.moveTo(ax, ay);
            ctx.lineTo(bx, by);
            ctx.lineTo(cx, cy);
            ctx.closePath();
            ctx.fill();
        }

        ctx.restore();
    }

    function drawGridRegion() {
        ctx.save();
        ctx.globalAlpha = 0.04;
        const [tlx, tly] = toPixel(SholoGuti.NODE_POSITIONS[6]);
        const [brx, bry] = toPixel(SholoGuti.NODE_POSITIONS[30]);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(tlx, tly, brx - tlx, bry - tly);
        ctx.restore();
    }

    function drawEdges() {
        const positions = SholoGuti.NODE_POSITIONS;

        for (const [a, b] of SholoGuti.EDGES) {
            const [x1, y1] = toPixel(positions[a]);
            const [x2, y2] = toPixel(positions[b]);

            // Determine if diagonal
            const dx = Math.abs(positions[b][0] - positions[a][0]);
            const dy = Math.abs(positions[b][1] - positions[a][1]);
            const isDiag = dx > 0.001 && dy > 0.001;

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.strokeStyle = isDiag ? '#4a3a28' : '#6b5a3e';
            ctx.lineWidth = isDiag ? 1 : 1.5;
            ctx.globalAlpha = isDiag ? 0.5 : 0.7;
            ctx.stroke();
            ctx.globalAlpha = 1;
        }
    }

    function drawNodes() {
        const positions = SholoGuti.NODE_POSITIONS;
        const nodeRadius = Math.max(3, boardSize * 0.008);

        for (let i = 0; i < SholoGuti.TOTAL_NODES; i++) {
            const [x, y] = toPixel(positions[i]);

            // Outer glow
            ctx.beginPath();
            ctx.arc(x, y, nodeRadius + 2, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(107, 90, 62, 0.3)';
            ctx.fill();

            // Node dot
            ctx.beginPath();
            ctx.arc(x, y, nodeRadius, 0, Math.PI * 2);
            ctx.fillStyle = '#6b5a3e';
            ctx.fill();

            // Inner highlight
            ctx.beginPath();
            ctx.arc(x, y - nodeRadius * 0.3, nodeRadius * 0.5, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.fill();
        }
    }

    return {
        init,
        resize,
        getNodePixel,
        get boardSize() { return boardSize; }
    };
})();
