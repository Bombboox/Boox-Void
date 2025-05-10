const app = new PIXI.Application();
var appInitialized = false;
var paused = false;
var gameRunning = false;

async function initializeApp() {
    if (appInitialized) return;

    await app.init({
        width: 1920,
        height: 1080,
        resizeTo: window,
        backgroundColor: 0x000000,
        resolution: devicePixelRatio,
        autoDensity: true,
        antialias: true,
    });
    const gameCanvasContainer = document.getElementById('game-canvas-container');
    if (gameCanvasContainer) {
        gameCanvasContainer.appendChild(app.canvas);
    } else {
        console.error("Game canvas container not found!");
        return;
    }
    appInitialized = true;
}

const worldContainer = new PIXI.Container();
var player = null;
const bullets = [];
const enemy_bullets = [];
const enemies = [];
const damage_numbers = [];

let lighting = null;

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
let audioContextUnlocked = false;

let audioOverlay = null;
let audioOverlayText = null;

var fpsText = null;
var homeButton = null;
var restartButton = null;

var currentWaves = null;
var minimap = null;

var backgroundGraphics = null;
var backgroundColor = 0x000000;

async function startGame(level) {
    if (!appInitialized) {
        console.error("App not initialized. Call initializeApp first.");
        return;
    }
    if (gameRunning) {
        stopGameLogic(true); 
    }

    gameRunning = true;
    paused = false;

    worldContainer.removeChildren(); 
    bullets.length = 0;
    enemy_bullets.length = 0;
    enemies.length = 0;
    keyboard.length = 0; 
    mouseDown = false;
    musicStarted = false; 

    backgroundGraphics = new PIXI.Graphics();
    backgroundGraphics.rect(worldContainer.x, worldContainer.y, window.innerWidth, window.innerHeight);
    backgroundGraphics.fill(backgroundColor);
    backgroundGraphics.zIndex = -100;
    worldContainer.addChild(backgroundGraphics);

    player = new Player(0, 0, 20, 0xffffff);
    lighting = new Lighting(worldContainer, player);
    lighting.setDarknessOpacity(0.0);

    fpsText = new PIXI.Text({text: "FPS: 0", style: {fontFamily: 'Arial', fontSize: 16, fill: 0xffffff }});
    fpsText.position.set(10, 10);
    fpsText.zIndex = 2000;

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

    if (minimap) minimap.destroy();
    minimap = new Minimap(app, player, enemies, activeLevel, {
        size: 180,
        padding: 15,
        viewRadius: 2000,
        showingEnemies: true,
        viewable: true
    });

    createHealthBar(worldContainer);
    player.initializeGraphics(worldContainer);
    player.cannons = [];
    let equipped = (typeof player_data !== 'undefined' && player_data && player_data.equippedWeapon) ? player_data.equippedWeapon : 'DefaultCannon';
    const cannonClassMap = {
        'DefaultCannon': DefaultCannon,
        'ExplosiveCannon': ExplosiveCannon,
        'HitscanCannon': HitscanCannon,
        'DroneCannon': DroneCannon,
    };
    let CannonClass = cannonClassMap[equipped] || DefaultCannon;
    let cannonLevel = (player_data && player_data.cannons && player_data.cannons[equipped]) ? player_data.cannons[equipped].level : 1;
    player.cannons.push(new CannonClass({ worldContainer: worldContainer, level: cannonLevel }));
 
    activeLevel.number = level;
    await configureLevel(activeLevel.number, player, worldContainer, lighting);

    currentWaves = getWaveData(activeLevel.number, worldContainer);
    if (!currentWaves) {
        console.error("Failed to get wave data for level:", activeLevel.number);
        stopGameLogic();
        if (typeof closeGame === 'function') closeGame();
        return;
    }
    currentWaves.reset();

    homeButton.off('pointerdown');
    homeButton.on('pointerdown', () => {
        stopGameLogic();
        if (typeof closeGame === 'function') {
            closeGame();
        } else {
            console.warn("closeGame function not found in menu script");
        }
    });

    restartButton.off('pointerdown');
    restartButton.on('pointerdown', () => {
        if (!player.alive) {
            startGame(activeLevel.number);
        }
    });

    app.ticker.remove(gameLoop);
    app.ticker.add(gameLoop);

    if (mobileCheck()) {
        isMobile = true;
        setupMobileControls();
        repositionJoysticks();
        if (!audioOverlay) createAudioOverlay();
    }

    addGlobalEventListeners();
}

