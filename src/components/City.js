/**
 * City Component for 3D Civilization Revolution
 */

class City {
  constructor(name, position, owner) {
    this.name = name || this.generateRandomName();
    this.position = position; // {x, y, z} coordinates
    this.owner = owner; // Player ID
    
    // City stats
    this.population = 1;
    this.health = 100;
    this.maxHealth = 100;
    
    // Resources generated per turn
    this.food = 0;
    this.production = 0;
    this.gold = 0;
    this.science = 0;
    this.culture = 0;
    
    // City development
    this.buildings = [];
    this.wonders = [];
    
    // Current production
    this.currentProduction = null;
    this.productionQueue = [];
    
    // Tiles under city influence
    this.workedTiles = [];
    this.claimedTiles = [];
    
    // Special abilities
    this.defensiveStrength = 5; // Base defense when attacked
    
    // 3D model reference
    this.mesh = null;
  }

  generateRandomName() {
    const prefixes = [
      'New', 'Great', 'Fort', 'Port', 'Mount', 'Lake', 'River', 'Valley',
      'Green', 'Golden', 'Silver', 'Iron', 'Stone', 'Oak', 'Pine', 'Cedar'
    ];
    
    const roots = [
      'York', 'Paris', 'Rome', 'Athens', 'Alexandria', 'London', 'Berlin',
      'Madrid', 'Vienna', 'Dublin', 'Cairo', 'Beijing', 'Delhi', 'Moscow',
      'Tokyo', 'Seoul', 'Bangkok', 'Sydney', 'Toronto', 'Lima', 'Cape Town'
    ];
    
    const suffixes = [
      'City', 'Town', 'Vale', 'Field', 'Bridge', 'Gate', 'Haven', 'Falls',
      'Point', 'Bay', 'Rest', 'View', 'Spring', 'Grove', 'Hill', 'Cove'
    ];
    
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const root = roots[Math.floor(Math.random() * roots.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    
    // Sometimes use just prefix+root, sometimes prefix+root+suffix
    if (Math.random() > 0.5) {
      return `${prefix} ${root}`;
    } else {
      return `${prefix} ${root} ${suffix}`;
    }
  }

  addBuilding(buildingType) {
    if (!this.buildings.includes(buildingType)) {
      this.buildings.push(buildingType);
      this.applyBuildingEffects(buildingType);
      return true;
    }
    return false;
  }

  removeBuilding(buildingType) {
    const index = this.buildings.indexOf(buildingType);
    if (index !== -1) {
      this.buildings.splice(index, 1);
      this.removeBuildingEffects(buildingType);
      return true;
    }
    return false;
  }

  applyBuildingEffects(buildingType) {
    switch(buildingType) {
      case 'granary':
        this.food += 2;
        break;
      case 'lighthouse':
        this.food += 1;
        this.production += 1;
        break;
      case 'workshop':
        this.production += 2;
        break;
      case 'grocer':
        this.food += 1;
        this.gold += 1;
        break;
      case 'marketplace':
        this.gold += 2;
        break;
      case 'bank':
        this.gold += 3;
        break;
      case 'library':
        this.science += 2;
        break;
      case 'university':
        this.science += 3;
        break;
      case 'temple':
        this.culture += 2;
        break;
      case 'monastery':
        this.culture += 1;
        this.science += 1;
        break;
      case 'barracks':
        this.defensiveStrength += 3;
        break;
      case 'walls':
        this.defensiveStrength += 5;
        this.maxHealth += 50;
        this.health = this.maxHealth;
        break;
      case 'arsenal':
        this.defensiveStrength += 8;
        break;
      case 'factory':
        this.production += 4;
        break;
      case 'hospital':
        this.population += Math.floor(this.population * 0.2); // 20% growth
        break;
      case 'stock_exchange':
        this.gold += 5;
        break;
      case 'observatory':
        this.science += 4;
        break;
      case 'theater':
        this.culture += 3;
        break;
      case 'broadcast_tower':
        this.culture += 5;
        break;
      default:
        console.log(`Unknown building type: ${buildingType}`);
    }
  }

  removeBuildingEffects(buildingType) {
    switch(buildingType) {
      case 'granary':
        this.food -= 2;
        break;
      case 'lighthouse':
        this.food -= 1;
        this.production -= 1;
        break;
      case 'workshop':
        this.production -= 2;
        break;
      case 'grocer':
        this.food -= 1;
        this.gold -= 1;
        break;
      case 'marketplace':
        this.gold -= 2;
        break;
      case 'bank':
        this.gold -= 3;
        break;
      case 'library':
        this.science -= 2;
        break;
      case 'university':
        this.science -= 3;
        break;
      case 'temple':
        this.culture -= 2;
        break;
      case 'monastery':
        this.culture -= 1;
        this.science -= 1;
        break;
      case 'barracks':
        this.defensiveStrength -= 3;
        break;
      case 'walls':
        this.defensiveStrength -= 5;
        this.maxHealth -= 50;
        this.health = Math.min(this.health, this.maxHealth);
        break;
      case 'arsenal':
        this.defensiveStrength -= 8;
        break;
      case 'factory':
        this.production -= 4;
        break;
      case 'hospital':
        this.population = Math.floor(this.population / 1.2); // Reverse 20% growth
        break;
      case 'stock_exchange':
        this.gold -= 5;
        break;
      case 'observatory':
        this.science -= 4;
        break;
      case 'theater':
        this.culture -= 3;
        break;
      case 'broadcast_tower':
        this.culture -= 5;
        break;
    }
  }

  addWonder(wonderType) {
    if (!this.wonders.includes(wonderType)) {
      this.wonders.push(wonderType);
      this.applyWonderEffects(wonderType);
      return true;
    }
    return false;
  }

  applyWonderEffects(wonderType) {
    switch(wonderType) {
      case 'great_library':
        this.science += 5;
        break;
      case 'colossus':
        this.gold += 3;
        break;
      case 'lighthouse':
        this.defensiveStrength += 3;
        break;
      case 'hanging_gardens':
        this.food += 4;
        this.population += 2;
        break;
      case 'oracle':
        this.culture += 5;
        this.science += 2;
        break;
      case 'pyramids':
        this.production += 4;
        this.maxHealth += 100;
        this.health = this.maxHealth;
        break;
      case 'great_wall':
        this.defensiveStrength += 10;
        break;
      case 'statue_of_zeus':
        this.defensiveStrength += 5;
        break;
      case 'temple_of_artemis':
        this.culture += 3;
        this.gold += 2;
        break;
      case 'mausoleum_at_halicarnassus':
        this.culture += 4;
        this.science += 1;
        break;
      case 'alexandria_library':
        this.science += 7;
        break;
      case 'parthenon':
        this.culture += 6;
        break;
      case 'petra':
        this.gold += 5;
        this.food += 2;
        break;
      case 'chichen_itza':
        this.culture += 4;
        this.defensiveStrength += 5;
        break;
      default:
        console.log(`Unknown wonder type: ${wonderType}`);
    }
  }

  // Calculate resources generated per turn
  calculateTurnResources() {
    // Base resources
    let resources = {
      food: this.food,
      production: this.production,
      gold: this.gold,
      science: this.science,
      culture: this.culture
    };

    // Add resources from worked tiles
    for (const tile of this.workedTiles) {
      resources.food += tile.food || 0;
      resources.production += tile.production || 0;
      resources.gold += tile.gold || 0;
      resources.science += tile.science || 0;
      resources.culture += tile.culture || 0;
    }

    // Population-related adjustments
    resources.food -= this.population; // Food consumption
    
    return resources;
  }

  // Add population to the city
  addPopulation(amount) {
    this.population += amount;
    // As population grows, more tiles can be worked
    this.expandWorkableArea();
  }

  // Expand the area of tiles that can be worked
  expandWorkableArea() {
    // In a real implementation, this would add more tiles to the workedTiles array
    // based on the city's population and technological advances
  }

  // Take damage when attacked
  takeDamage(damage) {
    this.health -= damage;
    
    if (this.health <= 0) {
      this.health = 0;
      return true; // City destroyed
    }
    return false; // City still alive
  }

  // Heal the city
  heal(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  // Add to production queue
  addToProductionQueue(itemType) {
    this.productionQueue.push({
      type: itemType,
      turnsRemaining: this.getProductionTime(itemType),
      progress: 0
    });
  }

  // Get the number of turns needed to produce an item
  getProductionTime(itemType) {
    const baseTimes = {
      warrior: 5,
      archer: 5,
      settler: 8,
      worker: 6,
      scout: 4,
      spearman: 6,
      cavalry: 7,
      catapult: 8,
      granary: 10,
      workshop: 12,
      marketplace: 15,
      library: 12,
      temple: 10,
      barracks: 8,
      walls: 20
    };
    
    return baseTimes[itemType] || 10; // Default to 10 turns
  }

  // Process a turn for the city
  processTurn() {
    // Process production
    if (this.productionQueue.length > 0) {
      const currentProduction = this.productionQueue[0];
      currentProduction.progress += this.production;
      
      if (currentProduction.progress >= currentProduction.turnsRemaining * this.production) {
        // Item completed
        this.productionQueue.shift();
        // In a real game, we would add the completed item to the city or player
      }
    }
    
    // Calculate and return resources generated this turn
    return this.calculateTurnResources();
  }
}

module.exports = City;