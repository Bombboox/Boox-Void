const app = new PIXI.Application();
var appInitialized = false;
var paused = false;
var gameRunning = false; // New flag to control game loop and input

async function initializeApp() {
    if (appInitialized) return; // Don't re-initialize

    await app.init({
        width: 1920,
        height: 1080,
        resizeTo: window,
        backgroundColor: 0x000000, // Black background
        resolution: devicePixelRatio,
        autoDensity: true,
        antialias: true,
    });
    // Append canvas to the specific container in index.html
    const gameCanvasContainer = document.getElementById('game-canvas-container');
    if (gameCanvasContainer) {
        gameCanvasContainer.appendChild(app.canvas);
    } else {
        console.error("Game canvas container not found!");
        return; // Stop if container missing
    }
    appInitialized = true;
}

const worldContainer = new PIXI.Container();
var player = null; // Initialize player later
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

var moveJoystick = null;
var aimJoystick = null;
var isMobile = false;

var worldTopBoundary = -1000;
var worldBottomBoundary = 1000;
var worldLeftBoundary = -1000;
var worldRightBoundary = 1000;

var enemiesPaused = false;

let musicStarted = false;
let audioContextUnlocked = false; // Flag to track if audio context is unlocked

// Mobile audio unlock overlay
let audioOverlay = null;
let audioOverlayText = null;

// UI elements (initialized later)
var fpsText = null;
var homeButton = null;
var restartButton = null;

var currentWaves = null;
var minimap = null;

// --- New Game Control Functions ---

async function startGame(level) {
    if (!appInitialized) {
        console.error("App not initialized. Call initializeApp first.");
        return;
    }
    if (gameRunning) {
        console.log("Game already running, resetting for new level.");
        stopGameLogic(true); // Stop existing game before starting new one
    }

    console.log(`Starting game for level ${level}`);
    gameRunning = true;
    paused = false;

    // Reset game state
    worldContainer.removeChildren(); // Clear previous elements
    bullets.length = 0;
    enemy_bullets.length = 0;
    enemies.length = 0;
    keyboard.length = 0; // Clear keyboard state
    mouseDown = false;
    musicStarted = false; // Reset music flag

    // Re-create player
    player = new Player(0, 0, 20, 0xffffff);

    // Setup UI elements
    fpsText = new PIXI.Text({text: "FPS: 0", style: {fontFamily: 'Arial', fontSize: 16, fill: 0xffffff }});
    fpsText.position.set(10, 10);
    fpsText.zIndex = 2000; // Ensure UI is on top

    homeButton = new PIXI.Text({text: "BACK", style: {fontFamily: 'Arial', fontSize: 24, fill: 0xffffff }});
    homeButton.position.set(10, 40);
    homeButton.eventMode = 'static';
    homeButton.cursor = 'pointer';
    homeButton.zIndex = 2000;

    restartButton = new PIXI.Text({text: "RESTART", style: {fontFamily: 'Arial', fontSize: 24, fill: 0xffffff }});
    restartButton.position.set(10, 80);
    restartButton.eventMode = 'static';
    restartButton.cursor = 'pointer';
    restartButton.visible = false;
    restartButton.zIndex = 2000;

    app.stage.addChild(worldContainer);
    app.stage.addChild(fpsText);
    app.stage.addChild(homeButton);
    app.stage.addChild(restartButton);

    createHealthBar(worldContainer);
    player.initializeGraphics(worldContainer);
    player.cannons = []; // Clear old cannons if any
    player.cannons.push(new DefaultCannon(worldContainer));

    activeLevel.number = level; // Set the active level number
    await configureLevel(activeLevel.number, player, worldContainer); // Load level data

    // Get wave data AFTER configuring level
    currentWaves = getWaveData(activeLevel.number, worldContainer);
    if (!currentWaves) {
        console.error("Failed to get wave data for level:", activeLevel.number);
        // Handle error - maybe stop game or go back to menu
        stopGameLogic();
        if (typeof closeGame === 'function') closeGame(); // Try to call menu's close function
        return;
    }
    currentWaves.reset(); // Ensure waves are reset

    // Re-create minimap if needed
    if (minimap) minimap.destroy(); // Destroy old one first
    minimap = new Minimap(app, player, enemies, activeLevel, {
        size: 180,
        padding: 15,
        viewRadius: 2000
    });

    // Setup button interactions
    homeButton.off('pointerdown'); // Remove previous listener if any
    homeButton.on('pointerdown', () => {
        stopGameLogic();
        if (typeof closeGame === 'function') {
            closeGame(); // Call the closeGame function from menu.js
        } else {
            console.warn("closeGame function not found in menu script");
        }
    });

    restartButton.off('pointerdown'); // Remove previous listener if any
    restartButton.on('pointerdown', () => {
        if (!player.alive) {
            // Restart the current level
            startGame(activeLevel.number);
        }
    });

    // Add ticker AFTER setup is complete
    app.ticker.remove(gameLoop); // Ensure no duplicate tickers
    app.ticker.add(gameLoop);

    if (mobileCheck()) {
        isMobile = true;
        setupMobileControls(); // Re-setup controls if needed
        repositionJoysticks();
        if (!audioOverlay) createAudioOverlay(); // Recreate overlay if needed
    }

    // Add global event listeners (ensure they check gameRunning/paused)
    addGlobalEventListeners();
}