function stopGameLogic(keepAppRunning = false) {
    gameRunning = false;
    paused = true;
    app.ticker.remove(gameLoop);

    if (worldContainer) worldContainer.removeChildren();
    if (fpsText) app.stage.removeChild(fpsText);
    if (homeButton) app.stage.removeChild(homeButton);
    if (restartButton) app.stage.removeChild(restartButton);
    if (minimap) minimap.destroy();
    if (lighting) {
        lighting.destroy();
        lighting = null;
    }

    destroyMobileControls();

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

    stopAllMusic();
    musicStarted = false;

    removeGlobalEventListeners();
}

function pauseGameLogic() {
    if (gameRunning) {
        paused = true;
    }
}

function resumeGameLogic() {
    if (gameRunning) {
        paused = false;
    }
}

function isGamePaused() {
    return paused;
}

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
    if (gameRunning && !paused) {
        deltaTime = ticker.deltaMS;

        if (!isMobile) {
            player.update(mouseX, mouseY, mouseDown, deltaTime);
        } else {
            updateMobileInput();
            player.update(mouseX, mouseY, mouseDown, deltaTime);
        }
    
        if (lighting) lighting.update();
    
        for (let i = bullets.length - 1; i >= 0; i--) { 
            bullets[i].update(deltaTime, worldContainer);
        }
    
        for (let i = enemy_bullets.length - 1; i >= 0; i--) { 
            enemy_bullets[i].update(deltaTime, worldContainer);
        }
    
        for (let i = enemies.length - 1; i >= 0; i--) { 
            enemies[i].update(deltaTime, worldContainer); 
        }

        for(let i = damage_numbers.length - 1; i >= 0; i--) {
            damage_numbers[i].update(deltaTime);
        }
    
        if (minimap && minimapEnabled) {
            minimap.update();
        }

        backgroundGraphics.clear();
        backgroundGraphics.rect(-worldContainer.x, -worldContainer.y, window.innerWidth, window.innerHeight);
        backgroundGraphics.fill(backgroundColor);
    
        drawHealthBar(worldContainer, deltaTime);
        currentWaves.update(deltaTime, enemies);
    
        if (fpsText) fpsText.text = `FPS: ${Math.round(app.ticker.FPS)}`;
        
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
    if (!gameRunning || paused) return;

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
                playMusic(pickSong(activeLevel.theme, activeLevel.number), true, 0.2);

                configureLevel(activeLevel.number, player, worldContainer, lighting);
                if (currentWaves) currentWaves.reset();
                restartButton.visible = false;
            }
            break;
        case 'Escape':
            if (typeof togglePause === 'function') {
                togglePause();
            }
            break;
        default:
            break;
    }
}

function handleKeyUp(event) {
    if (!gameRunning) return;
    keyboard[event.key] = false;
}

function handleMouseDown() {
    if (!gameRunning || paused) return;
    mouseDown = true;
    attemptAudioUnlock();
}

function handleMouseUp() {
    if (!gameRunning) return;
    mouseDown = false;
}

function handleResize() {
    if (!appInitialized) return;
    app.renderer.resize(window.innerWidth, window.innerHeight);
    app.renderer.resolution = devicePixelRatio;

    if (isMobile) {
        repositionJoysticks();
        
        if (audioOverlay) {
            audioOverlay.clear();
            audioOverlay.beginFill(0x000000, 0.7);
            audioOverlay.drawRect(0, 0, app.screen.width, app.screen.height);
            audioOverlay.endFill();
            
            if (audioOverlayText) audioOverlayText.position.set(app.screen.width / 2, app.screen.height / 2);
        }
    }

    if (fpsText) fpsText.position.set(10, 10);
    if (homeButton) homeButton.position.set(10, 40);
    if (restartButton) restartButton.position.set(10, 80);
}

