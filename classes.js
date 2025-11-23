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
        this.sprite.setScale(0.6); // Adjusted for 64x64 sprites
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
// BED CLASS
// ===========================

class Bed {
    constructor(scene, gridX, gridY, frameIndex) {
        this.scene = scene;
        this.gridX = gridX;
        this.gridY = gridY;
        this.occupied = false; // Is a cat sleeping in this bed

        // Create bed sprite
        const pos = ISO.toScreen(gridX, gridY);
        this.sprite = scene.add.sprite(pos.x, pos.y, 'beds', frameIndex);
        this.sprite.setOrigin(0.5, 0.8);
        this.sprite.setScale(0.5); // Adjusted for 120x92 sprites
        this.sprite.setDepth(50 + gridX + gridY);
    }

    checkNearby(cat) {
        const distance = Math.sqrt(
            Math.pow(cat.gridX - this.gridX, 2) +
            Math.pow(cat.gridY - this.gridY, 2)
        );

        return distance < 1.0; // Slightly larger range than food
    }
}

// ===========================
// CARPET CLASS
// ===========================

class Carpet {
    constructor(scene, gridX, gridY, frameIndex) {
        this.scene = scene;
        this.gridX = gridX;
        this.gridY = gridY;

        // Create carpet sprite
        const pos = ISO.toScreen(gridX, gridY);
        this.sprite = scene.add.sprite(pos.x, pos.y, 'carpets', frameIndex);
        this.sprite.setOrigin(0.5, 0.8);
        this.sprite.setScale(0.5); // Adjusted for 143x96 sprites
        this.sprite.setDepth(5 + gridX + gridY); // Above floor (0) but below furniture (50+)
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
        this.isSleeping = false;
        this.sleepTimer = 0;
        this.currentBed = null;
        this.isPlaying = false;
        this.playTimer = 0;
        this.playPartner = null; // Another cat to play with
        this.sleepIndicator = null; // Text showing "Zzzz"
        this.playIndicator = null; // Text showing "!"

        // Create cat sprite with animation
        const pos = ISO.toScreen(gridX, gridY);
        this.sprite = scene.add.sprite(pos.x, pos.y, `${catType}_idle`);
        this.sprite.setOrigin(0.5, 0.8); // Anchor at bottom center
        this.sprite.setScale(1.5); // Make cats a bit bigger
        this.sprite.setDepth(100 + gridX + gridY); // Set depth above floor

        // Play idle animation
        this.sprite.play(`${catType}_idle_anim`);
    }

    showSleepIndicator() {
        if (!this.sleepIndicator) {
            this.sleepIndicator = this.scene.add.text(this.sprite.x, this.sprite.y - 40, 'Zzzz', {
                fontSize: '16px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 2
            });
            this.sleepIndicator.setOrigin(0.5);
            this.sleepIndicator.setDepth(200);
        }
    }

    hideSleepIndicator() {
        if (this.sleepIndicator) {
            this.sleepIndicator.destroy();
            this.sleepIndicator = null;
        }
    }

    showPlayIndicator() {
        if (!this.playIndicator) {
            this.playIndicator = this.scene.add.text(this.sprite.x, this.sprite.y - 40, '!', {
                fontSize: '20px',
                color: '#ffff00',
                stroke: '#ff0000',
                strokeThickness: 3
            });
            this.playIndicator.setOrigin(0.5);
            this.playIndicator.setDepth(200);
        }
    }

    hidePlayIndicator() {
        if (this.playIndicator) {
            this.playIndicator.destroy();
            this.playIndicator = null;
        }
    }

    pickNewTarget(roomWidth, roomHeight) {
        // Pick a random spot in the room (leaving 1 tile border for walls)
        this.targetX = 1 + Math.floor(Math.random() * (roomWidth - 2));
        this.targetY = 1 + Math.floor(Math.random() * (roomHeight - 2));
        this.waitTimer = 0;
    }

    wakeUp() {
        if (this.isSleeping) {
            this.isSleeping = false;
            this.sleepTimer = 0;
            this.hideSleepIndicator();
            if (this.currentBed) {
                this.currentBed.occupied = false;
                this.currentBed = null;
            }
        }
    }

