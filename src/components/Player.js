/**
 * Player Component
 * Represents a player in the game
 */
class Player {
  constructor(id, name, color, civilization) {
    this.id = id;
    this.name = name;
    this.color = color; // Used for UI representation
    this.civilization = civilization; // Type of civilization (Roman, Egyptian, etc.)
    this.resources = {
      gold: 100,
      food: 100,
      production: 50,
      science: 0,
      culture: 0
    };
    this.units = []; // Array of unit IDs owned by the player
    this.cities = []; // Array of city IDs owned by the player
    this.technologies = []; // Array of researched technologies
    this.policies = []; // Array of adopted policies
    this.isHuman = true; // Whether this is a human or AI player
    this.victoryPoints = 0;
    this.techProgress = {}; // Progress toward researching technologies
    this.hasTurn = false; // Whether it's currently this player's turn
  }

  addResource(type, amount) {
    if (this.resources.hasOwnProperty(type)) {
      this.resources[type] += amount;
      return true;
    }
    return false;
  }

  removeResource(type, amount) {
    if (this.resources.hasOwnProperty(type) && this.resources[type] >= amount) {
      this.resources[type] -= amount;
      return true;
    }
    return false;
  }

  canAfford(costs) {
    for (const [resource, amount] of Object.entries(costs)) {
      if (this.resources[resource] < amount) {
        return false;
      }
    }
    return true;
  }

  spendResources(costs) {
    for (const [resource, amount] of Object.entries(costs)) {
      if (!this.removeResource(resource, amount)) {
        return false; // Failed to spend resources
      }
    }
    return true;
  }

  addUnit(unitId) {
    if (!this.units.includes(unitId)) {
      this.units.push(unitId);
    }
  }

  removeUnit(unitId) {
    const index = this.units.indexOf(unitId);
    if (index !== -1) {
      this.units.splice(index, 1);
      return true;
    }
    return false;
  }

  addCity(cityId) {
    if (!this.cities.includes(cityId)) {
      this.cities.push(cityId);
    }
  }

  removeCity(cityId) {
    const index = this.cities.indexOf(cityId);
    if (index !== -1) {
      this.cities.splice(index, 1);
      return true;
    }
    return false;
  }

  researchTechnology(techName) {
    if (!this.technologies.includes(techName)) {
      this.technologies.push(techName);
      return true;
    }
    return false;
  }

  adoptPolicy(policyName) {
    if (!this.policies.includes(policyName)) {
      this.policies.push(policyName);
      return true;
    }
    return false;
  }

  calculateTurnIncome() {
    // Calculate income based on cities, improvements, and technologies
    const income = {
      gold: 0,
      food: 0,
      production: 0,
      science: 0,
      culture: 0
    };

    // Base income from cities
    for (const cityId of this.cities) {
      // Simplified calculation - in a real game, this would be more complex
      income.gold += 5;
      income.food += 4;
      income.production += 3;
      income.science += 2;
      income.culture += 1;
    }

    // Additional income from units and improvements could be added here

    return income;
  }

  endTurn() {
    // Collect income for the turn
    const income = this.calculateTurnIncome();
    for (const [resource, amount] of Object.entries(income)) {
      this.resources[resource] += amount;
    }

    this.hasTurn = false;
  }

  startTurn() {
    this.hasTurn = true;
    // Reset unit movement points
    // Advance research
    // Process city production
  }
}

module.exports = Player;