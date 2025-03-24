// Portal System
class Portal {
    constructor(game) {
        this.game = game;
        this.scene = game.scene;
        
        // Portal properties
        this.active = false;
        this.radius = 2.5; // Portal size
        this.height = 4;
        this.position = new THREE.Vector3(0, 2, -40);
        this.rotationSpeed = 0.5;
        
        // Portal destination
        this.destinationURL = "http://portal.pieter.com";
        
        // Track if player is in the portal
        this.playerInPortal = false;
        
        // Create meshes
        this.portalMesh = null;
        this.portalRingMesh = null;
        this.portalLightMesh = null;
        
        // Setup text elements
        this.portalText = null;
    }
    
    createPortal(position) {
        // Set portal position
        this.position = position.clone();
        this.position.y = this.height / 2; // Adjust to be off the ground
        
        // Create portal effect
        this.createPortalEffect();
        
        // Add path markers to guide player to portal
        this.createPathToPortal();
        
        // Add spotlight above portal
        this.createPortalSpotlight();
        
        // Start in inactive state
        this.setPortalActive(false);
    }
    
    createPathToPortal() {
        // Create a glowing path to guide player to portal
        const pathPoints = [];
        const segmentCount = 10;
        
        // Create points from origin toward portal
        for (let i = 0; i <= segmentCount; i++) {
            const t = i / segmentCount;
            const x = t * this.position.x;
            const z = t * this.position.z;
            pathPoints.push(new THREE.Vector3(x, 0.05, z));
        }
        
        // Create path line
        const pathGeometry = new THREE.BufferGeometry().setFromPoints(pathPoints);
        const pathMaterial = new THREE.LineBasicMaterial({
            color: 0xff00ff,
            linewidth: 5
        });
        
        this.pathLine = new THREE.Line(pathGeometry, pathMaterial);
        this.game.scene.add(this.pathLine);
        
        // Add floating arrows along the path
        for (let i = 1; i < segmentCount; i += 2) {
            const position = pathPoints[i].clone();
            position.y = 1 + Math.sin(i) * 0.5;
            
            this.createArrowMarker(position);
        }
    }
    
    createArrowMarker(position) {
        // Create a floating arrow pointing toward portal
        const arrowGeometry = new THREE.ConeGeometry(0.4, 0.8, 8);
        const arrowMaterial = new THREE.MeshBasicMaterial({
            color: 0xff00ff,
            transparent: true,
            opacity: 0.7
        });
        
        const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
        
        // Position and rotate to point toward portal
        arrow.position.copy(position);
        arrow.lookAt(this.position);
        arrow.rotateX(Math.PI / 2); // Adjust cone to point in right direction
        
        // Store reference to update
        this.game.scene.add(arrow);
    }
    
    createPortalSpotlight() {
        // Add a spotlight above portal for high visibility
        const spotlight = new THREE.SpotLight(0xff00ff, 3, 40, Math.PI / 4, 0.5, 1);
        spotlight.position.copy(this.position);
        spotlight.position.y += 15;
        spotlight.target.position.copy(this.position);
        
        this.game.scene.add(spotlight);
        this.game.scene.add(spotlight.target);
    }
    
