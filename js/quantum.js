// Quantum System
class QuantumSystem {
    constructor(game) {
        this.game = game;
        this.scene = game.scene;
        
        // Quantum state properties
        this.observerMode = false;
        this.observerModeEnergy = 100; // max energy for observer mode
        this.currentEnergy = 100; // current energy
        this.energyDrainRate = 15; // energy drain per second in observer mode
        this.energyRechargeRate = 8; // energy recharge per second when not in observer mode
        
        // Quantum objects in the scene (will be populated by level generation)
        this.quantumObjects = [];
        
        // Shader uniforms for quantum visualization effects
        this.uniforms = {
            time: { value: 0 },
            observerMode: { value: 0 }, // 0: off, 1: on
            uncertainty: { value: 0.8 } // How "uncertain" quantum objects appear
        };
        
        // Bind methods
        this.toggleObserverMode = this.toggleObserverMode.bind(this);
        this.updateUniformTime = this.updateUniformTime.bind(this);
        
        // Setup event listeners
        document.addEventListener('keydown', (e) => {
            if (e.key === 'e' || e.key === 'E') {
                this.toggleObserverMode();
            }
        });
    }
    
    update(delta) {
        // Update time uniform for shaders
        this.updateUniformTime(delta);
        
        // Handle observer mode energy
        this.handleObserverModeEnergy(delta);
        
        // Update quantum objects
        this.updateQuantumObjects(delta);
    }
    
    updateUniformTime(delta) {
        this.uniforms.time.value += delta;
    }
    
    handleObserverModeEnergy(delta) {
        const energyBar = document.getElementById('quantum-fill');
        
        if (this.observerMode) {
            // Drain energy in observer mode
            this.currentEnergy = Math.max(0, this.currentEnergy - this.energyDrainRate * delta);
            
            // Turn off observer mode if energy depleted
            if (this.currentEnergy <= 0) {
                this.toggleObserverMode(false);
            }
        } else {
            // Recharge energy when not in observer mode
            this.currentEnergy = Math.min(this.observerModeEnergy, this.currentEnergy + this.energyRechargeRate * delta);
        }
        
        // Update energy bar
        const percentage = (this.currentEnergy / this.observerModeEnergy) * 100;
        energyBar.style.width = `${percentage}%`;
    }
    
    toggleObserverMode(forceState) {
        if (forceState !== undefined) {
            this.observerMode = forceState;
        } else {
            // Only allow toggling ON if there's energy
            if (!this.observerMode && this.currentEnergy <= 0) return;
            this.observerMode = !this.observerMode;
        }
        
        // Update UI
        const statusElement = document.getElementById('observerStatus');
        if (statusElement) {
            statusElement.textContent = this.observerMode ? 'ON' : 'OFF';
        }
        
        // Update shader uniform
        if (this.uniforms && this.uniforms.observerMode) {
            this.uniforms.observerMode.value = this.observerMode ? 1.0 : 0.0;
        }
        
        // Apply observer mode effect to all quantum objects
        if (Array.isArray(this.quantumObjects)) {
            this.quantumObjects.forEach(obj => {
                if (obj && typeof obj.setObserverMode === 'function') {
                    obj.setObserverMode(this.observerMode);
                }
            });
        }
    }
    
    updateQuantumObjects(delta) {
        // Update quantum state of all objects
        this.quantumObjects.forEach(obj => {
            obj.updateQuantumState(delta, this.uniforms.time.value);
        });
    }
    
    registerQuantumObject(object) {
        this.quantumObjects.push(object);
    }
    
    unregisterQuantumObject(object) {
        const index = this.quantumObjects.indexOf(object);
        if (index !== -1) {
            this.quantumObjects.splice(index, 1);
        }
    }
    
    // Quantum state calculation functions
    getWaveFunction(position, time) {
        // Simplified quantum wave function calculation
        const amplitude = Math.sin(position.x * 0.1 + position.y * 0.1 + position.z * 0.1 + time * 2) * 0.5 + 0.5;
        return amplitude;
    }
    
    getSuperpositionState(position, time) {
        // Calculate multiple possible states
        const state1 = Math.sin(position.x * 0.2 + time * 1.5) * 0.5 + 0.5;
        const state2 = Math.cos(position.z * 0.3 + time * 2.0) * 0.5 + 0.5;
        const state3 = Math.sin(position.y * 0.25 + time * 1.0) * 0.5 + 0.5;
        
        // Combine states based on a weighted average
        return (state1 * 0.4 + state2 * 0.3 + state3 * 0.3);
    }
    
