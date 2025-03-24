// Particle System
class ParticleSystem {
    constructor(game) {
        this.game = game;
        this.scene = game.scene;
        
        // Particle groups
        this.particles = [];
        
        // Pre-create particle geometries and materials for reuse
        this.setupParticleAssets();
    }
    
    setupParticleAssets() {
        // Collapse effect particles
        this.collapseGeometry = new THREE.SphereGeometry(0.08, 4, 4);
        this.collapseMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.8
        });
        
        // Observer mode particles
        this.observerGeometry = new THREE.SphereGeometry(0.04, 4, 4);
        this.observerMaterial = new THREE.MeshBasicMaterial({
            color: 0xff00ff,
            transparent: true,
            opacity: 0.7
        });
        
        // Player trail particles
        this.trailGeometry = new THREE.SphereGeometry(0.03, 4, 4);
        this.trailMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.5
        });
    }
    
    update(delta) {
        // Update and remove expired particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            // Update particle
            particle.life -= delta;
            
            // Apply movement
            particle.mesh.position.x += particle.velocity.x * delta;
            particle.mesh.position.y += particle.velocity.y * delta;
            particle.mesh.position.z += particle.velocity.z * delta;
            
            // Scale down over time
            const lifeRatio = particle.life / particle.maxLife;
            particle.mesh.scale.set(lifeRatio, lifeRatio, lifeRatio);
            
            // Update opacity
            particle.mesh.material.opacity = lifeRatio * particle.initialOpacity;
            
            // Remove if expired
            if (particle.life <= 0) {
                this.scene.remove(particle.mesh);
                particle.mesh.geometry.dispose();
                this.particles.splice(i, 1);
            }
        }
    }
    
    createCollapseEffect(position) {
        // Create burst of particles when quantum object collapses
        const numParticles = 12;
        
        for (let i = 0; i < numParticles; i++) {
            // Calculate random direction
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI * 2;
            
            const speed = 2 + Math.random() * 3;
            const velocity = new THREE.Vector3(
                Math.sin(theta) * Math.cos(phi) * speed,
                Math.sin(theta) * Math.sin(phi) * speed,
                Math.cos(theta) * speed
            );
            
            // Create particle
            const material = this.collapseMaterial.clone();
            material.color.setHSL(Math.random() * 0.2 + 0.4, 1, 0.5); // Cyan to blue-purple range
            
            const mesh = new THREE.Mesh(this.collapseGeometry, material);
            mesh.position.copy(position);
            
            // Add to scene and particles array
            this.scene.add(mesh);
            this.particles.push({
                mesh: mesh,
                velocity: velocity,
                life: 1 + Math.random() * 0.5, // 1-1.5 seconds
                maxLife: 1 + Math.random() * 0.5,
                initialOpacity: 0.8
            });
        }
    }
    
    createObserverModeEffect(position) {
        // Create swirling particles around the player in observer mode
        const numParticles = 3;
        
        for (let i = 0; i < numParticles; i++) {
            // Calculate spiral pattern
            const angle = Math.random() * Math.PI * 2;
            const radius = 0.5 + Math.random() * 0.5;
            
            const offset = new THREE.Vector3(
                Math.cos(angle) * radius,
                (Math.random() - 0.5) * 0.5,
                Math.sin(angle) * radius
            );
            
            // Random motion
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.5,
                (Math.random() - 0.5) * 0.5,
                (Math.random() - 0.5) * 0.5
            );
            
            // Create particle
            const material = this.observerMaterial.clone();
            material.color.setHSL(0.8 + Math.random() * 0.2, 1, 0.5); // Purple to magenta range
            
            const mesh = new THREE.Mesh(this.observerGeometry, material);
            mesh.position.copy(position).add(offset);
            
            // Add to scene and particles array
            this.scene.add(mesh);
            this.particles.push({
                mesh: mesh,
                velocity: velocity,
                life: 0.5 + Math.random() * 0.3, // 0.5-0.8 seconds
                maxLife: 0.5 + Math.random() * 0.3,
                initialOpacity: 0.7
            });
        }
    }
    
    createPlayerTrail(position) {
        // Create trail particles behind player
        if (Math.random() > 0.7) { // Only create particles occasionally for performance
            const material = this.trailMaterial.clone();
            material.color.setHSL(Math.random() * 0.2 + 0.4, 1, 0.5); // Cyan to blue range
            
            const mesh = new THREE.Mesh(this.trailGeometry, material);
            mesh.position.copy(position);
            
            // Small random motion
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.1,
                (Math.random() - 0.5) * 0.1,
                (Math.random() - 0.5) * 0.1
            );
            
            // Add to scene and particles array
            this.scene.add(mesh);
            this.particles.push({
                mesh: mesh,
                velocity: velocity,
                life: 0.5 + Math.random() * 0.5, // 0.5-1 second
                maxLife: 0.5 + Math.random() * 0.5,
                initialOpacity: 0.5
            });
        }
    }
    
    createPortalEffect(position) {
        // Create swirling particles for the portal
        const numParticles = 5;
        
        for (let i = 0; i < numParticles; i++) {
            // Calculate spiral pattern
            const angle = Math.random() * Math.PI * 2;
            const radius = 1 + Math.random() * 1.5;
            
            const offset = new THREE.Vector3(
                Math.cos(angle) * radius,
                (Math.random() - 0.5) * 2,
                Math.sin(angle) * radius
            );
            
            // Swirling motion
            const swirl = angle + Math.PI/2; // Perpendicular to radius
            const swirlSpeed = 2 + Math.random() * 2;
            
            const velocity = new THREE.Vector3(
                Math.cos(swirl) * swirlSpeed,
                (Math.random() - 0.5) * 0.5,
                Math.sin(swirl) * swirlSpeed
            );
            
            // Create particle
            const material = new THREE.MeshBasicMaterial({
                color: new THREE.Color().setHSL(0.7 + Math.random() * 0.3, 1, 0.5), // Purple to magenta
                transparent: true,
                opacity: 0.7
            });
            
            const mesh = new THREE.Mesh(this.observerGeometry, material);
            mesh.position.copy(position).add(offset);
            mesh.scale.set(2, 2, 2); // Larger particles for portal
            
            // Add to scene and particles array
            this.scene.add(mesh);
            this.particles.push({
                mesh: mesh,
                velocity: velocity,
                life: 1 + Math.random() * 1, // 1-2 seconds
                maxLife: 1 + Math.random() * 1,
                initialOpacity: 0.7
            });
        }
    }
}