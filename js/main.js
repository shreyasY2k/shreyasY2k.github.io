// Main Game Controller
class Game {
    constructor() {
        // Game state
        this.isRunning = false;
        this.score = 0;
        this.playerName = '';
        this.level = 1;
        this.comingFromPortal = false;

        // Check if coming from a portal
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('portal') === 'true') {
            this.comingFromPortal = true;
            this.playerName = urlParams.get('username') || 'Quantum Explorer';
            this.playerColor = urlParams.get('color') || '#0ff';
            this.refGame = urlParams.get('ref') || null;
        }

        // Three.js setup
        this.setupThreeJs();
        
        // Initialize systems
        this.quantum = new QuantumSystem(this);
        this.particles = new ParticleSystem(this);
        this.ui = new UI(this);
        
        // Initialize player last (after environment)
        this.player = null;

        // Bind methods
        this.animate = this.animate.bind(this);
        this.handleResize = this.handleResize.bind(this);
        this.updateMinimap = this.updateMinimap.bind(this);

        // Event listeners
        window.addEventListener('resize', this.handleResize);

        // Start screen or direct to game if coming from portal
        if (this.comingFromPortal) {
            this.startGame();
        } else {
            this.showStartScreen();
        }
    }

    setupThreeJs() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x050510);
        this.scene.fog = new THREE.FogExp2(0x050510, 0.025); // Reduced fog for better visibility
        
        // Create camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 5, 10);
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        document.body.appendChild(this.renderer.domElement);
        
        // Enhanced lighting
        const ambientLight = new THREE.AmbientLight(0x666666, 1.0); // Brighter ambient light
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0); // Brighter direct light
        directionalLight.position.set(5, 15, 10);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 1024;
        directionalLight.shadow.mapSize.height = 1024;
        this.scene.add(directionalLight);
        
        // Add an additional directional light from another angle
        const secondaryLight = new THREE.DirectionalLight(0xaaccff, 0.5);
        secondaryLight.position.set(-10, 10, -5);
        this.scene.add(secondaryLight);
        
        // Add a minimap
        this.setupMinimap();
        
        // Clock for timing
        this.clock = new THREE.Clock();
    }
    
    setupMinimap() {
        // Create a minimap in the corner of the screen
        
        // Create minimap container
        const minimapContainer = document.createElement('div');
        minimapContainer.id = 'minimap';
        minimapContainer.style.position = 'absolute';
        minimapContainer.style.bottom = '20px';
        minimapContainer.style.right = '20px';
        minimapContainer.style.width = '200px';
        minimapContainer.style.height = '200px';
        minimapContainer.style.background = 'rgba(0, 0, 0, 0.5)';
        minimapContainer.style.border = '2px solid #0ff';
        minimapContainer.style.borderRadius = '5px';
        minimapContainer.style.zIndex = '50';
        minimapContainer.style.overflow = 'hidden';
        document.body.appendChild(minimapContainer);
        
        // Create canvas for minimap
        const minimapCanvas = document.createElement('canvas');
        minimapCanvas.id = 'minimapCanvas';
        minimapCanvas.width = 200;
        minimapCanvas.height = 200;
        minimapContainer.appendChild(minimapCanvas);
        
        // Store reference
        this.minimapCanvas = minimapCanvas;
        this.minimapContext = minimapCanvas.getContext('2d');
    }
    
    updateMinimap() {
        if (!this.minimapContext || !this.player) return;
        
        const ctx = this.minimapContext;
        const canvas = this.minimapCanvas;
        const mapSize = 200;
        const worldSize = this.levelManager ? this.levelManager.worldSize : 50;
        const scale = mapSize / (worldSize * 2);
        
        // Clear minimap
        ctx.fillStyle = 'rgba(5, 5, 16, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw grid
        ctx.strokeStyle = 'rgba(0, 100, 255, 0.3)';
        ctx.beginPath();
        for (let i = 0; i <= mapSize; i += 20) {
            ctx.moveTo(0, i);
            ctx.lineTo(mapSize, i);
            ctx.moveTo(i, 0);
            ctx.lineTo(i, mapSize);
        }
        ctx.stroke();
        
        // Transform coordinates to center of map
        ctx.save();
        ctx.translate(mapSize / 2, mapSize / 2);
        
        // Draw platforms
        if (this.levelManager && this.levelManager.platforms) {
            ctx.fillStyle = 'rgba(0, 150, 255, 0.6)';
            this.levelManager.platforms.forEach(platform => {
                const x = platform.position.x * scale;
                const z = platform.position.z * scale;
                const width = platform.size.x * scale;
                const depth = platform.size.z * scale;
                ctx.fillRect(x - width/2, z - depth/2, width, depth);
            });
        }
        
        // Draw collectibles
        if (this.levelManager && this.levelManager.collectibles) {
            ctx.fillStyle = 'rgba(255, 255, 0, 0.8)';
            this.levelManager.collectibles.forEach(collectible => {
                const x = collectible.position.x * scale;
                const z = collectible.position.z * scale;
                
                // Draw as diamond
                ctx.beginPath();
                ctx.moveTo(x, z - 5);
                ctx.lineTo(x + 5, z);
                ctx.lineTo(x, z + 5);
                ctx.lineTo(x - 5, z);
                ctx.closePath();
                ctx.fill();
            });
        }
        
        // Draw portal
        if (this.portal && this.portal.position) {
            ctx.fillStyle = 'rgba(255, 0, 255, 0.8)';
            const x = this.portal.position.x * scale;
            const z = this.portal.position.z * scale;
            
            // Draw as circle
            ctx.beginPath();
            ctx.arc(x, z, 6, 0, Math.PI * 2);
            ctx.fill();
            
            // Add "P" label
            ctx.fillStyle = 'white';
            ctx.font = '9px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('P', x, z);
        }
        
        // Draw player (always on top)
        if (this.player) {
            const x = this.player.position.x * scale;
            const z = this.player.position.z * scale;
            
            // Player direction triangle
            const angle = Math.atan2(
                this.camera.position.x - this.player.position.x,
                this.camera.position.z - this.player.position.z
            );
            
            ctx.fillStyle = 'rgba(0, 255, 170, 1.0)';
            ctx.beginPath();
            ctx.moveTo(
                x + Math.sin(angle) * 8,
                z + Math.cos(angle) * 8
            );
            ctx.lineTo(
                x + Math.sin(angle + Math.PI * 2/3) * 5,
                z + Math.cos(angle + Math.PI * 2/3) * 5
            );
            ctx.lineTo(
                x + Math.sin(angle + Math.PI * 4/3) * 5,
                z + Math.cos(angle + Math.PI * 4/3) * 5
            );
            ctx.closePath();
            ctx.fill();
            
            // Player position dot
            ctx.beginPath();
            ctx.arc(x, z, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
        
        // Draw north indicator
        ctx.fillStyle = 'white';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('N', 100, 15);
        
        // Draw compass arrow
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.moveTo(100, 5);
        ctx.lineTo(104, 13);
        ctx.lineTo(100, 11);
        ctx.lineTo(96, 13);
        ctx.closePath();
        ctx.fill();
    }

    showStartScreen() {
        document.getElementById('startScreen').style.display = 'flex';
        document.getElementById('gameUI').style.display = 'none';
        
        // Event listener for start button
        document.getElementById('startButton').addEventListener('click', () => {
            this.playerName = document.getElementById('playerName').value || 'Quantum Explorer';
            this.startGame();
        });
    }

    startGame() {
        // Hide start screen
        document.getElementById('startScreen').style.display = 'none';
        document.getElementById('gameUI').style.display = 'block';
        
        // Initialize portal first
        this.portal = new Portal(this);
        
        // Initialize level
        this.levelManager = new LevelManager(this);
        this.levelManager.loadLevel(this.level);
        
        // Initialize player
        this.player = new Player(this);
        
        // Show tutorial if not coming from portal
        if (!this.comingFromPortal) {
            this.ui.showTutorial();
        }
        
        // Create object labels for important elements
        this.ui.addGameObjectLabels();
        this.createGameObjectLabels();
        
        // Start game loop
        this.isRunning = true;
        this.clock.start();
        this.animate();
    }
    
    createGameObjectLabels() {
        // Add labels to important objects
        
        // Label portal
        if (this.portal && this.portal.portalMesh) {
            this.ui.addObjectLabel(this.portal.portalMesh, "QUANTUM PORTAL", "#ff00ff");
        }
        
        // Label collectibles
        if (this.levelManager && this.levelManager.collectibles) {
            this.levelManager.collectibles.forEach((collectible, index) => {
                this.ui.addObjectLabel(collectible.mesh, `COLLECTIBLE ${index+1}`, "#ffff00");
            });
        }
        
        // Label platforms
        if (this.levelManager && this.levelManager.platforms) {
            this.levelManager.platforms.forEach((platform, index) => {
                if (index % 3 === 0) { // Only label some platforms to avoid clutter
                    this.ui.addObjectLabel(platform.mesh, "QUANTUM PLATFORM", "#00aaff");
                }
            });
        }
    }

    gameOver() {
        this.isRunning = false;
        document.getElementById('finalScoreValue').textContent = this.score;
        document.getElementById('gameOverScreen').style.display = 'flex';
        
        // Event listener for restart button
        document.getElementById('restartButton').addEventListener('click', () => {
            location.reload();
        });
    }

    updateScore(points) {
        this.score += points;
        document.getElementById('scoreValue').textContent = this.score;
    }

    animate() {
        if (!this.isRunning) return;
        
        requestAnimationFrame(this.animate);
        
        const delta = this.clock.getDelta();
        
        // Update systems
        if (this.player) this.player.update(delta);
        this.quantum.update(delta);
        this.particles.update(delta);
        this.levelManager.update(delta);
        this.portal.update(delta);
        this.ui.update(delta);
        
        // Update minimap
        this.updateMinimap();
        
        // Render scene
        this.renderer.render(this.scene, this.camera);
    }

    handleResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});