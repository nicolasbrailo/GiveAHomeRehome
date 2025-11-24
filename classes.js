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
        this.frameIndex = frameIndex;

        // Create bed sprite
        const pos = ISO.toScreen(gridX, gridY);
        this.sprite = scene.add.sprite(pos.x, pos.y, 'beds', frameIndex);
        this.sprite.setOrigin(0.5, 0.8);
        this.sprite.setScale(0.5); // Adjusted for 120x92 sprites
        this.sprite.setDepth(50 + gridX + gridY);

        // Make bed interactive and draggable
        this.sprite.setInteractive({ draggable: true });
        this.sprite.setData('itemType', 'placedBed');
        this.sprite.setData('bedInstance', this);

        // Add hover effect
        this.sprite.on('pointerover', function() {
            if (!this.getData('bedInstance').occupied) {
                this.setTint(0xcccccc);
            }
        });
        this.sprite.on('pointerout', function() {
            this.clearTint();
        });
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
        this.sprite.setAngle(-45); // Rotate to match isometric direction
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
        this.playCooldown = 0; // Cooldown period after playing
        this.sleepIndicator = null; // Text showing "Zzzz"
        this.playIndicator = null; // Text showing "!"

        // Stats
        this.name = this.generateRandomName();
        this.hunger = 0; // 0 = full, 100 = starving
        this.tiredness = 0; // 0 = energetic, 100 = exhausted
        this.statsUI = null; // UI container for stats display
        this.showingStats = false;

        // Create cat sprite with animation
        const pos = ISO.toScreen(gridX, gridY);
        this.sprite = scene.add.sprite(pos.x, pos.y, `${catType}_idle`);
        this.sprite.setOrigin(0.5, 0.8); // Anchor at bottom center
        this.sprite.setScale(1.5); // Make cats a bit bigger
        this.sprite.setDepth(100 + gridX + gridY); // Set depth above floor

        // Make sprite interactive for stats display
        this.sprite.setInteractive();
        this.sprite.setData('catInstance', this);

        // Play idle animation
        this.sprite.play(`${catType}_idle_anim`);
    }

    generateRandomName() {
        const names = [
            'Whiskers', 'Shadow', 'Luna', 'Mittens', 'Oliver', 'Bella',
            'Simba', 'Nala', 'Felix', 'Cleo', 'Max', 'Chloe',
            'Leo', 'Milo', 'Charlie', 'Lucy', 'Tiger', 'Smokey',
            'Oreo', 'Ginger', 'Pepper', 'Socks', 'Boots', 'Pumpkin',
            'Jasper', 'Ruby', 'Oscar', 'Lily', 'Zeus', 'Angel'
        ];
        return names[Math.floor(Math.random() * names.length)];
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

    showStats() {
        if (this.statsUI) return; // Already showing

        const x = this.sprite.x;
        const y = this.sprite.y - 60;

        // Create background
        const bg = this.scene.add.graphics();
        bg.fillStyle(0x000000, 0.8);
        bg.fillRoundedRect(x - 60, y - 40, 120, 75, 5);

        // Cat name
        const nameText = this.scene.add.text(x, y - 25, this.name, {
            fontSize: '14px',
            color: '#ffffff',
            fontStyle: 'bold'
        });
        nameText.setOrigin(0.5);

        // Hunger bar
        const hungerLabel = this.scene.add.text(x - 50, y - 5, 'Hunger:', {
            fontSize: '10px',
            color: '#ffffff'
        });
        const hungerBg = this.scene.add.graphics();
        hungerBg.fillStyle(0x333333, 1);
        hungerBg.fillRect(x - 50, y + 5, 100, 8);
        const hungerBar = this.scene.add.graphics();
        const hungerColor = this.hunger < 50 ? 0x00ff00 : this.hunger < 75 ? 0xffaa00 : 0xff0000;
        hungerBar.fillStyle(hungerColor, 1);
        hungerBar.fillRect(x - 50, y + 5, this.hunger, 8);

        // Tiredness bar
        const tirednessLabel = this.scene.add.text(x - 50, y + 18, 'Energy:', {
            fontSize: '10px',
            color: '#ffffff'
        });
        const tirednessBg = this.scene.add.graphics();
        tirednessBg.fillStyle(0x333333, 1);
        tirednessBg.fillRect(x - 50, y + 28, 100, 8);
        const tirednessBar = this.scene.add.graphics();
        const energyValue = 100 - this.tiredness;
        const energyColor = energyValue > 50 ? 0x00aaff : energyValue > 25 ? 0xffaa00 : 0xff0000;
        tirednessBar.fillStyle(energyColor, 1);
        tirednessBar.fillRect(x - 50, y + 28, energyValue, 8);

        // Store all UI elements
        this.statsUI = {
            bg, nameText, hungerLabel, hungerBg, hungerBar,
            tirednessLabel, tirednessBg, tirednessBar
        };

        // Set depth above everything
        Object.values(this.statsUI).forEach(element => {
            element.setDepth(1500);
        });

        this.showingStats = true;
    }

    hideStats() {
        if (!this.statsUI) return;

        Object.values(this.statsUI).forEach(element => {
            element.destroy();
        });

        this.statsUI = null;
        this.showingStats = false;
    }

    updateStatsDisplay() {
        if (!this.statsUI) return;

        // Update position to follow cat
        const x = this.sprite.x;
        const y = this.sprite.y - 60;

        this.statsUI.bg.clear();
        this.statsUI.bg.fillStyle(0x000000, 0.8);
        this.statsUI.bg.fillRoundedRect(x - 60, y - 40, 120, 75, 5);

        this.statsUI.nameText.setPosition(x, y - 25);

        this.statsUI.hungerLabel.setPosition(x - 50, y - 5);
        this.statsUI.hungerBg.clear();
        this.statsUI.hungerBg.fillStyle(0x333333, 1);
        this.statsUI.hungerBg.fillRect(x - 50, y + 5, 100, 8);

        this.statsUI.hungerBar.clear();
        const hungerColor = this.hunger < 50 ? 0x00ff00 : this.hunger < 75 ? 0xffaa00 : 0xff0000;
        this.statsUI.hungerBar.fillStyle(hungerColor, 1);
        this.statsUI.hungerBar.fillRect(x - 50, y + 5, this.hunger, 8);

        this.statsUI.tirednessLabel.setPosition(x - 50, y + 18);
        this.statsUI.tirednessBg.clear();
        this.statsUI.tirednessBg.fillStyle(0x333333, 1);
        this.statsUI.tirednessBg.fillRect(x - 50, y + 28, 100, 8);

        this.statsUI.tirednessBar.clear();
        const energyValue = 100 - this.tiredness;
        const energyColor = energyValue > 50 ? 0x00aaff : energyValue > 25 ? 0xffaa00 : 0xff0000;
        this.statsUI.tirednessBar.fillStyle(energyColor, 1);
        this.statsUI.tirednessBar.fillRect(x - 50, y + 28, energyValue, 8);
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
        // Update stats display if visible
        if (this.showingStats) {
            this.updateStatsDisplay();
        }

        // Increase hunger slowly over time (reaches 100 in ~5 minutes)
        if (this.hunger < 100) {
            this.hunger += 0.005;
        }

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

        // Handle play cooldown timer (prevents immediate re-play)
        if (this.playCooldown > 0) {
            this.playCooldown--;
        }

        // Handle playing timer
        if (this.playTimer > 0) {
            this.playTimer--;
            // Increase tiredness while playing
            if (this.tiredness < 100) {
                this.tiredness += 0.1;
            }
            if (this.playTimer === 0) {
                this.isPlaying = false;
                this.playPartner = null;
                this.hidePlayIndicator();
                // Start cooldown period (5 seconds at 60 FPS)
                this.playCooldown = 300;
            }
            return;
        }

        // Handle sleeping timer
        if (this.sleepTimer > 0) {
            this.sleepTimer--;
            // Reduce tiredness while sleeping
            if (this.tiredness > 0) {
                this.tiredness -= 0.15;
                if (this.tiredness < 0) this.tiredness = 0;
            }
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
            // Reduce hunger while eating
            if (this.hunger > 0) {
                this.hunger -= 1.2; // Eating reduces hunger quickly
                if (this.hunger < 0) this.hunger = 0;
            }
            if (this.eatingTimer === 0) {
                this.isEating = false;
                this.targetFood = null;
                // Eating a full meal resets hunger to 0
                this.hunger = 0;
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

        // Check for collision with other cats (only if not in cooldown, not hungry, and not too tired)
        if (!this.isPlaying && !this.isSleeping && this.playCooldown === 0 &&
            this.hunger < 70 && this.tiredness < 80 && otherCats) {
            for (let otherCat of otherCats) {
                // Skip if other cat is busy, is this cat, is in cooldown, hungry, or too tired
                if (otherCat === this || otherCat.isPlaying || otherCat.isSleeping ||
                    otherCat.playCooldown > 0 || otherCat.hunger >= 70 || otherCat.tiredness >= 80) continue;

                const dx = otherCat.gridX - this.gridX;
                const dy = otherCat.gridY - this.gridY;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 0.3) {
                    // Collision! Start playing
                    this.isPlaying = true;
                    this.playTimer = 300; // Play for 5 seconds (60 FPS * 5)
                    this.playPartner = otherCat;
                    this.isMoving = false;
                    this.sprite.play(`${this.catType}_walk_anim`); // Use walk animation for jumping
                    this.hideSleepIndicator(); // Make sure sleep indicator is gone when playing
                    this.showPlayIndicator();

                    // Make the other cat play too
                    otherCat.isPlaying = true;
                    otherCat.playTimer = 300; // Play for 5 seconds (60 FPS * 5)
                    otherCat.playPartner = this;
                    otherCat.isMoving = false;
                    otherCat.sprite.play(`${otherCat.catType}_walk_anim`);
                    otherCat.hideSleepIndicator(); // Make sure sleep indicator is gone when playing
                    otherCat.showPlayIndicator();
                    return;
                }
            }
        }

        // Check for nearby beds (only if not targeting food, and if tired)
        if (!this.isSleeping && !this.targetFood && this.tiredness > 50 && beds) {
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
