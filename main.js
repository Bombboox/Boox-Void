const app = new PIXI.Application();
let appInitialized = false;

async function initializeApp() {
    await app.init({
        width: 1920,
        height: 1080,
        resizeTo: window,
        backgroundColor: 0x000000, // Black background
        resolution: devicePixelRatio,
        autoDensity: true,
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
var minimapEnabled = true;

const keyboard = [];

var mouseX = 0;
var mouseY = 0;
var mouseDown = false;
var deltaTime = 0;

var worldTopBoundary = -1000;
var worldBottomBoundary = 1000;
var worldLeftBoundary = -1000;
var worldRightBoundary = 1000;

// FPS Counter Text
const fpsText = new PIXI.Text({text: "FPS: 0", style: {fontFamily: 'Arial', fontSize: 16, fill: 0xffffff }});
fpsText.position.set(10, 10);

const LEVEL_ONE_WAVES = new Waves([
    new Wave(1, 1),
    new Wave(2, 1),
    new Wave(5, 1.5)
], worldContainer);

let minimap = null; // Declare minimap variable

const main = () => {
    if (!appInitialized) {
        console.error("App not initialized yet");
        return;
    }
    
    app.stage.addChild(worldContainer);
    app.stage.addChild(fpsText);

    createHealthBar(worldContainer);
    player.initializeGraphics(worldContainer); 
    player.cannons.push(new ExplosiveCannon(worldContainer));

    configureLevel("levels/level_1.json", player, worldContainer);

    minimap = new Minimap(app, player, enemies, activeLevel, {
        size: 180, 
        padding: 15,
        viewRadius: 2000 
    });

    joyful_machinery.volume = 0.25;
    joyful_machinery.loop = true;
    app.ticker.add(gameLoop);
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

    // Update the minimap
    if (minimap && minimapEnabled) {
        minimap.update();
    }

    // Center the view on the player
    let x = app.screen.width / 2 - player.position.x * worldContainer.scale.x;
    let y = app.screen.height / 2 - player.position.y * worldContainer.scale.y;

    // Calculate the correct clamping boundaries for the worldContainer position
    const minContainerX = app.screen.width - worldRightBoundary * worldContainer.scale.x;
    const maxContainerX = -worldLeftBoundary * worldContainer.scale.x;
    const minContainerY = app.screen.height - worldBottomBoundary * worldContainer.scale.y;
    const maxContainerY = -worldTopBoundary * worldContainer.scale.y;

    // Apply clamping to keep the view within world boundaries, using correct min/max order
    worldContainer.x = clamp(x, minContainerX, maxContainerX);
    worldContainer.y = clamp(y, minContainerY, maxContainerY);

    drawHealthBar(worldContainer, deltaTime);
    LEVEL_ONE_WAVES.update(deltaTime, enemies);

    fpsText.text = `FPS: ${Math.round(app.ticker.FPS)}`;
}
window.addEventListener("mousemove", (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY;
});

window.addEventListener("keydown", (event) => {
    keyboard[event.key] = true;

    switch(event.key) {
        case "m":
            minimapEnabled = !minimapEnabled;
            minimap.graphics.clear();
            break;
    }
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

window.addEventListener("resize", () => {
    app.renderer.resize(window.innerWidth, window.innerHeight);
    app.renderer.resolution = devicePixelRatio;
});

// Create an interval to attempt playing music until it works
const musicInterval = setInterval(() => {
    try {
        // Attempt to play the music
        joyful_machinery.play()
            .then(() => {
                clearInterval(musicInterval); // Clear interval once music plays
            })
            .catch(error => {
            });
    } catch (error) {
    }
}, 1000); 

