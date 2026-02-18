/**
 * Game Map System for 3D Civilization Revolution
 * Handles the hexagonal game grid and map operations
 */

const HexTile = require('../components/HexTile');

class GameMap {
  constructor(width = 20, height = 20) {
    this.width = width;
    this.height = height;
    
    // The map is stored as a 2D array of HexTile objects
    this.tiles = [];
    
    // Initialize the hexagonal grid
    this.generateMap();
  }

  // Generate the hexagonal grid
  generateMap() {
    this.tiles = [];
    
    // Create hexagonal grid using offset coordinates
    for (let q = -this.width/2; q < this.width/2; q++) {
      this.tiles[q] = {};
      for (let r = -this.height/2; r < this.height/2; r++) {
        // Calculate s coordinate (cube coordinates: q + r + s = 0)
        const s = -q - r;
        
        // Create hex tile with random terrain
        const terrainTypes = ['grass', 'plains', 'hills', 'forest', 'desert', 'tundra', 'mountain'];
        const randomTerrain = terrainTypes[Math.floor(Math.random() * terrainTypes.length)];
        
        const hexTile = new HexTile(q, r, s, randomTerrain);
        
        // Store tile in the grid
        this.tiles[q][r] = hexTile;
      }
    }
    
    // Add some special features after generating base terrain
    this.addSpecialFeatures();
  }

  // Add special features like rivers, lakes, resources, etc.
  addSpecialFeatures() {
    // Add some rivers
    this.addRivers();
    
    // Add some resources
    this.addResources();
    
    // Add some water bodies
    this.addWaterFeatures();
  }

  // Add rivers to the map
  addRivers() {
    // For simplicity, create a few straight rivers
    for (let i = 0; i < 3; i++) {
      // Choose a random starting column
      const startQ = Math.floor(Math.random() * (this.width/2 - 2)) - this.width/4;
      
      // Create a river flowing in a particular direction
      for (let r = -this.height/3; r < this.height/3; r++) {
        const q = startQ + Math.floor(r / 3); // Diagonal river
        
        if (this.tiles[q] && this.tiles[q][r]) {
          this.tiles[q][r].type = 'river';
          this.tiles[q][r].setTerrainProperties();
        }
      }
    }
  }

  // Add resources to the map
  addResources() {
    const resourceTypes = [
      'cows', 'sheep', 'deer', 'fish', 'wheat', 'stone', 'iron', 
      'coal', 'oil', 'gold_resource', 'silver', 'spices', 'dyes', 
      'ivory', 'wine'
    ];
    
    // Place resources randomly on appropriate terrain
    for (let q in this.tiles) {
      for (let r in this.tiles[q]) {
        const tile = this.tiles[q][r];
        
        // Skip mountains and water
        if (tile.type === 'mountain' || tile.type === 'ocean') {
          continue;
        }
        
        // Random chance to place a resource
        if (Math.random() < 0.15) { // 15% chance
          const randomResource = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
          
          // Some resources only appear on specific terrains
          if (this.isResourceCompatible(tile.type, randomResource)) {
            tile.addResource(randomResource);
          }
        }
      }
    }
  }

  // Check if a resource is compatible with a terrain type
  isResourceCompatible(terrainType, resourceType) {
    const compatibility = {
      'cows': ['grass', 'plains'],
      'sheep': ['hills', 'grass'],
      'deer': ['forest', 'tundra'],
      'fish': ['coast', 'ocean', 'river'],
      'wheat': ['plains', 'grass'],
      'stone': ['hills', 'mountain'],
      'iron': ['hills', 'mountain'],
      'coal': ['hills', 'mountain', 'forest'],
      'oil': ['desert', 'tundra', 'coast'],
      'gold_resource': ['hills', 'mountain'],
      'silver': ['hills', 'mountain'],
      'spices': ['jungle', 'forest'],
      'dyes': ['jungle', 'forest'],
      'ivory': ['desert', 'plains'],
      'wine': ['grass', 'plains']
    };
    
    const allowedTerrains = compatibility[resourceType];
    return allowedTerrains ? allowedTerrains.includes(terrainType) : true;
  }

