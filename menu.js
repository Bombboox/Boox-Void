const canvas = document.getElementById('menu-canvas');
const ctx = canvas.getContext('2d');
const container = document.getElementById('big_container');
const pauseContainer = document.getElementById('pause-container');
const gamePage = document.getElementById('game');

const weapon_costs = {
    "DefaultCannon": document.getElementById('default_weapon_cost'),
    "ExplosiveCannon": document.getElementById('explosive_weapon_cost'),
    "HitscanCannon": document.getElementById('hitscan_weapon_cost'),
    "DroneCannon": document.getElementById('drone_weapon_cost'),
}

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
var animationFrameId = null;

function main() {
    openPage('menu');
    resizeCanvas();
    draw();

    // Apply fitText to all menu buttons
    function applyFitText() {
        const menuButtons = document.querySelectorAll('.menu-button');
        menuButtons.forEach(function(button) {
            jQuery(button).fitText(1.5, {
                minFontSize: '6px'
            });
        });
    }
    
    // Initial application when DOM is loaded
    document.addEventListener('DOMContentLoaded', applyFitText);
    
    // Apply when page changes or buttons are pressed
    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('menu-button') || 
            event.target.closest('.page')) {
            applyFitText();
        }
    });
}

function draw() {
    if (menuActive) {
        animationFrameId = requestAnimationFrame(draw);

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

function openPage(page) {
    document.getElementById(page).style.display = 'block';
    let pages = document.getElementsByClassName('page');
    for(let i = 0; i < pages.length; i++) {
        if(pages[i].id !== page) {
            pages[i].style.display = 'none';
        }
    }

    menuActive = (page === 'menu');
    if (page === 'menu') {
        draw();
    } else if (page === 'levels') {
        updateLevelDisplay();
    } else if (page === 'cannon') {
        updateCannonDisplay();
    } else if (page === 'shop') {
        updateShopDisplay();
    }
}

function updateLevelDisplay() {
    if (typeof player_data === 'undefined' || player_data === null) {
        console.error("Player data is not available.");
        // Optionally, try to load it again or initialize
        if (typeof loadPlayerData === 'function') {
            loadPlayerData();
            if (typeof player_data === 'undefined' || player_data === null) {
                 if (typeof initializePlayerData === 'function') initializePlayerData();
                 else return; // Still no player_data, can't proceed
            }
        } else {
            return; 
        }
    }

    const levelsContainer = document.querySelector('.levels_container');
    if (!levelsContainer) return;

    const levelElements = levelsContainer.querySelectorAll('.level');
    const maxUnlockedLevel = player_data.level;

    levelElements.forEach(levelElement => {
        const levelId = levelElement.id; // e.g., "level_1"
        const levelNumber = parseInt(levelId.split('_')[1]);

        if (levelNumber > maxUnlockedLevel) {
            levelElement.classList.add('locked');
            levelElement.onclick = null; // Remove existing click listener
            // Add a visual indicator if desired, e.g., a lock icon
            if (!levelElement.querySelector('.lock-indicator')) {
                const lockIndicator = document.createElement('span');
                lockIndicator.textContent = '🔒';
                lockIndicator.className = 'lock-indicator';
                levelElement.appendChild(lockIndicator);
            }
        } else {
            levelElement.classList.remove('locked');
            // Restore original onclick or set it if it was removed
            levelElement.onclick = () => openGame(levelNumber); 
            const lockIndicator = levelElement.querySelector('.lock-indicator');
            if (lockIndicator) {
                levelElement.removeChild(lockIndicator);
            }
        }
    });
}

function updateCannonDisplay() {
    if (typeof player_data === 'undefined' || player_data === null) {
        if (typeof loadPlayerData === 'function') loadPlayerData();
        if (typeof player_data === 'undefined' || player_data === null) {
            if (typeof initializePlayerData === 'function') initializePlayerData();
            else return;
        }
    }

    const cannonContainer = document.getElementById('cannon_container');
    if (!cannonContainer) return;
    cannonContainer.innerHTML = '';

    // Mapping for display names
    const cannonDisplayNames = {
        'DefaultCannon': 'Default',
        'ExplosiveCannon': 'Explosive',
        'HitscanCannon': 'Hitscan',
        'DroneCannon': 'Drone',
    };
    const rarityNames = ['Bronze', 'Silver', 'Gold', 'Diamond', 'Void'];
    const rarityColors = ['#b08d57', '#c0c0c0', '#ffd700', '#b9f2ff', '#6e00ff'];
    const rarityBorders = [
        '4px solid #b08d57', // Bronze
        '4px solid #c0c0c0', // Silver
        '4px solid #ffd700', // Gold
        '4px solid #b9f2ff', // Diamond
        '4px solid #6e00ff, 2px dashed #fff' // Void (fancy)
    ];
    const rarityShadows = [
        '0 0 16px 4px #b08d57aa',
        '0 0 16px 4px #c0c0c0aa',
        '0 0 24px 6px #ffd700cc',
        '0 0 32px 8px #b9f2ffaa',
        '0 0 40px 10px #6e00ff, 0 0 8px 2px #fff' // Void
    ];

    // Show all cannons in inventory
    for (const cannon of player_data.inventory) {
        const isEquipped = player_data.equippedCannonId === cannon.id;
        const cannonDiv = document.createElement('div');
        cannonDiv.className = 'weapon';
        // Apply rarity border and shadow
        cannonDiv.style.border = rarityBorders[cannon.rarity] || '2px solid #333';
        cannonDiv.style.boxShadow = rarityShadows[cannon.rarity] || 'none';
        if (cannon.rarity === 4) {
            cannonDiv.style.background = 'linear-gradient(135deg, #6e00ff 0%, #b9f2ff 100%)';
        }

        const name = document.createElement('h1');
        name.className = 'weapon_name';
        name.textContent = cannonDisplayNames[cannon.type] || cannon.type;
        cannonDiv.appendChild(name);

        // Rarity
        const rarityDiv = document.createElement('div');
        rarityDiv.textContent = 'Rarity: ' + rarityNames[cannon.rarity];
        rarityDiv.style.color = rarityColors[cannon.rarity];
        rarityDiv.style.margin = '10px 0 0 15px';
        rarityDiv.style.fontFamily = "'Press Start 2P', system-ui";
        rarityDiv.style.fontSize = '12px';
        cannonDiv.appendChild(rarityDiv);

        // Level
        const level = document.createElement('div');
        level.textContent = 'Level: ' + cannon.level;
        level.style.margin = '10px 0 0 15px';
        level.style.fontFamily = "'Press Start 2P', system-ui";
        level.style.fontSize = '12px';
        cannonDiv.appendChild(level);

        if (isEquipped) {
            const equippedLabel = document.createElement('div');
            equippedLabel.textContent = 'Equipped';
            equippedLabel.style.color = '#4CAF50';
            equippedLabel.style.margin = '10px 0 0 15px';
            equippedLabel.style.fontFamily = "'Press Start 2P', system-ui";
            equippedLabel.style.fontSize = '12px';
            cannonDiv.appendChild(equippedLabel);
        } else {
            const equipBtn = document.createElement('button');
            equipBtn.className = 'menu-button equip_button';
            equipBtn.textContent = 'Equip';
            equipBtn.style.width = '40%';
            equipBtn.style.height = '30%';
            equipBtn.onclick = function() {
                equipCannonById(cannon.id);
                updateCannonDisplay();
            };
            cannonDiv.appendChild(equipBtn);
        }

        // Upgrade button
        const upgradeBtn = document.createElement('button');
        upgradeBtn.className = 'menu-button buy_button';
        const upgradeCost = getCannonUpgradeCost(cannon.level);
        upgradeBtn.textContent = 'Upgrade (' + upgradeCost + ' $)';
        upgradeBtn.disabled = player_data.money < upgradeCost;
        upgradeBtn.onclick = function() {
            if (player_data.money >= upgradeCost) {
                addMoney(-upgradeCost);
                upgradeCannonById(cannon.id);
                updateCannonDisplay();
            }
        };
        cannonDiv.appendChild(upgradeBtn);

        // Trash/Remove button
        const removeBtn = document.createElement('button');
        removeBtn.className = 'menu-button trash_button';
        removeBtn.style.backgroundColor = '#b22222';
        removeBtn.style.color = '#fff';
        removeBtn.style.position = 'absolute';
        removeBtn.style.top = '10px';
        removeBtn.style.right = '10px';
        removeBtn.textContent = '🗑️';
        removeBtn.title = 'Trash this cannon';
        removeBtn.onclick = function() {
            if (confirm('Are you sure you want to trash this cannon? This cannot be undone.')) {
                removeCannonById(cannon.id);
                updateCannonDisplay();
            }
        };
        cannonDiv.appendChild(removeBtn);

        cannonContainer.appendChild(cannonDiv);
    }
    updateMoneyDisplay();
}

function updateShopDisplay() {
    if (typeof player_data === 'undefined' || player_data === null) {
        if (typeof loadPlayerData === 'function') loadPlayerData();
        if (typeof player_data === 'undefined' || player_data === null) {
            if (typeof initializePlayerData === 'function') initializePlayerData();
            else return;
        }
    }

    const shopContainer = document.getElementById('shop_container');
    if (!shopContainer) return;

    const cannonMapping = {
        "DefaultCannon": { id: "default_weapon", cost: parseInt(document.getElementById('default_weapon_cost')?.textContent || 150) },
        "ExplosiveCannon": { id: "explosive_weapon", cost: parseInt(document.getElementById('explosive_weapon_cost')?.textContent || 500) },
        "HitscanCannon": { id: "hitscan_weapon", cost: parseInt(document.getElementById('hitscan_weapon_cost')?.textContent || 1500) },
        "DroneCannon": { id: "drone_weapon", cost: parseInt(document.getElementById('drone_weapon_cost')?.textContent || 3000) },
    };

    // Setup buy buttons for each weapon
    for (const cannonType in cannonMapping) {
        const { id: elementId, cost } = cannonMapping[cannonType];
        if (!elementId) continue;

        const cannonDiv = document.getElementById(elementId);
        if (!cannonDiv) continue;

        const buyButton = cannonDiv.querySelector('.buy_button');
        if (!buyButton) continue;

        // Set the cost span text
        const costSpan = cannonDiv.querySelector(`#${elementId}_cost`);
        if (costSpan) {
            costSpan.textContent = cost;
        }

        // Only update the disabled state without recreating the onclick handler
        buyButton.disabled = player_data.money < cost;

        // Only set the onclick handler if it hasn't been set already
        if (!buyButton.hasAttribute('data-initialized')) {
            buyButton.setAttribute('data-initialized', 'true');
            buyButton.onclick = function() {
                if (player_data.money >= cost) {
                    addMoney(-cost);
                    const newCannon = addCannonToInventory(cannonType);
                    // Just update the disabled state of buttons without recreating them
                    document.querySelectorAll('.buy_button').forEach(btn => {
                        const parentId = btn.closest('.weapon').id;
                        const cannonInfo = Object.values(cannonMapping).find(info => info.id === parentId);
                        if (cannonInfo) {
                            btn.disabled = player_data.money < cannonInfo.cost;
                        }
                    });
                    updateMoneyDisplay();
                    updateCannonDisplay();
                    alert('You got a ' + (['Bronze','Silver','Gold','Diamond','Void'][newCannon.rarity]) + ' ' + (cannonType.replace('Cannon','')) + '!');
                }
            };
        }
    }
    updateMoneyDisplay();
}

function updateMoneyDisplay() {
    const money_displays = document.querySelectorAll('.money');
    money_displays.forEach(money => {
        money.textContent = `Gold: ${player_data.money}`;
    });
}

function getCannonUpgradeCost(level) {
    return 100 * level; 
}

function openGame(level) {
    menuActive = false;
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
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
    // Restart the animation loop
    if (animationFrameId === null) {
        draw();
    }
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

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    centerX = canvas.width/2;
    centerY = canvas.height/2.5;
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

window.addEventListener('resize', resizeCanvas);

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