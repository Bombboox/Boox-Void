const playingMusic = {};

const happyMusic = ["happy_1", "happy_2", "happy_3", "happy_4"];
const creepyMusic = ["creepy_1", "creepy_2", "creepy_3", "creepy_4"];
const chillMusic = ["chill_1", "chill_2", "chill_3", "chill_4", "chill_5", "chill_6"];
const actionMusic = ["action_1", "action_2"];
const bossMusic = ["boss_1"];

function loadSound() {
    if (!createjs.Sound.isReady()) {
        createjs.Sound.on("fileload", handleLoadComplete);
        createjs.Sound.alternateExtensions = ["mp3"]; // Optional: specify extensions
    }
    
    createjs.Sound.registerSound("sounds/shoot.mp3", "shoot");
    createjs.Sound.registerSound("sounds/hit.mp3", "hit");
    createjs.Sound.registerSound("sounds/shriek.mp3", "shriek");

    createjs.Sound.registerSound("sounds/music/happy/JoyfulMachinery.mp3", "happy_1");
    createjs.Sound.registerSound("sounds/music/happy/DigitalOdyssey.mp3", "happy_2");
    createjs.Sound.registerSound("sounds/music/happy/JoyfulMechanism.mp3", "happy_3");
    createjs.Sound.registerSound("sounds/music/happy/RiseOfThePixels.mp3", "happy_4");

    createjs.Sound.registerSound("sounds/music/creepy/Daydream.mp3", "creepy_1");
    createjs.Sound.registerSound("sounds/music/creepy/EchoesOfDread.mp3", "creepy_2");
    createjs.Sound.registerSound("sounds/music/creepy/IndustrialNightmare.mp3", "creepy_3");
    createjs.Sound.registerSound("sounds/music/creepy/MoodSwings.mp3", "creepy_4");

    createjs.Sound.registerSound("sounds/music/chill/EclipsedDreamscape.mp3", "chill_1");
    createjs.Sound.registerSound("sounds/music/chill/Machines.mp3", "chill_2");
    createjs.Sound.registerSound("sounds/music/chill/SomethingIsWrong.mp3", "chill_3");
    createjs.Sound.registerSound("sounds/music/chill/WhispersInShadows.mp3", "chill_4");
    createjs.Sound.registerSound("sounds/music/chill/WhispersInTheGrove.mp3", "chill_5");
    createjs.Sound.registerSound("sounds/music/chill/ZeroHour.mp3", "chill_6");

    createjs.Sound.registerSound("sounds/music/action/RunItBack.mp3", "action_1");
    createjs.Sound.registerSound("sounds/music/action/Sprint.mp3", "action_2");

    createjs.Sound.registerSound("sounds/music/boss/JoyfulEscape.mp3", "boss_1");
}

function handleLoadComplete(event) {

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
    if(Object.keys(playingMusic).length > 0) {
        console.log("Already playing music, end current track first.");
        return playingMusic[Object.keys(playingMusic)[0]];
    }

    if (!createjs.Sound.isReady()) {
        console.warn("Sound system not ready, cannot play music:", musicId);
        return;
    }

    // Check if this music is already playing
    if (playingMusic[musicId]) {
        console.log("Music already playing:", musicId);
        return playingMusic[musicId];
    }
    
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

function stopAndPlayMusic(musicId, loop = false, volume = 1) {
    stopAllMusic();
    playMusic(musicId, loop, volume);
}

function pickSong(theme, num) {
    let musicArray;
    switch (theme) {
        case "happy":
            musicArray = happyMusic;
            break;
        case "creepy":
            musicArray = creepyMusic;
            break;
        case "chill":
            musicArray = chillMusic;
            break;
        case "action":
            musicArray = actionMusic;
            break;
        case "boss":
            musicArray = bossMusic;
            break;
    }
    const len = musicArray.length;
    const index = num % len;
    return musicArray[index];
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