    // Create quantum material with superposition effect
    createQuantumMaterial(color = 0x00ffff, opacity = 0.8) {
        // Create custom shader material for quantum visualization
        const vertexShader = `
            uniform float time;
            uniform float observerMode;
            uniform float uncertainty;
            
            varying vec3 vPosition;
            varying vec2 vUv;
            
            void main() {
                vPosition = position;
                vUv = uv;
                
                // Apply quantum fluctuation to vertices when not observed
                vec3 newPosition = position;
                if (observerMode < 0.5) {
                    float noise = sin(position.x * 2.0 + position.y * 3.0 + position.z * 1.5 + time * 3.0) * uncertainty;
                    newPosition += normal * noise * 0.2; // Increased fluctuation
                }
                
                gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
            }
        `;
        
        const fragmentShader = `
            uniform float time;
            uniform float observerMode;
            
            varying vec3 vPosition;
            varying vec2 vUv;
            
            void main() {
                // Base color - brighter
                vec3 baseColor = vec3(0.0, 1.0, 1.0); // Cyan
                
                // When in observer mode, make more solid
                float alpha = observerMode > 0.5 ? 0.95 : 0.8; // Increased opacity
                
                // Add wave pattern when not in observer mode
                if (observerMode < 0.5) {
                    float wave = sin(vPosition.x * 5.0 + vPosition.y * 3.0 + vPosition.z * 2.0 + time * 2.0) * 0.5 + 0.5;
                    baseColor = mix(baseColor, vec3(1.0, 0.0, 1.0), wave * 0.9); // More vibrant color mixing
                    
                    // Add edge glow
                    float edgeGlow = pow(1.0 - abs(dot(vec3(0.0, 0.0, 1.0), normalize(vPosition))), 2.0);
                    baseColor += vec3(0.5, 0.5, 1.0) * edgeGlow * 0.5;
                    
                    // Add flickering to alpha, but keep higher base opacity
                    alpha *= (0.9 + sin(time * 3.0) * 0.1);
                }
                
                gl_FragColor = vec4(baseColor, alpha);
            }
        `;
        
        return new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            transparent: true,
            side: THREE.DoubleSide
        });
    }
}

// Quantum Object base class
class QuantumObject {
    constructor(game, position, size) {
        this.game = game;
        this.scene = game.scene;
        this.quantumSystem = game.quantum;
        
        this.position = position || new THREE.Vector3(0, 0, 0);
        this.size = size || new THREE.Vector3(1, 1, 1);
        
        this.observedState = null; // null = superposition, 0 or 1 = collapsed
        this.superpositionFactor = Math.random(); // Random starting phase
        this.collapseProbability = 0.5; // Default 50/50 collapse chance
        
        // Create mesh with quantum material
        this.createMesh();
        
        // Register with quantum system
        this.quantumSystem.registerQuantumObject(this);
        
        // Add mesh to scene
        this.scene.add(this.mesh);
        
        // Bind methods
        this.collapse = this.collapse.bind(this);
        this.setObserverMode = this.setObserverMode.bind(this);
        
        // Add click interaction
        this.mesh.userData.clickable = true;
        this.mesh.userData.parent = this;
    }
    
    createMesh() {
        // Create geometry (default cube)
        this.geometry = new THREE.BoxGeometry(this.size.x, this.size.y, this.size.z);
        
        // Create quantum material
        this.material = this.quantumSystem.createQuantumMaterial();
        
        // Create mesh
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.position.copy(this.position);
        
        // Set up for shadows
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
    }
    
    updateQuantumState(delta, time) {
        if (this.observedState !== null) {
            // Object has collapsed to a definite state - no need to update
            return;
        }
        
        // Update superposition factor
        this.superpositionFactor = this.quantumSystem.getSuperpositionState(this.position, time);
        
        // Update object visual state based on superposition
        this.updateVisualState();
    }
    
    updateVisualState() {
        // Check if mesh exists
        if (!this.mesh) return;
        
        // In superposition, visual changes based on quantum calculations
        if (this.observedState === null) {
            // Object "flickers" between possible states
            this.mesh.scale.set(
                0.8 + this.superpositionFactor * 0.4,
                0.8 + this.superpositionFactor * 0.4,
                0.8 + this.superpositionFactor * 0.4
            );
            
            // Update opacity based on superposition
            if (this.material && typeof this.material.opacity !== 'undefined') {
                this.material.opacity = 0.4 + this.superpositionFactor * 0.4;
            }
        } else {
            // Collapsed state is stable
            const stateFactor = this.observedState === 1 ? 1.2 : 0.8;
            this.mesh.scale.set(stateFactor, stateFactor, stateFactor);
            
            if (this.material && typeof this.material.opacity !== 'undefined') {
                this.material.opacity = 0.9;
            }
        }
    }
    
    collapse(forcedState) {
        // Object collapses from superposition to a definite state
        if (forcedState !== undefined) {
            this.observedState = forcedState;
        } else {
            // Collapse based on probability
            this.observedState = Math.random() < this.collapseProbability ? 1 : 0;
        }
        
        // Update visual state after collapse
        this.updateVisualState();
        
        // Generate particle effect for collapse
        this.game.particles.createCollapseEffect(this.position);
        
        // Add score for collapse
        this.game.updateScore(10);
        
        return this.observedState;
    }
    
    setObserverMode(isObserverMode) {
        // When observer mode is turned on, there's a chance the object collapses
        if (isObserverMode && this.observedState === null) {
            if (Math.random() < 0.3) {
                try {
                    this.collapse();
                } catch (error) {
                    console.error("Error collapsing quantum object:", error);
                }
            }
        }
    }
    
    dispose() {
        // Clean up resources
        this.scene.remove(this.mesh);
        this.geometry.dispose();
        this.material.dispose();
        
        // Unregister from quantum system
        this.quantumSystem.unregisterQuantumObject(this);
    }
}