const playingMusic = {};

function loadSound() {
    if (!createjs.Sound.isReady()) {
        createjs.Sound.on("fileload", handleLoadComplete);
        createjs.Sound.alternateExtensions = ["mp3"]; // Optional: specify extensions
    }
    
    createjs.Sound.registerSound("sounds/shoot.mp3", "shoot");
    createjs.Sound.registerSound("sounds/hit.mp3", "hit");
    createjs.Sound.registerSound("sounds/music/JoyfulMachinery.mp3", "music_main");
    createjs.Sound.registerSound("sounds/music/JoyfulEscape.mp3", "music_boss");
    createjs.Sound.registerSound("sounds/music/EclipsedDreamscape.mp3", "music_victory");
}

function handleLoadComplete(event) {
    console.log("Sound loaded:", event.id, event.src);
}

// Function to play a short sound effect
function playSound(soundId, volume = 1) {
    if (!createjs.Sound.isReady()) {
        console.warn("Sound system not ready, cannot play:", soundId);
        return;
    }
    const instance = createjs.Sound.play(soundId);
    if (instance) {
        instance.volume = volume;
        instance.on("failed", (event) => {
            console.error("Sound play failed:", event.src);
        });
         instance.on("complete", (event) => {

        });
    } else {
        console.error("Failed to create sound instance for:", soundId);
    }
    return instance; 
}

function playMusic(musicId, loop = false, volume = 1) {
    if (!createjs.Sound.isReady()) {
        console.warn("Sound system not ready, cannot play music:", musicId);
        return;
    }

    stopMusic(musicId); 
    
    const instance = createjs.Sound.play(musicId, { 
        loop: loop ? -1 : 0, // -1 for infinite loop
        volume: volume 
    });
    
    if (instance) {
        playingMusic[musicId] = instance;
        instance.on("failed", (event) => {
            console.error("Music play failed:", event.src);
            delete playingMusic[musicId];
        });
        instance.on("complete", (event) => {
            // Only delete if not looping
             if (!loop) {
                delete playingMusic[musicId];
             }
        });
    } 
    return instance;
}


function stopMusic(musicId) {
    if (playingMusic[musicId]) {
        playingMusic[musicId].stop();
        delete playingMusic[musicId];
    }
}

function stopAllMusic() {
    for (const musicId in playingMusic) {
        playingMusic[musicId].stop();
    }
    // Clear the tracking object
    for (const key in playingMusic) {
        delete playingMusic[key];
    }
}

if (typeof createjs !== 'undefined' && createjs.Sound) {
    loadSound();
} else {
    console.error("CreateJS Sound library not found. Sounds will not work.");
}