  // Add water features like lakes and coastal areas
  addWaterFeatures() {
    // Create some lakes
    for (let i = 0; i < 5; i++) {
      const centerQ = Math.floor(Math.random() * (this.width/2 - 4)) - this.width/4 + 2;
      const centerR = Math.floor(Math.random() * (this.height/2 - 4)) - this.height/4 + 2;
      
      // Create a circular lake
      for (let q = centerQ - 2; q <= centerQ + 2; q++) {
        for (let r = centerR - 2; r <= centerR + 2; r++) {
          if (this.tiles[q] && this.tiles[q][r]) {
            const distance = this.hexDistance(centerQ, centerR, q, r);
            if (distance <= 2) {
              this.tiles[q][r].type = 'coast'; // Use coast instead of ocean for smaller water bodies
              this.tiles[q][r].setTerrainProperties();
            }
          }
        }
      }
    }
  }

  // Calculate hex distance between two points
  hexDistance(q1, r1, q2, r2) {
    const s1 = -q1 - r1;
    const s2 = -q2 - r2;
    
    return (Math.abs(q1 - q2) + Math.abs(r1 - r2) + Math.abs(s1 - s2)) / 2;
  }

  // Get a tile at specific coordinates
  getTile(q, r) {
    if (this.tiles[q] && this.tiles[q][r]) {
      return this.tiles[q][r];
    }
    return null;
  }

  // Set a tile at specific coordinates
  setTile(q, r, tile) {
    if (this.tiles[q] && this.tiles[q][r]) {
      this.tiles[q][r] = tile;
      return true;
    }
    return false;
  }

  // Find the closest tile to a given point
  findClosestTile(targetQ, targetR) {
    let closestTile = null;
    let minDistance = Infinity;
    
    for (let q in this.tiles) {
      for (let r in this.tiles[q]) {
        const distance = this.hexDistance(parseInt(q), parseInt(r), targetQ, targetR);
        if (distance < minDistance) {
          minDistance = distance;
          closestTile = this.tiles[q][r];
        }
      }
    }
    
    return closestTile;
  }

  // Get all tiles within a certain range of a point
  getTilesInRange(centerQ, centerR, range) {
    const tilesInRange = [];
    
    for (let dq = -range; dq <= range; dq++) {
      for (let dr = Math.max(-range, -dq-range); dr <= Math.min(range, -dq+range); dr++) {
        const q = centerQ + dq;
        const r = centerR + dr;
        
        if (this.tiles[q] && this.tiles[q][r]) {
          tilesInRange.push(this.tiles[q][r]);
        }
      }
    }
    
    return tilesInRange;
  }

  // Get adjacent tiles to a given tile
  getAdjacentTiles(hexTile) {
    const adjacent = [];
    
    // Directions in cube coordinates
    const directions = [
      {q: 1, r: 0, s: -1}, {q: 1, r: -1, s: 0}, {q: 0, r: -1, s: 1},
      {q: -1, r: 0, s: 1}, {q: -1, r: 1, s: 0}, {q: 0, r: 1, s: -1}
    ];
    
    for (const dir of directions) {
      const neighborQ = hexTile.q + dir.q;
      const neighborR = hexTile.r + dir.r;
      
      if (this.tiles[neighborQ] && this.tiles[neighborQ][neighborR]) {
        adjacent.push(this.tiles[neighborQ][neighborR]);
      }
    }
    
    return adjacent;
  }

  // Get all tiles of a specific terrain type
  getTilesByType(terrainType) {
    const matchingTiles = [];
    
    for (let q in this.tiles) {
      for (let r in this.tiles[q]) {
        if (this.tiles[q][r].type === terrainType) {
          matchingTiles.push(this.tiles[q][r]);
        }
      }
    }
    
    return matchingTiles;
  }

  // Get all passable tiles
  getPassableTiles() {
    const passableTiles = [];
    
    for (let q in this.tiles) {
      for (let r in this.tiles[q]) {
        if (this.tiles[q][r].passable) {
          passableTiles.push(this.tiles[q][r]);
        }
      }
    }
    
    return passableTiles;
  }

