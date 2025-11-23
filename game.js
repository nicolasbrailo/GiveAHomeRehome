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

// ===========================
// FOOD CLASS
// ===========================

class Food {
    constructor(scene, gridX, gridY, frameIndex, isFresh = false) {
        this.scene = scene;
        this.gridX = gridX;
        this.gridY = gridY;
        this.eaten = false;
        this.isFresh = isFresh; // Newly placed food attracts cats
        this.claimed = false; // A cat is heading to this food

        // Create food sprite
        const pos = ISO.toScreen(gridX, gridY);
        this.sprite = scene.add.sprite(pos.x, pos.y, 'food', frameIndex);
        this.sprite.setOrigin(0.5, 0.8);
        this.sprite.setScale(1.2);
        this.sprite.setDepth(50 + gridX + gridY);
    }

    checkCollision(cat) {
        if (this.eaten) return false;

        const distance = Math.sqrt(
            Math.pow(cat.gridX - this.gridX, 2) +
            Math.pow(cat.gridY - this.gridY, 2)
        );

        return distance < 0.5;
    }

    eat() {
        if (!this.eaten) {
            this.eaten = true;
            this.sprite.destroy();
        }
    }
}

// ===========================
// CAT CLASS
// ===========================

class Cat {
    constructor(scene, gridX, gridY, catType) {
        this.scene = scene;
        this.gridX = gridX;
        this.gridY = gridY;
        this.catType = catType;
        this.speed = 0.02;
        this.runSpeed = 0.04; // Faster when running to fresh food
        this.targetX = gridX;
        this.targetY = gridY;
        this.waitTimer = 0;
        this.isMoving = false;
        this.isEating = false;
        this.eatingTimer = 0;
        this.targetFood = null; // The food this cat is heading towards

        // Create cat sprite with animation
        const pos = ISO.toScreen(gridX, gridY);
        this.sprite = scene.add.sprite(pos.x, pos.y, `${catType}_idle`);
        this.sprite.setOrigin(0.5, 0.8); // Anchor at bottom center
        this.sprite.setScale(1.5); // Make cats a bit bigger
        this.sprite.setDepth(100 + gridX + gridY); // Set depth above floor

        // Play idle animation
        this.sprite.play(`${catType}_idle_anim`);
    }

    pickNewTarget(roomWidth, roomHeight) {
        // Pick a random spot in the room (leaving 1 tile border for walls)
        this.targetX = 1 + Math.floor(Math.random() * (roomWidth - 2));
        this.targetY = 1 + Math.floor(Math.random() * (roomHeight - 2));
        this.waitTimer = 0;
    }

    update(roomWidth, roomHeight, foodItems) {
        // Handle eating timer
        if (this.eatingTimer > 0) {
            this.eatingTimer--;
            if (this.eatingTimer === 0) {
                this.isEating = false;
                this.targetFood = null;
            }
            return;
        }

        // Check for nearby food (reached food)
        if (!this.isEating && foodItems) {
            for (let food of foodItems) {
                if (food.checkCollision(this)) {
                    // Found food nearby, start eating
                    this.isEating = true;
                    this.eatingTimer = 90; // Eat for 1.5 seconds
                    this.isMoving = false;
                    this.sprite.play(`${this.catType}_idle_anim`);
                    food.eat();
                    this.targetFood = null;
                    return;
                }
            }
        }

        // Check for fresh food to target
        if (!this.targetFood && foodItems) {
            for (let food of foodItems) {
                if (food.isFresh && !food.claimed && !food.eaten) {
                    // Found fresh unclaimed food, claim it and run to it
                    this.targetFood = food;
                    food.claimed = true;
                    this.targetX = food.gridX;
                    this.targetY = food.gridY;
                    this.waitTimer = 0;
                    break;
                }
            }
        }

        // If targeting food, check if it's still valid
        if (this.targetFood && this.targetFood.eaten) {
            this.targetFood = null;
        }

        // Wait at current position for a bit
        if (this.waitTimer > 0) {
            this.waitTimer--;

            // If just stopped moving, switch to idle animation
            if (this.isMoving) {
                this.isMoving = false;
                this.sprite.play(`${this.catType}_idle_anim`);
            }
            return;
        }

        // Check if reached target
        const dx = this.targetX - this.gridX;
        const dy = this.targetY - this.gridY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 0.05) {
            // Reached target
            if (this.targetFood) {
                // At food location, will eat on next update
                this.targetFood = null;
            } else {
                // Reached random wander target, pick new one after waiting
                this.waitTimer = 60 + Math.random() * 120; // Wait 1-3 seconds
                this.pickNewTarget(roomWidth, roomHeight);
            }
            this.isMoving = false;
            this.sprite.play(`${this.catType}_idle_anim`);
            return;
        }

