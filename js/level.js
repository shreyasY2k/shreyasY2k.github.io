// Level Manager
class LevelManager {
    constructor(game) {
        this.game = game;
        this.scene = game.scene;
        
        // Level settings
        this.currentLevel = 1;
        this.levelCompleted = false;
        
        // Objects
        this.platforms = [];
        this.obstacles = [];
        this.collectibles = [];
        
        // Level dimensions
        this.worldSize = 50;
        
        // Platform settings
        this.platformCount = 15;
        this.platformMinSize = new THREE.Vector3(2, 0.5, 2);
        this.platformMaxSize = new THREE.Vector3(8, 1, 8);
        
        // Obstacle settings
        this.obstacleCount = 10;
        
        // Collectible settings
        this.collectibleCount = 5;
        
        // Portal
        this.portalPosition = new THREE.Vector3(0, 0, -40); // Far end of the level
    }
    
    loadLevel(level) {
        // Clear previous level
        this.clearLevel();
        
        // Set current level
        this.currentLevel = level;
        this.levelCompleted = false;
        
        // Create floor
        this.createFloor();
        
        // Create platforms
        this.createPlatforms();
        
        // Create obstacles
        this.createObstacles();
        
        // Create collectibles
        this.createCollectibles();
        
        // Create portal
        this.createPortal();
        
        // Update difficulty based on level
        this.updateDifficulty();
    }
    
    clearLevel() {
        // Remove all existing level elements
        
        // Remove platforms
        this.platforms.forEach(platform => {
            if (platform.dispose) platform.dispose();
        });
        this.platforms = [];
        
        // Remove obstacles
        this.obstacles.forEach(obstacle => {
            if (obstacle.dispose) obstacle.dispose();
        });
        this.obstacles = [];
        
        // Remove collectibles
        this.collectibles.forEach(collectible => {
            if (collectible.dispose) collectible.dispose();
        });
        this.collectibles = [];
    }
    
    createFloor() {
        // Create a basic floor
        const floorGeometry = new THREE.PlaneGeometry(this.worldSize * 2, this.worldSize * 2);
        
        // Rotate floor to be horizontal
        floorGeometry.rotateX(-Math.PI / 2);
        
        // Create quantum grid material with more visible color
        const floorMaterial = new THREE.MeshStandardMaterial({
            color: 0x222266,
            roughness: 0.8,
            metalness: 0.2,
            wireframe: false
        });
        
        // Create mesh
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.receiveShadow = true;
        
        // Add grid lines with higher contrast
        const gridHelper = new THREE.GridHelper(this.worldSize * 2, 40, 0x00aaff, 0x0044ff);
        gridHelper.position.y = 0.01; // Slightly above floor to prevent z-fighting
        
        // Add to scene
        this.scene.add(floor);
        this.scene.add(gridHelper);
    }
    
    createPlatforms() {
        // Create floating platforms in the level
        const platformCount = this.platformCount;
        
        for (let i = 0; i < platformCount; i++) {
            // Determine platform size
            const width = this.platformMinSize.x + Math.random() * (this.platformMaxSize.x - this.platformMinSize.x);
            const height = this.platformMinSize.y + Math.random() * (this.platformMaxSize.y - this.platformMinSize.y);
            const depth = this.platformMinSize.z + Math.random() * (this.platformMaxSize.z - this.platformMinSize.z);
            
            // Determine platform position - distribute more evenly
            const angle = (i / platformCount) * Math.PI * 2;
            const radius = 5 + Math.random() * 25;
            const x = Math.cos(angle) * radius;
            const y = 2 + Math.random() * 10; // Height above ground
            const z = Math.sin(angle) * radius;
            
            // Create quantum platform
            const platform = new QuantumPlatform(
                this.game,
                new THREE.Vector3(x, y, z),
                new THREE.Vector3(width, height, depth)
            );
            
            // Add indicator light on top of each platform
            this.addIndicatorLight(new THREE.Vector3(x, y + height/2 + 0.1, z), 0x0088ff, 0.8);
            
            this.platforms.push(platform);
        }
    }
    
