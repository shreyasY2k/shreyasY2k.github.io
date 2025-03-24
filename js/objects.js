// Additional Quantum Object Types and Effects

// Quantum Bridge - a bridge that exists in quantum superposition
class QuantumBridge extends QuantumObject {
    constructor(game, startPosition, endPosition, width = 1) {
        // Calculate length based on start and end positions
        const direction = new THREE.Vector3().subVectors(endPosition, startPosition);
        const length = direction.length();
        const center = new THREE.Vector3().addVectors(startPosition, endPosition).multiplyScalar(0.5);
        
        // Call parent constructor with center position and bridge dimensions
        super(game, center, new THREE.Vector3(width, 0.2, length));
        
        // Store original parameters
        this.startPosition = startPosition;
        this.endPosition = endPosition;
        this.width = width;
        
        // Calculate rotation to point from start to end
        direction.normalize();
        this.rotation = new THREE.Euler(0, Math.atan2(direction.x, direction.z), 0);
        
        // Replace the default geometry and material
        this.scene.remove(this.mesh);
        this.geometry.dispose();
        
        // Create new bridge geometry
        this.geometry = new THREE.BoxGeometry(width, 0.2, length);
        this.material = this.quantumSystem.createQuantumMaterial(0x00ff88); // Cyan-green color
        
        // Create bridge mesh with correct rotation
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.position.copy(center);
        this.mesh.rotation.copy(this.rotation);
        
        // Add userData for click interaction
        this.mesh.userData.clickable = true;
        this.mesh.userData.parent = this;
        
        // Add to scene
        this.scene.add(this.mesh);
        
        // Bridge has a high probability of being useful
        this.collapseProbability = 0.8;
    }
    
    // Override collapse behavior
    collapse(forcedState) {
        const state = super.collapse(forcedState);
        
        // If collapsed to state 1, bridge is solid
        // If collapsed to state 0, bridge fades away
        if (state === 0) {
            // Bridge becomes non-solid/transparent
            this.mesh.material.opacity = 0.2;
            // Disable collision
            this.isSolid = false;
        } else {
            // Bridge becomes solid
            this.mesh.material.opacity = 0.9;
            // Enable collision
            this.isSolid = true;
        }
        
        return state;
    }
}

// Quantum Elevator - platform that moves up and down based on quantum state
class QuantumElevator extends QuantumObject {
    constructor(game, position, size, minHeight, maxHeight) {
        super(game, position, size);
        
        // Elevator properties
        this.minHeight = minHeight;
        this.maxHeight = maxHeight;
        this.speed = 2; // Units per second
        this.currentSpeed = 0;
        
        // Start at min height
        this.position.y = minHeight + size.y / 2;
        this.targetHeight = this.position.y;
        
        // Replace material with elevator-specific one
        this.material = this.quantumSystem.createQuantumMaterial(0xffaa00); // Orange-yellow
        this.mesh.material = this.material;
        
        // Set collapse probability
        this.collapseProbability = 0.5; // 50% chance up/down
    }
    
    update(delta) {
        super.updateQuantumState(delta, this.quantumSystem.uniforms.time.value);
        
        // If in superposition, oscillate between heights
        if (this.observedState === null) {
            const time = this.quantumSystem.uniforms.time.value;
            this.position.y = this.minHeight + ((Math.sin(time) + 1) / 2) * (this.maxHeight - this.minHeight);
        } else {
            // Move to target height based on observed state
            const targetHeight = this.observedState === 1 ? this.maxHeight : this.minHeight;
            
            // Smoothly move to target
            if (Math.abs(this.position.y - targetHeight) > 0.01) {
                const direction = targetHeight > this.position.y ? 1 : -1;
                this.position.y += direction * this.speed * delta;
            } else {
                this.position.y = targetHeight;
            }
        }
        
        // Update mesh position
        this.mesh.position.y = this.position.y;
    }
    
    collapse(forcedState) {
        const state = super.collapse(forcedState);
        
        // Target height based on collapsed state
        this.targetHeight = state === 1 ? this.maxHeight : this.minHeight;
        
        return state;
    }
}

// Quantum Door - a door that may or may not be open based on quantum state
class QuantumDoor extends QuantumObject {
    constructor(game, position, width, height) {
        // Create with door dimensions
        super(game, position, new THREE.Vector3(width, height, 0.2));
        
        // Set door properties
        this.isOpen = false;
        
        // Replace material with door-specific one
        this.material = this.quantumSystem.createQuantumMaterial(0xff8800); // Orange
        this.mesh.material = this.material;
    }
    
    collapse(forcedState) {
        const state = super.collapse(forcedState);
        
        // If collapsed to state 1, door is open
        // If collapsed to state 0, door is closed
        if (state === 1) {
            // Door opens (becomes transparent)
            this.mesh.material.opacity = 0.2;
            this.isOpen = true;
        } else {
            // Door closes (becomes solid)
            this.mesh.material.opacity = 0.9;
            this.isOpen = false;
        }
        
        return state;
    }
}

