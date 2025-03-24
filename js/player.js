// Player Controller
class Player {
    constructor(game) {
        this.game = game;
        this.scene = game.scene;
        this.camera = game.camera;
        
        // Player state
        this.position = new THREE.Vector3(0, 1, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.rotation = new THREE.Euler(0, 0, 0);
        this.speed = 5; // units per second
        this.jumpForce = 7;
        this.gravity = 15;
        this.isGrounded = false;
        
        // Player dimensions
        this.height = 1.7;
        this.radius = 0.3;
        
        // Movement state
        this.keys = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            jump: false
        };
        
        // Camera settings
        this.cameraOffset = new THREE.Vector3(0, 1.6, 0); // Eye height
        this.cameraTarget = new THREE.Vector3(0, 0, -1); // Looking forward
        
        // Initialize player body
        this.createPlayerBody();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Apply player color if coming from portal
        if (this.game.comingFromPortal && this.game.playerColor) {
            this.setPlayerColor(this.game.playerColor);
        }
        
        // Position the player correctly
        this.resetPlayerPosition();
    }
    
    createPlayerBody() {
        // Player body geometry
        const bodyGeometry = new THREE.CylinderGeometry(this.radius, this.radius, this.height, 12);
        
        // Create quantum material for player
        const bodyMaterial = new THREE.MeshPhongMaterial({
            color: 0x00ffaa,
            emissive: 0x00aa66,
            emissiveIntensity: 0.5,
            specular: 0xffffff,
            shininess: 100,
            transparent: true,
            opacity: 0.95
        });
        
        // Create player mesh
        this.mesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
        this.mesh.castShadow = true;
        this.mesh.position.copy(this.position);
        
        // Adjust mesh pivot point to bottom of cylinder
        bodyGeometry.translate(0, this.height / 2, 0);
        
        // Add player spotlight
        const spotlight = new THREE.PointLight(0x00ffaa, 1, 10);
        spotlight.position.set(0, this.height * 0.7, 0);
        this.mesh.add(spotlight);
        
        // Add a small sphere on top to indicate "head"
        const headGeometry = new THREE.SphereGeometry(this.radius * 0.7, 12, 12);
        const headMaterial = new THREE.MeshPhongMaterial({
            color: 0x00ffcc,
            emissive: 0x00aa88,
            emissiveIntensity: 0.5
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.set(0, this.height * 0.9, 0);
        this.mesh.add(head);
        
        // Add to scene
        this.scene.add(this.mesh);
    }
    
    setPlayerColor(color) {
        // Set player color from portal parameters or customize screen
        if (typeof color === 'string') {
            this.mesh.material.color.set(color);
            this.mesh.material.emissive.set(color).multiplyScalar(0.3); // Darker version for emissive
        }
    }
    
    resetPlayerPosition() {
        // Reset player to starting position
        this.position.set(0, 1, 0);
        this.velocity.set(0, 0, 0);
        this.updateMeshPosition();
    }
    
    setupEventListeners() {
        // Keyboard events
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // Mouse click for object interaction
        document.addEventListener('click', (e) => this.handleClick(e));
        
        // Touch controls for mobile
        this.setupTouchControls();
    }
    
    handleKeyDown(e) {
        if (!this.game.isRunning) return;
        
        switch (e.key.toLowerCase()) {
            case 'w':
            case 'arrowup':
                this.keys.forward = true;
                break;
            case 's':
            case 'arrowdown':
                this.keys.backward = true;
                break;
            case 'a':
            case 'arrowleft':
                this.keys.left = true;
                break;
            case 'd':
            case 'arrowright':
                this.keys.right = true;
                break;
            case ' ':
                if (this.isGrounded) {
                    this.velocity.y = this.jumpForce;
                    this.isGrounded = false;
                }
                break;
        }
    }
    
    handleKeyUp(e) {
        if (!this.game.isRunning) return;
        
        switch (e.key.toLowerCase()) {
            case 'w':
            case 'arrowup':
                this.keys.forward = false;
                break;
            case 's':
            case 'arrowdown':
                this.keys.backward = false;
                break;
            case 'a':
            case 'arrowleft':
                this.keys.left = false;
                break;
            case 'd':
            case 'arrowright':
                this.keys.right = false;
                break;
        }
    }
    
    setupTouchControls() {
        // Will be implemented for mobile support
        // This is a simplified version for the prototype
    }
    
    handleClick(event) {
        if (!this.game.isRunning) return;
        
        // Normalize device coordinates
        const mouse = new THREE.Vector2();
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        // Create raycaster
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, this.camera);
        
        // Find intersected objects
        const intersects = raycaster.intersectObjects(this.scene.children);
        
        for (let i = 0; i < intersects.length; i++) {
            const object = intersects[i].object;
            
            // Check if object is a quantum object
            if (object.userData.clickable && object.userData.parent) {
                // Collapse the quantum object
                const quantumObject = object.userData.parent;
                if (quantumObject.observedState === null) {
                    quantumObject.collapse();
                    // Add a small score bounce for player interaction
                    this.game.updateScore(5);
                }
                break;
            }
        }
    }
    
    update(delta) {
        // Handle player movement
        this.updateMovement(delta);
        
        // Apply gravity
        this.applyGravity(delta);
        
        // Check collisions with environment and quantum objects
        this.checkCollisions();
        
        // Update mesh position
        this.updateMeshPosition();
        
        // Update camera position
        this.updateCamera();
        
        // Create particles if in observer mode
        if (this.game.quantum.observerMode && Math.random() > 0.8) {
            this.game.particles.createObserverModeEffect(this.position.clone().add(new THREE.Vector3(0, this.height / 2, 0)));
        }
        
        // Create player trail particles
        if (this.velocity.length() > 0.5) {
            this.game.particles.createPlayerTrail(this.position.clone().add(new THREE.Vector3(0, this.height / 3, 0)));
        }
    }
    
    updateMovement(delta) {
        // Calculate movement direction relative to camera
        const moveDirection = new THREE.Vector3(0, 0, 0);
        
        if (this.keys.forward) moveDirection.z -= 1;
        if (this.keys.backward) moveDirection.z += 1;
        if (this.keys.left) moveDirection.x -= 1;
        if (this.keys.right) moveDirection.x += 1;
        
        if (moveDirection.length() > 0) {
            moveDirection.normalize();
            
            // Calculate movement in camera direction
            const cameraDirection = new THREE.Vector3(0, 0, -1);
            cameraDirection.applyQuaternion(this.camera.quaternion);
            cameraDirection.y = 0; // Keep movement on horizontal plane
            cameraDirection.normalize();
            
            // Calculate right vector
            const right = new THREE.Vector3(-1, 0, 0);
            right.applyQuaternion(this.camera.quaternion);
            right.y = 0;
            right.normalize();
            
            // Combine directions
            const combined = new THREE.Vector3(0, 0, 0);
            combined.addScaledVector(cameraDirection, moveDirection.z);
            combined.addScaledVector(right, moveDirection.x);
            
            if (combined.length() > 0) {
                combined.normalize();
                
                // Apply movement
                this.velocity.x = combined.x * this.speed;
                this.velocity.z = combined.z * this.speed;
            }
        } else {
            // Apply friction to horizontal movement
            this.velocity.x *= 0.8;
            this.velocity.z *= 0.8;
            
            // Round small values to zero to prevent sliding
            if (Math.abs(this.velocity.x) < 0.01) this.velocity.x = 0;
            if (Math.abs(this.velocity.z) < 0.01) this.velocity.z = 0;
        }
        
        // Apply velocity to position
        this.position.x += this.velocity.x * delta;
        this.position.z += this.velocity.z * delta;
    }
    
    applyGravity(delta) {
        // Apply gravity if not grounded
        if (!this.isGrounded) {
            this.velocity.y -= this.gravity * delta;
        }
        
        // Apply vertical velocity
        this.position.y += this.velocity.y * delta;
        
        // Check floor collision
        if (this.position.y < 0) {
            this.position.y = 0;
            this.velocity.y = 0;
            this.isGrounded = true;
        } else {
            // Only set not grounded if we're not already touching the ground
            // This allows for walking down slopes without falling
            if (this.position.y > 0.01 && this.isGrounded) {
                this.isGrounded = false;
            }
        }
    }
    
    checkCollisions() {
        // Simplified collision detection for the prototype
        // In a full game, we would use a physics engine or more sophisticated collision detection
        
        // Check world boundaries
        const worldBounds = 50; // Size of the world
        if (Math.abs(this.position.x) > worldBounds) {
            this.position.x = Math.sign(this.position.x) * worldBounds;
        }
        if (Math.abs(this.position.z) > worldBounds) {
            this.position.z = Math.sign(this.position.z) * worldBounds;
        }
        
        // Check quantum object collisions (will be implemented in full game)
        // This would involve checking for overlap with each quantum object
        // and handling physics responses accordingly
    }
    
    updateMeshPosition() {
        // Update mesh position to match player position
        this.mesh.position.copy(this.position);
    }
    
    updateCamera() {
        // Update camera position to follow player
        this.camera.position.copy(this.position).add(this.cameraOffset);
        
        // Camera looks forward
        const lookTarget = this.position.clone().add(this.cameraTarget);
        this.camera.lookAt(lookTarget);
    }
    
    teleportTo(position) {
        // Teleport player to a new position (used for portals or level transitions)
        this.position.copy(position);
        this.velocity.set(0, 0, 0);
        this.updateMeshPosition();
        this.updateCamera();
    }
}