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
let beds = [];
let carpets = [];
let litterBoxes = [];
let roomTiles = [];
let vomitSplatters = [];
let gameScene = null;
let foodMenu = [];
let bedMenu = [];
let draggedItemSprite = null;
let draggedItemType = null;
let draggedItemFrame = null;
let cursors = null;
let isCameraDragging = false;
let cameraDragStart = null;
let lastCameraPosition = null;
const ROOM_WIDTH = 16;
const ROOM_HEIGHT = 12;
const FOOD_TYPES = 6; // 255÷64 = 3 cols × 188÷64 = 2 rows = ~6 frames
const BED_TYPES = 2; // 237÷120 = 1 col × 181÷92 = 1 row = ~2 frames
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
        frameWidth: 64,
        frameHeight: 64
    });

    // Load bed sprites
    this.load.spritesheet('beds', 'assets/CatInteraction/beds.png', {
        frameWidth: 120,
        frameHeight: 92
    });

    // Load wall textures
    this.load.spritesheet('walls', 'assets/Room/walls.png', {
        frameWidth: 140,
        frameHeight: 96
    });

    // Load carpet textures
    this.load.spritesheet('carpets', 'assets/Room/carpets.png', {
        frameWidth: 143,
        frameHeight: 96
    });

    console.log(`Loaded ${availableCatTypes.length} cat types, food sprites, bed sprites, wall textures, and carpet textures`);
}

function create() {
    console.log('Creating isometric playroom...');

    // Store scene reference
    gameScene = this;

    // Make vomit array accessible to scene
    this.vomitSplatters = vomitSplatters;

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
    createRoom(this, ROOM_WIDTH, ROOM_HEIGHT, roomTiles);

    // Track occupied positions to prevent overlaps
    const occupiedPositions = [];

    // Helper function to check if position is too close to occupied positions
    function isPositionValid(x, y, minDistance = 2) {
        for (let pos of occupiedPositions) {
            const distance = Math.sqrt(Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2));
            if (distance < minDistance) {
                return false;
            }
        }
        return true;
    }

    // Helper function to find a valid random position
    function findValidPosition(minDistance = 2, maxAttempts = 50) {
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const x = 3 + Math.floor(Math.random() * (ROOM_WIDTH - 6));
            const y = 3 + Math.floor(Math.random() * (ROOM_HEIGHT - 6));
            if (isPositionValid(x, y, minDistance)) {
                return { x, y };
            }
        }
        // If no valid position found after max attempts, return null
        return null;
    }

    // Spawn carpets randomly (before furniture to maintain depth order)
    const numCarpets = 2;
    const carpetFrameCount = this.textures.get('carpets').frameTotal;
    for (let i = 0; i < numCarpets; i++) {
        const frameIndex = Math.floor(Math.random() * carpetFrameCount);
        const pos = findValidPosition(3); // Carpets need 3 tile minimum spacing
        if (pos) {
            carpets.push(new Carpet(this, pos.x, pos.y, frameIndex));
            occupiedPositions.push(pos);
        }
    }

    // Create furniture (pass occupied positions to avoid overlaps)
    // Disabled placeholder furniture - users will place their own items
    // createFurnitureWithSpacing(this, occupiedPositions);

    // Create litter box in a visible corner
    const litterBoxX = 2; // Near left side
    const litterBoxY = 2; // Near top - more visible
    litterBoxes.push(new LitterBox(this, litterBoxX, litterBoxY));
    occupiedPositions.push({ x: litterBoxX, y: litterBoxY });
    console.log('Created litter box at:', litterBoxX, litterBoxY);

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

    // Create food and bed menu UI (beds are now placeable by user)
    createFoodMenu(this);

    // Setup drag and drop
    setupDragAndDrop(this);

    // Setup keyboard controls for camera
    cursors = this.input.keyboard.createCursorKeys();

    // Setup touch/mouse controls for camera panning
    setupCameraControls(this);

    // Setup cat interaction (hover and click for stats)
    setupCatInteraction(this);
}

function setupCameraControls(scene) {
    let pointerDownTime = 0;

    // Track pointer down on empty space (not on draggable items)
    scene.input.on('pointerdown', function(pointer) {
        pointerDownTime = Date.now();

        // Check if pointer is over a draggable object
        const objectsUnderPointer = scene.input.hitTestPointer(pointer);
        const isDraggableObject = objectsUnderPointer.some(obj => obj.input && obj.input.draggable);

        // Only start camera drag if not clicking on a draggable item and below menu
        if (pointer.y > 70 && !isDraggableObject) {
            // Add small delay to distinguish tap from drag
            setTimeout(() => {
                if (Date.now() - pointerDownTime > 100 && pointer.isDown) {
                    isCameraDragging = true;
                    cameraDragStart = { x: pointer.x, y: pointer.y };
                    lastCameraPosition = {
                        x: scene.cameras.main.scrollX,
                        y: scene.cameras.main.scrollY
                    };
                }
            }, 100);
        }
    });

    scene.input.on('pointermove', function(pointer) {
        if (isCameraDragging && cameraDragStart && lastCameraPosition) {
            // Calculate delta from drag start
            const deltaX = cameraDragStart.x - pointer.x;
            const deltaY = cameraDragStart.y - pointer.y;

            // Move camera based on drag (inverted for natural feel)
            scene.cameras.main.scrollX = lastCameraPosition.x + deltaX;
            scene.cameras.main.scrollY = lastCameraPosition.y + deltaY;
        }
    });

    scene.input.on('pointerup', function(pointer) {
        isCameraDragging = false;
        cameraDragStart = null;
        lastCameraPosition = null;
    });
}

function setupCatInteraction(scene) {
    let clickedCat = null;

    // Hover to show stats temporarily
    scene.input.on('gameobjectover', function(pointer, gameObject) {
        const catInstance = gameObject.getData('catInstance');
        if (catInstance && catInstance !== clickedCat) {
            catInstance.showStats();
        }
    });

    // Hover out to hide stats (unless clicked)
    scene.input.on('gameobjectout', function(pointer, gameObject) {
        const catInstance = gameObject.getData('catInstance');
        if (catInstance && catInstance !== clickedCat) {
            catInstance.hideStats();
        }
    });

    // Click/tap to toggle stats (persistent)
    scene.input.on('gameobjectdown', function(pointer, gameObject) {
        const catInstance = gameObject.getData('catInstance');
        if (catInstance) {
            // If there was a previously clicked cat, hide its stats
            if (clickedCat && clickedCat !== catInstance) {
                clickedCat.hideStats();
            }

            // Toggle stats for this cat
            if (clickedCat === catInstance) {
                catInstance.hideStats();
                clickedCat = null;
            } else {
                catInstance.showStats();
                clickedCat = catInstance;
            }
        }
    });

    // Hide stats when clicking on empty space
    scene.input.on('pointerdown', function(pointer) {
        const objectsUnderPointer = scene.input.hitTestPointer(pointer);
        const clickedOnCat = objectsUnderPointer.some(obj => obj.getData('catInstance'));

        if (!clickedOnCat && clickedCat) {
            clickedCat.hideStats();
            clickedCat = null;
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
        cat.update(ROOM_WIDTH, ROOM_HEIGHT, foodItems, beds, cats, litterBoxes);
    });
}
