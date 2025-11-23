# GiveAHomeRehome - Isometric Cat Playroom Game

## Project Overview
An interactive browser-based game featuring an isometric cat playroom where users can watch cats wander around and feed them by dragging food items into the room.

## Technology Stack
- **Game Engine**: Phaser 3 (v3.80.1) loaded from CDN
- **Languages**: HTML5 + JavaScript (vanilla)
- **Graphics**: PNG sprite sheets with animations
- **Rendering**: Isometric 2D perspective

## Current Implementation Status

### File Structure
```
/home/batman/src/GiveAHomeRehome/
├── index.html          # Main HTML entry point
├── game.js             # Main game logic (650+ lines)
├── context.md          # This file
└── assets/
    ├── AllCatsDemo/    # Cat sprite sheets
    │   ├── BatmanCatFree/
    │   ├── BlackCat/
    │   ├── Brown/
    │   ├── Classical/
    │   ├── DemonicFree/
    │   ├── EgyptCatFree/
    │   ├── Siamese/
    │   ├── ThreeColorFree/
    │   ├── TigerCatFree/
    │   ├── White/
    │   └── Xmas/
    └── CatInteraction/
        └── food.png    # Food sprite sheet (263x188, 40 frames in 8x5 grid)
```

### Key Features Implemented

#### 1. Isometric System (game.js:5-22)
- **ISO utility object**: Converts between Cartesian and isometric coordinates
- Tile dimensions: 64x32 pixels (2:1 ratio)
- Functions: `toScreen()` and `toGrid()`

#### 2. Room & Environment
- **Room size**: 16x12 grid tiles
- **Canvas size**: 800x600 pixels
- **Floor**: Tan colored diamond-shaped tiles
- **Walls**: Brown perimeter walls
- **Furniture**:
  - 2 cat trees (brown, with platforms)
  - 2 pink cat beds
  - 2 blue toy boxes
  - 2 sets of food/water bowls

#### 3. Cat System (game.js:68-210)
- **Number of cats**: 4 cats spawn with random types and positions
- **Cat types**: 11 different cat sprite variations
- **Animations**:
  - Idle animation (10 FPS)
  - Walk animation (12 FPS)
- **AI Behaviors**:
  - Random wandering at normal speed (0.02 grid units/frame)
  - Running towards fresh food at double speed (0.04)
  - First cat to claim food wins (claiming system)
  - Eating animation lasts 1.5 seconds
  - Sprite flipping based on movement direction

#### 4. Food System (game.js:28-62)
- **Food class**: Manages food items with collision detection
- **Properties**:
  - `isFresh`: Newly placed food attracts cats
  - `claimed`: Prevents multiple cats targeting same food
  - `eaten`: Triggers removal
- **Collision detection**: Within 0.5 grid units

#### 5. UI & Controls

