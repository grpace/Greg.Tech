class Game {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer();
        this.players = {};
        this.peer = null;
        this.connection = null;
        this.bullets = [];
        this.walls = [];
        this.bulletSpeed = 0.5;
        this.lastShot = 0;
        this.shotCooldown = 250; // milliseconds
        this.health = 100;
        this.score = 0;
        this.isAlive = true;
        this.respawnTime = 3000; // 3 seconds
        this.spawnPoints = [
            new THREE.Vector3(-45, 0.4, -45),  // Back left corner
            new THREE.Vector3(45, 0.4, 45)     // Front right corner
        ];
        this.healthPacks = [];
        this.healthPackValue = 25;
        this.healthPackSpawnTime = 10000; // 10 seconds
        this.lastHealthPackSpawn = 0;
        
        // Load sounds
        this.sounds = {
            shoot: document.getElementById('shootSound'),
            hit: document.getElementById('hitSound'),
            pickup: document.getElementById('pickupSound'),
            death: document.getElementById('deathSound')
        };
        
        this.weapons = {
            missile: {
                name: 'Missile Launcher',
                damage: {
                    direct: 100,
                    splash: 34
                },
                cooldown: 2000,
                minVelocity: 0.4,
                maxVelocity: 1.8,
                chargeRate: 0.002,
                currentCharge: 0,
                isCharging: false,
                explosionRadius: 3,
                modelUrl: 'https://threejs.org/examples/models/gltf/rocketlauncher.glb',
                position: new THREE.Vector3(0, -0.15, -0.3),
                rotation: new THREE.Euler(0, Math.PI, 0),
                scale: new THREE.Vector3(0.2, 0.2, 0.2)
            }
        };
        
        this.currentWeapon = this.weapons.missile;
        
        // Add lighting properties
        this.ambientLight = null;
        this.directionalLight = null;
        
        // Add texture loader
        this.textureLoader = new THREE.TextureLoader();
        
        // Update texture loading with grass texture
        this.textures = {
            floor: this.textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/terrain/grasslight-big.jpg'),
        };
        
        // Configure grass texture
        this.textures.floor.wrapS = this.textures.floor.wrapT = THREE.RepeatWrapping;
        this.textures.floor.repeat.set(32, 32); // Increased repeat for better grass detail
        
        // Add model loader
        this.modelLoader = new THREE.GLTFLoader();
        
        // Add weapon models container
        this.weaponModels = {};
        
        // Add weapon animations
        this.weaponMixer = null;
        this.shootAnimation = null;
        this.reloadAnimation = null;
        
        // Add movement properties
        this.velocity = new THREE.Vector3();
        this.moveSpeed = 0.025;
        this.sprintSpeed = 0.035;
        this.friction = 0.85;
        this.airFriction = 0.95;
        this.jumpForce = 0.125;
        this.gravity = 0.012;
        this.bhopBoostMultiplier = 0.1;
        this.isGrounded = true;
        this.moveState = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            sprinting: false,
            jumping: false
        };
        
        // Update camera control properties
        this.cameraRotation = {
            x: -0.3, // Initial downward tilt
            y: 0
        };
        this.mouseSensitivity = 0.003;
        
        // Add cat model properties
        this.catModel = null;
        this.catModelUrl = 'https://sketchfab.com/3d-models/kitten-simple-c12c4d965bc1458d9a0631b70586bfa5/download'; // Simple Kitten model
        
        // Add third-person camera properties
        this.cameraOffset = new THREE.Vector3(0, 4, 12);
        this.cameraLookAt = new THREE.Vector3(0, 1, -1);
        this.cameraSmoothness = 0.1;
        
        // Add jumping properties
        this.gravity = 0.012;
        this.jumpForce = 0.25;
        this.isGrounded = true;
        
        // Update missile effects to include charge sound again
        this.missileEffects = {
            chargeSound: document.getElementById('missileChargeSound'),
            launchSound: document.getElementById('missileLaunchSound'),
            explosionSound: document.getElementById('explosionSound'),
            chargeIndicator: document.getElementById('chargeIndicator'),
            chargeBar: document.getElementById('chargeBar'),
            cooldownIndicator: document.getElementById('cooldownIndicator'),
            cooldownBar: document.getElementById('cooldownBar')
        };
        
        // Add map size property
        this.mapSize = 100; // Increased from 50
        this.boundaryLimit = 48; // Matches current boundary
        
        // Configure texture repeats for larger map
        this.textures.floor.wrapS = this.textures.floor.wrapT = THREE.RepeatWrapping;
        this.textures.floor.repeat.set(16, 16); // Increased for larger floor
        
        // Add spawn and countdown properties
        this.gameStarted = false;
        this.countdownOverlay = document.getElementById('countdownOverlay');
        
        // Add scoring properties
        this.score = 0;
        this.kills = 0;
        this.deaths = 0;
        this.suicides = 0;
        this.gameEndScore = 10;
        this.gameOver = false;
        
        // Add hit marker properties
        this.hitMarkerSound = document.getElementById('hitMarkerSound');
        this.hitMarker = document.getElementById('hitMarker');
        this.hitMarkerTimeout = null;
        
        this.init();
    }

    init() {
        // Setup renderer
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        // Enable shadows
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Setup lighting
        this.setupLighting();

        // Create and add the cat model first with initial position
        this.localPlayer = this.createCatModel();
        this.localPlayer.position.set(0, 0.4, 0);
        this.scene.add(this.localPlayer);

        // Setup initial camera position properly
        const startOffset = new THREE.Vector3(
            -Math.sin(this.cameraRotation.y) * this.cameraOffset.z,
            this.cameraOffset.y,
            -Math.cos(this.cameraRotation.y) * this.cameraOffset.z
        );
        
        this.camera.position.set(
            this.localPlayer.position.x + startOffset.x,
            this.localPlayer.position.y + startOffset.y,
            this.localPlayer.position.z + startOffset.z
        );
        
        // Set initial camera rotation
        this.camera.rotation.order = 'YXZ';
        this.camera.lookAt(this.localPlayer.position);

        // Create weapon container
        this.weaponContainer = new THREE.Object3D();
        this.localPlayer.add(this.weaponContainer);

        // Create skybox with solid color
        const skyboxGeometry = new THREE.BoxGeometry(1000, 1000, 1000);
        const skyboxMaterial = new THREE.MeshBasicMaterial({
            color: 0x87CEEB,
            side: THREE.BackSide
        });
        const skybox = new THREE.Mesh(skyboxGeometry, skyboxMaterial);
        this.scene.add(skybox);

        // Create floor with grass texture
        const floorGeometry = new THREE.PlaneGeometry(this.mapSize, this.mapSize);
        const floorMaterial = new THREE.MeshPhongMaterial({ 
            map: this.textures.floor,
            side: THREE.DoubleSide,
            shininess: 5 // Reduced shininess for more natural grass look
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = Math.PI / 2;
        floor.receiveShadow = true;
        this.scene.add(floor);

        // Show initial weapon
        this.showWeaponModel(this.currentWeapon.name);

        // Create crosshair
        this.createCrosshair();

        // Setup controls
        this.setupControls();
        
        // Setup P2P connection handlers
        this.setupNetworking();

        // Start game loop
        this.animate();

        this.updateUI();
    }

    setupControls() {
        // Handle keydown for movement
        document.addEventListener('keydown', (event) => {
            if (!this.gameStarted) return; // Ignore input before game starts
            
            switch(event.key.toLowerCase()) {
                case 'w':
                    this.moveState.forward = true;
                    break;
                case 's':
                    this.moveState.backward = true;
                    break;
                case 'a':
                    this.moveState.left = true;
                    break;
                case 'd':
                    this.moveState.right = true;
                    break;
                case 'shift':
                    this.moveState.sprinting = true;
                    break;
                case ' ':
                    if (this.isGrounded) {
                        this.velocity.y = this.jumpForce;
                        this.isGrounded = false;
                        
                        // Reduced bhop boost
                        const speed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z);
                        if (speed > 0) {
                            const boost = Math.min(speed * this.bhopBoostMultiplier, 0.002); // Reduced from 0.004
                            this.velocity.x += this.velocity.x * boost;
                            this.velocity.z += this.velocity.z * boost;
                        }
                    }
                    break;
            }
        });

        // Handle keyup for movement
        document.addEventListener('keyup', (event) => {
            if (!this.gameStarted) return; // Ignore input before game starts
            
            switch(event.key.toLowerCase()) {
                case 'w':
                    this.moveState.forward = false;
                    break;
                case 's':
                    this.moveState.backward = false;
                    break;
                case 'a':
                    this.moveState.left = false;
                    break;
                case 'd':
                    this.moveState.right = false;
                    break;
                case 'shift':
                    this.moveState.sprinting = false;
                    break;
            }
        });

        // Fix mouse movement handler
        document.addEventListener('mousemove', (event) => {
            if (!this.gameStarted) return;
            
            if (document.pointerLockElement === this.renderer.domElement) {
                this.cameraRotation.y -= event.movementX * this.mouseSensitivity;
                
                // Allow more vertical movement but still maintain limits
                const newX = this.cameraRotation.x + event.movementY * this.mouseSensitivity;
                this.cameraRotation.x = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, newX));
            }
        });

        // Update pointer lock handling
        this.renderer.domElement.addEventListener('click', () => {
            if (document.pointerLockElement !== this.renderer.domElement) {
                this.renderer.domElement.requestPointerLock();
            }
        });

        // Remove click event listener for shooting
        document.removeEventListener('click', () => this.shoot());

        // Update mouse controls for charge-up shooting
        document.addEventListener('mousedown', () => {
            if (!this.gameStarted) return; // Ignore input before game starts
            
            if (document.pointerLockElement === this.renderer.domElement) {
                const timeSinceLastShot = Date.now() - this.lastShot;
                if (timeSinceLastShot >= this.currentWeapon.cooldown) {
                    this.currentWeapon.isCharging = true;
                    this.currentWeapon.currentCharge = 0;
                }
            }
        });

        document.addEventListener('mouseup', () => {
            if (!this.gameStarted) return; // Ignore input before game starts
            
            if (document.pointerLockElement === this.renderer.domElement) {
                this.shoot();
            }
        });
    }

    setupNetworking() {
        const lobbyButtons = document.querySelectorAll('.lobbyBtn');
        
        lobbyButtons.forEach(button => {
            button.addEventListener('click', () => {
                const lobbyId = `game-lobby-${button.dataset.lobby}`;
                this.joinLobby(lobbyId);
            });
        });
    }

    joinLobby(lobbyId) {
        this.peer = new Peer();
        
        this.peer.on('open', (myPeerId) => {
            // Try to join as second player first
            const conn = this.peer.connect(lobbyId);
            
            conn.on('open', () => {
                // Successfully connected to host
                this.connection = conn;
                this.setupConnectionHandlers();
                document.getElementById('gameIdDisplay').textContent = lobbyId.replace('game-lobby-', '');
                document.getElementById('gameId').style.display = 'block';
                document.getElementById('lobbySelector').style.display = 'none';
            });
            
            conn.on('error', () => {
                // Failed to connect as second player, become host
                this.peer.disconnect();
                this.peer = new Peer(lobbyId);
                
                this.peer.on('open', () => {
                    document.getElementById('gameIdDisplay').textContent = lobbyId.replace('game-lobby-', '');
                    document.getElementById('gameId').style.display = 'block';
                    document.getElementById('lobbySelector').style.display = 'none';
                });
                
                this.peer.on('connection', (conn) => {
                    this.connection = conn;
                    this.setupConnectionHandlers();
                });
            });
        });
        
        this.peer.on('error', (err) => {
            if (err.type === 'peer-unavailable') {
                // Failed to connect as second player, become host
                this.peer = new Peer(lobbyId);
                
                this.peer.on('open', () => {
                    document.getElementById('gameIdDisplay').textContent = lobbyId.replace('game-lobby-', '');
                    document.getElementById('gameId').style.display = 'block';
                    document.getElementById('lobbySelector').style.display = 'none';
                });
                
                this.peer.on('connection', (conn) => {
                    this.connection = conn;
                    this.setupConnectionHandlers();
                });
            } else {
                console.error('Peer error:', err);
                alert('Failed to connect. Please try another lobby.');
            }
        });
    }

    setupConnectionHandlers() {
        if (!this.connection) return;

        this.connection.on('open', () => {
            // Send initial connection message
            this.connection.send({
                type: 'init',
                peerId: this.peer.id,
                ready: true,
                position: this.localPlayer.position.clone(),
                rotation: this.localPlayer.rotation.clone()
            });
        });

        let opponentReady = false;
        let localReady = false;

        this.connection.on('data', (data) => {
            switch(data.type) {
                case 'init':
                    // Create opponent cat model if not exists
                    if (!this.players[this.connection.peer]) {
                        const opponentCat = this.createCatModel();
                        opponentCat.material = new THREE.MeshPhongMaterial({ color: 0xff0000 });
                        this.players[this.connection.peer] = {
                            mesh: opponentCat,
                            health: 100,
                            isAlive: true
                        };
                        this.scene.add(opponentCat);
                        
                        // Set initial position and rotation
                        opponentCat.position.copy(data.position);
                        opponentCat.rotation.copy(data.rotation);
                    }
                    
                    // Handle ready state
                    opponentReady = data.ready;
                    if (!localReady) {
                        localReady = true;
                        this.connection.send({
                            type: 'init',
                            peerId: this.peer.id,
                            ready: true,
                            position: this.localPlayer.position.clone(),
                            rotation: this.localPlayer.rotation.clone()
                        });
                    }

                    // Start game when both players are ready
                    if (opponentReady && localReady) {
                        this.startGameCountdown(data.peerId);
                    }
                    break;

                case 'position':
                    // Update opponent position and rotation
                    const player = this.players[this.connection.peer];
                    if (player && player.mesh) {
                        player.mesh.position.copy(data.position);
                        player.mesh.rotation.copy(data.rotation);
                    }
                    break;

                case 'missile':
                    const missile = this.createRemoteMissile(
                        new THREE.Vector3().copy(data.position),
                        new THREE.Vector3().copy(data.direction),
                        data.charge
                    );
                    this.bullets.push(missile);
                    break;

                case 'explosion':
                    this.createExplosion(
                        new THREE.Vector3().copy(data.position),
                        true // isRemote
                    );
                    break;

                case 'removeMissile':
                    // Remove specific missile by ID
                    const missileIndex = this.bullets.findIndex(m => m.userData.id === data.missileId);
                    if (missileIndex !== -1) {
                        const missile = this.bullets[missileIndex];
                        this.scene.remove(missile);
                        this.scene.remove(missile.trailParticles);
                        this.bullets.splice(missileIndex, 1);
                    }
                    break;

                case 'damage':
                    // Handle incoming damage
                    if (data.targetId === this.peer.id) {
                        this.handleDamage(data.damage, data.source);
                    }
                    break;

                case 'killed':
                    this.addKillFeed(data.killer, data.victim);
                    break;

                case 'gameEnd':
                    this.handleGameEnd(data.winner, data.loser);
                    break;
                
                case 'restartGame':
                    this.resetGame();
                    break;

                case 'playSound':
                    this.playRemoteSound(data.soundType, data.position);
                    break;
            }
        });

        // Send position updates frequently
        setInterval(() => {
            if (this.connection && this.connection.open && this.gameStarted) {
                this.connection.send({
                    type: 'position',
                    position: this.localPlayer.position.clone(),
                    rotation: this.localPlayer.rotation.clone()
                });
            }
        }, 16); // 60 times per second
    }

    createRemoteMissile(position, direction, charge) {
        // Create unique ID without modifying mesh properties
        const missileId = Math.random().toString(36).substr(2, 9);
        
        const missile = new THREE.Mesh(
            new THREE.CylinderGeometry(0.05, 0.1, 0.4),
            new THREE.MeshPhongMaterial({ 
                color: 0x444444,
                emissive: 0xff4400,
                emissiveIntensity: 0.5
            })
        );
        
        // Store ID as a custom property
        missile.userData.id = missileId;
        missile.position.copy(position);
        missile.direction = direction;
        missile.gravity = new THREE.Vector3(0, -0.002, 0);
        
        // Create trail
        const trailParticles = new THREE.Points(
            new THREE.BufferGeometry(),
            new THREE.PointsMaterial({
                color: 0xff4400,
                size: 0.1,
                transparent: true,
                opacity: 0.8,
                blending: THREE.AdditiveBlending
            })
        );
        
        missile.trailPositions = new Array(20).fill(null).map(() => position.clone());
        trailParticles.geometry.setAttribute(
            'position',
            new THREE.Float32BufferAttribute(new Float32Array(missile.trailPositions.length * 3), 3)
        );
        
        this.scene.add(missile);
        this.scene.add(trailParticles);
        missile.trailParticles = trailParticles;
        
        return missile;
    }

    shoot() {
        if (!this.isAlive || !this.gameStarted) return;
        
        const timeSinceLastShot = Date.now() - this.lastShot;
        if (timeSinceLastShot < this.currentWeapon.cooldown) return;
        
        this.lastShot = Date.now();
        this.currentWeapon.isCharging = false;

        // Create a new audio instance for launch sound with higher volume
        const launchSound = new Audio(this.missileEffects.launchSound.src);
        launchSound.volume = 0.8;
        launchSound.play();
        
        const direction = new THREE.Vector3();
        const lookAtPoint = new THREE.Vector3(
            this.localPlayer.position.x + Math.sin(this.cameraRotation.y) * 10,
            this.localPlayer.position.y + 0.5 - Math.sin(this.cameraRotation.x) * 10,
            this.localPlayer.position.z + Math.cos(this.cameraRotation.y) * 10
        );
        
        direction.subVectors(lookAtPoint, this.localPlayer.position).normalize();
        
        const startPosition = new THREE.Vector3(
            this.localPlayer.position.x + direction.x * 0.5,
            this.localPlayer.position.y + 0.5,
            this.localPlayer.position.z + direction.z * 0.5
        );

        const missile = this.createRemoteMissile(
            startPosition,
            direction.multiplyScalar(this.currentWeapon.maxVelocity * this.currentWeapon.currentCharge),
            this.currentWeapon.currentCharge
        );
        
        // Store the launch sound with the missile for cleanup
        missile.userData.launchSound = launchSound;
        
        this.bullets.push(missile);

        if (this.connection && this.connection.open) {
            this.connection.send({
                type: 'missile',
                position: startPosition,
                direction: direction,
                charge: this.currentWeapon.currentCharge,
                missileId: missile.userData.id
            });
        }

        // Send sound event to other player
        if (this.connection && this.connection.open) {
            this.connection.send({
                type: 'playSound',
                soundType: 'missile',
                position: startPosition
            });
        }
    }

    createExplosion(position, isRemote = false) {
        // Create explosion effect
        const explosionGeometry = new THREE.SphereGeometry(0.5);
        const explosionMaterial = new THREE.MeshBasicMaterial({
            color: 0xff4400,
            transparent: true,
            opacity: 0.8
        });
        const explosion = new THREE.Mesh(explosionGeometry, explosionMaterial);
        explosion.position.copy(position);
        this.scene.add(explosion);

        // Play explosion sound only for local explosions
        if (!isRemote) {
            const explosionSound = new Audio(this.missileEffects.explosionSound.src);
            explosionSound.volume = 0.5;
            explosionSound.play();
            // Clean up sound when finished
            explosionSound.onended = () => explosionSound.remove();
        }

        // Send sound event to other player
        if (this.connection && this.connection.open) {
            this.connection.send({
                type: 'playSound',
                soundType: 'explosion',
                position: position
            });
        }

        // Animate explosion
        let scale = 1;
        const expandExplosion = () => {
            scale += 0.2;
            explosion.scale.set(scale, scale, scale);
            explosionMaterial.opacity -= 0.05;

            if (explosionMaterial.opacity > 0) {
                requestAnimationFrame(expandExplosion);
            } else {
                this.scene.remove(explosion);
            }
        };
        expandExplosion();
    }

    updateUI() {
        // Update health bar
        document.getElementById('healthFill').style.width = `${this.health}%`;
        
        // Update score display
        document.getElementById('score').textContent = `${this.kills - this.suicides}`;
    }

    handleDamage(damage, source) {
        if (!this.isAlive) return;
        
        this.health = Math.max(0, this.health - damage);
        this.updateUI();
        
        const hitSound = new Audio(this.sounds.hit.src);
        hitSound.volume = 0.7;
        hitSound.play();
        hitSound.onended = () => hitSound.remove();
        
        // Send sound event to other player
        if (this.connection && this.connection.open) {
            this.connection.send({
                type: 'playSound',
                soundType: 'hit',
                position: this.localPlayer.position
            });
        }
        
        if (this.health <= 0) {
            this.deaths++;
            // Check if it was a suicide
            if (source === this.peer.id) {
                this.suicides++;
                this.score--;
                this.addKillFeed('You', 'Yourself');
            }
            this.die();
            
            // Check if game should end
            if (this.kills - this.suicides >= this.gameEndScore) {
                this.handleGameEnd('You', 'Opponent');
                this.connection.send({
                    type: 'gameEnd',
                    winner: 'Opponent',
                    loser: 'You'
                });
            }
        }
    }

    die() {
        this.isAlive = false;
        
        // Play death sound
        const deathSound = new Audio(this.sounds.death.src);
        deathSound.volume = 0.7;
        deathSound.play();
        deathSound.onended = () => deathSound.remove();
        
        // Play death animation
        const startRotation = {
            x: this.localPlayer.rotation.x,
            y: this.localPlayer.rotation.y,
            z: this.localPlayer.rotation.z
        };
        const startPosition = this.localPlayer.position.clone();
        let progress = 0;
        
        // Create death effect
        const deathEffect = () => {
            progress += 0.02; // Slower animation
            
            if (progress <= 1) {
                // Rotate and fall animation
                this.localPlayer.rotation.z = startRotation.z + (Math.PI * 0.5) * progress;
                this.localPlayer.rotation.x = startRotation.x + (Math.PI * 0.2) * Math.sin(progress * Math.PI);
                
                // Add a slight bounce effect
                const fallDistance = 0.5; // Distance to fall
                const bounce = Math.abs(Math.sin(progress * Math.PI * 2)) * 0.1;
                this.localPlayer.position.y = Math.max(
                    0.4, // Minimum height
                    startPosition.y - (fallDistance * progress) + bounce
                );
                
                // Add a slight sideways tilt
                const tiltAmount = 0.2;
                this.localPlayer.position.x = startPosition.x + Math.sin(progress * Math.PI) * tiltAmount;
                
                requestAnimationFrame(deathEffect);
            } else {
                // Ensure final position is correct
                this.localPlayer.position.y = 0.4;
                this.localPlayer.rotation.z = startRotation.z + Math.PI * 0.5;
                
                // Show death overlay
                const deathOverlay = document.createElement('div');
                deathOverlay.id = 'deathOverlay';
                deathOverlay.style.cssText = `
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    color: #ff0000;
                    font-size: 48px;
                    font-family: 'Segoe UI', Arial, sans-serif;
                    text-align: center;
                    text-shadow: 0 0 10px rgba(255, 0, 0, 0.5);
                    z-index: 1000;
                    opacity: 0;
                    transition: opacity 0.3s ease-in-out;
                `;
                deathOverlay.innerHTML = `
                    <div style="font-size: 64px; margin-bottom: 10px;">XXX---XXX</div>
                    <div>Defeated!</div>
                    <div style="font-size: 24px; margin-top: 10px;">Respawning in 3...</div>
                `;
                document.body.appendChild(deathOverlay);
                
                // Fade in the overlay
                setTimeout(() => {
                    deathOverlay.style.opacity = '1';
                }, 0);
                
                // Update countdown
                let count = 2;
                const countdownInterval = setInterval(() => {
                    const countdownElement = deathOverlay.querySelector('div:last-child');
                    countdownElement.textContent = `Respawning in ${count}...`;
                    count--;
                    
                    if (count < 0) {
                        clearInterval(countdownInterval);
                        // Fade out overlay
                        deathOverlay.style.opacity = '0';
                        setTimeout(() => {
                            document.body.removeChild(deathOverlay);
                            this.respawn();
                        }, 300);
                    }
                }, 1000);
            }
        };
        
        // Start death animation
        deathEffect();
    }

    respawn() {
        // Reset health and state
        this.health = 100;
        this.isAlive = true;
        
        // Reset position and rotation
        const isHost = this.peer.id < Object.keys(this.players)[0];
        this.localPlayer.position.copy(isHost ? this.spawnPoints[0] : this.spawnPoints[1]);
        this.localPlayer.rotation.set(0, isHost ? Math.PI / 4 : -3 * Math.PI / 4, 0);
        
        // Reset camera
        this.cameraRotation.x = -0.3;
        this.cameraRotation.y = this.localPlayer.rotation.y;
        this.updateCamera();
        
        // Remove death overlay
        const deathOverlay = document.getElementById('deathOverlay');
        if (deathOverlay) {
            deathOverlay.remove();
        }
        
        // Update UI
        this.updateUI();
        
        // Notify other players
        if (this.connection && this.connection.open) {
            this.connection.send({
                type: 'respawn',
                position: this.localPlayer.position.clone(),
                rotation: this.localPlayer.rotation.clone()
            });
        }
    }

    spawnHealthPack() {
        const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const material = new THREE.MeshPhongMaterial({ 
            map: this.textures.healthPack,
            shininess: 30
        });
        const healthPack = new THREE.Mesh(geometry, material);
        
        // Random position within the arena
        healthPack.position.x = (Math.random() - 0.5) * 40;
        healthPack.position.z = (Math.random() - 0.5) * 40;
        healthPack.position.y = 0.25; // Slightly above ground
        
        healthPack.castShadow = true;
        healthPack.receiveShadow = true;
        
        // Add glow effect
        const glowGeometry = new THREE.SphereGeometry(0.3);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.3
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        healthPack.add(glow);
        
        this.healthPacks.push(healthPack);
        this.scene.add(healthPack);
        
        // Rotate the health pack
        healthPack.rotation.y = Math.random() * Math.PI * 2;
    }

    pickupHealth(packIndex) {
        const pack = this.healthPacks[packIndex];
        
        // Remove the pack
        this.scene.remove(pack);
        this.healthPacks.splice(packIndex, 1);
        
        // Add health
        this.health = Math.min(100, this.health + this.healthPackValue);
        this.updateUI();
        
        // Play sound
        this.sounds.pickup.currentTime = 0;
        this.sounds.pickup.play();
        
        // Notify other players
        if (this.connection) {
            this.connection.send({
                type: 'healthPickup',
                packIndex: packIndex
            });
        }
    }

    addKillFeed(killer, victim) {
        const killFeed = document.getElementById('killFeed');
        const killMessage = document.createElement('div');
        killMessage.style.cssText = `
            margin-bottom: 5px;
            font-size: 16px;
            opacity: 1;
            transition: opacity 0.5s ease-out;
        `;
        killMessage.textContent = `${killer} eliminated ${victim}`;
        
        killFeed.appendChild(killMessage);
        
        // Fade out and remove after 4 seconds
        setTimeout(() => {
            killMessage.style.opacity = '0';
            setTimeout(() => killMessage.remove(), 500);
        }, 4000);
    }

    setupLighting() {
        // Ambient light for general illumination
        this.ambientLight = new THREE.AmbientLight(0x404040);
        this.scene.add(this.ambientLight);
        
        // Main directional light (sun-like)
        this.directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        this.directionalLight.position.set(10, 20, 10);
        this.directionalLight.castShadow = true;
        
        // Configure shadow properties
        this.directionalLight.shadow.mapSize.width = 2048;
        this.directionalLight.shadow.mapSize.height = 2048;
        this.directionalLight.shadow.camera.near = 0.5;
        this.directionalLight.shadow.camera.far = 50;
        this.directionalLight.shadow.camera.left = -25;
        this.directionalLight.shadow.camera.right = 25;
        this.directionalLight.shadow.camera.top = 25;
        this.directionalLight.shadow.camera.bottom = -25;
        
        this.scene.add(this.directionalLight);
    }

    async loadWeaponModels() {
        // No need to load external models for now
        return Promise.resolve();
    }

    showWeaponModel(weaponName) {
        // Remove current weapon model
        if (this.weaponContainer) {
            this.weaponContainer.clear();
        }
        
        // Create a simple placeholder model
        const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.5);
        const material = new THREE.MeshPhongMaterial({ color: 0x444444 });
        const model = new THREE.Mesh(geometry, material);
        
        // Position weapon
        model.position.set(0.3, -0.2, -0.5);
        
        if (this.weaponContainer) {
            this.weaponContainer.add(model);
        }
    }

    updateMovement() {
        if (!this.isAlive || !this.gameStarted) return;

        // Get movement direction based on camera rotation
        const moveDirection = new THREE.Vector3();
        
        // Fix inverted controls - changed signs
        if (this.moveState.forward) moveDirection.z += 1;  // Changed from -= to +=
        if (this.moveState.backward) moveDirection.z -= 1; // Changed from += to -=
        if (this.moveState.left) moveDirection.x += 1;     // Changed from -= to +=
        if (this.moveState.right) moveDirection.x -= 1;    // Changed from += to -=
        
        moveDirection.normalize();
        
        // Rotate movement direction based on camera
        moveDirection.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.cameraRotation.y);
        
        // Apply movement speed
        const currentSpeed = this.moveState.sprinting ? this.sprintSpeed : this.moveSpeed;
        
        // Apply movement with momentum
        if (moveDirection.length() > 0) {
            // Reduced air momentum multiplier
            const speedMultiplier = this.isGrounded ? 1 : 1.1; // Reduced from 1.2
            this.velocity.x += moveDirection.x * currentSpeed * speedMultiplier;
            this.velocity.z += moveDirection.z * currentSpeed * speedMultiplier;
        }
        
        // Apply gravity
        if (!this.isGrounded) {
            this.velocity.y -= this.gravity;
        }
        
        // Apply friction
        const currentFriction = this.isGrounded ? this.friction : this.airFriction;
        this.velocity.x *= currentFriction;
        this.velocity.z *= currentFriction;
        
        // Update position
        this.localPlayer.position.add(this.velocity);
        
        // Ground check and landing
        if (this.localPlayer.position.y <= 0.4) {
            this.localPlayer.position.y = 0.4;
            this.velocity.y = 0;
            this.isGrounded = true;
        }
        
        // Keep player within boundaries
        const boundaryLimit = this.boundaryLimit;
        this.localPlayer.position.x = Math.max(-boundaryLimit, Math.min(boundaryLimit, this.localPlayer.position.x));
        this.localPlayer.position.z = Math.max(-boundaryLimit, Math.min(boundaryLimit, this.localPlayer.position.z));
        
        // Send position update to peer
        if (this.connection && this.connection.open) {
            this.connection.send({
                type: 'position',
                position: this.localPlayer.position.clone(),
                rotation: this.localPlayer.rotation.clone()
            });
        }
    }

    createCrosshair() {
        const crosshairHTML = `
            <div id="crosshair" style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 20px;
                height: 20px;
                pointer-events: none;
            ">
                <div style="
                    position: absolute;
                    left: 9px;
                    top: 0;
                    width: 2px;
                    height: 8px;
                    background: white;
                "></div>
                <div style="
                    position: absolute;
                    left: 9px;
                    bottom: 0;
                    width: 2px;
                    height: 8px;
                    background: white;
                "></div>
                <div style="
                    position: absolute;
                    top: 9px;
                    left: 0;
                    width: 8px;
                    height: 2px;
                    background: white;
                "></div>
                <div style="
                    position: absolute;
                    top: 9px;
                    right: 0;
                    width: 8px;
                    height: 2px;
                    background: white;
                "></div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', crosshairHTML);
    }

    createCatModel() {
        // Remove any existing player model
        if (this.localPlayer) {
            this.scene.remove(this.localPlayer);
        }

        const cat = new THREE.Group();
        cat.position.y = 0.4;

        // Cat body - main body box
        const bodyGeometry = new THREE.BoxGeometry(0.4, 0.3, 0.7);
        const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0xaaaaaa }); // Light gray
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.15;
        cat.add(body);

        // Cat head
        const headGeometry = new THREE.BoxGeometry(0.35, 0.35, 0.35);
        const headMaterial = new THREE.MeshPhongMaterial({ color: 0xaaaaaa });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.set(0, 0.3, 0.4);
        cat.add(head);

        // Cat face details
        const noseGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
        const noseMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
        const nose = new THREE.Mesh(noseGeometry, noseMaterial);
        nose.position.set(0, 0.25, 0.6);
        cat.add(nose);

        // Eyes
        const eyeGeometry = new THREE.SphereGeometry(0.05);
        const eyeMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
        
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(0.1, 0.35, 0.55);
        cat.add(leftEye);
        
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(-0.1, 0.35, 0.55);
        cat.add(rightEye);

        // Cat ears - made more pointed
        const earGeometry = new THREE.ConeGeometry(0.08, 0.2, 4);
        const earMaterial = new THREE.MeshPhongMaterial({ color: 0x808080 });
        
        const leftEar = new THREE.Mesh(earGeometry, earMaterial);
        leftEar.position.set(0.15, 0.6, 0.35);
        leftEar.rotation.z = -0.3;
        cat.add(leftEar);

        const rightEar = new THREE.Mesh(earGeometry, earMaterial);
        rightEar.position.set(-0.15, 0.6, 0.35);
        rightEar.rotation.z = 0.3;
        cat.add(rightEar);

        // Cat legs - made slightly thinner
        const legGeometry = new THREE.BoxGeometry(0.08, 0.2, 0.08);
        const legMaterial = new THREE.MeshPhongMaterial({ color: 0x808080 });

        // Front legs
        const frontLeftLeg = new THREE.Mesh(legGeometry, legMaterial);
        frontLeftLeg.position.set(0.15, -0.1, 0.25);
        frontLeftLeg.name = 'frontLeftLeg';
        cat.add(frontLeftLeg);

        const frontRightLeg = new THREE.Mesh(legGeometry, legMaterial);
        frontRightLeg.position.set(-0.15, -0.1, 0.25);
        frontRightLeg.name = 'frontRightLeg';
        cat.add(frontRightLeg);

        // Back legs
        const backLeftLeg = new THREE.Mesh(legGeometry, legMaterial);
        backLeftLeg.position.set(0.15, -0.1, -0.25);
        backLeftLeg.name = 'backLeftLeg';
        cat.add(backLeftLeg);

        const backRightLeg = new THREE.Mesh(legGeometry, legMaterial);
        backRightLeg.position.set(-0.15, -0.1, -0.25);
        backRightLeg.name = 'backRightLeg';
        cat.add(backRightLeg);

        // Cat tail - made longer and thinner
        const tailGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.5);
        const tailMaterial = new THREE.MeshPhongMaterial({ color: 0x808080 });
        const tail = new THREE.Mesh(tailGeometry, tailMaterial);
        tail.position.set(0, 0.2, -0.4);
        tail.rotation.x = -0.3;
        cat.add(tail);

        // Ensure all parts cast and receive shadows
        cat.traverse((object) => {
            if (object instanceof THREE.Mesh) {
                object.castShadow = true;
                object.receiveShadow = true;
                object.material.needsUpdate = true;
            }
        });

        return cat;
    }

    updateCamera() {
        // Calculate camera position based on player rotation
        const offset = new THREE.Vector3(
            -Math.sin(this.cameraRotation.y) * this.cameraOffset.z,
            this.cameraOffset.y,
            -Math.cos(this.cameraRotation.y) * this.cameraOffset.z
        );

        // Position camera behind player
        this.camera.position.x = this.localPlayer.position.x + offset.x;
        this.camera.position.y = this.localPlayer.position.y + offset.y;
        this.camera.position.z = this.localPlayer.position.z + offset.z;

        // Calculate target point for camera to look at
        const targetPoint = new THREE.Vector3(
            this.localPlayer.position.x + Math.sin(this.cameraRotation.y) * 10,
            this.localPlayer.position.y + 1 - Math.sin(this.cameraRotation.x) * 10,
            this.localPlayer.position.z + Math.cos(this.cameraRotation.y) * 10
        );

        this.camera.lookAt(targetPoint);

        // Update player model rotation to match camera horizontal rotation only
        this.localPlayer.rotation.y = this.cameraRotation.y;
    }

    updateMissileEffects() {
        const timeSinceLastShot = Date.now() - this.lastShot;
        const isOnCooldown = timeSinceLastShot < this.currentWeapon.cooldown;

        // Update charge indicator and sound
        if (this.currentWeapon.isCharging && !isOnCooldown) {
            this.missileEffects.chargeIndicator.style.display = 'block';
            this.missileEffects.chargeBar.style.width = `${this.currentWeapon.currentCharge * 100}%`;
            
            // Play charge sound if not already playing
            if (this.missileEffects.chargeSound.paused) {
                this.missileEffects.chargeSound.currentTime = 0;
                this.missileEffects.chargeSound.volume = 0.3; // Lower volume for charging
                this.missileEffects.chargeSound.play();
            }
        } else {
            this.missileEffects.chargeIndicator.style.display = 'none';
            // Stop charge sound
            this.missileEffects.chargeSound.pause();
            this.missileEffects.chargeSound.currentTime = 0;
        }

        // Update cooldown indicator
        if (isOnCooldown) {
            const cooldownProgress = (timeSinceLastShot / this.currentWeapon.cooldown) * 100;
            this.missileEffects.cooldownIndicator.style.display = 'block';
            this.missileEffects.cooldownBar.style.width = `${100 - cooldownProgress}%`;
            
            // Ensure charge sound is stopped during cooldown
            this.missileEffects.chargeSound.pause();
            this.missileEffects.chargeSound.currentTime = 0;
        } else {
            this.missileEffects.cooldownIndicator.style.display = 'none';
        }

        // Reset charge when on cooldown
        if (isOnCooldown) {
            this.currentWeapon.isCharging = false;
            this.currentWeapon.currentCharge = 0;
        }
    }

    startGameCountdown(opponentId) {
        // Determine spawn positions based on peer IDs
        const isHost = this.peer.id < opponentId;
        
        // Position players at opposite corners
        if (isHost) {
            this.localPlayer.position.copy(this.spawnPoints[0]);
            this.players[opponentId].mesh.position.copy(this.spawnPoints[1]);
            this.cameraRotation.y = Math.PI / 4;
        } else {
            this.localPlayer.position.copy(this.spawnPoints[1]);
            this.players[opponentId].mesh.position.copy(this.spawnPoints[0]);
            this.cameraRotation.y = -3 * Math.PI / 4;
        }

        // Ensure both players are in the scene
        if (!this.scene.children.includes(this.localPlayer)) {
            this.scene.add(this.localPlayer);
        }
        if (!this.scene.children.includes(this.players[opponentId].mesh)) {
            this.scene.add(this.players[opponentId].mesh);
        }

        // Set initial camera position and rotation
        this.updateCamera();

        // Send initial positions to ensure sync
        if (this.connection && this.connection.open) {
            this.connection.send({
                type: 'position',
                position: this.localPlayer.position.clone(),
                rotation: this.localPlayer.rotation.clone()
            });
        }

        // Disable movement during countdown
        this.gameStarted = false;
        
        // Show countdown overlay
        this.countdownOverlay.style.display = 'block';
        
        let count = 3;
        const countdownInterval = setInterval(() => {
            this.countdownOverlay.textContent = count;
            count--;
            
            if (count < 0) {
                clearInterval(countdownInterval);
                this.countdownOverlay.style.display = 'none';
                this.gameStarted = true;
            }
        }, 1000);

        // Show UI when game starts
        document.getElementById('gameStats').style.display = 'block';
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        if (this.isAlive) {
            this.updateMovement();
            this.updateCamera();
            
            // Update weapon charge
            if (this.currentWeapon.isCharging) {
                this.currentWeapon.currentCharge = Math.min(
                    1,
                    this.currentWeapon.currentCharge + this.currentWeapon.chargeRate
                );
            }
            
            this.updateMissileEffects();
            
            if (this.weaponMixer) {
                this.weaponMixer.update(0.016);
            }

            // Update missiles and their trails
            for (let i = this.bullets.length - 1; i >= 0; i--) {
                const missile = this.bullets[i];
                
                // Update missile position
                missile.direction.add(missile.gravity);
                missile.position.add(missile.direction);
                
                // Update sound volume based on distance
                if (missile.userData.launchSound) {
                    const distance = missile.position.distanceTo(this.localPlayer.position);
                    const maxDistance = 50; // Maximum distance at which sound can be heard
                    const minVolume = 0.1;
                    const maxVolume = 0.6;
                    
                    // Calculate volume based on distance (inverse relationship)
                    let volume = maxVolume * (1 - Math.min(distance / maxDistance, 1));
                    volume = Math.max(minVolume, volume); // Ensure minimum volume
                    
                    missile.userData.launchSound.volume = volume;
                }
                
                // Update trail positions
                missile.trailPositions.unshift(missile.position.clone());
                missile.trailPositions.pop();
                
                // Update trail particles
                const positions = new Float32Array(missile.trailPositions.length * 3);
                missile.trailPositions.forEach((pos, index) => {
                    positions[index * 3] = pos.x;
                    positions[index * 3 + 1] = pos.y;
                    positions[index * 3 + 2] = pos.z;
                });
                
                missile.trailParticles.geometry.setAttribute(
                    'position',
                    new THREE.BufferAttribute(positions, 3)
                );
                
                // Check ground collision
                if (missile.position.y <= 0) {
                    // Clean up launch sound
                    if (missile.userData.launchSound) {
                        missile.userData.launchSound.pause();
                        missile.userData.launchSound.remove();
                        delete missile.userData.launchSound;
                    }
                    
                    this.createExplosion(missile.position);
                    
                    // Check splash damage for all players including local player
                    const distance = missile.position.distanceTo(this.localPlayer.position);
                    if (distance <= this.currentWeapon.explosionRadius) {
                        this.health = Math.max(0, this.health - this.currentWeapon.damage.splash);
                        this.updateUI();
                    }
                    
                    // Check opponent splash damage
                    for (const peerId in this.players) {
                        const player = this.players[peerId];
                        if (player.isAlive) {
                            const distance = missile.position.distanceTo(player.mesh.position);
                            if (distance <= this.currentWeapon.explosionRadius) {
                                this.connection.send({
                                    type: 'damage',
                                    targetId: peerId,
                                    damage: this.currentWeapon.damage.splash,
                                    source: this.peer.id
                                });
                            }
                        }
                    }
                    
                    this.scene.remove(missile);
                    this.scene.remove(missile.trailParticles);
                    this.bullets.splice(i, 1);
                    continue;
                }
                
                // Check direct hits with players
                for (const peerId in this.players) {
                    const player = this.players[peerId];
                    if (player.isAlive && missile.position.distanceTo(player.mesh.position) < 0.5) {
                        // Clean up launch sound
                        if (missile.userData.launchSound) {
                            missile.userData.launchSound.pause();
                            missile.userData.launchSound.remove();
                            delete missile.userData.launchSound;
                        }
                        
                        this.createExplosion(missile.position);
                        
                        // Update score and kill feed
                        this.kills++;
                        this.addKillFeed('You', 'Opponent');
                        this.updateUI();
                        
                        // Show hit marker with kill effect
                        this.showHitMarker(true);
                        
                        this.connection.send({
                            type: 'damage',
                            targetId: peerId,
                            damage: this.currentWeapon.damage.direct,
                            source: this.peer.id
                        });
                        
                        this.scene.remove(missile);
                        this.scene.remove(missile.trailParticles);
                        this.bullets.splice(i, 1);
                        break;
                    }
                }
            }
        }

        // Update opponent animations if they exist
        for (const peerId in this.players) {
            const player = this.players[peerId];
            if (player && player.mesh) {
                // Add any opponent animations here if needed
            }
        }

        this.renderer.render(this.scene, this.camera);
    }

    handleGameEnd(winner, loser) {
        this.gameOver = true;
        this.gameStarted = false;
        
        // Clean up any active missile sounds
        this.bullets.forEach(missile => {
            if (missile.userData.launchSound) {
                missile.userData.launchSound.pause();
                missile.userData.launchSound.remove();
                delete missile.userData.launchSound;
            }
        });
        
        // Create game end overlay
        const gameEndOverlay = document.createElement('div');
        gameEndOverlay.id = 'gameEndOverlay';
        gameEndOverlay.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            font-family: 'Segoe UI', Arial, sans-serif;
            z-index: 1000;
        `;
        
        gameEndOverlay.innerHTML = `
            <h2 style="color: ${winner === 'You' ? '#00ff00' : '#ff0000'}; margin: 0 0 20px 0;">
                ${winner} Won!
            </h2>
            <p style="margin: 0 0 20px 0;">Final Score: ${this.kills - this.suicides}</p>
            <p>Game will restart in 5 seconds...</p>
        `;
        
        document.body.appendChild(gameEndOverlay);
        
        // Restart game after 5 seconds
        setTimeout(() => {
            document.body.removeChild(gameEndOverlay);
            this.resetGame();
        }, 5000);
    }

    resetGame() {
        // Reset scores
        this.score = 0;
        this.kills = 0;
        this.deaths = 0;
        this.suicides = 0;
        this.gameOver = false;
        
        // Reset health
        this.health = 100;
        this.isAlive = true;
        
        // Reset positions
        const isHost = this.peer.id < Object.keys(this.players)[0];
        this.localPlayer.position.copy(isHost ? this.spawnPoints[0] : this.spawnPoints[1]);
        this.localPlayer.rotation.set(0, isHost ? Math.PI / 4 : -3 * Math.PI / 4, 0);
        
        // Update UI
        this.updateUI();
        
        // Start new game countdown
        if (this.connection && this.connection.open) {
            this.connection.send({
                type: 'restartGame'
            });
        }
        
        this.startGameCountdown(Object.keys(this.players)[0]);
    }

    showHitMarker(isKill = false) {
        // Clear any existing timeout
        if (this.hitMarkerTimeout) {
            clearTimeout(this.hitMarkerTimeout);
        }
        
        // Play hit marker sound with higher volume
        const hitSound = new Audio(this.hitMarkerSound.src);
        hitSound.volume = 0.6; // Increased from 0.3
        hitSound.play();
        hitSound.onended = () => hitSound.remove();
        
        // Show hit marker
        this.hitMarker.style.transform = 'translate(-50%, -50%) scale(1.2)';
        if (isKill) {
            this.hitMarker.style.filter = 'drop-shadow(0 0 5px red)';
        } else {
            this.hitMarker.style.filter = 'none';
        }
        
        // Hide hit marker after animation
        this.hitMarkerTimeout = setTimeout(() => {
            this.hitMarker.style.transform = 'translate(-50%, -50%) scale(0)';
        }, 100);
    }

    playRemoteSound(soundType, position) {
        if (!position) return;
        
        const soundPosition = new THREE.Vector3(position.x, position.y, position.z);
        const distance = soundPosition.distanceTo(this.localPlayer.position);
        const maxDistance = 50;
        const minVolume = 0.2; // Increased minimum volume
        const maxVolume = 0.8; // Increased maximum volume
        
        // Calculate volume based on distance
        let volume = maxVolume * (1 - Math.min(distance / maxDistance, 1));
        volume = Math.max(minVolume, volume);
        
        let sound;
        switch(soundType) {
            case 'missile':
                sound = new Audio(this.missileEffects.launchSound.src);
                sound.volume = 0.8; // Increased volume for new missile sound
                break;
            case 'explosion':
                sound = new Audio(this.missileEffects.explosionSound.src);
                break;
            case 'hit':
                sound = new Audio(this.sounds.hit.src);
                sound.volume = 0.6;
                return sound.play();
            case 'death':
                sound = new Audio(this.sounds.death.src);
                sound.volume = 0.7;
                return sound.play();
        }
        
        if (sound) {
            sound.volume = volume;
            sound.play();
            sound.onended = () => sound.remove();
        }
    }
}

// Start the game when the page loads
window.onload = () => {
    new Game();
}; 