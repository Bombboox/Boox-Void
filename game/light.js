class Darkness {
    constructor(worldContainer) {
        this.worldContainer = worldContainer;
        this.container = new PIXI.Container();
        this.sprite = null;
        this.opacity = 0.8; // Default opacity value
        
        this._initialize();
        
        // Add event listener for window resize
        window.addEventListener('resize', this.resize.bind(this));
    }
    
    _initialize() {
        // Create the darkness sprite
        this.sprite = new PIXI.Sprite(PIXI.Texture.WHITE);
        this.sprite.tint = 0x000000;
        this.sprite.width = window.innerWidth;
        this.sprite.height = window.innerHeight;
        this.sprite.alpha = this.opacity;
        this.sprite.position.set(-this.worldContainer.position.x, -this.worldContainer.position.y);
        
        this.container.addChild(this.sprite);
    }
    
    setOpacity(value) {
        this.opacity = Math.max(0, Math.min(1, value)); // Clamp between 0 and 1
        if (this.sprite) {
            this.sprite.alpha = this.opacity;
        }
    }
    
    getOpacity() {
        return this.opacity;
    }
    
    resize() {
        if (this.sprite) {
            this.sprite.width = window.innerWidth;
            this.sprite.height = window.innerHeight;
        }
    }
    
    destroy() {
        // Remove the resize event listener
        window.removeEventListener('resize', this.resize.bind(this));
        
        if (this.container) {
            if (this.sprite) {
                this.container.removeChild(this.sprite);
                this.sprite.destroy();
                this.sprite = null;
            }
            this.container.destroy();
            this.container = null;
        }
    }
}

class Lighting {
    constructor(worldContainer, player) {
        this.worldContainer = worldContainer;
        this.player = player;
        this.lightingContainer = null;
        this.playerLight = null;
        this.gradientTexture = null;
        this.lights = []; // Array to store all lights
        this.darkness = null; // Reference to the darkness object

        this._createGradientTexture();
        this._initializeLightingContainer();
        this._createPlayerLight();
    }

    _createGradientTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;

        const ctx = canvas.getContext('2d');
        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);

        gradient.addColorStop(0, 'white');
        gradient.addColorStop(0.5, 'white');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(32, 32, 32, 0, Math.PI * 2);
        ctx.fill();

        this.gradientTexture = PIXI.Texture.from(canvas);
    }

    _initializeLightingContainer() {
        this.lightingContainer = new PIXI.Container();
        this.worldContainer.addChild(this.lightingContainer);
        this.lightingContainer.blendMode = 'add'; // Changed from 'add' to 'screen' to affect black objects
        
        // Create darkness as a separate entity
        this.darkness = new Darkness(this.worldContainer);
        this.lightingContainer.addChild(this.darkness.container);
        
        // Apply a composite filter to ensure proper blending with black objects
        const compositeFilter = new PIXI.AlphaFilter();
        compositeFilter.blendMode = 'multiply';

        const lightingFilter = new PIXI.ColorMatrixFilter();
        // This will boost the brightness while preserving colors
        lightingFilter.brightness(1.5, false);
        // Apply the filter to your world container instead of the lighting container
        this.worldContainer.filters = [lightingFilter];
        this.lightingContainer.filters = [compositeFilter];

        
        
        this.lightingContainer.zIndex = 1000; 
        this.lightingContainer.sortableChildren = true; 
    }

    _createPlayerLight() {
        this.playerLight = this.addLight(0, 0, 0xffffff, 10);
    }

    addLight(x, y, color = 0xffffff, radius = 5) {
        const light = new PIXI.Sprite(this.gradientTexture);
        light.scale.set(radius);
        light.tint = color;
        light.anchor.set(0.5); 
        light.position.set(x, y);
        this.lightingContainer.addChild(light);
        this.lights.push(light);
        
        light.visible = this.darkness && this.darkness.getOpacity() > 0;
        
        return light;
    }

    // Remove a specific light
    removeLight(light) {
        const index = this.lights.indexOf(light);
        if (index !== -1) {
            this.lightingContainer.removeChild(light);
            this.lights.splice(index, 1);
            light.destroy();
        }
    }

    // Update light position
    updateLightPosition(light, x, y) {
        if (light) {
            light.position.set(x, y);
        }
    }

    updateDarknessPosition(darkness, x, y) {
        if (darkness) {
           darkness.sprite.position.set(x, y);
        }
    }

    // Update light color
    updateLightColor(light, color) {
        if (light) {
            light.tint = color;
        }
    }

    // Update light radius
    updateLightRadius(light, radius) {
        if (light) {
            light.scale.set(radius);
        }
    }
    
    // Set darkness opacity
    setDarknessOpacity(opacity) {
        if (this.darkness) {
            this.darkness.setOpacity(opacity);
            
            // Update visibility of all lights based on darkness opacity
            const shouldShowLights = opacity > 0;
            for (const light of this.lights) {
                light.visible = shouldShowLights;
            }
        }
    }
    
    // Get darkness opacity
    getDarknessOpacity() {
        return this.darkness ? this.darkness.getOpacity() : 0;
    }

    update() {
        // Only update lights if darkness opacity is above 0
        if (this.darkness && this.darkness.getOpacity() > 0) {
            if (this.player && this.player.graphics && this.playerLight) {
                // Center the player light on the screen, effectively making it seem like the player is the light source
                // as the camera follows the player.
                this.updateLightPosition(
                    this.playerLight,
                    this.player.position.x,
                    this.player.position.y
                );

                this.updateDarknessPosition(
                    this.darkness,
                    -this.worldContainer.position.x,
                    -this.worldContainer.position.y
                );
            }
        }
    }

    destroy() {
        if (this.lightingContainer) {
            this.worldContainer.removeChild(this.lightingContainer);
            
            // Destroy darkness separately
            if (this.darkness) {
                this.darkness.destroy();
                this.darkness = null;
            }
            
            this.lightingContainer.destroy({ children: true, texture: true, baseTexture: true });
            this.lightingContainer = null;
        }
        if (this.gradientTexture) {
            this.gradientTexture.destroy(true);
            this.gradientTexture = null;
        }
        this.playerLight = null;
        this.lights = []; // Clear the lights array
    }
}
