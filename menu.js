const canvas = document.getElementById('menu-canvas');
const ctx = canvas.getContext('2d');
const container = document.getElementById('big_container');
const pauseContainer = document.getElementById('pause-container');
const gamePage = document.getElementById('game');

// Set canvas dimensions to match window size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const menu_bullets = [];

var mouseX = 0;
var mouseY = 0;
var centerX = canvas.width/2;
var centerY = canvas.height/2.5;
var angle = 0;
var menuActive = true;
var gameInitialized = false;
var currentGameLevel = 1;

function main() {
    openPage('menu');
    draw();
}

function draw() {
    if (menuActive) {
        requestAnimationFrame(draw);

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 25, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(angle);
        
        const rectWidth = 30;
        const rectHeight = 15;
        ctx.fillRect(30, -rectHeight/2, rectWidth, rectHeight);
        
        ctx.restore();

        for (const [index, bullet] of menu_bullets.entries()) {
            bullet.x += Math.cos(bullet.angle) * bullet.speed;
            bullet.y += Math.sin(bullet.angle) * bullet.speed;

            ctx.beginPath();
            ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
            ctx.fill();

            if(bullet.x < 0 || bullet.x > canvas.width || bullet.y < 0 || bullet.y > canvas.height) {
                menu_bullets.splice(index, 1);
            }
        }
    }
}

ctx.fillStyle = 'white';
ctx.beginPath();
ctx.arc(canvas.width/2, canvas.height/2, 50, 0, Math.PI * 2);

function fire() {
    if (!menuActive) return;
    let len = 50;
    let x = centerX + Math.cos(angle) * len;
    let y = centerY + Math.sin(angle) * len;

    menu_bullets.push({
        x: x,
        y: y,
        angle: angle,
        speed: 10,
        radius: 7.5,
        color: 'white',
    });
}

function openGame(level) {
    menuActive = false;
    currentGameLevel = level;
    openPage('game');
    pauseContainer.style.display = 'none';

    if (typeof initializeApp === 'function' && typeof startGame === 'function') {
        if (!gameInitialized) {
            initializeApp().then(() => {
                gameInitialized = true;
                startGame(level);
            }).catch(err => console.error("Initialization failed:", err));
        } else {
            startGame(level);
        }
    } else {
        console.error("Game initialization or start function not found!");
    }
}

function closeGame() {
    if (typeof stopGameLogic === 'function') {
        stopGameLogic();
    } else {
        console.warn("stopGameLogic function not found in game script");
    }
    openPage('menu');
    pauseContainer.style.display = 'none';
    menuActive = true;
    draw();
}

function togglePause() {
    if (gamePage.style.display === 'block' && typeof isGamePaused === 'function' && typeof pauseGameLogic === 'function' && typeof resumeGameLogic === 'function') {
        if(isGamePaused()) {
            resumeGameLogic();
            pauseContainer.style.display = 'none';
        } else {
            pauseGameLogic();
            pauseContainer.style.display = 'grid';
        }
    } else if (gamePage.style.display !== 'block') {
        // Ignore pause toggle if not on the game page
    } else {
        console.warn("Game pause functions not available.");
    }
}

function openPage(page) {
    menuActive = (page === 'menu');

    document.getElementById(page).style.display = 'block';
    let pages = document.getElementsByClassName('page');
    for(let i = 0; i < pages.length; i++) {
        if(pages[i].id !== page) {
            pages[i].style.display = 'none';
        }
    }
}

window.addEventListener('mousemove', function(event) {
    if (!menuActive) return;

    mouseX = event.clientX;
    mouseY = event.clientY;

    let rect = canvas.getBoundingClientRect();
    let canvasMouseX = mouseX - rect.left;
    let canvasMouseY = mouseY - rect.top;
    angle = Math.atan2(canvasMouseY - centerY, canvasMouseX - centerX);
});

window.addEventListener('resize', function() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    centerX = canvas.width/2;
    centerY = canvas.height/2.5;
});

window.addEventListener('mousedown', function() {
    if (!menuActive) return;
    fire();
});

document.addEventListener('keydown', function(event) {
    switch(event.key) {
        case 'Escape':
            if (gamePage.style.display === 'block') {
                togglePause();
            }
            break;
    }
});

function handleLevelCompleted() {
    setTimeout(() => {
        alert("Well Done!");
        closeGame();
    }, 1000);
}

document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
});

pauseContainer.addEventListener('pointerdown', function(event) {
    if (event.target === pauseContainer && gamePage.style.display === 'block') {
        togglePause();
    }
});

main();