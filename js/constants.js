/* ═══════════════════════════════════════════════════════
   SHOLO GUTI — BOARD CONSTANTS & TOPOLOGY
   ═══════════════════════════════════════════════════════
 *
 * Traditional 37-node expanded Alquerque board:
 *
 *               0               ← Top apex
 *              / \
 *             1   2             ← Row T1
 *            / \ / \
 *           3   4   5           ← Row T2 (triangle base)
 *          /|\ /|\ /|\
 *   6---7---8---9--10           ← Grid row 0
 *   |\ /| X | X |/ \|
 *  11--12--13--14--15           ← Grid row 1
 *   |/ \| X | X |\ /|
 *  16--17--18--19--20           ← Grid row 2 (center)
 *   |\ /| X | X |/ \|
 *  21--22--23--24--25           ← Grid row 3
 *   |/ \| X | X |\ /|
 *  26--27--28--29--30           ← Grid row 4
 *           \|/ \|/
 *           31  32  33          ← Row B2 (triangle base)
 *            \ / \ /
 *            34  35             ← Row B1
 *              \ /
 *              36               ← Bottom apex
 *
 *  Total: 6 (top tri) + 25 (grid) + 6 (bottom tri) = 37
 *  Player 1 (Gold):    0-5 + 6-15  = 16 pieces (top)
 *  Player 2 (Emerald): 21-30 + 31-36 = 16 pieces (bottom)
 *  Center row 16-20: empty at start
 */

const SholoGuti = {};

SholoGuti.TOTAL_NODES = 37;
SholoGuti.PLAYER_1 = 1;  // Gold
SholoGuti.PLAYER_2 = 2;  // Emerald
SholoGuti.EMPTY = 0;

// ── Node Positions [x, y] as fractions of board size (0–1) ──
SholoGuti.NODE_POSITIONS = (() => {
    const pos = [];
    const PAD = 0.08;
    const SPAN = 1 - 2 * PAD;       // usable range
    const TRI_H = SPAN * 0.095;     // height per triangle row

    // Top triangle
    pos[0]  = [0.5, PAD];                              // apex
    pos[1]  = [0.5 - SPAN / 8, PAD + TRI_H];           // row T1 left
    pos[2]  = [0.5 + SPAN / 8, PAD + TRI_H];           // row T1 right
    pos[3]  = [0.5 - SPAN / 4, PAD + TRI_H * 2];       // row T2 left
    pos[4]  = [0.5,             PAD + TRI_H * 2];       // row T2 center
    pos[5]  = [0.5 + SPAN / 4, PAD + TRI_H * 2];       // row T2 right

    // Central grid 5×5 (rows 0–4)
    // Offset grid slightly inward so triangle bases don't overlap grid rows
    const gridGap    = TRI_H * 0.55;
    const gridTop    = PAD + TRI_H * 2 + gridGap;
    const gridBottom = 1 - PAD - TRI_H * 2 - gridGap;
    const rowH       = (gridBottom - gridTop) / 4;

    for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
            pos[6 + r * 5 + c] = [
                PAD + (c / 4) * SPAN,
                gridTop + r * rowH
            ];
        }
    }

    // Bottom triangle (mirrored: B2 base below grid row 4, then B1, then apex)
    const btBase = gridBottom + gridGap;
    pos[31] = [0.5 - SPAN / 4, btBase];                 // row B2 left
    pos[32] = [0.5,             btBase];                 // row B2 center
    pos[33] = [0.5 + SPAN / 4, btBase];                 // row B2 right
    pos[34] = [0.5 - SPAN / 8, btBase + TRI_H];         // row B1 left
    pos[35] = [0.5 + SPAN / 8, btBase + TRI_H];         // row B1 right
    pos[36] = [0.5,             btBase + TRI_H * 2];     // apex

    return pos;
})();

