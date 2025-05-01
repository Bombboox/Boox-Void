class Armor {
    constructor(stats) {
        this.stats = stats;
    }
}

class DefaultArmor extends Armor {
    constructor() {
        super({
            name: "Default",
            hp: 50,
        });
    }
}
