var activeLevel = {
    objects: [], // Original objects from JSON
    shapes: [],  // Filtered shapes (Rectangles, Circles)
    points: []   // Filtered points (for spawn points, waypoints, etc.)
};

// Container for level graphics, added to worldContainer
const levelGraphicsContainer = new PIXI.Container();

async function loadLevel(filePath) {
    try {
        const response = await fetch(filePath);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const levelData = await response.json();

        if (!levelData || !Array.isArray(levelData.objects)) {
            console.error("Invalid level data format: 'objects' array not found.");
            activeLevel = { objects: [], shapes: [], points: [] };
            return false; // Indicate failure
        }

        activeLevel.objects = levelData.objects;
        activeLevel.shapes = levelData.objects.filter(obj => obj.type === 'Rectangle' || obj.type === 'Circle');
        activeLevel.points = levelData.objects.filter(obj => obj.type === 'Point');

        console.log(`Level loaded successfully from ${filePath}:`, activeLevel);
        return true; // Indicate success

    } catch (error) {
        console.error("Error loading level:", error);
        activeLevel = { objects: [], shapes: [], points: [] };
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
        const color = parseInt(colorString.replace("#", ""), 16);

        graphics.beginFill(color);
        // Optional: Add line style for outlines
        // graphics.lineStyle(1, 0x000000); // Black outline

        if (obj.type === 'Rectangle') {
            graphics.drawRect(obj.x, obj.y, obj.width, obj.height);
        } else if (obj.type === 'Circle') {
            graphics.drawCircle(obj.x, obj.y, obj.radius);
        }
        graphics.endFill();
        levelGraphicsContainer.addChild(graphics);
    });

    // Add the single container with all level shapes to the main world container
    if (!container.children.includes(levelGraphicsContainer)) {
         container.addChild(levelGraphicsContainer);
    }
    console.log("Level graphics created.");
}

async function configureLevel(levelPath, player, worldContainer) { // Added async and worldContainer
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
                console.log(`Player positioned at spawn point: (${spawnPoint.x}, ${spawnPoint.y})`);
            } else {
                console.warn("No spawn point found in level");
            }
            
            return true;
        }
        
        return false;
    } catch (error) {
        console.error("Error configuring level:", error);
        return false;
    }
}