    addIndicatorLight(position, color, size = 0.5) {
        // Create a point light
        const light = new THREE.PointLight(color, 0.8, 5);
        light.position.copy(position);
        this.scene.add(light);
        
        // Create a small sphere to mark the light source
        const geometry = new THREE.SphereGeometry(size * 0.2, 8, 8);
        const material = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.7
        });
        
        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.copy(position);
        this.scene.add(sphere);
    }
    
    createObstacles() {
        // Create quantum obstacles in the level
        const obstacleCount = this.obstacleCount;
        
        for (let i = 0; i < obstacleCount; i++) {
            // Determine obstacle size
            const size = 1 + Math.random() * 1.5;
            
            // Determine obstacle position
            const x = (Math.random() - 0.5) * this.worldSize * 0.8;
            const y = 1 + Math.random() * 8; // Height above ground
            const z = (Math.random() - 0.5) * this.worldSize * 0.8;
            
            // Create quantum obstacle
            const obstacle = new QuantumObstacle(
                this.game,
                new THREE.Vector3(x, y, z),
                size
            );
            
            this.obstacles.push(obstacle);
        }
    }
    
    createCollectibles() {
        // Create quantum collectibles in the level
        const collectibleCount = this.collectibleCount;
        
        for (let i = 0; i < collectibleCount; i++) {
            // Determine collectible position - distribute more evenly in a circle
            const angle = (i / collectibleCount) * Math.PI * 2;
            const radius = 15 + Math.random() * 20;
            const x = Math.cos(angle) * radius;
            const y = 3 + Math.random() * 8; // Height above ground
            const z = Math.sin(angle) * radius;
            
            // Create quantum collectible
            const collectible = new QuantumCollectible(
                this.game,
                new THREE.Vector3(x, y, z)
            );
            
            // Add a bright light at collectible position
            this.addIndicatorLight(new THREE.Vector3(x, y, z), 0xffff00, 1.5);
            
            this.collectibles.push(collectible);
        }
        
        // Add floating arrow markers pointing to each collectible
        this.createCollectibleMarkers();
    }
    
    createCollectibleMarkers() {
        // Create 3D arrow markers pointing to collectibles
        for (let i = 0; i < this.collectibles.length; i++) {
            const collectible = this.collectibles[i];
            
            // Create arrow geometry (cone + cylinder)
            const arrowHeadGeometry = new THREE.ConeGeometry(0.3, 0.6, 8);
            const arrowBodyGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.8, 8);
            
            // Create materials
            const arrowMaterial = new THREE.MeshBasicMaterial({
                color: 0xffff00,
                transparent: true,
                opacity: 0.7
            });
            
            // Create meshes
            const arrowHead = new THREE.Mesh(arrowHeadGeometry, arrowMaterial);
            arrowHead.position.y = 0.7;
            
            const arrowBody = new THREE.Mesh(arrowBodyGeometry, arrowMaterial);
            
            // Create arrow group
            const arrow = new THREE.Group();
            arrow.add(arrowHead);
            arrow.add(arrowBody);
            
            // Position 2 meters above collectible
            arrow.position.copy(collectible.position);
            arrow.position.y += 2;
            
            // Add arrow to scene
            this.scene.add(arrow);
            
            // Store reference to update later
            collectible.marker = arrow;
        }
    }
    
    createPortal() {
        // Create portal to next level or the Vibeverse
        this.game.portal.createPortal(this.portalPosition);
    }
    
    updateDifficulty() {
        // Adjust difficulty based on level number
        const difficulty = this.currentLevel;
        
        // Update obstacle quantum collapse probability
        this.obstacles.forEach(obstacle => {
            obstacle.collapseProbability = 0.5 - (difficulty * 0.05);
            if (obstacle.collapseProbability < 0.1) obstacle.collapseProbability = 0.1;
        });
        
        // Update platform quantum collapse probability
        this.platforms.forEach(platform => {
            platform.collapseProbability = 0.7 - (difficulty * 0.03);
            if (platform.collapseProbability < 0.3) platform.collapseProbability = 0.3;
        });
    }
    
    update(delta) {
        // Check for level completion
        this.checkLevelCompletion();
        
        // Update platforms
        this.platforms.forEach(platform => {
            // Minimal updates for platforms
        });
        
        // Update obstacles
        this.obstacles.forEach(obstacle => {
            // Minimal updates for obstacles
        });
        
        // Update collectibles
        this.collectibles.forEach(collectible => {
            collectible.update(delta);
        });
        
        // Check for collectible collection
        this.checkCollectibleCollection();
    }
    
    checkLevelCompletion() {
        // Level is complete when all collectibles are collected
        if (this.collectibles.length === 0 && !this.levelCompleted) {
            this.levelCompleted = true;
            
            // Notify player portal is ready
            this.game.ui.showPortalNotification();
        }
    }
    
    checkCollectibleCollection() {
        // Check if player has collected any collectibles
        if (!this.game.player) return;
        
        const playerPosition = this.game.player.position;
        
        for (let i = this.collectibles.length - 1; i >= 0; i--) {
            const collectible = this.collectibles[i];
            const distance = collectible.position.distanceTo(playerPosition);
            
            // Collect if within range
            if (distance < 1.5) {
                // Collect the collectible
                collectible.collect();
                
                // Remove from array
                this.collectibles.splice(i, 1);
                
                // Update score
                this.game.updateScore(50);
            }
        }
    }
}

