/**
 * HexTile Component for 3D Civilization Revolution
 * Represents a single tile in the hexagonal game grid
 */

class HexTile {
  constructor(q, r, s, type = 'grass') {
    // Cube coordinates (q + r + s = 0)
    this.q = q; // Column
    this.r = r; // Row
    this.s = s; // Depth (derived from q + r + s = 0)
    
    // Position in 3D space
    this.position = this.hexToPixel(q, r);
    
    // Terrain type
    this.type = type;
    
    // Terrain properties
    this.passable = true;
    this.movementCost = 1;
    this.defenseBonus = 0;
    this.food = 0;
    this.production = 0;
    this.gold = 0;
    this.science = 0;
    this.culture = 0;
    
    // Set properties based on terrain type
    this.setTerrainProperties();
    
    // Optional features
    this.resource = null;
    this.improvement = null;
    this.city = null;
    this.unit = null;
    
    // Ownership
    this.owner = null; // Player ID if claimed
    
    // 3D model reference
    this.mesh = null;
  }

  // Convert hex coordinates to pixel coordinates
  hexToPixel(q, r) {
    const size = 1; // Size of hexagon
    const x = size * (3.0/2.0 * q);
    const z = size * (Math.sqrt(3.0)/2.0 * q + Math.sqrt(3.0) * r);
    return { x, y: 0, z }; // y is usually 0 unless terrain has elevation
  }

  // Convert pixel coordinates back to hex coordinates
  pixelToHex(x, z) {
    const size = 1;
    const q = (2.0/3.0 * x) / size;
    const r = (-1.0/3.0 * x + Math.sqrt(3.0)/3.0 * z) / size;
    return this.hexRound(q, r);
  }

  // Round hex coordinates to nearest integer
  hexRound(q, r) {
    const s = -q - r;
    
    let qi = Math.round(q);
    let ri = Math.round(r);
    let si = Math.round(s);
    
    const qDiff = Math.abs(qi - q);
    const rDiff = Math.abs(ri - r);
    const sDiff = Math.abs(si - s);
    
    if (qDiff > rDiff && qDiff > sDiff) {
      qi = -ri - si;
    } else if (rDiff > sDiff) {
      ri = -qi - si;
    } else {
      si = -qi - ri;
    }
    
    return { q: qi, r: ri, s: si };
  }

  // Set properties based on terrain type
  setTerrainProperties() {
    switch(this.type) {
      case 'grass':
        this.food = 1;
        this.production = 1;
        this.movementCost = 1;
        this.passable = true;
        break;
      case 'plains':
        this.food = 1;
        this.production = 2;
        this.movementCost = 1;
        this.passable = true;
        break;
      case 'hills':
        this.production = 2;
        this.defenseBonus = 1;
        this.movementCost = 2;
        this.passable = true;
        break;
      case 'forest':
        this.production = 1;
        this.science = 1;
        this.defenseBonus = 1;
        this.movementCost = 2;
        this.passable = true;
        break;
      case 'jungle':
        this.food = 1;
        this.defenseBonus = 1;
        this.movementCost = 3;
        this.passable = true;
        break;
      case 'desert':
        this.gold = 1;
        this.movementCost = 1;
        this.passable = true;
        break;
      case 'tundra':
        this.food = 1;
        this.culture = 1;
        this.movementCost = 2;
        this.passable = true;
        break;
      case 'snow':
        this.movementCost = 3;
        this.passable = true; // Still passable but costly
        break;
      case 'mountain':
        this.defenseBonus = 2;
        this.movementCost = 99; // Effectively impassable
        this.passable = false;
        break;
      case 'coast':
        this.food = 1;
        this.gold = 1;
        this.science = 1;
        this.movementCost = 1;
        this.passable = true;
        break;
      case 'ocean':
        this.movementCost = 99;
        this.passable = false; // Only passable by naval units
        break;
      case 'river':
        this.food = 1;
        this.movementCost = 2;
        this.passable = true;
        break;
      default:
        // Default to grass
        this.food = 1;
        this.production = 1;
        this.movementCost = 1;
        this.passable = true;
    }
  }

