/**
 * Player Component for 3D Civilization Revolution
 */

class Player {
  constructor(id, name, color, civilization) {
    this.id = id;
    this.name = name || `Player ${id + 1}`;
    this.color = color || this.generateRandomColor();
    this.civilization = civilization || 'Generic';
    
    // Resources
    this.resources = {
      gold: 100,
      food: 100,
      production: 50,
      science: 0,
      culture: 0
    };
    
    // Units and cities
    this.units = [];
    this.cities = [];
    
    // Technologies and policies
    this.technologies = [];
    this.policies = [];
    
    // Game state
    this.isHuman = true;
    this.hasTurn = false;
    this.victoryPoints = 0;
    this.techProgress = {};
    
    // Diplomacy
    this.diplomaticRelations = {}; // {playerId: relationshipType}
    
    // Score
    this.score = 0;
  }

  generateRandomColor() {
    // Generate a random hex color
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
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

  addUnit(unit) {
    if (!this.units.includes(unit)) {
      this.units.push(unit);
      return true;
    }
    return false;
  }

  removeUnit(unit) {
    const index = this.units.indexOf(unit);
    if (index !== -1) {
      this.units.splice(index, 1);
      return true;
    }
    return false;
  }

  addCity(city) {
    if (!this.cities.includes(city)) {
      this.cities.push(city);
      return true;
    }
    return false;
  }

  removeCity(city) {
    const index = this.cities.indexOf(city);
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
    for (const city of this.cities) {
      const cityIncome = city.calculateTurnResources();
      for (const [resource, amount] of Object.entries(cityIncome)) {
        income[resource] += amount;
      }
    }

    // Additional income from units and improvements could be added here
    // Income from trade routes, etc.

    return income;
  }

  endTurn() {
    // Collect income for the turn
    const income = this.calculateTurnIncome();
    for (const [resource, amount] of Object.entries(income)) {
      this.resources[resource] += amount;
    }

    this.hasTurn = false;
    
    // Process city production
    for (const city of this.cities) {
      city.processTurn();
    }
    
    // Process research
    this.processResearch();
    
    // Process policies
    this.processPolicies();
  }

  startTurn() {
    this.hasTurn = true;
    // Reset unit movement points
    for (const unit of this.units) {
      unit.resetTurn();
    }
    // Advance research
    // Process city production
  }

  processResearch() {
    // Process ongoing research projects
    for (const [tech, progress] of Object.entries(this.techProgress)) {
      if (progress >= this.getTechCost(tech)) {
        // Tech completed
        this.researchTechnology(tech);
        delete this.techProgress[tech];
      }
    }
    
    // Add science to ongoing research
    if (this.resources.science > 0) {
      for (const tech of Object.keys(this.techProgress)) {
        this.techProgress[tech] += this.resources.science;
      }
    }
  }

  processPolicies() {
    // Process policy changes
    // Implement social policy system
  }

  getTechCost(techName) {
    // Define base costs for technologies
    const baseCosts = {
      'agriculture': 50,
      'pottery': 75,
      'animal_husbandry': 75,
      'archery': 100,
      'mining': 100,
      'sailing': 120,
      'calendar': 150,
      'writing': 175,
      'horseshoeing': 200,
      'mathematics': 250,
      'physics': 300,
      'astronomy': 350,
      'chemistry': 400,
      'economics': 450,
      'biology': 500,
      'electricity': 550,
      'steam_power': 600,
      'refining': 650,
      'radio': 700,
      'flight': 750,
      'electronics': 800,
      'ballistics': 850,
      'combustion': 900,
      'plastics': 950,
      'nuclear_fission': 1000,
      'rocketry': 1050,
      'computer': 1100,
      'mobile_tactics': 1150,
      'satellites': 1200,
      'robotics': 1250,
      'lasers': 1300,
      'nuclear_fusion': 1350,
      'nanotechnology': 1400,
      'particle_physics': 1450,
      'future_tech': 1500
    };
    
    return baseCosts[techName] || 100;
  }

  updateScore() {
    // Calculate player's score based on various factors
    this.score = 0;
    
    // Points from cities
    this.score += this.cities.length * 10;
    
    // Points from population
    for (const city of this.cities) {
      this.score += city.population * 2;
    }
    
    // Points from technologies
    this.score += this.technologies.length * 3;
    
    // Points from wonders
    for (const city of this.cities) {
      this.score += city.wonders.length * 5;
    }
    
    // Points from territory
    for (const city of this.cities) {
      this.score += city.claimedTiles.length;
    }
    
    return this.score;
  }

  getMilitaryStrength() {
    // Calculate the combined military strength of all units
    let strength = 0;
    for (const unit of this.units) {
      strength += unit.attack + unit.defense;
    }
    return strength;
  }

  getEconomicStrength() {
    // Calculate economic strength based on cities and resources
    let strength = 0;
    for (const city of this.cities) {
      strength += city.gold + city.production * 0.5;
    }
    strength += this.resources.gold * 0.1;
    return strength;
  }

  getScientificStrength() {
    // Calculate scientific strength based on technologies and research
    let strength = this.technologies.length * 10;
    strength += this.resources.science * 5;
    return strength;
  }

  setDiplomaticRelation(playerId, relation) {
    // Set diplomatic relation with another player
    // Relations could be 'ally', 'friend', 'neutral', 'enemy', 'war'
    this.diplomaticRelations[playerId] = relation;
  }

  getDiplomaticRelation(playerId) {
    return this.diplomaticRelations[playerId] || 'neutral';
  }
}

module.exports = Player;