// Quantum Platform class
class QuantumPlatform extends QuantumObject {
    constructor(game, position, size) {
        super(game, position, size);
        
        // Override default material with platform-specific one
        this.material = this.quantumSystem.createQuantumMaterial(0x0088ff);
        this.mesh.material = this.material;
        
        // Set collapse probability higher (more stable)
        this.collapseProbability = 0.7;
    }
    
    // Platforms have different behavior when collapsed
    collapse(forcedState) {
        const state = super.collapse(forcedState);
        
        // If collapsed to state 1, platform is solid
        // If collapsed to state 0, platform is semi-transparent/unstable
        if (this.mesh && this.mesh.material) {
            if (state === 0) {
                this.mesh.material.opacity = 0.3;
            } else {
                this.mesh.material.opacity = 0.9;
            }
        }
        
        return state;
    }
}

// Quantum Obstacle class
class QuantumObstacle extends QuantumObject {
    constructor(game, position, size) {
        // Create with spherical geometry instead of cube
        super(game, position, new THREE.Vector3(size, size, size));
        
        // Replace default geometry with sphere
        this.scene.remove(this.mesh);
        this.geometry.dispose();
        
        this.geometry = new THREE.SphereGeometry(size / 2, 16, 12);
        this.material = this.quantumSystem.createQuantumMaterial(0xff00ff); // Magenta color
        
        // Recreate mesh
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.position.copy(this.position);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        
        // Re-add userData for click interaction
        this.mesh.userData.clickable = true;
        this.mesh.userData.parent = this;
        
        // Add to scene
        this.scene.add(this.mesh);
        
        // Set collapse probability lower (more unstable)
        this.collapseProbability = 0.3;
    }
    
    // Obstacles have different behavior when collapsed
    collapse(forcedState) {
        const state = super.collapse(forcedState);
        
        // If collapsed to state 1, obstacle is harmful
        // If collapsed to state 0, obstacle is harmless
        if (state === 1) {
            // Ensure material exists before modifying it
            if (this.material && this.material.color) {
                this.material.color.set(0xff0000); // Red for harmful
            }
            this.isHarmful = true;
        } else {
            // Ensure material exists before modifying it
            if (this.material && this.material.color) {
                this.material.color.set(0x00ff00); // Green for harmless
            }
            this.isHarmful = false;
        }
        
        return state;
    }
    
    // Check if player collides with obstacle
    checkPlayerCollision(playerPosition, playerRadius) {
        if (this.observedState !== 1) return false; // Only harmful if collapsed to state 1
        
        const distance = this.position.distanceTo(playerPosition);
        const combinedRadius = (this.size.x / 2) + playerRadius;
        
        return distance < combinedRadius;
    }
}

