/**
 * Render System for 3D Civilization Revolution
 * Handles rendering of game entities using Three.js
 */

class RenderSystem {
  constructor(gameEngine) {
    this.game = gameEngine;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    
    // Game objects
    this.tiles = [];
    this.units = [];
    this.cities = [];
    
    // Materials and geometries
    this.materials = {};
    this.geometries = {};
    
    // Initialize Three.js components
    this.initThreeJS();
  }

  initThreeJS() {
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
    const OrbitControls = require('three-orbitcontrols')(THREE);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    
    // Create materials
    this.createMaterials();
    
    // Add renderer to document
    document.body.appendChild(this.renderer.domElement);
    
    // Handle window resize
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  createMaterials() {
    const THREE = require('three');
    
    // Terrain materials
    this.materials = {
      grass: new THREE.MeshStandardMaterial({ 
        color: 0x2E8B57, 
        roughness: 0.8,
        metalness: 0.2
      }),
      plains: new THREE.MeshStandardMaterial({ 
        color: 0xDAA520, 
        roughness: 0.8,
        metalness: 0.2
      }),
      hills: new THREE.MeshStandardMaterial({ 
        color: 0x8FBC8F, 
        roughness: 0.9,
        metalness: 0.1
      }),
      forest: new THREE.MeshStandardMaterial({ 
        color: 0x228B22, 
        roughness: 0.9,
        metalness: 0.1
      }),
      jungle: new THREE.MeshStandardMaterial({ 
        color: 0x1E5631, 
        roughness: 0.95,
        metalness: 0.05
      }),
      desert: new THREE.MeshStandardMaterial({ 
        color: 0xF4A460, 
        roughness: 0.9,
        metalness: 0.1
      }),
      tundra: new THREE.MeshStandardMaterial({ 
        color: 0xD8BFD8, 
        roughness: 0.85,
        metalness: 0.15
      }),
      snow: new THREE.MeshStandardMaterial({ 
        color: 0xF5F5F5, 
        roughness: 0.95,
        metalness: 0.05
      }),
      mountain: new THREE.MeshStandardMaterial({ 
        color: 0x808080, 
        roughness: 0.9,
        metalness: 0.2
      }),
      coast: new THREE.MeshStandardMaterial({ 
        color: 0x4682B4, 
        roughness: 0.7,
        metalness: 0.3
      }),
      ocean: new THREE.MeshStandardMaterial({ 
        color: 0x1E90FF, 
        roughness: 0.2,
        metalness: 0.8,
        transparent: true,
        opacity: 0.8
      }),
      river: new THREE.MeshStandardMaterial({ 
        color: 0x00BFFF, 
        roughness: 0.3,
        metalness: 0.7,
        transparent: true,
        opacity: 0.7
      })
    };
    
    // Unit materials
    this.materials.unitMaterials = {
      warrior: new THREE.MeshStandardMaterial({ color: 0xFF0000 }), // Red
      archer: new THREE.MeshStandardMaterial({ color: 0x0000FF }),  // Blue
      settler: new THREE.MeshStandardMaterial({ color: 0x00FF00 }), // Green
      worker: new THREE.MeshStandardMaterial({ color: 0xFFFF00 }),  // Yellow
      scout: new THREE.MeshStandardMaterial({ color: 0xFFA500 }),   // Orange
      spearman: new THREE.MeshStandardMaterial({ color: 0x800080 }), // Purple
      cavalry: new THREE.MeshStandardMaterial({ color: 0xA52A2A }), // Brown
      catapult: new THREE.MeshStandardMaterial({ color: 0x808080 })  // Gray
    };
    
    // City materials
    this.materials.cityMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xFFFFFF,
      emissive: 0x333333
    });
  }

  // Create a hexagonal tile mesh
  createHexTileMesh(hexTile) {
    const THREE = require('three');
    
    // Create hexagon shape
    const angleStep = Math.PI / 3; // 60 degrees
    const vertices = [];
    const radius = 0.866; // Approximate radius for regular hexagon
    
    for (let i = 0; i < 6; i++) {
      const angle = i * angleStep;
      vertices.push(
        Math.cos(angle) * radius,
        0,
        Math.sin(angle) * radius
      );
    }
    
    // Create geometry
    const geometry = new THREE.BufferGeometry();
    const positionBuffer = new Float32Array(vertices);
    
    // Triangulate hexagon (fan triangulation)
    const indices = [
      0, 1, 2,
      0, 2, 3,
      0, 3, 4,
      0, 4, 5
    ];
    
    geometry.setIndex(indices);
    geometry.setAttribute('position', new THREE.BufferAttribute(positionBuffer, 3));
    
    // Compute normals
    geometry.computeVertexNormals();
    
    // Create mesh
    const material = this.materials[hexTile.type] || this.materials.grass;
    const mesh = new THREE.Mesh(geometry, material);
    
    // Position the tile
    mesh.position.set(hexTile.position.x, 0, hexTile.position.z);
    mesh.receiveShadow = true;
    
    // Store reference to hexTile
    mesh.userData.hexTile = hexTile;
    hexTile.mesh = mesh;
    
    return mesh;
  }

  // Create a unit mesh
  createUnitMesh(unit) {
    const THREE = require('three');
    
    let geometry;
    
    // Create different shapes for different unit types
    switch(unit.type) {
      case 'warrior':
        geometry = new THREE.ConeGeometry(0.3, 0.8, 4);
        break;
      case 'archer':
        geometry = new THREE.BoxGeometry(0.4, 0.4, 0.6);
        break;
      case 'settler':
        geometry = new THREE.CylinderGeometry(0.3, 0.3, 0.6, 8);
        break;
      case 'worker':
        geometry = new THREE.SphereGeometry(0.3, 8, 8);
        break;
      case 'scout':
        geometry = new THREE.TetrahedronGeometry(0.35);
        break;
      case 'spearman':
        geometry = new THREE.ConeGeometry(0.25, 0.7, 3);
        break;
      case 'cavalry':
        geometry = new THREE.ConeGeometry(0.4, 0.5, 6);
        break;
      case 'catapult':
        geometry = new THREE.BoxGeometry(0.5, 0.4, 0.5);
        break;
      default:
        geometry = new THREE.SphereGeometry(0.3, 8, 8);
    }
    
    const material = this.materials.unitMaterials[unit.type] || 
                     this.materials.unitMaterials.warrior;
    
    const mesh = new THREE.Mesh(geometry, material);
    
    // Position the unit above the tile
    mesh.position.set(unit.position.x, 0.5, unit.position.z);
    mesh.castShadow = true;
    
    // Store reference to unit
    mesh.userData.unit = unit;
    unit.mesh = mesh;
    
    return mesh;
  }

  // Create a city mesh
  createCityMesh(city) {
    const THREE = require('three');
    
    // Create a city as a small building with dome
    const group = new THREE.Group();
    
    // Base building
    const baseGeometry = new THREE.BoxGeometry(1.2, 0.8, 1.2);
    const baseMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xDDDDDD,
      roughness: 0.7
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = 0.4;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);
    
    // Dome
    const domeGeometry = new THREE.SphereGeometry(0.5, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const domeMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xFFFFFF,
      emissive: 0x222222
    });
    const dome = new THREE.Mesh(domeGeometry, domeMaterial);
    dome.position.y = 0.9;
    dome.castShadow = true;
    group.add(dome);
    
    // Position the city
    group.position.set(city.position.x, 0, city.position.z);
    
    // Store reference to city
    group.userData.city = city;
    city.mesh = group;
    
    return group;
  }

  // Render the entire game world
  render() {
    // Clear existing objects from scene
    this.clearScene();
    
    // Render tiles
    for (const hexTile of this.game.gameState.map.tiles) {
      const tileMesh = this.createHexTileMesh(hexTile);
      this.scene.add(tileMesh);
      this.tiles.push(tileMesh);
    }
    
    // Render units
    for (const unit of this.game.gameState.entities.units) {
      const unitMesh = this.createUnitMesh(unit);
      this.scene.add(unitMesh);
      this.units.push(unitMesh);
    }
    
    // Render cities
    for (const city of this.game.gameState.entities.cities) {
      const cityMesh = this.createCityMesh(city);
      this.scene.add(cityMesh);
      this.cities.push(cityMesh);
    }
  }

  // Clear all rendered objects
  clearScene() {
    // Remove all tiles
    for (const tile of this.tiles) {
      this.scene.remove(tile);
    }
    this.tiles = [];
    
    // Remove all units
    for (const unit of this.units) {
      this.scene.remove(unit);
    }
    this.units = [];
    
    // Remove all cities
    for (const city of this.cities) {
      this.scene.remove(city);
    }
    this.cities = [];
  }

  // Update the scene (called each frame)
  update() {
    // Update controls
    if (this.controls) {
      this.controls.update();
    }
    
    // Animate anything that needs animating
    this.animateObjects();
    
    // Render the scene
    this.renderer.render(this.scene, this.camera);
  }

  // Animate objects in the scene
  animateObjects() {
    // Animate units slightly to indicate they're active
    const time = Date.now() * 0.001;
    
    for (const unitMesh of this.units) {
      if (unitMesh.userData.unit) {
        const unit = unitMesh.userData.unit;
        
        // Slight vertical bobbing animation
        unitMesh.position.y = 0.5 + Math.sin(time + unit.position.x + unit.position.z) * 0.05;
      }
    }
    
    // Animate cities to show they're active
    for (const cityMesh of this.cities) {
      if (cityMesh.userData.city) {
        const city = cityMesh.userData.city;
        
        // Gentle pulsing of dome
        const scale = 1 + Math.sin(time * 2 + city.position.x + city.position.z) * 0.02;
        cityMesh.scale.set(scale, scale, scale);
      }
    }
  }

  // Highlight a tile
  highlightTile(hexTile, color = 0xFFFF00) {
    if (hexTile.mesh) {
      hexTile.mesh.material.emissive = new THREE.Color(color);
    }
  }

  // Remove highlight from a tile
  removeHighlight(hexTile) {
    if (hexTile.mesh) {
      hexTile.mesh.material.emissive = new THREE.Color(0x000000);
    }
  }

  // Raycast to find what was clicked
  raycast(mouseX, mouseY) {
    const THREE = require('three');
    
    // Normalize mouse coordinates to [-1, 1]
    const mouseVector = new THREE.Vector2();
    mouseVector.x = (mouseX / window.innerWidth) * 2 - 1;
    mouseVector.y = -(mouseY / window.innerHeight) * 2 + 1;
    
    // Create raycaster
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouseVector, this.camera);
    
    // Get all intersected objects
    const intersects = raycaster.intersectObjects([
      ...this.tiles, 
      ...this.units, 
      ...this.cities
    ]);
    
    if (intersects.length > 0) {
      const object = intersects[0].object;
      return object.userData;
    }
    
    return null;
  }
}

module.exports = RenderSystem;