function addGlobalEventListeners() {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("resize", handleResize);
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

function setBackgroundColor(color) {
    backgroundColor = color;
    backgroundGraphics.clear();
    backgroundGraphics.rect(-worldContainer.x, -worldContainer.y, window.innerWidth, window.innerHeight);
    backgroundGraphics.fill(backgroundColor);  
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

function setupMobileControls() {
    const joystickContainerLeft = document.createElement('div');
    joystickContainerLeft.id = 'joystick-container-left';
    joystickContainerLeft.style.position = 'absolute';
    joystickContainerLeft.style.bottom = '150px';
    joystickContainerLeft.style.left = '150px';
    joystickContainerLeft.style.width = '150px';
    joystickContainerLeft.style.height = '150px';
    joystickContainerLeft.style.zIndex = '1000';
    document.body.appendChild(joystickContainerLeft);

    const joystickContainerRight = document.createElement('div');
    joystickContainerRight.id = 'joystick-container-right';
    joystickContainerRight.style.position = 'absolute';
    joystickContainerRight.style.bottom = '150px';
    joystickContainerRight.style.right = '150px';
    joystickContainerRight.style.width = '150px';
    joystickContainerRight.style.height = '150px';
    joystickContainerRight.style.zIndex = '1000';
    document.body.appendChild(joystickContainerRight);

    const joystickOptionsLeft = {
        zone: joystickContainerLeft,
        mode: 'static',
        position: { left: '-20%', top: '120%' },
        color: 'white',
        size: 100
    };

    const joystickOptionsRight = {
        zone: joystickContainerRight,
        mode: 'static',
        position: { left: '120%', top: '120%' },
        color: 'white',
        size: 100
    };

    moveJoystick = nipplejs.create(joystickOptionsLeft);
    aimJoystick = nipplejs.create(joystickOptionsRight);

    const startMusicOnInteraction = () => {
        attemptAudioUnlock();

        moveJoystick.off('start', startMusicOnInteraction);
        aimJoystick.off('start', startMusicOnInteraction);
    };

    moveJoystick.on('start', startMusicOnInteraction);
    aimJoystick.on('start', startMusicOnInteraction);

    moveJoystick.on('move', (evt, data) => {
        const speed = 5;
        const angle = data.angle.radian;
        const force = Math.min(data.force, 1.0);

        const vx = Math.cos(angle) * speed * force;
        const vy = Math.sin(angle) * speed * force * -1;

        if (player) {
            keyboard['w'] = vy < -speed * 0.2;
            keyboard['s'] = vy > speed * 0.2;
            keyboard['a'] = vx < -speed * 0.2;
            keyboard['d'] = vx > speed * 0.2;
        } else {
            console.warn("Player object or body not accessible for movement joystick.");
        }
    });

    moveJoystick.on('end', () => {
        keyboard['w'] = false;
        keyboard['s'] = false;
        keyboard['a'] = false;
        keyboard['d'] = false;
    });

    aimJoystick.on('move', (evt, data) => {
        const playerScreenPos = worldContainer.toGlobal(player.graphics.position);
        const angle = data.angle.radian;
        const distance = 100;

        mouseX = playerScreenPos.x + Math.cos(angle) * distance;
        mouseY = playerScreenPos.y - Math.sin(angle) * distance;

        mouseDown = true;
    });

    aimJoystick.on('end', () => {
        mouseDown = false;
    });

    repositionJoysticks();
}

function updateMobileInput() {
    if (!mouseDown && aimJoystick && player) {
        const playerScreenPos = worldContainer.toGlobal(player.graphics.position);
    }
}

function repositionJoysticks() {
    if (!isMobile || !moveJoystick || !aimJoystick) return;

    const containerLeft = document.getElementById('joystick-container-left');
    const containerRight = document.getElementById('joystick-container-right');

    if(containerLeft) {
        containerLeft.style.bottom = '150px';
        containerLeft.style.left = '150px';
    }
    if(containerRight) {
        containerRight.style.bottom = '150px';
        containerRight.style.right = '150px';
    }
}

function attemptAudioUnlock() {
    if (audioContextUnlocked) {
        if (!musicStarted) {
            const musicInstance = playMusic(pickSong(activeLevel.theme, activeLevel.number), true, 0.2);
            if (musicInstance && musicInstance.playState !== 'playFailed') {
                musicStarted = true;
            } else if (musicInstance && musicInstance.playState === 'playFailed') {
                 console.warn("Audio context unlocked, but main music failed to play.");
            }
        }
        return;
    }
    
    const musicInstance = playMusic(pickSong(activeLevel.theme, activeLevel.number), true, 0.2);

    if (musicInstance && musicInstance.playState !== 'playFailed') {
        audioContextUnlocked = true;
        musicStarted = true;
        
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
        setTimeout(() => {
            alert("Well Done!");
            beatLevel(activeLevel.number);
            closeGame();
        }, 1000);
    }
}

window.mobileCheck = function() {
    let check = false;
    (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
    return check;
};