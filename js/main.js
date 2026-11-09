/* ═══════════════════════════════════════════════════════════════════════════════
   GUTI STRATEGY BOARD GAMES — MAIN APPLICATION ENTRY POINT
   Initializes audio, canvas board, piece layers, and UI controllers
   ═══════════════════════════════════════════════════════════════════════════════ */

(function () {
    'use strict';

    document.addEventListener('DOMContentLoaded', () => {
        // Initialize board canvas renderer
        const canvas = document.getElementById('board-canvas');
        if (canvas) {
            BoardRenderer.init(canvas);
        }

        // Initialize piece renderer
        const piecesLayer = document.getElementById('pieces-layer');
        const highlightsLayer = document.getElementById('highlights-layer');
        if (piecesLayer && highlightsLayer) {
            PieceRenderer.init(piecesLayer, highlightsLayer);
        }

        // Initialize UI controller
        UIController.init();

        console.log('%c⚔️ Guti Strategy Board Games (12 Guti & 16 Guti) Ready!', 'color: #84cc16; font-size: 14px; font-weight: bold;');
    });
})();
