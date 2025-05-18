class Armor {
    constructor(stat_boosts = {hp, speed}) {
        this.hp = stat_boosts.hp || 0;
        this.speed = stat_boosts.speed || 0;
    }
}

class DefaultArmor extends Armor {
    constructor() {
        super({
            name: "Default",
            hp: 50,
            speed: 0.1
        });
    }
}
