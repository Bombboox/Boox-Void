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
        antialias: false,
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
    enemies.push(new DefaultEnemy(400, 300, worldContainer));
    enemies.push(new DefaultEnemy(500, 300, worldContainer));
    enemies.push(new DefaultEnemy(600, 300, worldContainer));
    enemies.push(new DefaultEnemy(700, 300, worldContainer));

    configureLevel("levels/level_1.json", player, worldContainer); 

    joyful_machinery.volume = 0.1;
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

    worldContainer.x = app.screen.width / 2 - player.position.x * worldContainer.scale.x;
    worldContainer.y = app.screen.height / 2 - player.position.y * worldContainer.scale.y;

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
}, 1000); // Try every 3 seconds

