class Minimap {
    constructor(app, player, enemies, levelData, options = {}) {
        this.app = app;
        this.player = player;
        this.enemies = enemies; // This should be the live array of enemies
        this.levelData = levelData; // Need to figure out the structure later

        this.size = options.size || 150; // Default size
        this.padding = options.padding || 10; // Padding from corner
        this.viewRadius = options.viewRadius || 1000; // World units radius shown around player
        this.bgColor = options.bgColor || 0x000000;
        this.bgAlpha = options.bgAlpha || 0.5;
        this.borderColor = options.borderColor || 0xffffff;
        this.borderWidth = options.borderWidth || 2; // Increased border width for better visibility
        this.playerColor = options.playerColor || 0x00ff00; // Green
        this.enemyColor = options.enemyColor || 0xff0000; // Red
        this.levelColor = options.levelColor || 0xaaaaaa; // Grey

        this.container = new PIXI.Container();
        this.graphics = new PIXI.Graphics();
        this.container.addChild(this.graphics);

        // Create a mask once during initialization
        this.mask = new PIXI.Graphics();
        this.mask.rect(0, 0, this.size, this.size);
        this.mask.fill({color: 0xffffff});
        this.container.addChild(this.mask);
        this.graphics.mask = this.mask;

        this.container.x = this.app.screen.width - this.size - this.padding;
        this.container.y = this.padding;
        this.container.zIndex = 1001; // Ensure it's above most things

        this.app.stage.addChild(this.container);

        // Add resize listener
        window.addEventListener('resize', this.handleResize.bind(this));
    }

    handleResize() {
        this.container.x = this.app.screen.width - this.size - this.padding;
        this.container.y = this.padding;
    }

    // Convert world coordinates to minimap coordinates
    worldToMinimap(worldX, worldY) {
        // Center view on player
        const relativeX = worldX - this.player.position.x;
        const relativeY = worldY - this.player.position.y;

        // Scale based on viewRadius and minimap size
        // World coordinates within 2 * viewRadius diameter map to minimap size
        const scale = this.size / (this.viewRadius * 2);

        const mapX = (relativeX * scale) + (this.size / 2);
        const mapY = (relativeY * scale) + (this.size / 2);

        return { x: mapX, y: mapY };
    }

    update() {  
        this.graphics.clear();

        // Draw background and border
        this.graphics.fill({color: this.bgColor, alpha: this.bgAlpha});
        this.graphics.rect(0, 0, this.size, this.size);
        this.graphics.stroke({color: this.borderColor, width: this.borderWidth});

        // Draw level geometry
        if (this.levelData && this.levelData.shapes) {
            this.graphics.setStrokeStyle({width: 0});

            this.levelData.shapes.forEach(shape => {
                // Skip points or shapes without geometry
                if (shape.type !== 'Rectangle' && shape.type !== 'Circle') return;
                
                // Determine shape center for distance check
                let shapeCenterX = shape.x;
                let shapeCenterY = shape.y;
                let shapeRadius = 0; // Effective radius for distance check

                if(shape.type === 'Rectangle') {
                    shapeCenterX += shape.width / 2;
                    shapeCenterY += shape.height / 2;
                    // Use half-diagonal for rough radius check
                    shapeRadius = Math.sqrt(shape.width*shape.width + shape.height*shape.height) / 2;
                } else { // Circle
                    shapeRadius = shape.radius;
                }

                // Simple distance check from player to shape center + shape radius
                const dx = shapeCenterX - this.player.position.x;
                const dy = shapeCenterY - this.player.position.y;
                if (Math.sqrt(dx*dx + dy*dy) <= this.viewRadius + shapeRadius) {
                    // Convert shape coordinates to minimap space
                    const mapPos = this.worldToMinimap(shape.x, shape.y);
                    const scale = this.size / (this.viewRadius * 2);
                    
                    // Parse color, default to levelColor
                    let fillColor = this.levelColor;
                    let fillAlpha = 1; // Default alpha
                    if (shape.color) {
                         if (shape.color.startsWith('rgba')) {
                             const rgba = shape.color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
                             if (rgba) {
                                 fillColor = (parseInt(rgba[1]) << 16) | (parseInt(rgba[2]) << 8) | parseInt(rgba[3]);
                                 fillAlpha = parseFloat(rgba[4]);
                             } 
                         } else {
                             try {
                                fillColor = parseInt(shape.color.replace("#", ""), 16);
                             } catch (e) { /* Use default if parsing fails */ }
                         }
                    }
                    // Ignore fully transparent shapes on minimap
                    if(fillAlpha <= 0) return;
                    if (shape.type === 'Rectangle') {
                        const mapWidth = shape.width * scale;
                        const mapHeight = shape.height * scale;
                        this.graphics.rect(mapPos.x, mapPos.y, mapWidth, mapHeight);
                    } else { // Circle
                        const mapRadius = shape.radius * scale;
                        this.graphics.circle(mapPos.x, mapPos.y, mapRadius);
                    }
                    this.graphics.fill({color: fillColor, alpha: fillAlpha * 0.8});
                }
            });
        }

        // Draw enemies
        this.graphics.setStrokeStyle({width: 0}); // No border for dots
        for (let i = 0; i < this.enemies.length; i++) {
            const enemy = this.enemies[i];
            // Check if enemy is within view radius before converting
            // Make sure we're accessing position correctly
            if (!enemy || !enemy.position) continue;
            
            const dx = enemy.position.x - this.player.position.x;
            const dy = enemy.position.y - this.player.position.y;
            if (Math.sqrt(dx*dx + dy*dy) <= this.viewRadius) {
                const mapPos = this.worldToMinimap(enemy.position.x, enemy.position.y);
                this.graphics.circle(mapPos.x, mapPos.y, 2); // Draw enemy as a small circle
            }
        }
        this.graphics.fill({color: this.enemyColor});

        // Draw player (always in the center)
        this.graphics.setStrokeStyle({width: 0});
        this.graphics.circle(this.size / 2, this.size / 2, 3); // Player slightly larger
        this.graphics.fill({color: this.playerColor});
        
        // Draw white outline around the minimap (on top of everything)
        this.graphics.stroke({color: 0xffffff, width: 1});
        this.graphics.rect(0, 0, this.size, this.size);
    }

    destroy() {
         window.removeEventListener('resize', this.handleResize.bind(this));
         this.app.stage.removeChild(this.container);
         this.graphics.destroy();
         this.mask.destroy();
         this.container.destroy();
    }
} 