        // Start walk animation if not already walking
        if (!this.isMoving) {
            this.isMoving = true;
            this.sprite.play(`${this.catType}_walk_anim`);
        }

        // Move toward target (faster if running to food)
        const currentSpeed = this.targetFood ? this.runSpeed : this.speed;
        const moveX = (dx / distance) * currentSpeed;
        const moveY = (dy / distance) * currentSpeed;

        this.gridX += moveX;
        this.gridY += moveY;

        // Flip sprite based on direction
        if (dx < 0) {
            this.sprite.setFlipX(true);
        } else if (dx > 0) {
            this.sprite.setFlipX(false);
        }

        // Update screen position
        const pos = ISO.toScreen(this.gridX, this.gridY);
        this.sprite.x = pos.x;
        this.sprite.y = pos.y;

        // Update depth for proper sorting (add 100 to ensure cats are above floor)
        this.sprite.setDepth(100 + this.gridX + this.gridY);
    }
}

// ===========================
// GAME CONFIGURATION
// ===========================

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#8B9DC3',
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

// ===========================
// GAME VARIABLES
// ===========================

let cats = [];
let foodItems = [];
let roomTiles = [];
let gameScene = null;
let foodMenu = [];
let draggedFood = null;
let draggedFoodSprite = null;
let cursors = null;
const ROOM_WIDTH = 16;
const ROOM_HEIGHT = 12;
const FOOD_TYPES = 40; // 8x5 grid in sprite sheet
const CAMERA_SPEED = 5;

// List of available cat sprite types with their file names
const CAT_TYPES = {
    'BatmanCatFree': { idle: 'IdleCatt.png', walk: 'JumpCattt.png' },
    'BlackCat': { idle: 'IdleCatb.png', walk: 'JumpCabt.png' },
    'Brown': { idle: 'IdleCattt.png', walk: 'JumpCatttt.png' },
    'Classical': { idle: 'IdleCat.png', walk: 'JumpCat.png' },
    'DemonicFree': { idle: 'IdleCatd.png', walk: 'JumpCatd.png' },
    'EgyptCatFree': { idle: 'IdleCatb.png', walk: 'JumpCabt.png' },
    'Siamese': { idle: 'IdleCattt.png', walk: 'JumpCatttt.png' },
    'ThreeColorFree': { idle: 'IdleCatt.png', walk: 'JumpCattt.png' },
    'TigerCatFree': { idle: 'IdleCatt.png', walk: 'JumpCattt.png' },
    'White': { idle: 'IdleCatttt.png', walk: 'JumpCattttt.png' },
    'Xmas': { idle: 'Idle2Cattt.png', walk: 'JumpCatttt.png' }
};

let availableCatTypes = [];

// ===========================
// GAME FUNCTIONS
// ===========================

function preload() {
    console.log('Preloading cat sprites...');

    // Load all cat sprite sheets
    Object.keys(CAT_TYPES).forEach(catType => {
        const basePath = `assets/AllCatsDemo/${catType}/`;
        const files = CAT_TYPES[catType];

        // Load idle sprite sheet
        this.load.spritesheet(`${catType}_idle`, `${basePath}${files.idle}`, {
            frameWidth: 32,
            frameHeight: 32
        });

        // Load jump/walk sprite sheet
        this.load.spritesheet(`${catType}_walk`, `${basePath}${files.walk}`, {
            frameWidth: 32,
            frameHeight: 32
        });

        availableCatTypes.push(catType);
    });

    // Load food sprites
    this.load.spritesheet('food', 'assets/CatInteraction/food.png', {
        frameWidth: 32,
        frameHeight: 32
    });

    console.log(`Loaded ${availableCatTypes.length} cat types and food sprites`);
}