##### Food Menu (game.js:521-567)
- Dark menu bar at top (800x70 pixels)
- 10 different food types displayed
- Hover effect on food icons (scale 1.5 → 1.7)
- Fixed to camera (doesn't scroll)

##### Drag & Drop (game.js:569-619)
- Drag food from menu
- Semi-transparent preview while dragging
- Drop onto playroom to place food
- Cats race to fresh food

##### Camera Controls (game.js:621-640)
- Arrow keys move camera at 5 pixels/frame
- ↑↓←→ for panning around room
- UI menu stays fixed while room scrolls

#### 6. Depth Sorting System
Ensures proper rendering order:
- **Depth 0**: Floor tiles
- **Depth 10**: Walls
- **Depth 50 + (gridX + gridY)**: Furniture and placed food
- **Depth 100 + (gridX + gridY)**: Cats
- **Depth 1000+**: UI elements
- **Depth 2000**: Dragged food preview

### Technical Details

#### Cat Sprite Loading
Each cat type has two sprite sheets:
- **Idle**: e.g., `IdleCat.png` (224x32, 7 frames @ 32x32)
- **Walk/Jump**: e.g., `JumpCat.png` (416x32, 13 frames @ 32x32)

Note: File naming is inconsistent across cat types (see `CAT_TYPES` object in game.js:249-261)

#### Food Sprite Sheet
- **File**: `food.png` (263x188 pixels)
- **Frame size**: 32x32 pixels
- **Total frames**: 40 (8 columns × 5 rows)
- Menu displays every 4th frame (frames 0, 4, 8, 12...)

#### Coordinate Conversion
```javascript
// Screen to Grid (for food placement)
worldX = pointer.worldX
worldY = pointer.worldY
gridPos = ISO.toGrid(worldX, worldY)

// Grid to Screen (for rendering)
screenPos = ISO.toScreen(gridX, gridY)
```

#### Important: Scroll Factors
- **World objects (cats, food, room)**: scrollFactor = 1 (default)
- **UI elements (menu, text)**: scrollFactor = 0 (fixed to camera)
- **Dragged food preview**: scrollFactor = 0 (follows cursor exactly)

### Game Variables (game.js:235-246)
```javascript
let cats = [];              // Array of Cat instances
let foodItems = [];         // Array of Food instances
let gameScene = null;       // Reference to Phaser scene
let foodMenu = [];          // UI food icons
let draggedFood = null;     // Currently dragged food frame index
let draggedFoodSprite = null; // Dragged sprite object
let cursors = null;         // Arrow key input
const ROOM_WIDTH = 16;      // Grid width
const ROOM_HEIGHT = 12;     // Grid height
const FOOD_TYPES = 40;      // Number of food sprites
const CAMERA_SPEED = 5;     // Camera pan speed
```

### Game Loop (game.js:621-647)
1. Handle camera movement (arrow keys)
2. Clean up eaten food
3. Update all cats (check for food, move, animate)

### Cat AI Decision Tree
```
Is eating? → Continue eating timer → Done
   ↓ No
Has nearby food? → Start eating → Remove food
   ↓ No
Has targetFood set? → Move towards it fast
   ↓ No
Any fresh unclaimed food? → Claim it, set as target
   ↓ No
Is waiting? → Idle animation, count down timer
   ↓ No
Reached wander target? → Start waiting, pick new target
   ↓ No
Walking to target → Move at normal speed
```

### How to Run
```bash
cd /home/batman/src/GiveAHomeRehome
python3 -m http.server 8000
# Open browser to http://localhost:8000
```

### Known Limitations
1. No collision between cats (they can overlap)
2. Cats don't avoid furniture when pathfinding
3. Camera can scroll beyond room boundaries
4. No limit on number of food items that can be placed
5. No save/load functionality
6. No sound effects or background music

### Recent Fixes
- ✅ Fixed dragged food sprite positioning (now uses screen space)
- ✅ Fixed food placement bounds checking
- ✅ Cats properly render above floor tiles
- ✅ Camera movement works with drag & drop

### Potential Next Steps
1. Add camera bounds to prevent scrolling off-room
2. Add collision detection between cats
3. Implement pathfinding around furniture
4. Add sound effects (meowing, eating sounds)
5. Add more interactive elements (toys, scratching posts)
6. Add cat happiness/satisfaction metrics
7. Add ability to pet cats with mouse
8. Implement day/night cycle
9. Add more room types or expandable playroom
10. Save game state to localStorage

### Code Architecture

#### Classes
- **Food**: Manages individual food items
  - Constructor: `(scene, gridX, gridY, frameIndex, isFresh)`
  - Methods: `checkCollision(cat)`, `eat()`

- **Cat**: Manages individual cat behavior
  - Constructor: `(scene, gridX, gridY, catType)`
  - Methods: `pickNewTarget(roomWidth, roomHeight)`, `update(roomWidth, roomHeight, foodItems)`

#### Main Functions
- `preload()`: Load all sprite assets
- `create()`: Initialize game scene, create objects, setup controls
- `update()`: Game loop called every frame
- `createRoom(scene)`: Build floor and walls
- `drawWalls(scene)`: Render wall graphics
- `createFurniture(scene)`: Place furniture items
- `createFoodMenu(scene)`: Build UI menu
- `setupDragAndDrop(scene)`: Setup input handlers

### Asset Requirements
- Cat sprites must be 32x32 frame size
- Each cat needs idle and walk sprite sheets
- Food sprite sheet should be evenly divided grid
- All sprites should be PNG with transparency

### Performance Notes
- Game runs at 60 FPS (Phaser default)
- 4 cats + multiple food items + furniture renders smoothly
- No performance issues with current implementation
- Could potentially support 10-20 cats without issues

## Debug Tips
- Open browser console (F12) to see food placement coordinates
- Console logs: `Dropped at world: (x, y), grid: (x, y)`
- Use console to inspect `cats` and `foodItems` arrays
- Check sprite loading in Network tab if assets don't appear

## Session Date
November 23, 2025