  // Add a resource to this tile
  addResource(resourceName) {
    this.resource = resourceName;
    
    // Apply resource bonuses to tile yields
    switch(resourceName) {
      case 'cows':
        this.food += 2;
        break;
      case 'sheep':
        this.food += 1;
        break;
      case 'deer':
        this.food += 1;
        this.production += 1;
        break;
      case 'fish':
        this.food += 1;
        break;
      case 'wheat':
        this.food += 2;
        break;
      case 'stone':
        this.production += 1;
        break;
      case 'iron':
        this.production += 1;
        break;
      case 'coal':
        this.production += 2;
        break;
      case 'oil':
        this.production += 2;
        this.gold += 1;
        break;
      case 'gold_resource':
        this.gold += 2;
        break;
      case 'silver':
        this.gold += 1;
        break;
      case 'spices':
        this.gold += 1;
        this.culture += 1;
        break;
      case 'dyes':
        this.gold += 1;
        this.culture += 1;
        break;
      case 'ivory':
        this.gold += 1;
        this.culture += 1;
        break;
      case 'wine':
        this.gold += 1;
        this.culture += 1;
        break;
      default:
        console.log(`Unknown resource: ${resourceName}`);
    }
  }

  // Add an improvement to this tile
  addImprovement(improvementName) {
    this.improvement = improvementName;
    
    // Apply improvement bonuses to tile yields
    switch(improvementName) {
      case 'farm':
        this.food += 1;
        break;
      case 'mine':
        this.production += 1;
        break;
      case 'pasture':
        this.food += 1;
        break;
      case 'plantation':
        this.food += 1;
        this.gold += 1;
        break;
      case 'camp':
        this.production += 1;
        break;
      case 'quarry':
        this.production += 2;
        this.movementCost = 2; // Improvement might affect movement
        break;
      case 'fishing_boats':
        this.food += 1;
        break;
      case 'trading_post':
        this.gold += 1;
        break;
      case 'fort':
        this.defenseBonus += 3;
        break;
      case 'lumbermill':
        this.production += 1;
        break;
      case 'windmill':
        this.food += 1;
        this.production += 1;
        break;
      case 'customs_house':
        this.gold += 2;
        break;
      default:
        console.log(`Unknown improvement: ${improvementName}`);
    }
  }

  // Check if this tile is adjacent to another tile
  isAdjacent(otherTile) {
    const dq = Math.abs(this.q - otherTile.q);
    const dr = Math.abs(this.r - otherTile.r);
    const ds = Math.abs(-this.q - this.r - otherTile.s); // s = -q - r
    
    return (dq <= 1 && dr <= 1 && ds <= 1) && !(dq === 0 && dr === 0);
  }

  // Get all adjacent tiles from a grid
  getAdjacentTiles(grid) {
    const adjacent = [];
    
    // Directions in cube coordinates
    const directions = [
      {q: 1, r: 0, s: -1}, {q: 1, r: -1, s: 0}, {q: 0, r: -1, s: 1},
      {q: -1, r: 0, s: 1}, {q: -1, r: 1, s: 0}, {q: 0, r: 1, s: -1}
    ];
    
    for (const dir of directions) {
      const neighborQ = this.q + dir.q;
      const neighborR = this.r + dir.r;
      const neighborS = this.s + dir.s;
      
      // Check if neighbor exists in grid
      if (grid[neighborQ] && grid[neighborQ][neighborR]) {
        adjacent.push(grid[neighborQ][neighborR]);
      }
    }
    
    return adjacent;
  }

  // Get total yield for this tile
  getTotalYield() {
    return {
      food: this.food,
      production: this.production,
      gold: this.gold,
      science: this.science,
      culture: this.culture
    };
  }

  // Calculate distance to another tile
  distanceTo(otherTile) {
    return (Math.abs(this.q - otherTile.q) + 
            Math.abs(this.r - otherTile.r) + 
            Math.abs(this.s - otherTile.s)) / 2;
  }

  // Check if tile can be worked by a city
  canBeWorked() {
    // A tile can be worked if it's not occupied by an enemy unit/city
    // and is within working distance of a city
    return this.unit === null && this.city === null;
  }

  // Check if this tile is suitable for a specific purpose
  isSuitableFor(purpose) {
    switch(purpose) {
      case 'city':
        // Cities generally need to be on passable terrain
        // Avoid mountains and oceans
        return this.passable && this.type !== 'mountain' && this.type !== 'ocean';
      case 'military_unit':
        // Most terrains are suitable for military units
        return this.passable;
      case 'civilian_unit':
        // Civilian units might avoid dangerous terrain
        return this.passable;
      case 'resource_extraction':
        // Suitable if it has a resource or can support an improvement
        return this.resource !== null || this.improvement === null;
      default:
        return this.passable;
    }
  }
}

module.exports = HexTile;