    createPortalEffect() {
        // Create portal inner effect (the actual transportation area)
        const portalGeometry = new THREE.CylinderGeometry(this.radius * 0.8, this.radius * 0.8, this.height, 32, 1, true);
        
        // Create custom shader material for the portal effect
        const portalMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                active: { value: 0 }
            },
            vertexShader: `
                varying vec2 vUv;
                varying vec3 vPosition;
                
                void main() {
                    vUv = uv;
                    vPosition = position;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform float active;
                varying vec2 vUv;
                varying vec3 vPosition;
                
                void main() {
                    // Swirl effect
                    float angle = atan(vPosition.x, vPosition.z);
                    float radius = length(vec2(vPosition.x, vPosition.z));
                    
                    // Animated swirl
                    float swirl = sin(angle * 10.0 + time * 3.0) * 0.5 + 0.5;
                    
                    // Radial gradient
                    float edge = smoothstep(0.8, 1.0, radius / 2.0);
                    
                    // Vertical gradient
                    float vertGrad = smoothstep(-1.0, 1.0, vPosition.y / 2.0);
                    
                    // Pulse effect based on time
                    float pulse = sin(time * 2.0) * 0.1 + 0.9;
                    
                    // Base color: magenta when inactive, cyan when active
                    vec3 baseColorInactive = vec3(1.0, 0.0, 1.0); // Magenta
                    vec3 baseColorActive = vec3(0.0, 1.0, 1.0); // Cyan
                    vec3 baseColor = mix(baseColorInactive, baseColorActive, active);
                    
                    // Combine effects
                    vec3 finalColor = baseColor * (swirl * 0.5 + 0.5) * pulse;
                    
                    // Add edge glow
                    finalColor = mix(finalColor, vec3(1.0, 1.0, 1.0), edge * 0.5);
                    
                    // Adjust opacity based on active state
                    float alpha = active > 0.5 ? 0.8 : 0.4;
                    
                    gl_FragColor = vec4(finalColor, alpha);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide
        });
        
        // Create portal mesh
        this.portalMesh = new THREE.Mesh(portalGeometry, portalMaterial);
        this.portalMesh.position.copy(this.position);
        this.scene.add(this.portalMesh);
        
        // Create portal outer ring
        const ringGeometry = new THREE.TorusGeometry(this.radius, 0.2, 16, 32);
        const ringMaterial = new THREE.MeshStandardMaterial({
            color: 0x8800ff,
            emissive: 0x440088,
            metalness: 0.8,
            roughness: 0.2
        });
        
        this.portalRingMesh = new THREE.Mesh(ringGeometry, ringMaterial);
        this.portalRingMesh.position.copy(this.position);
        this.portalRingMesh.rotation.x = Math.PI / 2; // Orient horizontally
        this.scene.add(this.portalRingMesh);
        
        // Add a second ring at the bottom
        const bottomRingMesh = this.portalRingMesh.clone();
        bottomRingMesh.position.y = this.position.y - this.height / 2;
        this.scene.add(bottomRingMesh);
        
        // Add a second ring at the top
        const topRingMesh = this.portalRingMesh.clone();
        topRingMesh.position.y = this.position.y + this.height / 2;
        this.scene.add(topRingMesh);
        
        // Add light to the portal
        const portalLight = new THREE.PointLight(0xff00ff, 1, 10);
        portalLight.position.copy(this.position);
        this.scene.add(portalLight);
        
        // Create portal label
        this.createPortalLabel();
    }
    
    createPortalLabel() {
        // Create a simple floating text mesh above the portal
        const textGeometry = new THREE.PlaneGeometry(4, 1);
        const textTexture = this.createTextTexture("Vibeverse Portal", 256, 64);
        
        const textMaterial = new THREE.MeshBasicMaterial({
            map: textTexture,
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide
        });
        
        this.portalText = new THREE.Mesh(textGeometry, textMaterial);
        this.portalText.position.copy(this.position);
        this.portalText.position.y += this.height / 2 + 1; // Position above portal
        
        // Always face the camera
        this.portalText.userData.isBillboard = true;
        
        this.scene.add(this.portalText);
    }
    
    createTextTexture(text, width, height) {
        // Create a canvas to draw the text
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const context = canvas.getContext('2d');
        context.fillStyle = 'rgba(0, 0, 0, 0)';
        context.fillRect(0, 0, width, height);
        
        // Draw text
        context.font = 'bold 36px system-ui, sans-serif';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        
        // Create gradient
        const gradient = context.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, '#ff00ff');
        gradient.addColorStop(0.5, '#00ffff');
        gradient.addColorStop(1, '#ff00ff');
        context.fillStyle = gradient;
        
        // Add glow effect
        context.shadowColor = '#00ffff';
        context.shadowBlur = 10;
        
        // Write text
        context.fillText(text, width / 2, height / 2);
        
        // Create texture from canvas
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        
        return texture;
    }
    
    setPortalActive(isActive) {
        this.active = isActive;
        
        // Update shader uniform
        if (this.portalMesh && this.portalMesh.material && this.portalMesh.material.uniforms) {
            this.portalMesh.material.uniforms.active.value = isActive ? 1.0 : 0.0;
        }
        
        // Update portal ring color
        if (this.portalRingMesh) {
            if (isActive) {
                this.portalRingMesh.material.emissive.set(0x00ffff);
                this.portalRingMesh.material.color.set(0x00ffff);
            } else {
                this.portalRingMesh.material.emissive.set(0x440088);
                this.portalRingMesh.material.color.set(0x8800ff);
            }
        }
    }
    
    update(delta) {
        // Update portal effects
        if (!this.portalMesh) return;
        
        // Update time uniform for animation
        if (this.portalMesh.material && this.portalMesh.material.uniforms) {
            this.portalMesh.material.uniforms.time.value += delta;
        }
        
        // Rotate portal ring
        if (this.portalRingMesh) {
            this.portalRingMesh.rotation.z += this.rotationSpeed * delta;
        }
        
        // Make text billboard face camera
        if (this.portalText && this.portalText.userData.isBillboard) {
            this.portalText.lookAt(this.game.camera.position);
        }
        
        // Add particle effects if portal is active
        if (this.active && Math.random() > 0.8) {
            this.game.particles.createPortalEffect(this.position);
        }
        
        // Check if portal is activated based on level completion
        if (this.game.levelManager && this.game.levelManager.levelCompleted) {
            this.setPortalActive(true);
        }
        
        // Check if player enters portal
        this.checkPlayerEntry();
    }
    
    checkPlayerEntry() {
        // Only check if portal is active and player exists
        if (!this.active || !this.game.player) return;
        
        const playerPosition = this.game.player.position;
        const portalCenterXZ = new THREE.Vector2(this.position.x, this.position.z);
        const playerXZ = new THREE.Vector2(playerPosition.x, playerPosition.z);
        
        // Check distance from portal center in XZ plane
        const distance = portalCenterXZ.distanceTo(playerXZ);
        
        // Check if player is within portal radius
        if (distance < this.radius * 0.8) {
            // Check if player is within portal height
            const portalMinY = this.position.y - this.height / 2;
            const portalMaxY = this.position.y + this.height / 2;
            
            if (playerPosition.y >= portalMinY && playerPosition.y <= portalMaxY) {
                // Player has entered the portal
                if (!this.playerInPortal) {
                    this.playerInPortal = true;
                    this.transportPlayer();
                }
            }
        } else {
            // Reset flag when player exits portal area
            this.playerInPortal = false;
        }
    }
    
    transportPlayer() {
        // Build the portal URL with player information
        let portalURL = this.destinationURL;
        
        // Add query parameters
        const params = new URLSearchParams();
        params.append('portal', 'true');
        params.append('username', this.game.playerName || 'Quantum Explorer');
        params.append('color', '#00ffaa'); // Player color
        params.append('speed', '5');
        params.append('ref', window.location.href);
        
        // Redirect to the portal
        setTimeout(() => {
            window.location.href = `${portalURL}?${params.toString()}`;
        }, 500); // Short delay for effect
    }
}