  // Find a path between two tiles using A* algorithm
  findPath(startTile, endTile, unitMovementType = 'infantry') {
    // Implementation of A* pathfinding algorithm
    const openSet = [{ tile: startTile, g: 0, h: this.estimateDistance(startTile, endTile), f: 0, parent: null }];
    const closedSet = new Set();
    
    // Helper function to get unique key for a tile
    const getTileKey = (tile) => `${tile.q},${tile.r}`;
    
    // Add starting tile to closed set
    closedSet.add(getTileKey(startTile));
    
    while (openSet.length > 0) {
      // Sort open set by f value (lowest first)
      openSet.sort((a, b) => a.f - b.f);
      
      // Get tile with lowest f value
      const current = openSet.shift();
      
      // Check if we've reached the destination
      if (current.tile.q === endTile.q && current.tile.r === endTile.r) {
        // Reconstruct path
        const path = [];
        let node = current;
        while (node) {
          path.unshift(node.tile);
          node = node.parent;
        }
        return path;
      }
      
      // Get adjacent tiles
      const neighbors = this.getAdjacentTiles(current.tile);
      
      for (const neighbor of neighbors) {
        const neighborKey = getTileKey(neighbor);
        
        // Skip if already evaluated or impassable
        if (closedSet.has(neighborKey) || !neighbor.passable) {
          continue;
        }
        
        // Calculate tentative g score
        const movementCost = this.getMovementCost(current.tile, neighbor, unitMovementType);
        const tentativeG = current.g + movementCost;
        
        // Check if this path to neighbor is better than any previous one
        const existingNode = openSet.find(node => node.tile.q === neighbor.q && node.tile.r === neighbor.r);
        
        if (!existingNode) {
          // Add neighbor to open set
          const h = this.estimateDistance(neighbor, endTile);
          const newNode = {
            tile: neighbor,
            g: tentativeG,
            h: h,
            f: tentativeG + h,
            parent: current
          };
          openSet.push(newNode);
        } else if (tentativeG < existingNode.g) {
          // Update existing node with better path
          existingNode.g = tentativeG;
          existingNode.f = tentativeG + existingNode.h;
          existingNode.parent = current;
        }
      }
      
      // Add current to closed set
      closedSet.add(getTileKey(current.tile));
    }
    
    // No path found
    return null;
  }

  // Estimate distance between two tiles (heuristic for A*)
  estimateDistance(tile1, tile2) {
    return this.hexDistance(tile1.q, tile1.r, tile2.q, tile2.r);
  }

  // Get movement cost between two adjacent tiles
  getMovementCost(fromTile, toTile, unitMovementType) {
    // Base movement cost is determined by the terrain being moved to
    let cost = toTile.movementCost;
    
    // Adjust based on unit type
    if (unitMovementType === 'naval' && toTile.type === 'ocean') {
      cost = 1; // Naval units move efficiently in ocean
    } else if (unitMovementType === 'naval' && toTile.type !== 'coast' && toTile.type !== 'ocean') {
      return Infinity; // Naval units can't go on land
    } else if (unitMovementType === 'air') {
      return 1; // Air units ignore terrain costs
    }
    
    return cost;
  }

  // Get map statistics
  getStatistics() {
    const stats = {
      totalTiles: 0,
      terrainCounts: {},
      resourceCounts: {},
      passableTiles: 0
    };
    
    for (let q in this.tiles) {
      for (let r in this.tiles[q]) {
        const tile = this.tiles[q][r];
        stats.totalTiles++;
        
        // Count terrain types
        if (!stats.terrainCounts[tile.type]) {
          stats.terrainCounts[tile.type] = 0;
        }
        stats.terrainCounts[tile.type]++;
        
        // Count resources
        if (tile.resource) {
          if (!stats.resourceCounts[tile.resource]) {
            stats.resourceCounts[tile.resource] = 0;
          }
          stats.resourceCounts[tile.resource]++;
        }
        
        // Count passable tiles
        if (tile.passable) {
          stats.passableTiles++;
        }
      }
    }
    
    return stats;
  }
}

module.exports = GameMap;