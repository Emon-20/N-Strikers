/* ═══════════════════════════════════════════════════════════════════════════════
   GUTI STRATEGY BOARD GAMES — TOPOLOGY & CONFIGURATION
   Supports Level 1 (12 Guti / Baro Guti) & Level 2 (16 Guti / Sholo Guti)
   ═══════════════════════════════════════════════════════════════════════════════ */

const GutiGames = (() => {
    const PLAYER_1 = 1; // Top player: Lime Green (12 Guti) / Radiant Gold (16 Guti)
    const PLAYER_2 = 2; // Bottom player: Sunset Orange (12 Guti) / Emerald Green (16 Guti)
    const EMPTY = 0;

    /* ─────────────────────────────────────────────────────────────────────────────
       LEVEL 1: 12 GUTI (BARO GUTI)
       Classic 5x5 intersection matrix (forming 4x4 squares with cross-diagonals)
       Total 25 nodes, 12 pieces per player, center node starts empty.
       ───────────────────────────────────────────────────────────────────────────── */
    const LEVEL_12 = (() => {
        const TOTAL_NODES = 25;
        const PIECES_PER_PLAYER = 12;
        const PAD = 0.09;
        const SPAN = 1 - 2 * PAD;

        // 5x5 normalized node positions [x, y]
        const NODE_POSITIONS = [];
        for (let r = 0; r < 5; r++) {
            for (let c = 0; c < 5; c++) {
                NODE_POSITIONS.push([
                    PAD + (c / 4) * SPAN,
                    PAD + (r / 4) * SPAN
                ]);
            }
        }

        // 5x5 Edge Connections with Alquerque diagonals
        const edgeSet = new Set();
        const addEdge = (a, b) => edgeSet.add(Math.min(a, b) + ',' + Math.max(a, b));
        const G = (r, c) => r * 5 + c;

        for (let r = 0; r < 5; r++) {
            for (let c = 0; c < 5; c++) {
                const n = G(r, c);
                if (c < 4) addEdge(n, G(r, c + 1)); // Horizontal
                if (r < 4) addEdge(n, G(r + 1, c)); // Vertical

                // Diagonals on even sum intersections (classic Alquerque cross-diagonals)
                if ((r + c) % 2 === 0) {
                    if (r < 4 && c < 4) addEdge(n, G(r + 1, c + 1)); // ↘
                    if (r < 4 && c > 0) addEdge(n, G(r + 1, c - 1)); // ↙
                }
            }
        }

        const EDGES = Array.from(edgeSet).map(s => {
            const parts = s.split(',');
            return [+parts[0], +parts[1]];
        });

        // Adjacency map
        const ADJACENCY = {};
        for (let i = 0; i < TOTAL_NODES; i++) ADJACENCY[i] = [];
        for (const [a, b] of EDGES) {
            ADJACENCY[a].push(b);
            ADJACENCY[b].push(a);
        }

        // Jump Map: a jumped over b lands on c
        const JUMP_MAP = {};
        for (let i = 0; i < TOTAL_NODES; i++) JUMP_MAP[i] = {};

        function computeJump(a, b) {
            const dx1 = NODE_POSITIONS[b][0] - NODE_POSITIONS[a][0];
            const dy1 = NODE_POSITIONS[b][1] - NODE_POSITIONS[a][1];
            const d1 = Math.hypot(dx1, dy1);

            for (const c of ADJACENCY[b]) {
                if (c === a) continue;
                const dx2 = NODE_POSITIONS[c][0] - NODE_POSITIONS[b][0];
                const dy2 = NODE_POSITIONS[c][1] - NODE_POSITIONS[b][1];
                const d2 = Math.hypot(dx2, dy2);

                const cross = Math.abs(dx1 * dy2 - dy1 * dx2);
                const dot = dx1 * dx2 + dy1 * dy2;

                // Collinear, same direction, equal step distance (±15%)
                if (cross < 0.005 && dot > 0 && Math.abs(d1 - d2) / Math.max(d1, 1e-6) < 0.15) {
                    JUMP_MAP[a][b] = c;
                }
            }
        }

        for (const [a, b] of EDGES) {
            computeJump(a, b);
            computeJump(b, a);
        }

        // Initial Board Setup:
        // P1: Rows 0 & 1 (10 pieces) + Row 2 cols 0 & 1 (2 pieces) = 12 pieces
        // Center: Row 2 col 2 (node 12) = Empty
        // P2: Row 2 cols 3 & 4 (2 pieces) + Rows 3 & 4 (10 pieces) = 12 pieces
        const INITIAL_STATE = new Array(TOTAL_NODES).fill(EMPTY);
        for (let i = 0; i <= 9; i++) INITIAL_STATE[i] = PLAYER_1;
        INITIAL_STATE[10] = PLAYER_1;
        INITIAL_STATE[11] = PLAYER_1;
        INITIAL_STATE[12] = EMPTY;
        INITIAL_STATE[13] = PLAYER_2;
        INITIAL_STATE[14] = PLAYER_2;
        for (let i = 15; i <= 24; i++) INITIAL_STATE[i] = PLAYER_2;

        // Positional weights for AI
        const POSITION_WEIGHTS = new Array(TOTAL_NODES).fill(0);
        for (let i = 0; i < TOTAL_NODES; i++) {
            const dx = NODE_POSITIONS[i][0] - 0.5;
            const dy = NODE_POSITIONS[i][1] - 0.5;
            const dist = Math.hypot(dx, dy);
            POSITION_WEIGHTS[i] = Math.max(1, 6 - dist * 10);
        }
        POSITION_WEIGHTS[12] = 7.0; // Center is vital
        POSITION_WEIGHTS[6] = 5.0; POSITION_WEIGHTS[8] = 5.0;
        POSITION_WEIGHTS[16] = 5.0; POSITION_WEIGHTS[18] = 5.0;
        POSITION_WEIGHTS[7] = 5.5; POSITION_WEIGHTS[11] = 5.5;
        POSITION_WEIGHTS[13] = 5.5; POSITION_WEIGHTS[17] = 5.5;

        return {
            id: '12_guti',
            levelNumber: 1,
            name: '12 Guti',
            nativeName: '১২ গুটি',
            subtitle: 'Baro Guti · 12 Soldiers',
            tag: 'Fast & Tactical',
            boardType: 'square',
            totalNodes: TOTAL_NODES,
            piecesPerPlayer: PIECES_PER_PLAYER,
            nodePositions: NODE_POSITIONS,
            edges: EDGES,
            adjacency: ADJACENCY,
            jumpMap: JUMP_MAP,
            initialState: INITIAL_STATE,
            positionWeights: POSITION_WEIGHTS,
            theme: {
                p1Name: 'Lime Green',
                p2Name: 'Vivid Orange',
                p1Class: 'lime-piece',
                p2Class: 'orange-piece',
                p1Color: '#84cc16',
                p2Color: '#f97316',
                p1Glow: 'rgba(132, 204, 22, 0.45)',
                p2Glow: 'rgba(249, 115, 22, 0.45)'
            }
        };
    })();

    /* ─────────────────────────────────────────────────────────────────────────────
       LEVEL 2: 16 GUTI (SHOLO GUTI)
       Expanded 37-node board: 5x5 central grid + top & bottom triangular extensions
       Total 37 nodes, 16 pieces per player, central grid row 2 starts empty.
       ───────────────────────────────────────────────────────────────────────────── */
    const LEVEL_16 = (() => {
        const TOTAL_NODES = 37;
        const PIECES_PER_PLAYER = 16;
        const PAD = 0.08;
        const SPAN = 1 - 2 * PAD;
        const TRI_H = SPAN * 0.095;

        const NODE_POSITIONS = [];

        // Top triangle (nodes 0 to 5)
        NODE_POSITIONS[0] = [0.5, PAD];
        NODE_POSITIONS[1] = [0.5 - SPAN / 8, PAD + TRI_H];
        NODE_POSITIONS[2] = [0.5 + SPAN / 8, PAD + TRI_H];
        NODE_POSITIONS[3] = [0.5 - SPAN / 4, PAD + TRI_H * 2];
        NODE_POSITIONS[4] = [0.5, PAD + TRI_H * 2];
        NODE_POSITIONS[5] = [0.5 + SPAN / 4, PAD + TRI_H * 2];

        // Central grid 5x5 (nodes 6 to 30)
        const gridGap = TRI_H * 0.55;
        const gridTop = PAD + TRI_H * 2 + gridGap;
        const gridBottom = 1 - PAD - TRI_H * 2 - gridGap;
        const rowH = (gridBottom - gridTop) / 4;

        for (let r = 0; r < 5; r++) {
            for (let c = 0; c < 5; c++) {
                NODE_POSITIONS[6 + r * 5 + c] = [
                    PAD + (c / 4) * SPAN,
                    gridTop + r * rowH
                ];
            }
        }

        // Bottom triangle (nodes 31 to 36)
        const btBase = gridBottom + gridGap;
        NODE_POSITIONS[31] = [0.5 - SPAN / 4, btBase];
        NODE_POSITIONS[32] = [0.5, btBase];
        NODE_POSITIONS[33] = [0.5 + SPAN / 4, btBase];
        NODE_POSITIONS[34] = [0.5 - SPAN / 8, btBase + TRI_H];
        NODE_POSITIONS[35] = [0.5 + SPAN / 8, btBase + TRI_H];
        NODE_POSITIONS[36] = [0.5, btBase + TRI_H * 2];

        // Edge connections
        const edgeSet = new Set();
        const addEdge = (a, b) => edgeSet.add(Math.min(a, b) + ',' + Math.max(a, b));
        const G = (r, c) => 6 + r * 5 + c;

        // Top triangle internal edges
        addEdge(0, 1); addEdge(0, 2);
        addEdge(1, 2);
        addEdge(1, 3); addEdge(1, 4);
        addEdge(2, 4); addEdge(2, 5);
        addEdge(3, 4); addEdge(4, 5);

        // Top triangle to grid row 0
        addEdge(3, G(0, 1));
        addEdge(4, G(0, 2));
        addEdge(5, G(0, 3));
        addEdge(3, G(0, 0));
        addEdge(3, G(0, 2));
        addEdge(5, G(0, 2));
        addEdge(5, G(0, 4));

        // Central 5x5 grid edges
        for (let r = 0; r < 5; r++) {
            for (let c = 0; c < 5; c++) {
                const n = G(r, c);
                if (c < 4) addEdge(n, G(r, c + 1));
                if (r < 4) addEdge(n, G(r + 1, c));
                if ((r + c) % 2 === 0) {
                    if (r < 4 && c < 4) addEdge(n, G(r + 1, c + 1));
                    if (r < 4 && c > 0) addEdge(n, G(r + 1, c - 1));
                }
            }
        }

        // Grid row 4 to bottom triangle
        addEdge(G(4, 1), 31);
        addEdge(G(4, 2), 32);
        addEdge(G(4, 3), 33);
        addEdge(G(4, 0), 31);
        addEdge(G(4, 2), 31);
        addEdge(G(4, 2), 33);
        addEdge(G(4, 4), 33);

        // Bottom triangle internal edges
        addEdge(31, 32); addEdge(32, 33);
        addEdge(31, 34); addEdge(32, 34);
        addEdge(32, 35); addEdge(33, 35);
        addEdge(34, 35);
        addEdge(34, 36); addEdge(35, 36);

        const EDGES = Array.from(edgeSet).map(s => {
            const parts = s.split(',');
            return [+parts[0], +parts[1]];
        });

        // Adjacency map
        const ADJACENCY = {};
        for (let i = 0; i < TOTAL_NODES; i++) ADJACENCY[i] = [];
        for (const [a, b] of EDGES) {
            ADJACENCY[a].push(b);
            ADJACENCY[b].push(a);
        }

        // Jump Map
        const JUMP_MAP = {};
        for (let i = 0; i < TOTAL_NODES; i++) JUMP_MAP[i] = {};

        function computeJump(a, b) {
            const dx1 = NODE_POSITIONS[b][0] - NODE_POSITIONS[a][0];
            const dy1 = NODE_POSITIONS[b][1] - NODE_POSITIONS[a][1];
            const d1 = Math.hypot(dx1, dy1);

            for (const c of ADJACENCY[b]) {
                if (c === a) continue;
                const dx2 = NODE_POSITIONS[c][0] - NODE_POSITIONS[b][0];
                const dy2 = NODE_POSITIONS[c][1] - NODE_POSITIONS[b][1];
                const d2 = Math.hypot(dx2, dy2);

                const cross = Math.abs(dx1 * dy2 - dy1 * dx2);
                const dot = dx1 * dx2 + dy1 * dy2;

                if (cross < 0.005 && dot > 0 && Math.abs(d1 - d2) / Math.max(d1, 1e-6) < 0.15) {
                    JUMP_MAP[a][b] = c;
                }
            }
        }

        for (const [a, b] of EDGES) {
            computeJump(a, b);
            computeJump(b, a);
        }

        // Initial Board Setup:
        // P1: Nodes 0-15 (Top triangle 0-5 + Grid rows 0-1 6-15) = 16 pieces
        // Empty: Nodes 16-20 (Grid row 2) = 5 empty nodes
        // P2: Nodes 21-36 (Grid rows 3-4 21-30 + Bottom triangle 31-36) = 16 pieces
        const INITIAL_STATE = new Array(TOTAL_NODES).fill(EMPTY);
        for (let i = 0; i <= 15; i++) INITIAL_STATE[i] = PLAYER_1;
        for (let i = 21; i <= 36; i++) INITIAL_STATE[i] = PLAYER_2;

        // Positional weights for AI
        const POSITION_WEIGHTS = new Array(TOTAL_NODES).fill(0);
        for (let i = 0; i < TOTAL_NODES; i++) {
            const dx = NODE_POSITIONS[i][0] - 0.5;
            const dy = NODE_POSITIONS[i][1] - 0.5;
            const dist = Math.hypot(dx, dy);
            POSITION_WEIGHTS[i] = Math.max(0.5, 5 - dist * 10);
        }
        POSITION_WEIGHTS[18] = 6.0; // Central grid node
        POSITION_WEIGHTS[17] = 5.2; POSITION_WEIGHTS[19] = 5.2;
        POSITION_WEIGHTS[12] = 5.0; POSITION_WEIGHTS[13] = 5.5; POSITION_WEIGHTS[14] = 5.0;
        POSITION_WEIGHTS[22] = 5.0; POSITION_WEIGHTS[23] = 5.5; POSITION_WEIGHTS[24] = 5.0;

        return {
            id: '16_guti',
            levelNumber: 2,
            name: '16 Guti',
            nativeName: '১৬ গুটি',
            subtitle: 'Sholo Guti · 16 Soldiers',
            tag: 'Grand Classic',
            boardType: 'expanded',
            totalNodes: TOTAL_NODES,
            piecesPerPlayer: PIECES_PER_PLAYER,
            nodePositions: NODE_POSITIONS,
            edges: EDGES,
            adjacency: ADJACENCY,
            jumpMap: JUMP_MAP,
            initialState: INITIAL_STATE,
            positionWeights: POSITION_WEIGHTS,
            theme: {
                p1Name: 'Radiant Gold',
                p2Name: 'Emerald Green',
                p1Class: 'gold-piece',
                p2Class: 'emerald-piece',
                p1Color: '#e8c170',
                p2Color: '#10b981',
                p1Glow: 'rgba(232, 193, 112, 0.45)',
                p2Glow: 'rgba(16, 185, 129, 0.45)'
            }
        };
    })();

    const LEVELS = {
        '12_guti': LEVEL_12,
        '16_guti': LEVEL_16
    };

    function getLevel(levelId) {
        return LEVELS[levelId] || LEVEL_12;
    }

    return {
        PLAYER_1,
        PLAYER_2,
        EMPTY,
        LEVEL_12,
        LEVEL_16,
        LEVELS,
        getLevel
    };
})();

// Legacy alias for existing codebase compatibility
const SholoGuti = {
    PLAYER_1: GutiGames.PLAYER_1,
    PLAYER_2: GutiGames.PLAYER_2,
    EMPTY: GutiGames.EMPTY,
    get TOTAL_NODES() { return GutiGames.LEVEL_16.totalNodes; },
    get NODE_POSITIONS() { return GutiGames.LEVEL_16.nodePositions; },
    get EDGES() { return GutiGames.LEVEL_16.edges; },
    get ADJACENCY() { return GutiGames.LEVEL_16.adjacency; },
    get JUMP_MAP() { return GutiGames.LEVEL_16.jumpMap; },
    get INITIAL_STATE() { return GutiGames.LEVEL_16.initialState; }
};
