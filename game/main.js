const app = new PIXI.Application();
var appInitialized = false;
var paused = false;

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

var moveJoystick = null;
var aimJoystick = null;
var isMobile = false;

var worldTopBoundary = -1000;
var worldBottomBoundary = 1000;
var worldLeftBoundary = -1000;
var worldRightBoundary = 1000;

var enemiesPaused = false;

let musicStarted = false;

// FPS Counter Text
const fpsText = new PIXI.Text({text: "FPS: 0", style: {fontFamily: 'Arial', fontSize: 16, fill: 0xffffff }});
fpsText.position.set(10, 10);

const LEVEL_ONE_WAVES = new Waves(worldContainer, [
    new Wave(1, {
        "DefaultEnemy": 1,
    }),

    new Wave(1, {
        "DefaultEnemy": 2,
    }),

    new Wave(1, {
        "DefaultEnemy": 4,
        "DefaultBoss": 1
    }, () => {
        stopAllMusic();
        playMusic('music_boss', true, 0.25);
    }),
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

    app.ticker.add(gameLoop);
    
    if (mobileCheck()) {
        isMobile = true;
        setupMobileControls();
        repositionJoysticks();
    }
}

const gameLoop = (ticker) => {
    if(!paused) {
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
        LEVEL_ONE_WAVES.update(deltaTime, enemies);
    
        fpsText.text = `FPS: ${Math.round(app.ticker.FPS)}`;
    }
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

                configureLevel("levels/level_1.json", player, worldContainer);
                LEVEL_ONE_WAVES.reset();
            }
            break;
        default:
            window.parent.postMessage(event.key, '*');
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

    if (isMobile) {
        repositionJoysticks();
    }
});

window.mobileCheck = function() {
    let check = false;
    (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
    return check;
};

const tryPlayMusic = () => {
    if (musicStarted) return;
    const musicInstance = playMusic('music_main', true, 0.2);
    if (musicInstance && musicInstance.playState !== 'playFailed') {
        musicStarted = true;;
    } else {
        console.log("Failed to play music initially (likely needs interaction). Will retry on interaction.");
    }
};

function setupMobileControls() {
    const joystickContainerLeft = document.createElement('div');
    joystickContainerLeft.id = 'joystick-container-left';
    joystickContainerLeft.style.position = 'absolute';
    joystickContainerLeft.style.bottom = '150px';
    joystickContainerLeft.style.left = '150px';
    joystickContainerLeft.style.width = '150px';
    joystickContainerLeft.style.height = '150px';
    document.body.appendChild(joystickContainerLeft);

    const joystickContainerRight = document.createElement('div');
    joystickContainerRight.id = 'joystick-container-right';
    joystickContainerRight.style.position = 'absolute';
    joystickContainerRight.style.bottom = '150px';
    joystickContainerRight.style.right = '150px';
    joystickContainerRight.style.width = '150px';
    joystickContainerRight.style.height = '150px';
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
        if (!musicStarted) {
            tryPlayMusic();
        }
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