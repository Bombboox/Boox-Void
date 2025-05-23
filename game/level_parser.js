var activeLevel = {
    number: 1,
    objects: [], // Original objects from JSON
    shapes: [],  // Filtered shapes (Rectangles, Circles)
    points: [],  // Filtered points (for spawn points, waypoints, etc.)
    lights: []   // Filtered light objects
};

// Container for level graphics, added to worldContainer
const levelGraphicsContainer = new PIXI.Container();

async function loadLevel(levelNumber) {
    try {
        const filePath = `levels/level_${levelNumber}.json`;
        const response = await fetch(filePath);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const levelData = await response.json();

        if (!levelData || !Array.isArray(levelData.objects)) {
            console.error("Invalid level data format: 'objects' array not found.");
            activeLevel = { objects: [], shapes: [], points: [], lights: [], theme: ""};
            return false; // Indicate failure
        }

        activeLevel.objects = levelData.objects;
        activeLevel.shapes = levelData.objects.filter(obj => obj.type === 'Rectangle' || obj.type === 'Circle');
        activeLevel.points = levelData.objects.filter(obj => obj.type === 'Point');
        activeLevel.lights = levelData.objects.filter(obj => obj.type === 'Light');
        activeLevel.theme = levelData.theme ? levelData.theme : "happy";

        return true; // Indicate success

    } catch (error) {
        console.error("Error loading level:", error);
        activeLevel = { objects: [], shapes: [], points: [], lights: [] };
        return false; // Indicate failure
    }
}

// Create level graphics once and add them to the container
function createLevelGraphics(level, container) {
    if (!level || !level.shapes || !container) {
        console.error("Cannot create level graphics: Invalid level data or container.");
        return;
    }

    // Clear previous graphics if any (e.g., loading a new level)
    levelGraphicsContainer.removeChildren();

    level.shapes.forEach(obj => {
        const graphics = new PIXI.Graphics();
        // Convert CSS color string (like #ffffff) to hex number (like 0xffffff)
        const colorString = obj.color || '#808080'; // Default gray
        let color;
        
        // Check if the color is in rgba format
        if (colorString.startsWith('rgba')) {
            // Parse rgba values
            const rgba = colorString.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
            if (rgba) {
                const r = parseInt(rgba[1]);
                const g = parseInt(rgba[2]);
                const b = parseInt(rgba[3]);
                const a = parseFloat(rgba[4]);
                color = (r << 16) | (g << 8) | b;
                graphics.alpha = a;
            } else {
                color = 0x808080; // Default if rgba parsing fails
            }
        } else {
            // Handle hex colors
            color = parseInt(colorString.replace("#", ""), 16);
        }

        if (obj.type === 'Rectangle') {
            graphics.rect(obj.x, obj.y, obj.width, obj.height);
        } else if (obj.type === 'Circle') {
            graphics.circle(obj.x, obj.y, obj.radius);
        }
        graphics.fill({color: color});
        levelGraphicsContainer.addChild(graphics);
    });

    // Add the single container with all level shapes to the main world container
    if (!container.children.includes(levelGraphicsContainer)) {
         container.addChild(levelGraphicsContainer);
    }
}

async function configureLevel(levelPath, player, worldContainer, lighting) { // Added lighting parameter
    try {
        const loaded = await loadLevel(levelPath); // Added await
        if (!loaded) {
            console.error("Failed to load level data.");
            return false;
        }

        // Create the level graphics and add to the scene
        createLevelGraphics(activeLevel, worldContainer);

        if (activeLevel && activeLevel.points) {
            // Find the spawn point
            const spawnPoint = activeLevel.points.find(point => point.tag === "spawn");
            
            // If spawn point exists, set player position
            if (spawnPoint) {
                player.position.x = spawnPoint.x;
                player.position.y = spawnPoint.y;
            } else {
                console.warn("No spawn point found in level");
            }
        }

        // Configure lights from the level data
        if (lighting && activeLevel.lights) {
            activeLevel.lights.forEach(lightObj => {
                const colorString = lightObj.color || '#FFFF00'; 
                let pixiColor = 0xFFFF00;
                let alpha = 1.0; 

                if (colorString.startsWith('rgba')) {
                    const rgba = colorString.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
                    if (rgba) {
                        const r = parseInt(rgba[1]);
                        const g = parseInt(rgba[2]);
                        const b = parseInt(rgba[3]);
                        pixiColor = (r << 16) | (g << 8) | b;
                        alpha = parseFloat(rgba[4]);                     
                    } else {
                        pixiColor = 0xFFFF00; s
                    }
                } else if (colorString.startsWith('#')) {
                    pixiColor = parseInt(colorString.replace("#", ""), 16);
                }

                const lightScale = (lightObj.radius || 50) / 32; 

                lighting.addLight(lightObj.x, lightObj.y, pixiColor, lightScale);
            });
        }

        for(let i = 0; i < activeLevel.points.length; i++) {
            const point = activeLevel.points[i];
            switch(point.tag) {
                case "top":
                    worldTopBoundary = point.y * worldContainer.scale.y;
                    break;
                case "bottom":
                    worldBottomBoundary = point.y * worldContainer.scale.y;
                    break;
                case "left":
                    worldLeftBoundary = point.x * worldContainer.scale.x;
                    break;
                case "right":
                    worldRightBoundary = point.x * worldContainer.scale.x;
                    break;
                case "espawn":
                    enemies.push(new DefaultEnemySpawner(point.x, point.y));
                    break;
                case "espawn2":
                    enemies.push(new MiniBlueSpawner(point.x, point.y));
                    break;
                case "espawn3":
                    enemies.push(new ToxicGreenSpawner(point.x, point.y));
                    break;
                case "espawn4":
                    enemies.push(new ShriekerSpawner(point.x, point.y));
                    break;
                case "espawn5":
                    enemies.push(new GhostSpawner(point.x, point.y));
                    break;
                case "bspawn":
                    enemies.push(new DefaultBossSpawner(point.x, point.y));
                    break;
            }
        }
        return false;
    } catch (error) {
        console.error("Error configuring level:", error);
        return false;
    }
}
