class DamageNumber {
    constructor(options = {x, y, number, color, fontWeight, font, size, duration}) {
        this.x = options.x || 0;
        this.y = options.y || 0;
        this.number = options.number || 0;
        this.color = options.color || '#000000';
        this.fontWeight = options.fontWeight || 'normal';
        this.font = options.font || 'Arial';
        this.size = options.size || 16;
        this.duration = options.duration || 200;
        this.timer = 0;
        this.worldContainer = options.worldContainer || worldContainer;

        this.graphics = new PIXI.Text({
            text: this.number,
            style: {
                fontFamily: this.font,
                fontSize: this.size,
                fill: this.color,
                align: 'center',
                fontWeight: this.fontWeight
            }
        });
        this.graphics.zIndex = 1000;
        
        this.worldContainer.addChild(this.graphics);
        damage_numbers.push(this);
    }

    render_graphics() {
        this.graphics.position.set(this.x, this.y);
    }

    update(deltaTime) {
        this.y -= deltaTime * 0.01; 
        this.timer += deltaTime;
        this.render_graphics(this.worldContainer);

        if(this.timer > this.duration) {
            this.destroy();
        }
    }

    destroy() {
        this.worldContainer.removeChild(this.graphics);
        damage_numbers.splice(damage_numbers.indexOf(this), 1);
    }
}