function create() {
    console.log('Creating isometric playroom...');

    // Store scene reference
    gameScene = this;

    // Create animations for all cat types
    Object.keys(CAT_TYPES).forEach(catType => {
        // Idle animation
        this.anims.create({
            key: `${catType}_idle_anim`,
            frames: this.anims.generateFrameNumbers(`${catType}_idle`, { start: 0, end: -1 }),
            frameRate: 10,
            repeat: -1
        });

        // Walk animation
        this.anims.create({
            key: `${catType}_walk_anim`,
            frames: this.anims.generateFrameNumbers(`${catType}_walk`, { start: 0, end: -1 }),
            frameRate: 12,
            repeat: -1
        });
    });

    // Center the camera
    this.cameras.main.centerOn(0, 0);

    // Create the room
    createRoom(this);

    // Create furniture
    createFurniture(this);

    // Create cats with random sprites
    const catTypeKeys = Object.keys(CAT_TYPES);
    const numCats = 4;

    for (let i = 0; i < numCats; i++) {
        const randomCatType = catTypeKeys[Math.floor(Math.random() * catTypeKeys.length)];
        const randomX = 2 + Math.floor(Math.random() * (ROOM_WIDTH - 4));
        const randomY = 2 + Math.floor(Math.random() * (ROOM_HEIGHT - 4));
        cats.push(new Cat(this, randomX, randomY, randomCatType));
    }

    // Give cats initial targets
    cats.forEach(cat => cat.pickNewTarget(ROOM_WIDTH, ROOM_HEIGHT));

    // Create food menu UI
    createFoodMenu(this);

    // Setup drag and drop
    setupDragAndDrop(this);

    // Setup keyboard controls for camera
    cursors = this.input.keyboard.createCursorKeys();
}

function createRoom(scene) {
    const graphics = scene.add.graphics();

    // Draw floor tiles
    for (let y = 0; y < ROOM_HEIGHT; y++) {
        for (let x = 0; x < ROOM_WIDTH; x++) {
            const pos = ISO.toScreen(x, y);

            // Draw tile
            graphics.lineStyle(1, 0x999999, 0.5);
            graphics.fillStyle(0xDEB887, 1); // Tan floor color

            // Diamond shape for isometric tile
            graphics.beginPath();
            graphics.moveTo(pos.x, pos.y);
            graphics.lineTo(pos.x + ISO.TILE_WIDTH / 2, pos.y + ISO.TILE_HEIGHT / 2);
            graphics.lineTo(pos.x, pos.y + ISO.TILE_HEIGHT);
            graphics.lineTo(pos.x - ISO.TILE_WIDTH / 2, pos.y + ISO.TILE_HEIGHT / 2);
            graphics.closePath();
            graphics.fillPath();
            graphics.strokePath();
        }
    }

    // Set floor depth (below furniture and cats)
    graphics.setDepth(0);

    // Draw walls around the perimeter
    drawWalls(scene);

    // Add title text
    const title = scene.add.text(0, -120, 'Cozy Cat Playroom', {
        fontSize: '24px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 4
    });
    title.setOrigin(0.5);
}

function drawWalls(scene) {
    const graphics = scene.add.graphics();

    // Back wall (top)
    for (let x = 0; x < ROOM_WIDTH; x++) {
        const pos = ISO.toScreen(x, 0);
        graphics.fillStyle(0x8B7355, 1); // Brown wall
        graphics.fillRect(pos.x - ISO.TILE_WIDTH / 2, pos.y - 40, ISO.TILE_WIDTH / 2, 40);
    }

    // Left wall
    for (let y = 0; y < ROOM_HEIGHT; y++) {
        const pos = ISO.toScreen(0, y);
        graphics.fillStyle(0xA0826D, 1); // Lighter brown
        graphics.fillRect(pos.x - ISO.TILE_WIDTH / 2, pos.y, ISO.TILE_WIDTH / 2, ISO.TILE_HEIGHT / 2);
    }

    // Right wall
    for (let y = 0; y < ROOM_HEIGHT; y++) {
        const pos = ISO.toScreen(ROOM_WIDTH - 1, y);
        graphics.fillStyle(0x6D5D4B, 1); // Darker brown
        graphics.fillRect(pos.x, pos.y, ISO.TILE_WIDTH / 2, ISO.TILE_HEIGHT / 2);
    }

    // Set wall depth (below furniture and cats)
    graphics.setDepth(10);
}

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

