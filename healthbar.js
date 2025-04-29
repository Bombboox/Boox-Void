var healthBarDuration = 4000;
var healthBarTimer = 0;
var activeEnemy = null;

var healthBar;
var enemyNameText;

function createHealthBar(worldContainer) {
    healthBar = new PIXI.Graphics();
    healthBar.zIndex = 1000;
    worldContainer.addChild(healthBar);
    
    // Create text for enemy name
    enemyNameText = new PIXI.Text('', {
        fontFamily: 'Arial',
        fontSize: 16,
        fill: 0xffffff,
        align: 'center',
        stroke: 0x000000,
        strokeThickness: 2,
    });
    enemyNameText.zIndex = 1000;
    enemyNameText.anchor.set(0.5, 0.5);
    worldContainer.addChild(enemyNameText);
}

function drawHealthBar(worldContainer, deltaTime) {
    healthBarTimer -= deltaTime;
    if(healthBarTimer <= 0) {
        healthBar.clear();
        enemyNameText.visible = false;
        return;
    }

    healthBar.clear();

    const barWidthMax = window.innerWidth * 0.6;
    const barWidth = barWidthMax * activeEnemy.hp / activeEnemy.maxHp; 

    const barX = window.innerWidth * 0.2 -worldContainer.x;
    const barY = -worldContainer.y + 30;

    // Display enemy name above health bar
    enemyNameText.visible = true;
    enemyNameText.text = activeEnemy.name || "Enemy";
    enemyNameText.position.set(barX + barWidthMax/2, barY - 15);

    healthBar.rect(barX, barY, barWidthMax, 20);
    healthBar.fill({color: 0xff0808});
    healthBar.stroke({color: 0xffffff, width: 2});
    healthBar.rect(barX, barY, barWidth, 20);
    healthBar.fill({color: 0x00ff00});
}

function destroyHealthBar(worldContainer) {
    if(!activeEnemy) return;
    worldContainer.removeChild(activeEnemy.healthBar);
    worldContainer.removeChild(enemyNameText);
}
