/**
 * Main entry point for the 3D Civilization Revolution Remake
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

class GameEngine {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = socketIo(this.server);

    // Set up static file serving
    this.app.use(express.static(path.join(__dirname, '../public')));

    // Serve the main HTML file
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, '../public/index.html'));
    });

    // Initialize Three.js scene
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;

    // Game state
    this.gameState = {
      players: [],
      currentTurn: 0,
      map: null,
      entities: [],
      isRunning: false
    };

    // Initialize game systems
    this.systems = {};
    this.components = {};

    this.setupSocketHandlers();
  }

  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log('A player connected:', socket.id);

      // Send initial game state to the new player
      socket.emit('game_state', this.gameState);

      socket.on('disconnect', () => {
        console.log('A player disconnected:', socket.id);
      });

      socket.on('player_action', (action) => {
        // Process player action and broadcast to other players
        this.handlePlayerAction(action);
        socket.broadcast.emit('player_action', action);
      });
    });
  }

  handlePlayerAction(action) {
    // Handle different types of player actions
    switch(action.type) {
      case 'move_unit':
        this.moveUnit(action.payload);
        break;
      case 'attack':
        this.performCombat(action.payload);
        break;
      case 'build':
        this.buildStructure(action.payload);
        break;
      case 'end_turn':
        this.endTurn();
        break;
      case 'research':
        this.researchTech(action.payload);
        break;
      case 'trade':
        this.tradeResources(action.payload);
        break;
      default:
        console.log('Unknown action type:', action.type);
    }
  }

  moveUnit(payload) {
    // Implementation for moving units
    console.log('Moving unit:', payload);
  }

  performCombat(payload) {
    // Implementation for combat
    console.log('Combat action:', payload);
  }

  buildStructure(payload) {
    // Implementation for building structures
    console.log('Build action:', payload);
  }

  endTurn() {
    // Implementation for ending a turn
    this.gameState.currentTurn = (this.gameState.currentTurn + 1) % this.gameState.players.length;
    this.io.emit('turn_changed', this.gameState.currentTurn);
    console.log('Turn ended, new turn:', this.gameState.currentTurn);
  }

  researchTech(payload) {
    // Implementation for researching technology
    console.log('Research action:', payload);
  }

  tradeResources(payload) {
    // Implementation for trading resources
    console.log('Trade action:', payload);
  }

  initScene() {
    // Initialize Three.js scene
    const THREE = require('three');

    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87CEEB); // Sky blue background

    // Create camera
    this.camera = new THREE.PerspectiveCamera(
      75, 
      window.innerWidth / window.innerHeight, 
      0.1, 
      1000
    );
    this.camera.position.set(0, 20, 30);
    this.camera.lookAt(0, 0, 0);

    // Create renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    
    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 1.5);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 20, 15);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);

    // Add controls
    const OrbitControls = require('three').OrbitControls;
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;

    // Create the game board
    this.createBoard();

    // Add renderer to document
    document.body.appendChild(this.renderer.domElement);

    // Handle window resize
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Start animation loop
    this.animate();
  }

  createBoard() {
    // Create hexagonal grid for the game board
    const geometry = new THREE.PlaneGeometry(50, 50, 20, 20);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0x2E8B57, // Green for grasslands
      wireframe: false,
      side: THREE.DoubleSide
    });
    
    const plane = new THREE.Mesh(geometry, material);
    plane.rotation.x = -Math.PI / 2; // Rotate to lay flat
    plane.receiveShadow = true;
    this.scene.add(plane);

    // Add some terrain features
    this.createTerrainFeatures();
  }

  createTerrainFeatures() {
    const THREE = require('three');
    
    // Add mountains
    for (let i = 0; i < 5; i++) {
      const geometry = new THREE.ConeGeometry(1, 3, 8);
      const material = new THREE.MeshStandardMaterial({ color: 0x808080 });
      const mountain = new THREE.Mesh(geometry, material);
      
      mountain.position.set(
        (Math.random() - 0.5) * 40,
        1.5,
        (Math.random() - 0.5) * 40
      );
      
      mountain.castShadow = true;
      mountain.receiveShadow = true;
      this.scene.add(mountain);
    }

    // Add forests (trees)
    for (let i = 0; i < 20; i++) {
      // Tree trunk
      const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.3, 2, 8);
      const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
      const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
      
      trunk.position.set(
        (Math.random() - 0.5) * 40,
        1,
        (Math.random() - 0.5) * 40
      );
      
      trunk.castShadow = true;
      this.scene.add(trunk);
      
      // Tree top
      const topGeometry = new THREE.SphereGeometry(1.2, 8, 8);
      const topMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
      const top = new THREE.Mesh(topGeometry, topMaterial);
      
      top.position.set(trunk.position.x, 2.5, trunk.position.z);
      top.castShadow = true;
      this.scene.add(top);
    }

    // Add water bodies
    for (let i = 0; i < 3; i++) {
      const geometry = new THREE.CircleGeometry(3, 16);
      const material = new THREE.MeshStandardMaterial({ 
        color: 0x1E90FF,
        transparent: true,
        opacity: 0.8
      });
      
      const water = new THREE.Mesh(geometry, material);
      water.rotation.x = -Math.PI / 2; // Lay flat
      
      water.position.set(
        (Math.random() - 0.5) * 40,
        0.1,
        (Math.random() - 0.5) * 40
      );
      
      water.receiveShadow = true;
      this.scene.add(water);
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    // Update controls
    if (this.controls) {
      this.controls.update();
    }

    // Render the scene
    this.renderer.render(this.scene, this.camera);
  }

  start() {
    const port = process.env.PORT || 3000;
    
    this.server.listen(port, () => {
      console.log(`Server running on port ${port}`);
      console.log(`Visit http://localhost:${port} to play`);
    });

    // Initialize the Three.js scene after the DOM is ready
    if (typeof document !== 'undefined' && document.readyState !== 'loading') {
      this.initScene();
    } else if (typeof document !== 'undefined') {
      document.addEventListener('DOMContentLoaded', () => {
        this.initScene();
      });
    }
  }
}

// Export the game engine
module.exports = GameEngine;

// If running directly, start the game
if (require.main === module) {
  const game = new GameEngine();
  game.start();
}