function createFoodMenu(scene) {
    const menuY = 30;
    const startX = 100;
    const spacing = 60;

    // Create background for menu
    const menuBg = scene.add.graphics();
    menuBg.fillStyle(0x2c3e50, 0.9);
    menuBg.fillRect(0, 0, 800, 70);
    menuBg.setDepth(1000);
    menuBg.setScrollFactor(0); // Fixed to camera

    // Create food menu items (show 10 different food types)
    for (let i = 0; i < 10; i++) {
        const frameIndex = i * 4; // Sample different foods from sprite sheet
        const foodIcon = scene.add.sprite(startX + i * spacing, menuY, 'food', frameIndex);
        foodIcon.setScale(1.5);
        foodIcon.setInteractive({ draggable: true });
        foodIcon.setDepth(1001);
        foodIcon.setScrollFactor(0); // Fixed to camera
        foodIcon.setData('foodFrame', frameIndex);

        // Add hover effect
        foodIcon.on('pointerover', function() {
            this.setScale(1.7);
        });
        foodIcon.on('pointerout', function() {
            this.setScale(1.5);
        });

        foodMenu.push(foodIcon);
    }

    // Add instruction text
    const instructions = scene.add.text(400, 55, 'Drag food to feed the cats!', {
        fontSize: '14px',
        color: '#ecf0f1'
    });
    instructions.setOrigin(0.5);
    instructions.setDepth(1001);
    instructions.setScrollFactor(0);
}

function setupDragAndDrop(scene) {
    scene.input.on('dragstart', function(pointer, gameObject) {
        // Create a dragged sprite that follows the screen cursor
        const frameIndex = gameObject.getData('foodFrame');
        draggedFoodSprite = scene.add.sprite(0, 0, 'food', frameIndex);
        draggedFoodSprite.setScale(1.2);
        draggedFoodSprite.setDepth(2000);
        draggedFoodSprite.setAlpha(0.8);
        draggedFoodSprite.setScrollFactor(0); // Fixed to screen, not world
        draggedFoodSprite.x = pointer.x;
        draggedFoodSprite.y = pointer.y;
        draggedFood = frameIndex;
    });

    scene.input.on('drag', function(pointer, gameObject, dragX, dragY) {
        if (draggedFoodSprite) {
            // Use screen coordinates since scroll factor is 0
            draggedFoodSprite.x = pointer.x;
            draggedFoodSprite.y = pointer.y;
        }
    });

    scene.input.on('dragend', function(pointer, gameObject) {
        if (draggedFoodSprite && draggedFood !== null) {
            // Check if dropped in valid area (below menu)
            if (pointer.y > 70) {
                // Convert world position to grid position
                const worldX = pointer.worldX;
                const worldY = pointer.worldY;
                const gridPos = ISO.toGrid(worldX, worldY);

                console.log(`Dropped at world: (${worldX.toFixed(2)}, ${worldY.toFixed(2)}), grid: (${gridPos.x}, ${gridPos.y})`);

                // Check if within room bounds (with margin)
                if (gridPos.x >= 1 && gridPos.x <= ROOM_WIDTH - 2 &&
                    gridPos.y >= 1 && gridPos.y <= ROOM_HEIGHT - 2) {
                    // Place food at this location
                    const food = new Food(scene, gridPos.x, gridPos.y, draggedFood, true);
                    foodItems.push(food);
                } else {
                    console.log(`Food placement out of bounds: grid (${gridPos.x}, ${gridPos.y})`);
                }
            }

            // Clean up dragged sprite
            draggedFoodSprite.destroy();
            draggedFoodSprite = null;
            draggedFood = null;
        }
    });
}

function update() {
    // Handle camera movement with arrow keys
    if (cursors && gameScene) {
        const camera = gameScene.cameras.main;

        if (cursors.left.isDown) {
            camera.scrollX -= CAMERA_SPEED;
        }
        if (cursors.right.isDown) {
            camera.scrollX += CAMERA_SPEED;
        }
        if (cursors.up.isDown) {
            camera.scrollY -= CAMERA_SPEED;
        }
        if (cursors.down.isDown) {
            camera.scrollY += CAMERA_SPEED;
        }
    }

    // Clean up eaten food
    foodItems = foodItems.filter(food => !food.eaten);

    // Update all cats
    cats.forEach(cat => {
        cat.update(ROOM_WIDTH, ROOM_HEIGHT, foodItems);
    });
}
