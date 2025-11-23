// ===========================
// ROOM CREATION FUNCTIONS
// ===========================

function createRoom(scene, roomWidth, roomHeight, roomTiles) {
    // Pick random textures for floor and walls
    const wallFrameCount = scene.textures.get('walls').frameTotal;
    const floorTextureFrame = Math.floor(Math.random() * wallFrameCount);
    const wallTextureFrame = Math.floor(Math.random() * wallFrameCount);

    // Draw floor tiles using random texture
    for (let y = 0; y < roomHeight; y++) {
        for (let x = 0; x < roomWidth; x++) {
            const pos = ISO.toScreen(x, y);

            // Create floor tile sprite
            const floorTile = scene.add.sprite(pos.x, pos.y, 'walls', floorTextureFrame);
            floorTile.setOrigin(0.5, 0.5);
            floorTile.setScale(0.5); // Scale to fit isometric tiles
            floorTile.setDepth(0); // Floor is at depth 0
            floorTile.setAlpha(0.8); // Slightly transparent for texture blend

            roomTiles.push(floorTile);
        }
    }

    // Draw walls around the perimeter
    drawWalls(scene, roomWidth, roomHeight, wallTextureFrame);

    // Add title text
    const title = scene.add.text(0, -120, 'Cozy Cat Playroom', {
        fontSize: '24px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 4
    });
    title.setOrigin(0.5);
}

function drawWalls(scene, roomWidth, roomHeight, wallTextureFrame) {
    const WALL_HEIGHT = 120;
    const FLOOR_EXTENSION = 16; // Extra pixels to reach down to floor level
    const graphics = scene.add.graphics();

    // Back wall (top) - draw as continuous smooth wall
    const backWallStartPos = ISO.toScreen(0, 0);
    const backWallEndPos = ISO.toScreen(roomWidth - 1, 0);

    // Back wall main panel - extended to floor
    graphics.fillStyle(0x8B7355, 1); // Opaque
    graphics.beginPath();
    graphics.moveTo(backWallStartPos.x - ISO.TILE_WIDTH / 2, backWallStartPos.y - WALL_HEIGHT);
    graphics.lineTo(backWallEndPos.x + ISO.TILE_WIDTH / 2, backWallEndPos.y - WALL_HEIGHT);
    graphics.lineTo(backWallEndPos.x + ISO.TILE_WIDTH / 2, backWallEndPos.y + FLOOR_EXTENSION);
    graphics.lineTo(backWallStartPos.x - ISO.TILE_WIDTH / 2, backWallStartPos.y + FLOOR_EXTENSION);
    graphics.closePath();
    graphics.fillPath();

    // Back wall gradient overlay for depth
    graphics.fillStyle(0x6D5D4B, 0.3);
    graphics.beginPath();
    graphics.moveTo(backWallStartPos.x - ISO.TILE_WIDTH / 2, backWallStartPos.y - WALL_HEIGHT);
    graphics.lineTo(backWallEndPos.x + ISO.TILE_WIDTH / 2, backWallEndPos.y - WALL_HEIGHT);
    graphics.lineTo(backWallEndPos.x + ISO.TILE_WIDTH / 2, backWallEndPos.y - WALL_HEIGHT / 2);
    graphics.lineTo(backWallStartPos.x - ISO.TILE_WIDTH / 2, backWallStartPos.y - WALL_HEIGHT / 2);
    graphics.closePath();
    graphics.fillPath();

    // Left wall - draw as continuous isometric panels
    for (let y = 0; y < roomHeight; y++) {
        const pos = ISO.toScreen(0, y);
        const nextPos = ISO.toScreen(0, y + 1);

        // Main panel (angled face)
        graphics.fillStyle(0xA0826D, 1); // Opaque
        graphics.beginPath();
        graphics.moveTo(pos.x - ISO.TILE_WIDTH / 2, pos.y - WALL_HEIGHT);
        graphics.lineTo(pos.x, pos.y - WALL_HEIGHT + ISO.TILE_HEIGHT / 2);
        graphics.lineTo(nextPos.x, nextPos.y - WALL_HEIGHT + ISO.TILE_HEIGHT / 2);
        graphics.lineTo(nextPos.x - ISO.TILE_WIDTH / 2, nextPos.y - WALL_HEIGHT);
        graphics.closePath();
        graphics.fillPath();

        // Left face (darker vertical face) - extended to floor
        graphics.fillStyle(0x8B8679, 1); // Opaque
        graphics.beginPath();
        graphics.moveTo(pos.x - ISO.TILE_WIDTH / 2, pos.y - WALL_HEIGHT);
        graphics.lineTo(pos.x - ISO.TILE_WIDTH / 2, pos.y + FLOOR_EXTENSION);
        graphics.lineTo(nextPos.x - ISO.TILE_WIDTH / 2, nextPos.y + FLOOR_EXTENSION);
        graphics.lineTo(nextPos.x - ISO.TILE_WIDTH / 2, nextPos.y - WALL_HEIGHT);
        graphics.closePath();
        graphics.fillPath();

        // Top edge - extended to floor
        graphics.fillStyle(0xBFA98A, 1); // Opaque
        graphics.beginPath();
        graphics.moveTo(pos.x - ISO.TILE_WIDTH / 2, pos.y - WALL_HEIGHT);
        graphics.lineTo(pos.x, pos.y - WALL_HEIGHT + ISO.TILE_HEIGHT / 2);
        graphics.lineTo(pos.x, pos.y + ISO.TILE_HEIGHT / 2 + FLOOR_EXTENSION);
        graphics.lineTo(pos.x - ISO.TILE_WIDTH / 2, pos.y + FLOOR_EXTENSION);
        graphics.closePath();
        graphics.fillPath();
    }

    // Right wall removed - only back and left walls remain

    // Add subtle line details to walls for texture
    graphics.lineStyle(1, 0x000000, 0.1);

    // Horizontal lines on back wall
    for (let i = 1; i < 5; i++) {
        const y = backWallStartPos.y - (WALL_HEIGHT * i / 5);
        graphics.beginPath();
        graphics.moveTo(backWallStartPos.x - ISO.TILE_WIDTH / 2, y);
        graphics.lineTo(backWallEndPos.x + ISO.TILE_WIDTH / 2, y);
        graphics.strokePath();
    }

    // Set wall depth (below furniture and cats)
    graphics.setDepth(10);
}
