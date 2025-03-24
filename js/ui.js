// User Interface Manager
class UI {
    constructor(game) {
        this.game = game;
        
        // UI elements
        this.scoreElement = document.getElementById('scoreValue');
        this.observerStatusElement = document.getElementById('observerStatus');
        this.tutorialElement = document.getElementById('tutorial');
        this.portalNotificationElement = document.getElementById('portalNotification');
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Create compass indicator
        this.createCompass();
        
        // Check for portal entry
        this.checkPortalEntry();
        
        // Create floating help popups
        this.createHelpPopups();
    }
    
    createCompass() {
        // Create a compass to show direction to objectives
        const compass = document.createElement('div');
        compass.id = 'compass';
        compass.style.position = 'absolute';
        compass.style.top = '20px';
        compass.style.right = '20px';
        compass.style.width = '100px';
        compass.style.height = '100px';
        compass.style.background = 'rgba(0, 0, 0, 0.5)';
        compass.style.border = '2px solid #0ff';
        compass.style.borderRadius = '50%';
        compass.style.display = 'flex';
        compass.style.justifyContent = 'center';
        compass.style.alignItems = 'center';
        compass.style.zIndex = '50';
        
        // Compass needle
        const needle = document.createElement('div');
        needle.id = 'compassNeedle';
        needle.style.width = '4px';
        needle.style.height = '60px';
        needle.style.background = 'linear-gradient(to bottom, #ff00ff 0%, #00ffff 100%)';
        needle.style.transformOrigin = 'center bottom';
        compass.appendChild(needle);
        
        // "N" indicator
        const north = document.createElement('div');
        north.textContent = 'N';
        north.style.position = 'absolute';
        north.style.top = '5px';
        north.style.color = 'white';
        north.style.fontSize = '14px';
        north.style.fontWeight = 'bold';
        compass.appendChild(north);
        
        // Portal indicator
        const portalIndicator = document.createElement('div');
        portalIndicator.id = 'portalIndicator';
        portalIndicator.style.position = 'absolute';
        portalIndicator.style.width = '12px';
        portalIndicator.style.height = '12px';
        portalIndicator.style.borderRadius = '50%';
        portalIndicator.style.background = '#ff00ff';
        portalIndicator.style.boxShadow = '0 0 10px #ff00ff';
        portalIndicator.style.transform = 'translate(-50%, -50%)';
        compass.appendChild(portalIndicator);
        
        // Collectibles indicator container
        const collectiblesContainer = document.createElement('div');
        collectiblesContainer.id = 'collectiblesContainer';
        compass.appendChild(collectiblesContainer);
        
        document.body.appendChild(compass);
    }
    
