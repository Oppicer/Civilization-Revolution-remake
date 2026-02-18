/**
 * Tile Component
 * Represents a tile on the game map
 */
class Tile {
  constructor(x, y, type = 'grass', terrainModifier = 1.0) {
    this.x = x;
    this.y = y;
    this.type = type; // grass, forest, mountain, water, etc.
    this.terrainModifier = terrainModifier; // affects movement cost and combat
    this.resource = null;
    this.improvement = null;
    this.unit = null;
    this.city = null;
    this.walkable = true;
    this.defenseBonus = 0;
  }

  setType(type) {
    this.type = type;
    // Adjust properties based on tile type
    switch(type) {
      case 'water':
        this.walkable = false;
        this.terrainModifier = 0;
        break;
      case 'mountain':
        this.walkable = false;
        this.terrainModifier = 3;
        this.defenseBonus = 2;
        break;
      case 'forest':
        this.terrainModifier = 2;
        this.defenseBonus = 1;
        break;
      case 'grass':
      default:
        this.walkable = true;
        this.terrainModifier = 1;
        this.defenseBonus = 0;
        break;
    }
  }

  getResourceValue() {
    if (!this.resource) return 0;
    // Different resources have different values
    const resourceValues = {
      'food': 2,
      'production': 1,
      'gold': 3,
      'science': 2,
      'culture': 2
    };
    return resourceValues[this.resource] || 0;
  }
}

module.exports = Tile;