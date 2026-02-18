/**
 * Unit Component for 3D Civilization Revolution
 */

class Unit {
  constructor(type, position, owner) {
    this.type = type; // warrior, archer, settler, etc.
    this.position = position; // {x, y, z} coordinates
    this.owner = owner; // Player ID
    
    // Unit stats
    this.health = 100;
    this.maxHealth = 100;
    this.attack = this.getDefaultAttack(type);
    this.defense = this.getDefaultDefense(type);
    this.movement = this.getDefaultMovement(type);
    this.maxMovement = this.movement;
    this.range = this.getDefaultRange(type);
    this.level = 1;
    this.experience = 0;
    
    // 3D model reference
    this.mesh = null;
    
    // Actions
    this.actionPoints = 2;
    this.maxActionPoints = 2;
  }

  getDefaultAttack(type) {
    const attacks = {
      warrior: 15,
      archer: 10,
      settler: 5,
      worker: 3,
      scout: 8,
      spearman: 12,
      cavalry: 18,
      catapult: 20
    };
    return attacks[type] || 10;
  }

  getDefaultDefense(type) {
    const defenses = {
      warrior: 8,
      archer: 5,
      settler: 3,
      worker: 2,
      scout: 4,
      spearman: 10,
      cavalry: 6,
      catapult: 5
    };
    return defenses[type] || 5;
  }

  getDefaultMovement(type) {
    const movements = {
      warrior: 2,
      archer: 2,
      settler: 1,
      worker: 1,
      scout: 3,
      spearman: 2,
      cavalry: 4,
      catapult: 1
    };
    return movements[type] || 2;
  }

  getDefaultRange(type) {
    const ranges = {
      warrior: 1,
      archer: 2,
      settler: 1,
      worker: 1,
      scout: 1,
      spearman: 1,
      cavalry: 1,
      catapult: 3
    };
    return ranges[type] || 1;
  }

  takeDamage(damage) {
    const actualDamage = Math.max(0, damage - this.defense / 2);
    this.health -= actualDamage;
    
    if (this.health <= 0) {
      this.health = 0;
      return true; // Unit destroyed
    }
    return false; // Unit still alive
  }

  heal(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  canPerformAction() {
    return this.actionPoints > 0;
  }

  performAction() {
    if (this.actionPoints > 0) {
      this.actionPoints--;
      return true;
    }
    return false;
  }

  resetTurn() {
    this.actionPoints = this.maxActionPoints;
    this.movement = this.maxMovement;
  }

  gainExperience(amount) {
    this.experience += amount;
    // Level up if experience threshold reached
    const expThreshold = this.level * 100;
    if (this.experience >= expThreshold) {
      this.levelUp();
    }
  }

  levelUp() {
    this.level++;
    this.attack += 2;
    this.defense += 1;
    this.maxHealth += 10;
    this.health = this.maxHealth;
  }

  moveTo(newPosition) {
    if (this.movement > 0) {
      this.position = {...newPosition};
      this.movement--;
      return true;
    }
    return false;
  }

  getValidMovePositions(gameMap) {
    // Calculate all positions this unit can move to based on movement points
    // This would involve pathfinding on the hex grid
    const positions = [];
    
    // For simplicity, just return adjacent positions
    // In a real implementation, this would use pathfinding algorithms
    const directions = [
      {x: 1, y: 0, z: -1}, {x: 1, y: -1, z: 0}, {x: 0, y: -1, z: 1},
      {x: -1, y: 0, z: 1}, {x: -1, y: 1, z: 0}, {x: 0, y: 1, z: -1}
    ];
    
    for (const dir of directions) {
      const newPos = {
        x: this.position.x + dir.x,
        y: this.position.y + dir.y,
        z: this.position.z + dir.z
      };
      
      // Check if position is valid (exists on map, not occupied, etc.)
      if (this.isValidPosition(newPos, gameMap)) {
        positions.push(newPos);
      }
    }
    
    return positions;
  }

  isValidPosition(position, gameMap) {
    // Check if position is within map bounds
    // Check if position is not occupied by another unit
    // Check if terrain is passable for this unit type
    return true; // Simplified for now
  }

  getAttackablePositions(gameMap) {
    // Calculate all positions this unit can attack
    const positions = [];
    
    // For ranged units, find positions within range
    // For melee units, find adjacent positions
    const directions = [
      {x: 1, y: 0, z: -1}, {x: 1, y: -1, z: 0}, {x: 0, y: -1, z: 1},
      {x: -1, y: 0, z: 1}, {x: -1, y: 1, z: 0}, {x: 0, y: 1, z: -1}
    ];
    
    for (let r = 1; r <= this.range; r++) {
      for (const dir of directions) {
        const newPos = {
          x: this.position.x + dir.x * r,
          y: this.position.y + dir.y * r,
          z: this.position.z + dir.z * r
        };
        
        if (this.isValidPosition(newPos, gameMap)) {
          positions.push(newPos);
        }
      }
    }
    
    return positions;
  }
}

module.exports = Unit;