    updateCompass() {
        if (!this.game.player || !this.game.camera) return;
        
        const compass = document.getElementById('compass');
        if (!compass) return;
        
        // Get player forward direction
        const playerForward = new THREE.Vector3(0, 0, -1);
        playerForward.applyQuaternion(this.game.camera.quaternion);
        playerForward.y = 0; // Keep on horizontal plane
        playerForward.normalize();
        
        // Calculate angle between player forward and world north (z-axis)
        const worldNorth = new THREE.Vector3(0, 0, -1);
        const angle = Math.atan2(playerForward.x, playerForward.z);
        
        // Rotate compass needle to show north
        const needle = document.getElementById('compassNeedle');
        if (needle) {
            needle.style.transform = `rotate(${angle}rad)`;
        }
        
        // Update portal indicator position
        if (this.game.portal && this.game.portal.position) {
            const portalIndicator = document.getElementById('portalIndicator');
            if (portalIndicator) {
                // Calculate direction to portal relative to player
                const portalDir = new THREE.Vector3().subVectors(
                    this.game.portal.position,
                    this.game.player.position
                );
                portalDir.y = 0; // Keep on horizontal plane
                portalDir.normalize();
                
                // Calculate angle between portal direction and player forward
                const portalAngle = Math.atan2(portalDir.x, portalDir.z) - angle;
                
                // Calculate position on compass circle
                const radius = 40; // Slightly smaller than compass radius
                const x = Math.sin(portalAngle) * radius;
                const y = -Math.cos(portalAngle) * radius;
                
                // Update position
                portalIndicator.style.left = `${50 + x}px`;
                portalIndicator.style.top = `${50 + y}px`;
                
                // Pulse animation
                const pulse = 0.7 + 0.3 * Math.sin(Date.now() * 0.005);
                portalIndicator.style.transform = `translate(-50%, -50%) scale(${pulse})`;
            }
        }
        
        // Update collectible indicators
        const collectiblesContainer = document.getElementById('collectiblesContainer');
        if (collectiblesContainer && this.game.levelManager && this.game.levelManager.collectibles) {
            // Clear previous indicators
            collectiblesContainer.innerHTML = '';
            
            // Create indicator for each collectible
            this.game.levelManager.collectibles.forEach((collectible, index) => {
                // Calculate direction to collectible relative to player
                const collectibleDir = new THREE.Vector3().subVectors(
                    collectible.position,
                    this.game.player.position
                );
                collectibleDir.y = 0; // Keep on horizontal plane
                collectibleDir.normalize();
                
                // Calculate angle between collectible direction and player forward
                const collectibleAngle = Math.atan2(collectibleDir.x, collectibleDir.z) - angle;
                
                // Calculate position on compass circle
                const radius = 40; // Slightly smaller than compass radius
                const x = Math.sin(collectibleAngle) * radius;
                const y = -Math.cos(collectibleAngle) * radius;
                
                // Create indicator
                const indicator = document.createElement('div');
                indicator.className = 'collectibleIndicator';
                indicator.style.position = 'absolute';
                indicator.style.width = '8px';
                indicator.style.height = '8px';
                indicator.style.borderRadius = '50%';
                indicator.style.background = '#ffff00';
                indicator.style.boxShadow = '0 0 5px #ffff00';
                indicator.style.left = `${50 + x}px`;
                indicator.style.top = `${50 + y}px`;
                indicator.style.transform = 'translate(-50%, -50%)';
                
                collectiblesContainer.appendChild(indicator);
            });
        }
    }
    
    setupEventListeners() {
        // Tutorial dismiss button
        document.getElementById('tutorialDismiss').addEventListener('click', () => {
            this.hideTutorial();
        });
    }
    
    checkPortalEntry() {
        // If player is coming from a portal, show welcome message
        if (this.game.comingFromPortal) {
            this.showPortalWelcome();
        }
    }
    
    showTutorial() {
        this.tutorialElement.style.display = 'block';
        
        // Auto-hide tutorial after 10 seconds
        setTimeout(() => {
            this.hideTutorial();
        }, 10000);
    }
    
    hideTutorial() {
        this.tutorialElement.style.display = 'none';
    }
    
    showPortalNotification() {
        // Show notification that portal is ready
        this.portalNotificationElement.style.display = 'block';
        
        // Hide after 5 seconds
        setTimeout(() => {
            this.hidePortalNotification();
        }, 5000);
    }
    
    hidePortalNotification() {
        this.portalNotificationElement.style.display = 'none';
    }
    
    showPortalWelcome() {
        // Create a temporary welcome message when coming from portal
        const welcomeDiv = document.createElement('div');
        welcomeDiv.style.position = 'absolute';
        welcomeDiv.style.top = '20%';
        welcomeDiv.style.left = '50%';
        welcomeDiv.style.transform = 'translate(-50%, -50%)';
        welcomeDiv.style.padding = '20px';
        welcomeDiv.style.background = 'rgba(0, 0, 0, 0.7)';
        welcomeDiv.style.border = '2px solid #0ff';
        welcomeDiv.style.borderRadius = '10px';
        welcomeDiv.style.color = '#fff';
        welcomeDiv.style.fontSize = '24px';
        welcomeDiv.style.textAlign = 'center';
        welcomeDiv.style.zIndex = '100';
        
        // Welcome message
        welcomeDiv.innerHTML = `
            <h2 style="color: #0ff; margin-bottom: 10px;">Quantum Realm Entered</h2>
            <p>Welcome, ${this.game.playerName}!</p>
            <p>You've arrived through a quantum tunnel.</p>
        `;
        
        // Add to body
        document.body.appendChild(welcomeDiv);
        
        // Remove after 5 seconds
        setTimeout(() => {
            document.body.removeChild(welcomeDiv);
        }, 5000);
    }
    