function stopGameLogic(keepAppRunning = false) {
    console.log("Stopping game logic...");
    gameRunning = false;
    paused = true; // Ensure it's paused
    app.ticker.remove(gameLoop);

    // Cleanup: Remove game-specific elements from stage
    if (worldContainer) worldContainer.removeChildren(); // Clear game world visuals
    if (fpsText) app.stage.removeChild(fpsText);
    if (homeButton) app.stage.removeChild(homeButton);
    if (restartButton) app.stage.removeChild(restartButton);
    if (minimap) minimap.destroy();

    // Destroy joystick elements if they exist
    destroyMobileControls();

    // Clear arrays
    bullets.length = 0;
    enemy_bullets.length = 0;
    enemies.length = 0;
    if (player && player.cannons) player.cannons.length = 0;
    activeLevel.objects = [];
    activeLevel.shapes = [];
    activeLevel.points = [];

    player = null;
    minimap = null;
    currentWaves = null;
    fpsText = null;
    homeButton = null;
    restartButton = null;

    stopAllMusic(); // Stop any playing music
    musicStarted = false;

    // Optionally destroy the Pixi app itself if not keeping it
    // if (!keepAppRunning && appInitialized) {
    //     app.destroy(true, { children: true, texture: true, baseTexture: true });
    //     appInitialized = false;
    // }
    removeGlobalEventListeners(); // Remove listeners when stopping completely
}

function pauseGameLogic() {
    if (gameRunning) {
        paused = true;
        // Stop music or lower volume?
        // stopAllMusic(); or adjust volume
    }
}

function resumeGameLogic() {
    if (gameRunning) {
        paused = false;
        // Resume music?
        // Maybe replay the relevant music track if needed
    }
}

function isGamePaused() {
    return paused;
}

// --- End Game Control Functions ---

const createAudioOverlay = () => {
    if (!isMobile) return;
    
    audioOverlay = new PIXI.Graphics();
    audioOverlay.beginFill(0x000000, 0.7);
    audioOverlay.drawRect(0, 0, app.screen.width, app.screen.height);
    audioOverlay.endFill();
    audioOverlay.eventMode = 'static';
    
    audioOverlayText = new PIXI.Text({
        text: "TAP SCREEN TO FOCUS",
        style: {
            fontFamily: 'Arial',
            fontSize: 24,
            fill: 0xffffff,
            align: 'center'
        }
    });

    audioOverlayText.zIndex = 10000;    
    audioOverlayText.anchor.set(0.5);
    audioOverlayText.position.set(window.innerWidth / 2, window.innerHeight / 2);
    
    audioOverlay.addChild(audioOverlayText);
    app.stage.addChild(audioOverlay);
    
    audioOverlay.on('pointerdown', () => {
        attemptAudioUnlock();
        app.stage.removeChild(audioOverlay);
        audioOverlay = null;
        audioOverlayText = null;
    });
}

const gameLoop = (ticker) => {
    // Only run if the game is active and not paused
    if (gameRunning && !paused) {
        deltaTime = ticker.deltaMS;

        // Update game logic
        if (!isMobile) {
            player.update(mouseX, mouseY, mouseDown, deltaTime);
        } else {
            updateMobileInput();
            player.update(mouseX, mouseY, mouseDown, deltaTime);
        }
    
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
        currentWaves.update(deltaTime, enemies);
    
        if (fpsText) fpsText.text = `FPS: ${Math.round(app.ticker.FPS)}`;
        
        // Show restart button if player dies
        if (!player.alive && restartButton && !restartButton.visible) {
            restartButton.visible = true;
        }
    }
}

function handleMouseMove(event) {
    if (!gameRunning || paused) return;
    mouseX = event.clientX;
    mouseY = event.clientY;
}

function handleKeyDown(event) {
    if (!gameRunning || paused) return; // Don't process if game not active

    keyboard[event.key] = true;

    switch(event.key) {
        case "m":
            minimapEnabled = !minimapEnabled;
            minimap.graphics.clear();
            break;
        case "r": // Restart on R only if player dead
            if(!player.alive) {
                player.revive();

                destroyAllEnemies();
                stopAllMusic();
                playMusic('music_main', true, 0.2);

                configureLevel(activeLevel.number, player, worldContainer);
                if (currentWaves) currentWaves.reset();
                restartButton.visible = false;
            }
            break;
        case 'Escape': // Let menu handle Escape for pause
            if (typeof togglePause === 'function') {
                togglePause(); // Call menu's toggle function
            }
            break;
        default:
            // Handle other keys if needed
            break;
    }
}

