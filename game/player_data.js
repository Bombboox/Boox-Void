var player_data;
const savedData = localStorage.getItem('player_data');

if (savedData) {
    try {
        player_data = JSON.parse(savedData);
    } catch (error) {
        console.error('Failed to parse player data from localStorage:', error);
        initializePlayerData();
    }
} else {
    initializePlayerData();
    localStorage.setItem('player_data', JSON.stringify(player_data));
}

function savePlayerData() {
    localStorage.setItem('player_data', JSON.stringify(player_data));
}

function loadPlayerData() {
    const savedData = localStorage.getItem('player_data');
    if (savedData) {
        player_data = JSON.parse(savedData);
    }
}

function initializePlayerData() {
    if (!player_data) {
        player_data = {
            money: 0,
            level: 1,
            cannons: {
                "DefaultCannon": {
                    level: 1,
                    owned: true
                }
            },
            equippedWeapon: "DefaultCannon"
        };
        savePlayerData();
    }
}

function addToInventory(item) {
    if (!player_data.cannons[item]) {
        player_data.cannons[item] = {
            level: 1,
            owned: true
        };
    }
    savePlayerData();
}

function upgradeCannon(cannonType) {
    if (player_data.cannons[cannonType]) {
        player_data.cannons[cannonType].level += 1;
        savePlayerData();
    }
}

function getCannonLevel(cannonType) {
    if (player_data.cannons[cannonType]) {
        return player_data.cannons[cannonType].level;
    }
    return 0;
}

function addMoney(amount) {
    player_data.money += amount;
    savePlayerData();
}

function beatLevel(level) {
    if(level + 1 > player_data.level) {
        player_data.level = level + 1;
        savePlayerData();
    }
}