    updateScore(score) {
        if (this.scoreElement) {
            this.scoreElement.textContent = score;
        }
    }
    
    updateObserverStatus(isActive) {
        if (this.observerStatusElement) {
            this.observerStatusElement.textContent = isActive ? 'ON' : 'OFF';
        }
    }
    
    showGameOver(score) {
        // Update final score
        document.getElementById('finalScoreValue').textContent = score;
        
        // Show game over screen
        document.getElementById('gameOverScreen').style.display = 'flex';
        
        // Hide other UI elements
        document.getElementById('gameUI').style.display = 'none';
        
        // Bind restart button
        document.getElementById('restartButton').addEventListener('click', () => {
            location.reload();
        });
    }
    
    createHelpPopups() {
        // Create floating help popups that follow the player's view
        const helpPopups = [
            {
                title: "WASD to Move",
                content: "Use WASD or Arrow Keys to move your character",
                position: { x: 0, y: 0, z: -5 },
                delay: 1000
            },
            {
                title: "E for Observer Mode",
                content: "Press E to toggle Observer Mode which makes quantum objects more stable",
                position: { x: 5, y: 2, z: 5 },
                delay: 5000
            },
            {
                title: "Click to Collapse",
                content: "Click on quantum objects to collapse them into a definite state",
                position: { x: -5, y: 2, z: 5 },
                delay: 10000
            },
            {
                title: "Collect Yellow Objects",
                content: "Find and collect all yellow tetrahedrons to open the portal",
                position: { x: 0, y: 3, z: 10 },
                delay: 15000
            }
        ];
        
        // Create a container for help popups
        const container = document.createElement('div');
        container.id = 'helpPopupsContainer';
        container.style.position = 'absolute';
        container.style.top = '0';
        container.style.left = '0';
        container.style.width = '100%';
        container.style.height = '100%';
        container.style.pointerEvents = 'none';
        container.style.zIndex = '50';
        document.body.appendChild(container);
        
        // Create each popup with timer
        helpPopups.forEach(popup => {
            setTimeout(() => {
                this.showHelpPopup(popup.title, popup.content, popup.position);
            }, popup.delay);
        });
    }
    
    showHelpPopup(title, content, position) {
        // Create popup element
        const popup = document.createElement('div');
        popup.className = 'help-popup';
        popup.style.position = 'absolute';
        popup.style.padding = '15px';
        popup.style.background = 'rgba(0, 0, 0, 0.8)';
        popup.style.border = '2px solid #0ff';
        popup.style.borderRadius = '10px';
        popup.style.color = '#fff';
        popup.style.fontSize = '16px';
        popup.style.textAlign = 'center';
        popup.style.zIndex = '55';
        popup.style.minWidth = '250px';
        popup.style.transform = 'translate(-50%, -50%)';
        popup.style.backdropFilter = 'blur(5px)';
        popup.style.boxShadow = '0 0 20px rgba(0, 255, 255, 0.5)';
        
        // Add content
        popup.innerHTML = `
            <h3 style="color: #0ff; margin-top: 0; margin-bottom: 10px; font-size: 20px;">${title}</h3>
            <p style="margin: 0;">${content}</p>
        `;
        
        // Add to container
        document.getElementById('helpPopupsContainer').appendChild(popup);
        
        // Position in middle of screen initially
        popup.style.top = '50%';
        popup.style.left = '50%';
        
        // Remove after 10 seconds
        setTimeout(() => {
            if (popup.parentNode) {
                popup.parentNode.removeChild(popup);
            }
        }, 10000);
        
        // Store reference to update position based on 3D world position
        this.game.helpPopups = this.game.helpPopups || [];
        this.game.helpPopups.push({
            element: popup,
            position: new THREE.Vector3(position.x, position.y, position.z)
        });
    }
    