function handleKeyUp(event) {
    if (!gameRunning) return; // Ignore if game stopped
    keyboard[event.key] = false;
}

function handleMouseDown() {
    if (!gameRunning || paused) return;
    mouseDown = true;
    attemptAudioUnlock(); // Try unlocking audio on interaction
}

function handleMouseUp() {
    if (!gameRunning) return;
    mouseDown = false;
}

function handleResize() {
    if (!appInitialized) return; // Don't resize if app not ready
    app.renderer.resize(window.innerWidth, window.innerHeight);
    // Resolution might not need setting again, but autoDensity should handle it.

    if (isMobile) {
        repositionJoysticks();
        
        // Resize audio overlay if it exists
        if (audioOverlay) {
            audioOverlay.clear();
            audioOverlay.beginFill(0x000000, 0.7);
            audioOverlay.drawRect(0, 0, app.screen.width, app.screen.height);
            audioOverlay.endFill();
            
            if (audioOverlayText) audioOverlayText.position.set(app.screen.width / 2, app.screen.height / 2);
        }
    }

    // Reposition UI elements if needed based on screen size
    if (fpsText) fpsText.position.set(10, 10);
    if (homeButton) homeButton.position.set(10, 40);
    if (restartButton) restartButton.position.set(10, 80);
}

// Add/Remove Global Listeners
function addGlobalEventListeners() {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("resize", handleResize);
    // Touch events for audio unlock are added separately if needed
}

function removeGlobalEventListeners() {
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("keydown", handleKeyDown);
    window.removeEventListener("keyup", handleKeyUp);
    window.removeEventListener("mousedown", handleMouseDown);
    window.removeEventListener("mouseup", handleMouseUp);
    window.removeEventListener("resize", handleResize);
}

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

function destroyMobileControls() {
    if (moveJoystick) moveJoystick.destroy();
    if (aimJoystick) aimJoystick.destroy();
    moveJoystick = null;
    aimJoystick = null;
    const containerLeft = document.getElementById('joystick-container-left');
    const containerRight = document.getElementById('joystick-container-right');
    if (containerLeft) containerLeft.remove();
    if (containerRight) containerRight.remove();
}

function updateMobileInput() {
    if (!mouseDown && aimJoystick && player) {
        
    }
}

function repositionJoysticks() {
    if (!isMobile || !moveJoystick || !aimJoystick) return;

    const padding = 50; // Distance from edges
    const size = 150; // Size of the joystick zone

    const containerLeft = document.getElementById('joystick-container-left');
    const containerRight = document.getElementById('joystick-container-right');

    if(containerLeft) {
        containerLeft.style.width = `${size}px`;
        containerLeft.style.height = `${size}px`;
        containerLeft.style.bottom = `${padding}px`;
        containerLeft.style.left = `${padding}px`;
    }
    if(containerRight) {
        containerRight.style.width = `${size}px`;
        containerRight.style.height = `${size}px`;
        containerRight.style.bottom = `${padding}px`;
        containerRight.style.right = `${padding}px`;
    }
}

function attemptAudioUnlock() {
    if (audioContextUnlocked) {
        if (!musicStarted) {
            const musicInstance = playMusic('music_main', true, 0.2);
            if (musicInstance && musicInstance.playState !== 'playFailed') {
                console.log("Main music started successfully after context unlock.");
                musicStarted = true;
            } else if (musicInstance && musicInstance.playState === 'playFailed') {
                 console.warn("Audio context unlocked, but main music failed to play.");
            }
        }
        return;
    }

    console.log("Attempting to unlock audio context and play music");
    const musicInstance = playMusic('music_main', true, 0.2);

    if (musicInstance && musicInstance.playState !== 'playFailed') {
        console.log("Audio context unlocked and music started successfully!");
        audioContextUnlocked = true;
        musicStarted = true;
        
        // Remove the overlay if it exists and we're on mobile
        if (isMobile && audioOverlay) {
            app.stage.removeChild(audioOverlay);
            audioOverlay = null;
            audioOverlayText = null;
        }
    } else {
        console.warn("Failed to unlock audio context/play music on first attempt. Retrying on next interaction is implicitly handled.");
    }
}

function gameCompleted() {
    if (typeof closeGame === 'function') {
        alert("Well Done!");
        closeGame();
    }
}

window.mobileCheck = function() {
    let check = false;
    (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
    return check;
};