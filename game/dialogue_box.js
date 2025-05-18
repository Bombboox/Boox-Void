class DialogueBox {
    constructor(app, options = {}) {
        this.app = app;
        this.container = new PIXI.Container();
        this.container.zIndex = 1000;
        
        this.options = {
            width: app.screen.width,
            height: 200,
            padding: 20,
            textSpeed: 0.05, 
            triggerKey: 'Space',
            spriteSize: 400,
            ...options
        };

        this.background = new PIXI.Graphics();
        this.background.rect(0, app.screen.height - this.options.height, this.options.width, this.options.height);
        this.background.fill(0x000000, 0.8);
        this.container.addChild(this.background);

        this.spriteContainer = new PIXI.Container();
        this.spriteContainer.position.set(
            this.options.width - this.options.padding,
            app.screen.height - this.options.padding
        );
        this.container.addChild(this.spriteContainer);

        this.text = new PIXI.Text('', {
            fontFamily: 'Arial',
            fontSize: 24,
            fill: 0xFFFFFF,
            wordWrap: true,
            wordWrapWidth: this.options.width - (this.options.padding * 3) - this.options.spriteSize
        });
        
        this.text.position.set(
            this.options.padding * 2,
            this.app.screen.height - this.options.height + (this.options.padding * 2)
        );
        this.container.addChild(this.text);

        this.currentDialogue = null;
        this.dialogueQueue = [];
        this.isTyping = false;
        this.currentTextIndex = 0;
        this.typeTimer = 0;

        this.app.stage.addChild(this.container);
        this.container.visible = false;

        this.setupInputHandler();
    }

    setupInputHandler() {
        const keyHandler = (e) => {
            if (e.code === this.options.triggerKey) {
                if (this.isTyping) {
                    this.skipTyping();
                } else {
                    if(this.currentDialogue) {
                        if(this.currentDialogue.special_condition != undefined) return;
                    }
                    this.nextDialogue();
                }
            }
        };

        window.addEventListener('keydown', keyHandler);
        this.keyHandler = keyHandler;
    }

    setSprite(sprite) {
        this.spriteContainer.removeChildren();
        if (sprite) {
            const scale = Math.min(
                this.options.spriteSize / sprite.width,
                this.options.spriteSize / sprite.height
            );
            sprite.scale.set(scale);
            
            sprite.anchor.set(1, 1);
            sprite.position.set(0, 0);
            
            this.spriteContainer.addChild(sprite);
        }
    }

    showDialogue(dialogue) {
        this.dialogueQueue.push(dialogue);
        if (!this.currentDialogue) {
            this.nextDialogue();
        }
    }

    nextDialogue() {
        if (this.dialogueQueue.length === 0) {
            this.hide();
            return;
        }

        this.currentDialogue = this.dialogueQueue.shift();
        this.setSprite(this.currentDialogue.sprite);
        this.startTyping();
        this.container.visible = true;

        if (this.currentDialogue.onStart) {
            this.currentDialogue.onStart();
        }
    }

    startTyping() {
        this.currentTextIndex = 0;
        this.isTyping = true;
        this.typeTimer = 0;
        this.globalTimer = 0;
    }

    skipTyping() {
        if (this.currentDialogue) {
            this.text.text = this.currentDialogue.text;
            this.currentTextIndex = this.currentDialogue.text.length;
            this.isTyping = false;
            if(this.currentDialogue.onEnd) {
                this.currentDialogue.onEnd();
            }
        }
    }

    update(delta) {
        if (this.isTyping && this.currentDialogue) {
            this.typeTimer += delta;
            if (this.typeTimer >= this.options.textSpeed) {
                this.typeTimer = 0;
                this.currentTextIndex++;
                this.text.text = this.currentDialogue.text.substring(0, this.currentTextIndex);
                
                if (this.currentTextIndex >= this.currentDialogue.text.length) {
                    this.isTyping = false;
                    if(this.currentDialogue.onEnd) {
                        this.currentDialogue.onEnd();
                    }
                }
            }
        }

        if(!this.isTyping && this.currentDialogue) {
            this.globalTimer += delta;
            if(this.currentDialogue.special_condition != undefined) {
                if(this.currentDialogue.special_condition()) {
                    if(this.currentTextIndex >= this.currentDialogue.text.length) {
                        this.nextDialogue();
                    }
                }
            } 
        }
    }

    hide() {
        this.container.visible = false;
        this.currentDialogue = null;
        this.dialogueQueue = [];
        this.isTyping = false;
    }

    destroy() {
        window.removeEventListener('keydown', this.keyHandler);
        this.app.stage.removeChild(this.container);
        this.container.destroy({ children: true });
    }

    resize() {
        this.options.width = this.app.screen.width;
        this.options.height = 200;

        this.background.clear();
        this.background.rect(0, this.app.screen.height - this.options.height, this.options.width, this.options.height);
        this.background.fill(0x000000, 0.8);

        this.spriteContainer.position.set(
            this.options.width - this.options.padding,
            this.app.screen.height - this.options.padding
        );
        
        this.text.style.wordWrapWidth = this.options.width - (this.options.padding * 3) - this.options.spriteSize;
        this.text.position.set(
            this.options.padding * 2,
            this.app.screen.height - this.options.height + (this.options.padding * 2)
        );
        this.text.updateText();
    }
}
