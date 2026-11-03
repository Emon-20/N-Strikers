/* ═══════════════════════════════════════════════════════════════════════════════
   GUTI STRATEGY BOARD GAMES — BOARD CANVAS RENDERER
   Draws the wooden board background, lines, and intersection points
   for both Level 1 (12 Guti) and Level 2 (16 Guti)
   ═══════════════════════════════════════════════════════════════════════════════ */

const BoardRenderer = (() => {
    let canvas, ctx;
    let boardSize = 0;
    let currentLevel = GutiGames.LEVEL_12;

    function init(canvasEl) {
        canvas = canvasEl;
        ctx = canvas.getContext('2d');
    }

    function setLevel(levelConfig) {
        currentLevel = levelConfig || GutiGames.LEVEL_12;
        if (boardSize > 0) {
            draw();
        }
    }

    function getLevel() {
        return currentLevel;
    }

    function resize(size) {
        boardSize = size;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.round(size * dpr);
        canvas.height = Math.round(size * dpr);
        canvas.style.width = size + 'px';
        canvas.style.height = size + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        draw();
    }

    function toPixel(frac) {
        return [frac[0] * boardSize, frac[1] * boardSize];
    }

    function getNodePixel(nodeIdx) {
        const pos = currentLevel.nodePositions[nodeIdx];
        if (!pos) return [0, 0];
        return toPixel(pos);
    }

    function draw() {
        if (!ctx || boardSize <= 0) return;

        ctx.clearRect(0, 0, boardSize, boardSize);

        // Draw board outer surface and background
        drawBoardBase();

        // Draw regions (triangles for 16 Guti or center quadrant diamond for 12 Guti)
        if (currentLevel.id === '16_guti') {
            draw16GutiRegions();
        } else {
            draw12GutiRegions();
        }

        // Draw board line grid and diagonals
        drawEdges();

        // Draw intersection node points
        drawNodes();
    }

    function drawBoardBase() {
        const radius = Math.min(22, boardSize * 0.04);
        const margin = 2;
        const width = boardSize - margin * 2;
        const height = boardSize - margin * 2;

        ctx.save();

        // Board outer shadow & border
        ctx.beginPath();
        roundRect(ctx, margin, margin, width, height, radius);

        // Rich walnut/rosewood gradient background
        const grad = ctx.createRadialGradient(
            boardSize * 0.5, boardSize * 0.45, boardSize * 0.1,
            boardSize * 0.5, boardSize * 0.5, boardSize * 0.75
        );
        grad.addColorStop(0, '#322316');
        grad.addColorStop(0.65, '#24180e');
        grad.addColorStop(1, '#18100a');

        ctx.fillStyle = grad;
        ctx.fill();

        // Subtle wooden texture ring / rim
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#5a422a';
        ctx.stroke();

        // Inner engraved bevel
        ctx.beginPath();
        roundRect(ctx, margin + 4, margin + 4, width - 8, height - 8, radius - 2);
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(232, 193, 112, 0.15)';
        ctx.stroke();

        ctx.restore();
    }

    function draw12GutiRegions() {
        ctx.save();

        // Central diamond highlight for 12 Guti
        const p = currentLevel.nodePositions;
        // Node 2 (top-mid), 10 (mid-left), 22 (bot-mid), 14 (mid-right)
        const [tX, tY] = toPixel(p[2]);
        const [lX, lY] = toPixel(p[10]);
        const [bX, bY] = toPixel(p[22]);
        const [rX, rY] = toPixel(p[14]);

        ctx.beginPath();
        ctx.moveTo(tX, tY);
        ctx.lineTo(rX, rY);
        ctx.lineTo(bX, bY);
        ctx.lineTo(lX, lY);
        ctx.closePath();
        ctx.fillStyle = 'rgba(232, 193, 112, 0.045)';
        ctx.fill();

        // Subtle side player base shading
        // Player 1 base (rows 0-1)
        const [tlX, tlY] = toPixel(p[0]);
        const [trX, trY] = toPixel(p[4]);
        const [mlX, mlY] = toPixel(p[10]);
        const [mrX, mrY] = toPixel(p[14]);

        const gradP1 = ctx.createLinearGradient(0, tlY, 0, mlY);
        gradP1.addColorStop(0, 'rgba(132, 204, 22, 0.05)');
        gradP1.addColorStop(1, 'rgba(132, 204, 22, 0.01)');
        ctx.fillStyle = gradP1;
        ctx.fillRect(tlX, tlY, trX - tlX, (mlY - tlY) * 0.7);

        // Player 2 base (rows 3-4)
        const [blX, blY] = toPixel(p[20]);
        const [brX, brY] = toPixel(p[24]);
        const gradP2 = ctx.createLinearGradient(0, mlY, 0, blY);
        gradP2.addColorStop(0, 'rgba(249, 115, 22, 0.01)');
        gradP2.addColorStop(1, 'rgba(249, 115, 22, 0.05)');
        ctx.fillStyle = gradP2;
        ctx.fillRect(blX, mlY + (blY - mlY) * 0.3, brX - blX, (blY - mlY) * 0.7);

        ctx.restore();
    }

    function draw16GutiRegions() {
        ctx.save();
        const p = currentLevel.nodePositions;

        // Top triangle region (Player 1 stronghold)
        const [ax, ay] = toPixel(p[0]);
        const [bx, by] = toPixel(p[3]);
        const [cx, cy] = toPixel(p[5]);
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.lineTo(cx, cy);
        ctx.closePath();
        ctx.fillStyle = 'rgba(232, 193, 112, 0.06)';
        ctx.fill();

        // Bottom triangle region (Player 2 stronghold)
        const [dax, day] = toPixel(p[36]);
        const [dbx, dby] = toPixel(p[31]);
        const [dcx, dcy] = toPixel(p[33]);
        ctx.beginPath();
        ctx.moveTo(dax, day);
        ctx.lineTo(dbx, dby);
        ctx.lineTo(dcx, dcy);
        ctx.closePath();
        ctx.fillStyle = 'rgba(16, 185, 129, 0.06)';
        ctx.fill();

        // Central grid faint fill
        const [tlx, tly] = toPixel(p[6]);
        const [brx, bry] = toPixel(p[30]);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.025)';
        ctx.fillRect(tlx, tly, brx - tlx, bry - tly);

        ctx.restore();
    }

    function drawEdges() {
        const positions = currentLevel.nodePositions;

        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        for (const [a, b] of currentLevel.edges) {
            const [x1, y1] = toPixel(positions[a]);
            const [x2, y2] = toPixel(positions[b]);

            const dx = Math.abs(positions[b][0] - positions[a][0]);
            const dy = Math.abs(positions[b][1] - positions[a][1]);
            const isDiag = dx > 0.001 && dy > 0.001;

            // Shadow / carved groove effect
            ctx.beginPath();
            ctx.moveTo(x1, y1 + 1);
            ctx.lineTo(x2, y2 + 1);
            ctx.strokeStyle = 'rgba(10, 7, 4, 0.7)';
            ctx.lineWidth = isDiag ? 1.5 : 2.5;
            ctx.stroke();

            // Main engraved brass line
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.strokeStyle = isDiag ? '#7c6544' : '#9e845c';
            ctx.lineWidth = isDiag ? 1.2 : 2.0;
            ctx.stroke();
        }

        ctx.restore();
    }

    function drawNodes() {
        const positions = currentLevel.nodePositions;
        const baseRadius = currentLevel.id === '12_guti'
            ? Math.max(4, boardSize * 0.010)
            : Math.max(3.2, boardSize * 0.008);

        ctx.save();

        for (let i = 0; i < currentLevel.totalNodes; i++) {
            const [x, y] = toPixel(positions[i]);

            // Outer dark pit
            ctx.beginPath();
            ctx.arc(x, y, baseRadius + 1.5, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(15, 10, 6, 0.85)';
            ctx.fill();

            // Brass/bronze pin
            ctx.beginPath();
            ctx.arc(x, y, baseRadius, 0, Math.PI * 2);
            const pinGrad = ctx.createRadialGradient(
                x - baseRadius * 0.3, y - baseRadius * 0.3, baseRadius * 0.1,
                x, y, baseRadius
            );
            pinGrad.addColorStop(0, '#e5c07b');
            pinGrad.addColorStop(0.7, '#8e6f42');
            pinGrad.addColorStop(1, '#533e21');
            ctx.fillStyle = pinGrad;
            ctx.fill();

            // Subtle highlight glint
            ctx.beginPath();
            ctx.arc(x - baseRadius * 0.3, y - baseRadius * 0.3, baseRadius * 0.35, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
            ctx.fill();
        }

        ctx.restore();
    }

    function roundRect(ctx, x, y, width, height, radius) {
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
    }

    return {
        init,
        setLevel,
        getLevel,
        resize,
        toPixel,
        getNodePixel,
        draw
    };
})();
