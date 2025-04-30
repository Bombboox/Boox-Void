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
const enemy_bullets = [];
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

var enemiesPaused = false;

// FPS Counter Text
const fpsText = new PIXI.Text({text: "FPS: 0", style: {fontFamily: 'Arial', fontSize: 16, fill: 0xffffff }});
fpsText.position.set(10, 10);

const LEVEL_ONE_WAVES = new Waves(worldContainer, [
    new Wave(1, {
        "DefaultEnemy": 1,
        "DefaultBoss": 1
    }),

    new Wave(1, {
        "DefaultEnemy": 2,
    }),

    new Wave(1, {
        "DefaultEnemy": 5,
        "DefaultBoss": 1
    }, () => {
        stopAllMusic();
        playMusic(boss_music);
    }),
    new Wave(0, {
    }, () => {
        stopAllMusic();
        playMusic(victory_music);
    })
]);

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
    player.cannons.push(new DefaultCannon(worldContainer));

    configureLevel("levels/level_1.json", player, worldContainer);

    minimap = new Minimap(app, player, enemies, activeLevel, {
        size: 180, 
        padding: 15,
        viewRadius: 2000 
    });

    joyful_machinery.volume = 0.25;
    joyful_machinery.loop = true;
    boss_music.volume = 0.25;
    boss_music.loop = true;

    app.ticker.add(gameLoop);
    playMusic(joyful_machinery);
}

const gameLoop = (ticker) => {
    deltaTime = ticker.deltaMS;

    // Update game logic
    player.update(mouseX, mouseY, mouseDown, deltaTime);

    for (let i = bullets.length - 1; i >= 0; i--) { 
        bullets[i].update(deltaTime, worldContainer);
    }

    // Update enemy bullets
    for (let i = enemy_bullets.length - 1; i >= 0; i--) { 
        enemy_bullets[i].update(deltaTime, worldContainer);
    }

    for (let i = enemies.length - 1; i >= 0; i--) { 
        enemies[i].update(deltaTime, worldContainer); 
    }

    // Update the minimap
    if (minimap && minimapEnabled) {
        minimap.update();
    }

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
        case "r":
            if(!player.alive) {
                player.revive();

                destroyAllEnemies();
                stopAllMusic(); 

                playMusic(joyful_machinery);
                configureLevel("levels/level_1.json", player, worldContainer);
                LEVEL_ONE_WAVES.reset();
            }
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

function destroyAllEnemies() {
    for(let i = enemies.length - 1; i >= 0; i--) {
        if(enemies[i]) {
            enemies[i].destroy(worldContainer);
        }
    }

    for(let i = enemy_bullets.length - 1; i >= 0; i--) {
        enemy_bullets[i].destroy(worldContainer);
    }
}

function stopAllMusic() {
    joyful_machinery.pause();
    joyful_machinery.currentTime = 0;
    boss_music.pause();
    boss_music.currentTime = 0;
}

function playMusic(song) {
    // If music is already playing, restart it
    if (!song.paused) {
        song.currentTime = 0;
        return;
    }
    
    const musicInterval = setInterval(() => {
        try {
            // Attempt to play the music
            song.play()
                .then(() => {
                    clearInterval(musicInterval); // Clear interval once music plays
                })
                .catch(error => {
                });
        } catch (error) {
        }
    }, 1000); 
}