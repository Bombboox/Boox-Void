const app = new PIXI.Application();
let appInitialized = false;

async function initializeApp() {
    await app.init({
        resizeTo: window,
        backgroundColor: 0x000000, // Black background
        antialias: true,
    });
    document.body.appendChild(app.canvas);
    appInitialized = true;
    

    main();
}

initializeApp();

const worldContainer = new PIXI.Container();
const player = new Player(0, 0, 20, 0xffffff); 
const bullets = [];
const enemies = [];

const gridSize = 50; 
const gridColor = 0xffffff; 
const gridAlpha = 0.25;
const gridGraphics = new PIXI.Graphics();

const keyboard = [];

var mouseX = 0;
var mouseY = 0;
var mouseDown = false;
var deltaTime = 0;

// FPS Counter Text
const fpsText = new PIXI.Text('FPS: 0', { fontFamily: 'Arial', fontSize: 16, fill: 0xffffff });
fpsText.position.set(10, 10);

const main = () => {
    if (!appInitialized) {
        console.error("App not initialized yet");
        return;
    }
    
    app.stage.addChild(worldContainer);
    app.stage.addChild(fpsText);
    worldContainer.addChild(gridGraphics);
    
    player.initializeGraphics(worldContainer); 
    player.cannons.push(new DefaultCannon(worldContainer));

    enemies.push(new DefaultEnemy(300, 300, worldContainer));

    configureLevel("levels/level_1.json", player, worldContainer); 

    app.ticker.add(gameLoop);
}

const drawGrid = () => {
    gridGraphics.clear(); // Clear previous grid lines

    // Calculate the viewport boundaries in world coordinates (considering camera)
    const screenTopLeft = worldContainer.toLocal(new PIXI.Point(0, 0));
    const screenBottomRight = worldContainer.toLocal(new PIXI.Point(app.screen.width, app.screen.height));

    // Find the first grid line position based on the transformed coordinates
    const startX = Math.floor(screenTopLeft.x / gridSize) * gridSize;
    const startY = Math.floor(screenTopLeft.y / gridSize) * gridSize;

    // Calculate the end positions
    const endX = Math.ceil(screenBottomRight.x / gridSize) * gridSize;
    const endY = Math.ceil(screenBottomRight.y / gridSize) * gridSize;

    gridGraphics.lineStyle(1, gridColor, gridAlpha);

    // Draw vertical lines
    for (let x = startX; x <= endX; x += gridSize) {
        gridGraphics.moveTo(x, screenTopLeft.y);
        gridGraphics.lineTo(x, screenBottomRight.y);
    }

    // Draw horizontal lines
    for (let y = startY; y <= endY; y += gridSize) {
        gridGraphics.moveTo(screenTopLeft.x, y);
        gridGraphics.lineTo(screenBottomRight.x, y);
    }
}

const gameLoop = (ticker) => {
    deltaTime = ticker.deltaMS;

    // Update game logic
    player.update(mouseX, mouseY, mouseDown, deltaTime);

    for (let i = bullets.length - 1; i >= 0; i--) { 
        bullets[i].update(deltaTime, worldContainer);
    }

    for (let i = enemies.length - 1; i >= 0; i--) { 
        enemies[i].update(deltaTime, worldContainer); 
    }

    worldContainer.x = app.screen.width / 2 - player.position.x * worldContainer.scale.x;
    worldContainer.y = app.screen.height / 2 - player.position.y * worldContainer.scale.y;

    drawGrid();

    fpsText.text = `FPS: ${Math.round(app.ticker.FPS)}`;
}

window.addEventListener("mousemove", (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY;
});

window.addEventListener("keydown", (event) => {
    keyboard[event.key] = true;
});

window.addEventListener("keyup", (event) => {
    keyboard[event.key] = false;
});

window.addEventListener("mousedown", () => {
    mouseDown = true;
});

window.addEventListener("mouseup", () => {
    mouseDown = false;
});

