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

            // Create smooth floor tile as a filled diamond shape
            const floorGraphics = scene.add.graphics();
            floorGraphics.fillStyle(0xD4C4B0, 1); // Light wood color
            floorGraphics.beginPath();
            floorGraphics.moveTo(pos.x, pos.y - ISO.TILE_HEIGHT / 2); // Top
            floorGraphics.lineTo(pos.x + ISO.TILE_WIDTH / 2, pos.y); // Right
            floorGraphics.lineTo(pos.x, pos.y + ISO.TILE_HEIGHT / 2); // Bottom
            floorGraphics.lineTo(pos.x - ISO.TILE_WIDTH / 2, pos.y); // Left
            floorGraphics.closePath();
            floorGraphics.fillPath();

            // Add subtle outline for tile separation
            floorGraphics.lineStyle(1, 0xB0A090, 0.3);
            floorGraphics.strokePath();

            floorGraphics.setDepth(0);
            roomTiles.push(floorGraphics);
        }
    }

    // Draw walls around the perimeter
    drawWalls(scene, roomWidth, roomHeight, wallTextureFrame);

    // Add title text (moved higher to avoid wall overlap)
    const title = scene.add.text(0, -180, 'Cozy Cat Playroom', {
        fontSize: '24px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 4
    });
    title.setOrigin(0.5);
    title.setDepth(15); // Above walls
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

    // Left wall - ONE smooth continuous parallelogram
    const leftWallTop = ISO.toScreen(0, 0);
    const leftWallBottom = ISO.toScreen(0, roomHeight);

    // Draw left wall as single smooth surface (parallelogram from top to floor)
    graphics.fillStyle(0xA0826D, 1);
    graphics.beginPath();
    graphics.moveTo(leftWallTop.x - ISO.TILE_WIDTH / 2, leftWallTop.y - WALL_HEIGHT);
    graphics.lineTo(leftWallBottom.x - ISO.TILE_WIDTH / 2, leftWallBottom.y - WALL_HEIGHT);
    graphics.lineTo(leftWallBottom.x - ISO.TILE_WIDTH / 2, leftWallBottom.y + FLOOR_EXTENSION);
    graphics.lineTo(leftWallTop.x - ISO.TILE_WIDTH / 2, leftWallTop.y + FLOOR_EXTENSION);
    graphics.closePath();
    graphics.fillPath();

    // Subtle gradient overlay for depth
    graphics.fillStyle(0x8D7360, 0.25);
    graphics.beginPath();
    graphics.moveTo(leftWallTop.x - ISO.TILE_WIDTH / 2, leftWallTop.y - WALL_HEIGHT);
    graphics.lineTo(leftWallBottom.x - ISO.TILE_WIDTH / 2, leftWallBottom.y - WALL_HEIGHT);
    graphics.lineTo(leftWallBottom.x - ISO.TILE_WIDTH / 2, leftWallBottom.y - WALL_HEIGHT / 2);
    graphics.lineTo(leftWallTop.x - ISO.TILE_WIDTH / 2, leftWallTop.y - WALL_HEIGHT / 2);
    graphics.closePath();
    graphics.fillPath();

    // Right wall removed - only back and left walls remain

    // Set wall depth (below furniture and cats)
    graphics.setDepth(10);
}
