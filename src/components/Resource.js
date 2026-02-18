/**
 * Resource Component
 * Represents a resource that can be collected by players
 */
class Resource {
  constructor(type, value, position) {
    this.type = type; // food, production, gold, science, culture, strategic (iron, horses, etc.)
    this.value = value; // How much of the resource is available
    this.position = position; // Position on the map
    this.isStrategic = this.checkIfStrategic(type);
    this.isLuxury = this.checkIfLuxury(type);
    this.isBonus = this.checkIfBonus(type);
    this.usedBy = null; // Which improvement or city is using this resource
    this.accessedBy = []; // List of player IDs that have access to this resource
  }

  checkIfStrategic(type) {
    const strategicTypes = ['iron', 'horses', 'coal', 'oil', 'uranium'];
    return strategicTypes.includes(type);
  }

  checkIfLuxury(type) {
    const luxuryTypes = ['spices', 'dyes', 'ivory', 'silver', 'gold_resource', 'wine'];
    return luxuryTypes.includes(type);
  }

  checkIfBonus(type) {
    const bonusTypes = ['cows', 'sheep', 'deer', 'fish', 'wheat', 'stone'];
    return bonusTypes.includes(type);
  }

  getTypeClass() {
    if (this.isStrategic) return 'strategic';
    if (this.isLuxury) return 'luxury';
    if (this.isBonus) return 'bonus';
    return 'basic';
  }

  getValueForPlayer(player) {
    // Different resources have different values for different players
    // based on their civilization, policies, technologies, etc.
    let baseValue = this.value;

    // Apply modifiers based on player's civilization, technologies, etc.
    // This would be expanded in a full implementation
    if (this.isLuxury) {
      // Luxury resources might have increased value for trade or happiness
      baseValue *= 1.5;
    } else if (this.isStrategic) {
      // Strategic resources become more valuable later in the game
      baseValue *= 2;
    }

    return Math.round(baseValue);
  }

  addAccess(playerId) {
    if (!this.accessedBy.includes(playerId)) {
      this.accessedBy.push(playerId);
    }
  }

  removeAccess(playerId) {
    const index = this.accessedBy.indexOf(playerId);
    if (index !== -1) {
      this.accessedBy.splice(index, 1);
      if (this.usedBy === playerId) {
        this.usedBy = null;
      }
    }
  }

  isAccessibleTo(playerId) {
    return this.accessedBy.includes(playerId);
  }
}

module.exports = Resource;