    update(roomWidth, roomHeight, foodItems, beds, otherCats) {
        // Clean up indicators if state has changed (do this first, before any other logic)
        if (this.sleepIndicator && !this.isSleeping) {
            this.hideSleepIndicator();
        }
        if (this.playIndicator && !this.isPlaying) {
            this.hidePlayIndicator();
        }

        // Hide sleep indicator if cat is moving, eating, or playing
        if (this.sleepIndicator && (this.isMoving || this.isEating || this.isPlaying)) {
            this.hideSleepIndicator();
        }

        // Update indicator positions to follow cat (only if in correct state)
        if (this.sleepIndicator && this.isSleeping && !this.isMoving) {
            this.sleepIndicator.x = this.sprite.x;
            this.sleepIndicator.y = this.sprite.y - 40;
        }
        if (this.playIndicator && this.isPlaying) {
            this.playIndicator.x = this.sprite.x;
            this.playIndicator.y = this.sprite.y - 40;
        }

        // Handle playing timer
        if (this.playTimer > 0) {
            this.playTimer--;
            if (this.playTimer === 0) {
                this.isPlaying = false;
                this.playPartner = null;
                this.hidePlayIndicator();
            }
            return;
        }

        // Handle sleeping timer
        if (this.sleepTimer > 0) {
            this.sleepTimer--;
            if (this.sleepTimer === 0) {
                this.isSleeping = false;
                this.hideSleepIndicator();
                if (this.currentBed) {
                    this.currentBed.occupied = false;
                    this.currentBed = null;
                }
            }
            return;
        }

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
                    this.hideSleepIndicator(); // Make sure sleep indicator is gone when eating
                    food.eat();
                    this.targetFood = null;
                    return;
                }
            }
        }

        // Check for fresh food to target (wakes up sleeping cats)
        if (!this.targetFood && foodItems) {
            for (let food of foodItems) {
                if (food.isFresh && !food.claimed && !food.eaten) {
                    // Found fresh unclaimed food, wake up and run to it
                    this.wakeUp();
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

        // Check for collision with other cats
        if (!this.isPlaying && !this.isSleeping && otherCats) {
            for (let otherCat of otherCats) {
                if (otherCat === this || otherCat.isPlaying || otherCat.isSleeping) continue;

                const dx = otherCat.gridX - this.gridX;
                const dy = otherCat.gridY - this.gridY;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 0.3) {
                    // Collision! Start playing
                    this.isPlaying = true;
                    this.playTimer = 120; // Play for 2 seconds
                    this.playPartner = otherCat;
                    this.isMoving = false;
                    this.sprite.play(`${this.catType}_walk_anim`); // Use walk animation for jumping
                    this.hideSleepIndicator(); // Make sure sleep indicator is gone when playing
                    this.showPlayIndicator();

                    // Make the other cat play too
                    otherCat.isPlaying = true;
                    otherCat.playTimer = 120;
                    otherCat.playPartner = this;
                    otherCat.isMoving = false;
                    otherCat.sprite.play(`${otherCat.catType}_walk_anim`);
                    otherCat.hideSleepIndicator(); // Make sure sleep indicator is gone when playing
                    otherCat.showPlayIndicator();
                    return;
                }
            }
        }

        // Check for nearby beds (only if not targeting food)
        if (!this.isSleeping && !this.targetFood && beds) {
            for (let bed of beds) {
                if (!bed.occupied && bed.checkNearby(this)) {
                    // Found an empty bed, go to sleep
                    this.isSleeping = true;
                    this.sleepTimer = 180 + Math.random() * 180; // Sleep for 3-6 seconds
                    this.currentBed = bed;
                    bed.occupied = true;
                    this.isMoving = false;
                    this.sprite.play(`${this.catType}_idle_anim`);
                    this.showSleepIndicator();
                    return;
                }
            }
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
            // Make sure to hide sleep indicator when starting to move
            this.hideSleepIndicator();
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
