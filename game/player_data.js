var player_data;
const savedData = localStorage.getItem('player_data');
const CURRENT_VERSION = 1; // Define the current version of player data structure

function generateCannonId() {
    return 'cannon_' + Math.random().toString(36).substr(2, 9);
}

function getRandomRarity() {
    // 0: bronze, 1: silver, 2: gold, 3: diamond, 4: void
    const random = Math.random() * 100;
    if (random < 60) {
        return 0; // 60% chance for bronze
    } else if (random < 90) {
        return 1; // 30% chance for silver
    } else if (random < 97.5) {
        return 2; // 7.5% chance for gold
    } else if (random < 99.5) {
        return 3; // 2% chance for diamond
    } else {
        return 4; // 0.5% chance for void
    }
}

if (savedData) {
    try {
        player_data = JSON.parse(savedData);
        // Check if the data version matches current version
        if (!player_data.version || player_data.version !== CURRENT_VERSION) {
            console.log('Player data version mismatch. Reinitializing data.');
            initializePlayerData(true);
        }
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
        try {
            const loadedData = JSON.parse(savedData);
            // Check version before loading
            if (!loadedData.version || loadedData.version !== CURRENT_VERSION) {
                console.log('Player data version mismatch during load. Reinitializing data.');
                initializePlayerData();
            } else {
                player_data = loadedData;
            }
        } catch (error) {
            console.error('Failed to parse player data during load:', error);
            initializePlayerData();
        }
    }
}

function initializePlayerData(force = false) {
    if (!player_data || force) {
        player_data = {
            version: CURRENT_VERSION, // Add version to player data
            money: 0,
            level: 1,
            inventory: [
                {
                    id: generateCannonId(),
                    type: "DefaultCannon",
                    level: 1,
                    rarity: 0 // bronze
                }
            ],
            equippedCannonId: null
        };
        // Equip the first cannon by default
        player_data.equippedCannonId = player_data.inventory[0].id;
        savePlayerData();
    }
}

function addCannonToInventory(type) {
    const newCannon = {
        id: generateCannonId(),
        type: type,
        level: 1,
        rarity: getRandomRarity()
    };
    player_data.inventory.push(newCannon);
    savePlayerData();
    return newCannon;
}

function upgradeCannonById(cannonId) {
    const cannon = player_data.inventory.find(c => c.id === cannonId);
    if (cannon) {
        cannon.level += 1;
        savePlayerData();
    }
}

function getCannonById(cannonId) {
    return player_data.inventory.find(c => c.id === cannonId);
}

function getEquippedCannon() {
    return getCannonById(player_data.equippedCannonId);
}

function equipCannonById(cannonId) {
    if (player_data.inventory.some(c => c.id === cannonId)) {
        player_data.equippedCannonId = cannonId;
        savePlayerData();
    }
}

function addMoney(amount) {
    player_data.money += amount;
    savePlayerData();
}

function saveLevelData(level) {
    if(level + 1 > player_data.level) {
        player_data.level = level + 1;
        savePlayerData();
    }
}

function removeCannonById(cannonId) {
    const idx = player_data.inventory.findIndex(c => c.id === cannonId);
    if (idx !== -1) {
        // If the removed cannon is equipped, equip the first available or null
        const wasEquipped = player_data.equippedCannonId === cannonId;
        player_data.inventory.splice(idx, 1);
        if (wasEquipped) {
            if (player_data.inventory.length > 0) {
                player_data.equippedCannonId = player_data.inventory[0].id;
            } else {
                player_data.equippedCannonId = null;
            }
        }
        savePlayerData();
    }
}
