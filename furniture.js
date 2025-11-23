// ===========================
// FURNITURE CREATION FUNCTIONS
// ===========================

function createFurniture(scene) {
    // Cat trees
    createCatTree(scene, 2, 2);
    createCatTree(scene, 13, 9);

    // Cat beds
    createCatBed(scene, 13, 2);
    createCatBed(scene, 3, 9);

    // Toy boxes
    createToyBox(scene, 8, 3);
    createToyBox(scene, 5, 8);

    // Food bowls
    createBowls(scene, 11, 6);
    createBowls(scene, 7, 9);
}

function createCatTree(scene, gridX, gridY) {
    const pos = ISO.toScreen(gridX, gridY);
    const graphics = scene.add.graphics();

    // Base
    graphics.fillStyle(0x8B4513, 1);
    graphics.fillRect(pos.x - 15, pos.y - 10, 30, 10);

    // Post
    graphics.fillRect(pos.x - 5, pos.y - 50, 10, 40);

    // Platform
    graphics.fillStyle(0xD2691E, 1);
    graphics.fillRect(pos.x - 20, pos.y - 55, 40, 5);

    graphics.x = pos.x;
    graphics.y = pos.y;
    graphics.setDepth(50 + gridX + gridY);
}

function createCatBed(scene, gridX, gridY) {
    const pos = ISO.toScreen(gridX, gridY);
    const graphics = scene.add.graphics();

    // Bed outline
    graphics.fillStyle(0xFF6B9D, 1); // Pink bed
    graphics.fillEllipse(0, -5, 30, 20);

    // Inner part (lighter)
    graphics.fillStyle(0xFFB6C1, 1);
    graphics.fillEllipse(0, -5, 20, 12);

    graphics.x = pos.x;
    graphics.y = pos.y;
    graphics.setDepth(50 + gridX + gridY);
}

function createToyBox(scene, gridX, gridY) {
    const pos = ISO.toScreen(gridX, gridY);
    const graphics = scene.add.graphics();

    // Box
    graphics.fillStyle(0x4169E1, 1); // Blue box
    graphics.fillRect(0, -15, 25, 15);

    // Top
    graphics.fillStyle(0x6495ED, 1);
    graphics.beginPath();
    graphics.moveTo(0, -15);
    graphics.lineTo(12, -20);
    graphics.lineTo(37, -20);
    graphics.lineTo(25, -15);
    graphics.closePath();
    graphics.fillPath();

    graphics.x = pos.x - 12;
    graphics.y = pos.y;
    graphics.setDepth(50 + gridX + gridY);
}

function createBowls(scene, gridX, gridY) {
    const pos = ISO.toScreen(gridX, gridY);
    const graphics = scene.add.graphics();

    // Food bowl
    graphics.fillStyle(0xFFD700, 1); // Gold
    graphics.fillEllipse(-10, -3, 12, 8);
    graphics.fillStyle(0xFF8C00, 1); // Orange food
    graphics.fillEllipse(-10, -5, 8, 5);

    // Water bowl
    graphics.fillStyle(0xC0C0C0, 1); // Silver
    graphics.fillEllipse(10, -3, 12, 8);
    graphics.fillStyle(0x87CEEB, 1); // Blue water
    graphics.fillEllipse(10, -5, 8, 5);

    graphics.x = pos.x;
    graphics.y = pos.y;
    graphics.setDepth(50 + gridX + gridY);
}
