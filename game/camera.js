class Camera {
    constructor(options = {}) {
        this.worldContainer = options.worldContainer || worldContainer;
        this.position = options.position || vector(0, 0);
        this.zoom = options.zoom || 1;
        this.rotation = options.rotation || 0;
        this.scale = options.scale || vector(1, 1);
        this.owner = options.owner || null;
        this.followMode = options.followMode || 'instant'; // 'instant' or 'interpolate'
        this.interpolationSpeed = options.interpolationSpeed || 0.1; // Speed for interpolation follow
        this.offset = options.offset || vector(0, 0);
        this.shake = options.shake || vector(0, 0);
        this.shakeDuration = options.shakeDuration || 0;
        this.shakeAmplitude = options.shakeAmplitude || 10;
        this.shakeFrequency = options.shakeFrequency || 1;
        this.shakeTime = 0;
        this.shakeIntensity = 0;
        this.shakeSpeed = 1;
        
        // Command queue system
        this.commandQueue = [];
        this.currentCommand = null;
        this.commandTimer = 0;
    }

    update(deltaTime) {
        // Process command queue if we have commands
        if (this.commandQueue.length > 0 || this.currentCommand) {
            this.processCommandQueue(deltaTime);
        } 
        // Default follow behavior when no commands are active
        else if (this.owner) {
            if (this.followMode === 'instant') {
                this.position.x = this.owner.position.x + this.offset.x;
                this.position.y = this.owner.position.y + this.offset.y;
            } else if (this.followMode === 'interpolate') {
                // Smoothly interpolate to owner position
                const targetX = this.owner.position.x + this.offset.x;
                const targetY = this.owner.position.y + this.offset.y;
                this.position.x += (targetX - this.position.x) * this.interpolationSpeed * deltaTime;
                this.position.y += (targetY - this.position.y) * this.interpolationSpeed * deltaTime;
            }
        }

        // Update camera shake
        this.updateShake(deltaTime);

        // Apply camera transform to world container
        this.applyTransform();
    }

    updateShake(deltaTime) {
        if (this.shakeDuration > 0) {
            this.shakeDuration -= deltaTime;
            this.shakeTime += deltaTime * this.shakeSpeed;
            
            // Calculate shake offset using sine waves for natural motion
            const xFactor = Math.sin(this.shakeTime * this.shakeFrequency);
            const yFactor = Math.cos(this.shakeTime * this.shakeFrequency * 1.5);
            
            this.shake.x = xFactor * this.shakeAmplitude * (this.shakeDuration / 1000);
            this.shake.y = yFactor * this.shakeAmplitude * (this.shakeDuration / 1000);
            
            if (this.shakeDuration <= 0) {
                this.shake.x = 0;
                this.shake.y = 0;
            }
        }
    }

    applyTransform() {
        if (this.worldContainer) {
            // Apply position (with shake effect)
            let cameraTarget = this.getCameraClamped();

            this.worldContainer.position.x = cameraTarget.x;
            this.worldContainer.position.y = cameraTarget.y;
            
            this.worldContainer.scale.set(this.scale.x * this.zoom, this.scale.y * this.zoom);
            this.worldContainer.rotation = this.rotation;
        }
    }

    shakeCamera(duration = 500, amplitude = 10, frequency = 1, speed = 1) {
        this.shakeDuration = duration;
        this.shakeAmplitude = amplitude;
        this.shakeFrequency = frequency;
        this.shakeSpeed = speed;
        this.shakeTime = 0;
    }

    getCameraClamped() {
        let x = app.screen.width / 2 - this.position.x * this.worldContainer.scale.x;
        let y = app.screen.height / 2 - this.position.y * this.worldContainer.scale.y;

        const minContainerX = app.screen.width - worldRightBoundary * this.worldContainer.scale.x;
        const maxContainerX = -worldLeftBoundary * this.worldContainer.scale.x;
        const minContainerY = app.screen.height - worldBottomBoundary * this.worldContainer.scale.y;
        const maxContainerY = -worldTopBoundary * this.worldContainer.scale.y;

        return vector(clamp(x, minContainerX, maxContainerX), clamp(y, minContainerY, maxContainerY));
    }
    
    // Command queue system
    queueCommands(...commands) {
        this.commandQueue.push(...commands);
        
        // Start processing commands immediately if no current command
        if (!this.currentCommand && this.commandQueue.length > 0) {
            this.currentCommand = this.commandQueue.shift();
            this.commandTimer = 0;
            
            if (this.currentCommand.init) {
                this.currentCommand.init(this);
            }
        }
        
        return this; 
    }
    
    processCommandQueue(deltaTime) {
        // If no current command, get the next one
        if (!this.currentCommand && this.commandQueue.length > 0) {
            this.currentCommand = this.commandQueue.shift();
            this.commandTimer = 0;
            
            // Initialize the command if needed
            if (this.currentCommand.init) {
                this.currentCommand.init(this);
            }
        }
        
        // Process current command
        if (this.currentCommand) {
            this.commandTimer += deltaTime;
            
            // Execute the command
            const completed = this.currentCommand.execute(this, deltaTime, this.commandTimer);
            
            // If command is complete, move to the next one
            if (completed) {
                if (this.currentCommand.onComplete) {
                    this.currentCommand.onComplete(this);
                }
                this.currentCommand = null;
            }
        }
    }
    
    // Command factory methods
    lerpTo(target, duration = 1000, easing = 'linear') {
        const command = {
            startPos: null,
            targetPos: null,
            duration: duration,
            easing: easing,
            
            init: (camera) => {
                command.startPos = vector(camera.position.x, camera.position.y);
                
                // If target is an object with position, use that
                if (target && target.position) {
                    command.targetPos = vector(target.position.x, target.position.y);
                } else if (target) {
                    // Assume it's a vector or {x, y} object
                    command.targetPos = vector(target.x, target.y);
                }
            },
            
            execute: (camera, deltaTime, elapsedTime) => {
                const progress = Math.min(elapsedTime / command.duration, 1);
                let easedProgress = progress;
                
                // Apply easing if needed
                if (command.easing === 'easeInOut') {
                    easedProgress = progress < 0.5 
                        ? 2 * progress * progress 
                        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
                }
                
                // Update target position if it's a moving object
                if (target && target.position) {
                    command.targetPos = vector(target.position.x, target.position.y);
                }
                
                // Interpolate position
                camera.position.x = lerp(command.startPos.x, command.targetPos.x, easedProgress);
                camera.position.y = lerp(command.startPos.y, command.targetPos.y, easedProgress);
                
                return progress >= 1;
            }
        };
        
        return command;
    }
    
    wait(duration) {
        const command = {
            duration: duration,
            execute: (camera, deltaTime, elapsedTime) => {
                return elapsedTime >= command.duration;
            }
        };
        return command;
    }
    
    shake_camera(duration = 500, amplitude = 10, frequency = 1, speed = 1) {
        const command = {
            duration: duration,
            amplitude: amplitude,
            frequency: frequency,
            speed: speed,
            
            init: (camera) => {
                camera.shakeCamera(command.duration, command.amplitude, command.frequency, command.speed);
            },
            
            execute: (camera, deltaTime, elapsedTime) => {
                return elapsedTime >= command.duration;
            }
        };
        return command;
    }
}