    updateHelpPopupPositions() {
        // Update positions of help popups based on camera view
        if (!this.game.helpPopups || !this.game.camera) return;
        
        for (const popup of this.game.helpPopups) {
            if (!popup.element || !popup.element.parentNode) continue;
            
            // Project 3D position to 2D screen coordinates
            const position = popup.position.clone();
            position.project(this.game.camera);
            
            // Convert to screen coordinates
            const x = (position.x * 0.5 + 0.5) * window.innerWidth;
            const y = (-position.y * 0.5 + 0.5) * window.innerHeight;
            
            // Check if position is in front of camera
            if (position.z < 1) {
                // Update element position
                popup.element.style.left = x + 'px';
                popup.element.style.top = y + 'px';
                popup.element.style.display = 'block';
            } else {
                // Hide if behind camera
                popup.element.style.display = 'none';
            }
        }
    }
    
    showMobileControls() {
        // Create mobile control elements for touch devices
        if (!this.isMobile()) return;
        
        // Container for mobile controls
        const controlsContainer = document.createElement('div');
        controlsContainer.id = 'mobileControls';
        controlsContainer.style.position = 'absolute';
        controlsContainer.style.bottom = '20px';
        controlsContainer.style.left = '0';
        controlsContainer.style.width = '100%';
        controlsContainer.style.display = 'flex';
        controlsContainer.style.justifyContent = 'center';
        controlsContainer.style.alignItems = 'center';
        controlsContainer.style.pointerEvents = 'none'; // Container doesn't block clicks
        controlsContainer.style.zIndex = '50';
        
        // Left joystick for movement
        const leftJoystick = document.createElement('div');
        leftJoystick.id = 'leftJoystick';
        leftJoystick.style.width = '120px';
        leftJoystick.style.height = '120px';
        leftJoystick.style.borderRadius = '60px';
        leftJoystick.style.background = 'rgba(0, 255, 255, 0.2)';
        leftJoystick.style.border = '2px solid rgba(0, 255, 255, 0.5)';
        leftJoystick.style.position = 'relative';
        leftJoystick.style.marginRight = '60px';
        leftJoystick.style.pointerEvents = 'auto'; // This element receives clicks
        
        // Joystick handle
        const joystickHandle = document.createElement('div');
        joystickHandle.id = 'joystickHandle';
        joystickHandle.style.width = '40px';
        joystickHandle.style.height = '40px';
        joystickHandle.style.borderRadius = '20px';
        joystickHandle.style.background = 'rgba(0, 255, 255, 0.8)';
        joystickHandle.style.position = 'absolute';
        joystickHandle.style.top = '50%';
        joystickHandle.style.left = '50%';
        joystickHandle.style.transform = 'translate(-50%, -50%)';
        joystickHandle.style.pointerEvents = 'none'; // Handle doesn't receive events
        
        leftJoystick.appendChild(joystickHandle);
        
        // Action buttons
        const actionsContainer = document.createElement('div');
        actionsContainer.style.display = 'flex';
        actionsContainer.style.flexDirection = 'column';
        actionsContainer.style.gap = '15px';
        
        // Jump button
        const jumpButton = this.createActionButton('jumpButton', 'JUMP');
        
        // Observer mode button
        const observerButton = this.createActionButton('observerButton', 'OBSERVE');
        
        // Add buttons to actions container
        actionsContainer.appendChild(jumpButton);
        actionsContainer.appendChild(observerButton);
        
        // Add elements to container
        controlsContainer.appendChild(leftJoystick);
        controlsContainer.appendChild(actionsContainer);
        
        // Add to body
        document.body.appendChild(controlsContainer);
        
        // Setup event handlers for mobile controls
        this.setupMobileControlEvents();
    }
    
