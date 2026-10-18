/* ═══════════════════════════════════════════════════════
   SHOLO GUTI — MAIN ENTRY POINT
   Initializes all modules and starts the application
   ═══════════════════════════════════════════════════════ */

(function () {
    'use strict';

    document.addEventListener('DOMContentLoaded', () => {
        // Initialize board renderer
        const canvas = document.getElementById('board-canvas');
        BoardRenderer.init(canvas);

        // Initialize piece renderer
        const piecesLayer = document.getElementById('pieces-layer');
        const highlightsLayer = document.getElementById('highlights-layer');
        PieceRenderer.init(piecesLayer, highlightsLayer);

        // Initialize UI
        UIController.init();

        console.log('%c🎮 Sholo Guti loaded!', 'color: #e8c170; font-size: 14px; font-weight: bold;');
    });
})();
