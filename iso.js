// ===========================
// ISOMETRIC UTILITIES
// ===========================

const ISO = {
    TILE_WIDTH: 64,
    TILE_HEIGHT: 32,

    // Convert grid coordinates to screen coordinates
    toScreen(gridX, gridY) {
        const screenX = (gridX - gridY) * (this.TILE_WIDTH / 2);
        const screenY = (gridX + gridY) * (this.TILE_HEIGHT / 2);
        return { x: screenX, y: screenY };
    },

    // Convert screen coordinates to grid coordinates
    toGrid(screenX, screenY) {
        const gridX = (screenX / (this.TILE_WIDTH / 2) + screenY / (this.TILE_HEIGHT / 2)) / 2;
        const gridY = (screenY / (this.TILE_HEIGHT / 2) - screenX / (this.TILE_WIDTH / 2)) / 2;
        return { x: Math.floor(gridX), y: Math.floor(gridY) };
    }
};