// Quantum Power-up - gives player special abilities
class QuantumPowerup extends QuantumObject {
    constructor(game, position, type = 'energy') {
        // Create small power-up object
        super(game, position, new THREE.Vector3(0.5, 0.5, 0.5));
        
        // Set power-up type and properties
        this.type = type;
        this.isCollected = false;
        
        // Replace geometry with icosahedron (gem-like)
        this.scene.remove(this.mesh);
        this.geometry.dispose();
        
        this.geometry = new THREE.IcosahedronGeometry(0.5, 0);
        
        // Set color based on power-up type
        let color;
        switch (this.type) {
            case 'energy':
                color = 0x00ffff; // Cyan for energy
                break;
            case 'speed':
                color = 0xffff00; // Yellow for speed
                break;
            case 'observer':
                color = 0xff00ff; // Magenta for observer boost
                break;
            default:
                color = 0xffffff; // White for unknown
        }
        
        this.material = new THREE.MeshPhongMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: 0.3,
            transparent: true,
            opacity: 0.9,
            shininess: 100
        });
        
        // Create mesh
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.position.copy(this.position);
        
        // Add userData for click interaction
        this.mesh.userData.clickable = true;
        this.mesh.userData.parent = this;
        
        // Add to scene
        this.scene.add(this.mesh);
        
        // Animation properties
        this.rotationSpeed = 1;
        this.floatSpeed = 0.8;
        this.floatAmplitude = 0.3;
        this.initialY = position.y;
        this.time = Math.random() * Math.PI * 2;
    }
    
    update(delta) {
        if (this.isCollected) return;
        
        // Update time
        this.time += delta;
        
        // Rotate the power-up
        this.mesh.rotation.x += this.rotationSpeed * delta;
        this.mesh.rotation.y += this.rotationSpeed * 1.5 * delta;
        
        // Float up and down
        this.mesh.position.y = this.initialY + Math.sin(this.time * this.floatSpeed) * this.floatAmplitude;
        
        // Pulse effect
        const scale = 1 + Math.sin(this.time * 3) * 0.1;
        this.mesh.scale.set(scale, scale, scale);
    }
    
    collect() {
        if (this.isCollected) return;
        
        this.isCollected = true;
        
        // Apply power-up effect
        switch (this.type) {
            case 'energy':
                // Restore quantum energy
                this.game.quantum.currentEnergy = this.game.quantum.observerModeEnergy;
                this.game.ui.showNotification("Quantum Energy Restored!", 2000);
                break;
            case 'speed':
                // Boost player speed temporarily
                if (this.game.player) {
                    const originalSpeed = this.game.player.speed;
                    this.game.player.speed *= 1.5;
                    this.game.ui.showNotification("Speed Boost Activated!", 2000);
                    
                    // Reset speed after 10 seconds
                    setTimeout(() => {
                        if (this.game.player) {
                            this.game.player.speed = originalSpeed;
                            this.game.ui.showNotification("Speed Boost Ended", 2000);
                        }
                    }, 10000);
                }
                break;
            case 'observer':
                // Reduce observer mode energy drain
                const originalDrainRate = this.game.quantum.energyDrainRate;
                this.game.quantum.energyDrainRate *= 0.5;
                this.game.ui.showNotification("Observer Efficiency Increased!", 2000);
                
                // Reset drain rate after 15 seconds
                setTimeout(() => {
                    this.game.quantum.energyDrainRate = originalDrainRate;
                    this.game.ui.showNotification("Observer Boost Ended", 2000);
                }, 15000);
                break;
        }
        
        // Play collection effect
        this.game.particles.createCollapseEffect(this.position);
        
        // Add score
        this.game.updateScore(100);
        
        // Remove from scene
        this.dispose();
    }
}

// Quantum Hazard - dangerous objects that harm the player
class QuantumHazard extends QuantumObject {
    constructor(game, position, size) {
        super(game, position, new THREE.Vector3(size, size, size));
        
        // Replace with spiky geometry
        this.scene.remove(this.mesh);
        this.geometry.dispose();
        
        // Create spiky geometry
        const radiusTop = size * 0.1;
        const radiusBottom = size * 0.8;
        const height = size;
        const radialSegments = 4; // Low poly for spiky look
        
        this.geometry = new THREE.ConeGeometry(radiusBottom, height, radialSegments);
        this.material = this.quantumSystem.createQuantumMaterial(0xff0000); // Red color
        
        // Create mesh
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.position.copy(this.position);
        
        // Add userData for click interaction
        this.mesh.userData.clickable = true;
        this.mesh.userData.parent = this;
        
        // Add to scene
        this.scene.add(this.mesh);
        
        // Hazard properties
        this.damage = 20;
        this.isHarmful = true;
        
        // Set collapse probability (more likely to be harmful)
        this.collapseProbability = 0.7;
    }
    
    collapse(forcedState) {
        const state = super.collapse(forcedState);
        
        // If collapsed to state 1, hazard is harmful
        // If collapsed to state 0, hazard is harmless
        if (state === 1) {
            this.material.color.set(0xff0000); // Red for harmful
            this.isHarmful = true;
        } else {
            this.material.color.set(0x00ff00); // Green for harmless
            this.isHarmful = false;
        }
        
        return state;
    }
    
    update(delta) {
        // Rotate hazard for visual effect
        if (this.mesh) {
            this.mesh.rotation.y += delta;
        }
    }
    
    // Check collision with player
    checkPlayerCollision(playerPosition, playerRadius) {
        if (!this.isHarmful) return false;
        
        const distance = this.position.distanceTo(playerPosition);
        const collisionRadius = this.size.x / 2 + playerRadius;
        
        return distance < collisionRadius;
    }
}