// Quantum Collectible class
class QuantumCollectible extends QuantumObject {
    constructor(game, position) {
        // Create small collectible
        super(game, position, new THREE.Vector3(0.5, 0.5, 0.5));
        
        // Replace default geometry with tetrahedron
        this.scene.remove(this.mesh);
        this.geometry.dispose();
        
        // Create larger, more visible geometry
        this.geometry = new THREE.TetrahedronGeometry(1.2, 2);
        
        // Create glowing material
        this.material = new THREE.MeshPhongMaterial({
            color: 0xffff00,
            emissive: 0xffaa00,
            emissiveIntensity: 0.8,
            specular: 0xffffff,
            shininess: 100,
            transparent: true,
            opacity: 0.9
        });
        
        // Create mesh
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.position.copy(this.position);
        this.mesh.castShadow = true;
        
        // Add userData for click interaction
        this.mesh.userData.clickable = true;
        this.mesh.userData.parent = this;
        
        // Add glow effect
        this.addGlowEffect();
        
        // Add to scene
        this.scene.add(this.mesh);
        
        // Animation properties
        this.rotationSpeed = 0.5 + Math.random() * 1.5;
        this.floatSpeed = 0.5 + Math.random() * 0.5;
        this.floatAmplitude = 0.5 + Math.random() * 0.5; // Increased amplitude
        this.initialY = position.y;
        this.time = Math.random() * Math.PI * 2; // Random start phase
    }
    
    addGlowEffect() {
        // Add point light to make collectible glow
        this.light = new THREE.PointLight(0xffff00, 1, 8);
        this.light.position.copy(this.position);
        this.scene.add(this.light);
        
        // Add larger, more transparent version for glow effect
        const glowGeometry = new THREE.TetrahedronGeometry(1.8, 2);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 0.3,
            side: THREE.BackSide
        });
        
        this.glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
        this.glowMesh.position.copy(this.position);
        this.scene.add(this.glowMesh);
    }
    
    update(delta) {
        if (this.isCollected) return;
        
        // Update time
        this.time += delta;
        
        // Rotate the collectible
        this.mesh.rotation.x += this.rotationSpeed * delta;
        this.mesh.rotation.y += this.rotationSpeed * 1.3 * delta;
        
        // Float up and down with larger amplitude
        const newY = this.initialY + Math.sin(this.time * this.floatSpeed) * this.floatAmplitude;
        this.mesh.position.y = newY;
        
        // Update glow position
        if (this.glowMesh) {
            this.glowMesh.position.y = newY;
            this.glowMesh.rotation.x = this.mesh.rotation.x;
            this.glowMesh.rotation.y = this.mesh.rotation.y;
            
            // Pulse glow size
            const glowScale = 1 + Math.sin(this.time * 2) * 0.2;
            this.glowMesh.scale.set(glowScale, glowScale, glowScale);
        }
        
        // Update light position
        if (this.light) {
            this.light.position.y = newY;
            
            // Pulse light intensity
            this.light.intensity = 1 + Math.sin(this.time * 3) * 0.5;
        }
        
        // Pulse color
        if (this.material) {
            const hue = (this.time * 0.1) % 1; // Slowly cycle hue
            this.material.emissive.setHSL(hue, 1, 0.5);
        }
    }
    
    collect() {
        if (this.isCollected) return;
        
        this.isCollected = true;
        
        // Play collection effect
        this.game.particles.createCollapseEffect(this.position);
        
        // Create explosion effect
        for (let i = 0; i < 20; i++) {
            this.game.particles.createCollapseEffect(this.position);
        }
        
        // Remove light
        if (this.light) {
            this.scene.remove(this.light);
        }
        
        // Remove glow mesh
        if (this.glowMesh) {
            this.scene.remove(this.glowMesh);
            this.glowMesh.geometry.dispose();
            this.glowMesh.material.dispose();
        }
        
        // Add score
        this.game.updateScore(100);
        
        // Show notification
        this.game.ui.showNotification("Collectible Acquired! +100 Points", 2000);
        
        // Dispose of resources
        this.dispose();
    }
}