// ── Edge List (all line connections) ──
SholoGuti.EDGES = (() => {
    const set = new Set();
    const add = (a, b) => set.add(Math.min(a, b) + ',' + Math.max(a, b));

    // Convenience: grid node at row r, col c
    const G = (r, c) => 6 + r * 5 + c;

    /* ── Top Triangle ── */
    add(0, 1); add(0, 2);           // apex
    add(1, 2);                       // T1 horizontal
    add(1, 3); add(1, 4);           // T1→T2
    add(2, 4); add(2, 5);           // T1→T2
    add(3, 4); add(4, 5);           // T2 horizontal

    /* ── Triangle T2 to grid row 0 ──
       Base nodes 3,4,5 align with grid cols 1,2,3 respectively.
       Vertical links: 3→7, 4→8, 5→9
       Diagonals (continuing Alquerque pattern): 3→6, 3→8, 5→8, 5→10 */
    add(3, G(0, 1));  // 3→7 vertical
    add(4, G(0, 2));  // 4→8 vertical
    add(5, G(0, 3));  // 5→9 vertical
    add(3, G(0, 0));  // 3→6 diagonal left
    add(3, G(0, 2));  // 3→8 diagonal right
    add(5, G(0, 2));  // 5→8 diagonal left
    add(5, G(0, 4));  // 5→10 diagonal right

    /* ── Central Grid 5×5 ── */
    for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
            const n = G(r, c);
            if (c < 4) add(n, G(r, c + 1));                      // horizontal →
            if (r < 4) add(n, G(r + 1, c));                      // vertical ↓
            if ((r + c) % 2 === 0) {                              // diagonals on even squares
                if (r < 4 && c < 4) add(n, G(r + 1, c + 1));    // ↘
                if (r < 4 && c > 0) add(n, G(r + 1, c - 1));    // ↙
            }
        }
    }

    /* ── Grid row 4 to bottom triangle B2 ──
       Same pattern mirrored: 31,32,33 align with grid cols 1,2,3 */
    add(G(4, 1), 31);  // 27→31 vertical
    add(G(4, 2), 32);  // 28→32 vertical
    add(G(4, 3), 33);  // 29→33 vertical
    add(G(4, 0), 31);  // 26→31 diagonal
    add(G(4, 2), 31);  // 28→31 diagonal
    add(G(4, 2), 33);  // 28→33 diagonal
    add(G(4, 4), 33);  // 30→33 diagonal

    /* ── Bottom Triangle ── */
    add(31, 32); add(32, 33);        // B2 horizontal
    add(31, 34); add(32, 34);        // B2→B1
    add(32, 35); add(33, 35);        // B2→B1
    add(34, 35);                      // B1 horizontal
    add(34, 36); add(35, 36);        // B1→apex

    return Array.from(set).map(s => { const p = s.split(','); return [+p[0], +p[1]]; });
})();

// ── Adjacency Map ──
SholoGuti.ADJACENCY = (() => {
    const adj = {};
    for (let i = 0; i < SholoGuti.TOTAL_NODES; i++) adj[i] = [];
    for (const [a, b] of SholoGuti.EDGES) {
        adj[a].push(b);
        adj[b].push(a);
    }
    return adj;
})();

// ── Jump Map ──
// For each pair (a, b) where a and b are adjacent, find c adjacent to b
// such that a→b→c are collinear with equal spacing.
SholoGuti.JUMP_MAP = (() => {
    const jm = {};
    for (let i = 0; i < SholoGuti.TOTAL_NODES; i++) jm[i] = {};

    const P = SholoGuti.NODE_POSITIONS;

    function tryJump(a, b) {
        const dx1 = P[b][0] - P[a][0];
        const dy1 = P[b][1] - P[a][1];
        const d1  = Math.hypot(dx1, dy1);

        for (const c of SholoGuti.ADJACENCY[b]) {
            if (c === a) continue;
            const dx2 = P[c][0] - P[b][0];
            const dy2 = P[c][1] - P[b][1];
            const d2  = Math.hypot(dx2, dy2);

            const cross = Math.abs(dx1 * dy2 - dy1 * dx2);
            const dot   = dx1 * dx2 + dy1 * dy2;

            // Collinear, same direction, same distance (±15%)
            if (cross < 0.005 && dot > 0 && Math.abs(d1 - d2) / Math.max(d1, 1e-6) < 0.15) {
                jm[a][b] = c;
            }
        }
    }

    for (const [a, b] of SholoGuti.EDGES) {
        tryJump(a, b);
        tryJump(b, a);
    }

    return jm;
})();

// ── Initial Piece Placement ──
SholoGuti.INITIAL_STATE = (() => {
    const s = new Array(SholoGuti.TOTAL_NODES).fill(SholoGuti.EMPTY);

    // Gold (Player 1): top triangle 0-5 + grid rows 0-1 (nodes 6-15) = 16
    for (let i = 0; i <= 15; i++) s[i] = SholoGuti.PLAYER_1;

    // Emerald (Player 2): grid rows 3-4 (nodes 21-30) + bottom triangle 31-36 = 16
    for (let i = 21; i <= 36; i++) s[i] = SholoGuti.PLAYER_2;

    // Center row (16-20) stays empty
    return s;
})();