    createActionButton(id, text) {
        const button = document.createElement('div');
        button.id = id;
        button.style.width = '80px';
        button.style.height = '80px';
        button.style.borderRadius = '40px';
        button.style.background = 'rgba(255, 0, 255, 0.2)';
        button.style.border = '2px solid rgba(255, 0, 255, 0.5)';
        button.style.display = 'flex';
        button.style.justifyContent = 'center';
        button.style.alignItems = 'center';
        button.style.color = 'white';
        button.style.fontWeight = 'bold';
        button.style.fontSize = '14px';
        button.style.pointerEvents = 'auto'; // Button receives clicks
        button.textContent = text;
        
        return button;
    }
    
    setupMobileControlEvents() {
        // This function would implement touch controls
        // For simplicity, we're not implementing the full mobile control logic
        // in this prototype, but this is where you would add touch event handlers
    }
    
    isMobile() {
        // Simple mobile detection
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    
    showNotification(message, duration = 3000) {
        // Create a notification element
        const notification = document.createElement('div');
        notification.style.position = 'absolute';
        notification.style.top = '20%';
        notification.style.left = '50%';
        notification.style.transform = 'translate(-50%, -50%)';
        notification.style.padding = '10px 20px';
        notification.style.background = 'rgba(0, 0, 0, 0.7)';
        notification.style.border = '2px solid #0ff';
        notification.style.borderRadius = '10px';
        notification.style.color = '#fff';
        notification.style.fontSize = '18px';
        notification.style.textAlign = 'center';
        notification.style.zIndex = '90';
        
        // Set message
        notification.textContent = message;
        
        // Add to body
        document.body.appendChild(notification);
        
        // Remove after duration
        setTimeout(() => {
            document.body.removeChild(notification);
        }, duration);
    }
    
    addGameObjectLabels() {
        // Add floating labels to important game objects
        const labelContainer = document.createElement('div');
        labelContainer.id = 'objectLabelsContainer';
        labelContainer.style.position = 'absolute';
        labelContainer.style.top = '0';
        labelContainer.style.left = '0';
        labelContainer.style.width = '100%';
        labelContainer.style.height = '100%';
        labelContainer.style.pointerEvents = 'none';
        labelContainer.style.zIndex = '40';
        document.body.appendChild(labelContainer);
        
        // We'll populate this in the game loop by projecting 3D objects to 2D screen space
        this.game.objectLabels = [];
    }
    
    addObjectLabel(object, labelText, color = '#00ffff') {
        // Create a label for a 3D object
        const label = document.createElement('div');
        label.className = 'object-label';
        label.style.position = 'absolute';
        label.style.padding = '5px 10px';
        label.style.background = 'rgba(0, 0, 0, 0.7)';
        label.style.border = `1px solid ${color}`;
        label.style.borderRadius = '4px';
        label.style.color = color;
        label.style.fontSize = '12px';
        label.style.fontWeight = 'bold';
        label.style.textAlign = 'center';
        label.style.transform = 'translate(-50%, -50%)';
        label.style.pointerEvents = 'none';
        label.textContent = labelText;
        
        // Add to container
        document.getElementById('objectLabelsContainer').appendChild(label);
        
        // Store reference
        this.game.objectLabels.push({
            element: label,
            object: object
        });
        
        return label;
    }
    
    updateObjectLabels() {
        // Update positions of object labels
        if (!this.game.objectLabels || !this.game.camera) return;
        
        for (const label of this.game.objectLabels) {
            if (!label.element || !label.object || !label.element.parentNode) continue;
            
            // Get object position
            const position = label.object.position.clone();
            
            // Add height offset
            position.y += 1;
            
            // Project to screen coordinates
            position.project(this.game.camera);
            
            // Convert to screen coordinates
            const x = (position.x * 0.5 + 0.5) * window.innerWidth;
            const y = (-position.y * 0.5 + 0.5) * window.innerHeight;
            
            // Check if position is in front of camera
            if (position.z < 1) {
                // Update element position
                label.element.style.left = x + 'px';
                label.element.style.top = y + 'px';
                label.element.style.display = 'block';
            } else {
                // Hide if behind camera
                label.element.style.display = 'none';
            }
        }
    }
    
    update(delta) {
        // Update help popup positions
        this.updateHelpPopupPositions();
        
        // Update object labels
        this.updateObjectLabels();
        
        // Update compass
        this.updateCompass();
    }
}