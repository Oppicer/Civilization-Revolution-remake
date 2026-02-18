/**
 * Unit Component
 * Represents a game unit (warrior, settler, etc.)
 */
class Unit {
  constructor(type, owner, x, y) {
    this.type = type; // warrior, settler, worker, scout, etc.
    this.owner = owner; // player ID
    this.position = {x, y};
    this.health = 100;
    this.maxHealth = 100;
    this.attack = this.getDefaultAttack(type);
    this.defense = this.getDefaultDefense(type);
    this.movement = this.getDefaultMovement(type);
    this.maxMovement = this.movement;
    this.range = this.getDefaultRange(type);
    this.level = 1;
    this.experience = 0;
    this.upgradeThreshold = 100;
    this.actionsRemaining = 1;
    this.promoted = false;
  }

  getDefaultAttack(unitType) {
    const attackValues = {
      'warrior': 10,
      'archer': 8,
      'scout': 5,
      'settler': 3,
      'worker': 2,
      'spearman': 12,
      'cavalry': 15
    };
    return attackValues[unitType] || 5;
  }

  getDefaultDefense(unitType) {
    const defenseValues = {
      'warrior': 5,
      'archer': 3,
      'scout': 2,
      'settler': 1,
      'worker': 1,
      'spearman': 8,
      'cavalry': 4
    };
    return defenseValues[unitType] || 3;
  }

  getDefaultMovement(unitType) {
    const movementValues = {
      'warrior': 2,
      'archer': 2,
      'scout': 3,
      'settler': 2,
      'worker': 2,
      'spearman': 2,
      'cavalry': 4
    };
    return movementValues[unitType] || 2;
  }

  getDefaultRange(unitType) {
    const rangeValues = {
      'warrior': 1,
      'archer': 2,
      'scout': 1,
      'settler': 1,
      'worker': 1,
      'spearman': 1,
      'cavalry': 1
    };
    return rangeValues[unitType] || 1;
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.health = 0;
      return true; // Unit is destroyed
    }
    return false;
  }

  heal(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  move(x, y) {
    if (this.movement > 0) {
      this.position = {x, y};
      this.movement--;
      return true;
    }
    return false;
  }

  resetTurn() {
    this.movement = this.maxMovement;
    this.actionsRemaining = 1;
  }

  gainExperience(amount) {
    this.experience += amount;
    if (this.experience >= this.upgradeThreshold) {
      this.levelUp();
    }
  }

  levelUp() {
    this.level++;
    this.attack += 2;
    this.defense += 1;
    this.maxHealth += 10;
    this.health = this.maxHealth;
    this.upgradeThreshold = Math.floor(this.upgradeThreshold * 1.5);
  }

  canPerformAction() {
    return this.actionsRemaining > 0;
  }

  performAction() {
    if (this.actionsRemaining > 0) {
      this.actionsRemaining--;
      return true;
    }
    return false;
  }
}

module.exports = Unit;