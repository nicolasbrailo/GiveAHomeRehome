// ===========================
// UI AND INTERACTION FUNCTIONS
// ===========================

function createFoodMenu(scene) {
    const menuY = 30;
    const startX = 100;
    const spacing = 70;

    // Create background for menu
    const menuBg = scene.add.graphics();
    menuBg.fillStyle(0x2c3e50, 0.9);
    menuBg.fillRect(0, 0, 800, 70);
    menuBg.setDepth(1000);
    menuBg.setScrollFactor(0); // Fixed to camera

    // Create food menu items
    const numFoodItems = Math.min(FOOD_TYPES, 6);
    for (let i = 0; i < numFoodItems; i++) {
        const frameIndex = i;
        const foodIcon = scene.add.sprite(startX + i * spacing, menuY, 'food', frameIndex);
        foodIcon.setScale(0.6);
        foodIcon.setInteractive({ draggable: true });
        foodIcon.setDepth(1001);
        foodIcon.setScrollFactor(0);
        foodIcon.setData('itemType', 'food');
        foodIcon.setData('frameIndex', frameIndex);

        // Add hover effect
        foodIcon.on('pointerover', function() {
            this.setScale(0.7);
        });
        foodIcon.on('pointerout', function() {
            this.setScale(0.6);
        });

        foodMenu.push(foodIcon);
    }

    // Create bed menu items
    const bedStartX = startX + numFoodItems * spacing;
    for (let i = 0; i < BED_TYPES; i++) {
        const bedIcon = scene.add.sprite(bedStartX + i * spacing, menuY, 'beds', i);
        bedIcon.setScale(0.4);
        bedIcon.setInteractive({ draggable: true });
        bedIcon.setDepth(1001);
        bedIcon.setScrollFactor(0);
        bedIcon.setData('itemType', 'bed');
        bedIcon.setData('frameIndex', i);

        // Add hover effect
        bedIcon.on('pointerover', function() {
            this.setScale(0.45);
        });
        bedIcon.on('pointerout', function() {
            this.setScale(0.4);
        });

        bedMenu.push(bedIcon);
    }

    // Add instruction text
    const instructions = scene.add.text(400, 55, 'Drag food and beds into the room!', {
        fontSize: '14px',
        color: '#ecf0f1'
    });
    instructions.setOrigin(0.5);
    instructions.setDepth(1001);
    instructions.setScrollFactor(0);
}

function setupDragAndDrop(scene) {
    let draggedBedInstance = null; // Track if we're moving an existing bed

    scene.input.on('dragstart', function(pointer, gameObject) {
        const itemType = gameObject.getData('itemType');
        const frameIndex = gameObject.getData('frameIndex');

        if (itemType === 'food') {
            draggedItemSprite = scene.add.sprite(0, 0, 'food', frameIndex);
            draggedItemSprite.setScale(0.6);
            draggedItemType = 'food';
            draggedItemFrame = frameIndex;
            draggedBedInstance = null;
        } else if (itemType === 'bed') {
            draggedItemSprite = scene.add.sprite(0, 0, 'beds', frameIndex);
            draggedItemSprite.setScale(0.5);
            draggedItemType = 'bed';
            draggedItemFrame = frameIndex;
            draggedBedInstance = null;
        } else if (itemType === 'placedBed') {
            // Moving an existing bed
            const bedInstance = gameObject.getData('bedInstance');
            draggedBedInstance = bedInstance;
            draggedItemSprite = scene.add.sprite(0, 0, 'beds', bedInstance.frameIndex);
            draggedItemSprite.setScale(0.5);
            draggedItemType = 'placedBed';
            draggedItemFrame = bedInstance.frameIndex;

            // Hide the original bed sprite while dragging
            bedInstance.sprite.setVisible(false);

            // If a cat is sleeping in this bed, wake them up
            if (bedInstance.occupied) {
                // Find the cat using this bed and wake them up
                for (let cat of cats) {
                    if (cat.currentBed === bedInstance) {
                        cat.wakeUp();
                    }
                }
                bedInstance.occupied = false;
            }
        }

        if (draggedItemSprite) {
            draggedItemSprite.setDepth(2000);
            draggedItemSprite.setAlpha(0.8);
            draggedItemSprite.setScrollFactor(0);
            draggedItemSprite.x = pointer.x;
            draggedItemSprite.y = pointer.y;
        }
    });

    scene.input.on('drag', function(pointer, gameObject, dragX, dragY) {
        if (draggedItemSprite) {
            draggedItemSprite.x = pointer.x;
            draggedItemSprite.y = pointer.y;
        }
    });

    scene.input.on('dragend', function(pointer, gameObject) {
        if (draggedItemSprite && draggedItemType !== null) {
            // Check if dropped in valid area (below menu)
            if (pointer.y > 70) {
                const worldX = pointer.worldX;
                const worldY = pointer.worldY;
                const gridPos = ISO.toGrid(worldX, worldY);

                console.log(`Dropped ${draggedItemType} at world: (${worldX.toFixed(2)}, ${worldY.toFixed(2)}), grid: (${gridPos.x}, ${gridPos.y})`);

                // Check if within room bounds
                if (gridPos.x >= 1 && gridPos.x <= ROOM_WIDTH - 2 &&
                    gridPos.y >= 1 && gridPos.y <= ROOM_HEIGHT - 2) {

                    if (draggedItemType === 'food') {
                        const food = new Food(scene, gridPos.x, gridPos.y, draggedItemFrame, true);
                        foodItems.push(food);
                    } else if (draggedItemType === 'bed' || draggedItemType === 'placedBed') {
                        if (draggedBedInstance) {
                            // Moving existing bed - remove old one and create new one at new position
                            const index = beds.indexOf(draggedBedInstance);
                            if (index > -1) {
                                beds.splice(index, 1);
                            }
                            draggedBedInstance.sprite.destroy();
                        }
                        // Create new bed at dropped location
                        const bed = new Bed(scene, gridPos.x, gridPos.y, draggedItemFrame);
                        beds.push(bed);
                    }
                } else {
                    console.log(`${draggedItemType} placement out of bounds: grid (${gridPos.x}, ${gridPos.y})`);
                    // If it was a placed bed that's out of bounds, restore it
                    if (draggedBedInstance) {
                        draggedBedInstance.sprite.setVisible(true);
                    }
                }
            } else {
                // Dropped in menu area - restore bed if it was a placed bed
                if (draggedBedInstance) {
                    draggedBedInstance.sprite.setVisible(true);
                }
            }

            // Clean up dragged sprite
            draggedItemSprite.destroy();
            draggedItemSprite = null;
            draggedItemType = null;
            draggedItemFrame = null;
            draggedBedInstance = null;
        }
    });
}
