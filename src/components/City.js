/**
 * City Component
 * Represents a city in the game
 */

class City {
  constructor(owner, x, y, name = null) {
    this.owner = owner; // Player ID that owns the city
    this.position = { x, y };
    this.name = name || this.generateRandomName();
    this.population = 1;
    this.health = 100;
    this.maxHealth = 100;
    
    // City resources and production
    this.food = 0;
    this.production = 0;
    this.gold = 0;
    this.science = 0;
    this.culture = 0;
    
    // City defenses
    this.defense = 3; // Base defense value
    
    // City development
    this.buildings = [];
    this.specialists = {
      scientist: 0,
      merchant: 0,
      artist: 0
    };
    
    // Production queue
    this.productionQueue = [];
    
    // Tiles worked by the city
    this.workedTiles = [];
    
    // Growth requirements
    this.foodNeededForGrowth = 15;
    this.foodStored = 0;
    
    // Expansion
    this.tileRadius = 1; // Radius of tiles controlled by the city
    
    // Status
    this.isConnectedToCapital = false;
    this.isInResistance = false;
    this.resistanceTurnsLeft = 0;
    
    // Wonders
    this.wondersBuilt = [];
  }

  /**
   * Generate a random name for the city
   */
  generateRandomName() {
    const prefixes = ['New', 'Great', 'Fort', 'Port', 'Mount', 'Lake', 'River', 'Valley', 'Green', 'Golden'];
    const roots = ['York', 'Paris', 'Rome', 'Athens', 'Alexandria', 'London', 'Berlin', 'Madrid', 'Vienna', 'Dublin'];
    const suffixes = ['City', 'Town', 'Vale', 'Field', 'Bridge', 'Gate', 'Haven', 'Falls', 'Point', 'Bay'];
    
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

  /**
   * Add a building to the city
   */
  addBuilding(buildingType) {
    if (!this.buildings.includes(buildingType)) {
      this.buildings.push(buildingType);
      this.applyBuildingEffects(buildingType);
      return true;
    }
    return false;
  }

  /**
   * Remove a building from the city
   */
  removeBuilding(buildingType) {
    const index = this.buildings.indexOf(buildingType);
    if (index !== -1) {
      this.buildings.splice(index, 1);
      this.removeBuildingEffects(buildingType);
      return true;
    }
    return false;
  }

  /**
   * Apply effects of a building
   */
  applyBuildingEffects(buildingType) {
    switch(buildingType) {
      case 'granary':
        this.food += 2;
        break;
      case 'workshop':
        this.production += 2;
        break;
      case 'market':
        this.gold += 3;
        break;
      case 'library':
        this.science += 2;
        break;
      case 'temple':
        this.culture += 2;
        break;
      case 'barracks':
        this.defense += 2;
        break;
      case 'walls':
        this.defense += 5;
        this.maxHealth += 50;
        this.health = this.maxHealth; // Restore health when walls are built
        break;
      case 'harbor':
        this.gold += 2;
        this.production += 1;
        break;
      case 'university':
        this.science += 3;
        this.culture += 1;
        break;
      case 'bank':
        this.gold += 4;
        break;
      case 'factory':
        this.production += 4;
        this.science += 1;
        break;
      case 'observatory':
        this.science += 4;
        break;
      case 'theater':
        this.culture += 3;
        break;
      case 'monument':
        this.culture += 2;
        break;
      case 'seaport':
        this.gold += 3;
        this.production += 2;
        break;
      case 'airport':
        this.gold += 2;
        this.science += 2;
        break;
      case 'spaceship_factory':
        this.production += 5;
        this.science += 3;
        break;
    }
  }

  /**
   * Remove effects of a building
   */
  removeBuildingEffects(buildingType) {
    switch(buildingType) {
      case 'granary':
        this.food -= 2;
        break;
      case 'workshop':
        this.production -= 2;
        break;
      case 'market':
        this.gold -= 3;
        break;
      case 'library':
        this.science -= 2;
        break;
      case 'temple':
        this.culture -= 2;
        break;
      case 'barracks':
        this.defense -= 2;
        break;
      case 'walls':
        this.defense -= 5;
        this.maxHealth -= 50;
        // Ensure health doesn't exceed new max
        this.health = Math.min(this.health, this.maxHealth);
        break;
      case 'harbor':
        this.gold -= 2;
        this.production -= 1;
        break;
      case 'university':
        this.science -= 3;
        this.culture -= 1;
        break;
      case 'bank':
        this.gold -= 4;
        break;
      case 'factory':
        this.production -= 4;
        this.science -= 1;
        break;
      case 'observatory':
        this.science -= 4;
        break;
      case 'theater':
        this.culture -= 3;
        break;
      case 'monument':
        this.culture -= 2;
        break;
      case 'seaport':
        this.gold -= 3;
        this.production -= 2;
        break;
      case 'airport':
        this.gold -= 2;
        this.science -= 2;
        break;
      case 'spaceship_factory':
        this.production -= 5;
        this.science -= 3;
        break;
    }
  }

  /**
   * Add a specialist to the city
   */
  addSpecialist(type) {
    if (['scientist', 'merchant', 'artist'].includes(type)) {
      this.specialists[type]++;
      this.applySpecialistEffect(type);
      return true;
    }
    return false;
  }

  /**
   * Remove a specialist from the city
   */
  removeSpecialist(type) {
    if (['scientist', 'merchant', 'artist'].includes(type) && this.specialists[type] > 0) {
      this.specialists[type]--;
      this.removeSpecialistEffect(type);
      return true;
    }
    return false;
  }

  /**
   * Apply effect of a specialist
   */
  applySpecialistEffect(type) {
    switch(type) {
      case 'scientist':
        this.science += 3;
        this.gold += 1;
        break;
      case 'merchant':
        this.gold += 3;
        this.production += 1;
        break;
      case 'artist':
        this.culture += 3;
        this.science += 1;
        break;
    }
  }

  /**
   * Remove effect of a specialist
   */
  removeSpecialistEffect(type) {
    switch(type) {
      case 'scientist':
        this.science -= 3;
        this.gold -= 1;
        break;
      case 'merchant':
        this.gold -= 3;
        this.production -= 1;
        break;
      case 'artist':
        this.culture -= 3;
        this.science -= 1;
        break;
    }
  }

  /**
   * Add food to the city's storage
   */
  addFood(amount) {
    this.foodStored += amount;
    
    // Check if city grows
    if (this.foodStored >= this.foodNeededForGrowth) {
      this.growPopulation();
    }
  }

  /**
   * Grow the city's population
   */
  growPopulation() {
    this.population++;
    this.foodStored -= this.foodNeededForGrowth;
    
    // Increase food needed for next growth
    this.foodNeededForGrowth = Math.floor(this.foodNeededForGrowth * 1.4);
    
    // Expand city radius every few population increases
    if (this.population % 3 === 0 && this.tileRadius < 3) {
      this.expandRadius();
    }
  }

  /**
   * Expand the city's radius to work more tiles
   */
  expandRadius() {
    this.tileRadius++;
  }

  /**
   * Set a tile to be worked by the city
   */
  assignTile(x, y) {
    // Check if tile is within city radius
    const distance = Math.abs(this.position.x - x) + Math.abs(this.position.y - y);
    if (distance <= this.tileRadius) {
      const tileKey = `${x},${y}`;
      if (!this.workedTiles.includes(tileKey)) {
        this.workedTiles.push(tileKey);
        return true;
      }
    }
    return false;
  }

  /**
   * Remove a tile from the city's worked tiles
   */
  unassignTile(x, y) {
    const tileKey = `${x},${y}`;
    const index = this.workedTiles.indexOf(tileKey);
    if (index !== -1) {
      this.workedTiles.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Calculate the yield from worked tiles
   */
  calculateTileYields(terrainData) {
    // Reset yields
    this.food = 0;
    this.production = 0;
    this.gold = 0;
    this.science = 0;
    this.culture = 0;
    
    // Calculate base yields from worked tiles
    for (const tileKey of this.workedTiles) {
      const [x, y] = tileKey.split(',').map(Number);
      
      // This would normally access the actual terrain data
      // For now, we'll use a simple calculation
      if (x !== undefined && y !== undefined) {
        // Base yields depend on terrain type
        // This is simplified - in a real game, this would access the actual tile data
        this.food += 2;
        this.production += 1;
        this.gold += 0.5;
        this.science += 0.5;
        this.culture += 0.3;
      }
    }
    
    // Add yields from buildings and specialists
    // These are already factored into the property values
  }

  /**
   * Add a unit to the city's garrison
   */
  addToGarrison(unitId) {
    if (!this.garrison) {
      this.garrison = [];
    }
    
    if (!this.garrison.includes(unitId)) {
      this.garrison.push(unitId);
      // Increase defense when units are garrisoned
      this.defense += 2;
      return true;
    }
    return false;
  }

  /**
   * Remove a unit from the city's garrison
   */
  removeFromGarrison(unitId) {
    if (!this.garrison) return false;
    
    const index = this.garrison.indexOf(unitId);
    if (index !== -1) {
      this.garrison.splice(index, 1);
      // Decrease defense when units leave garrison
      this.defense -= 2;
      return true;
    }
    return false;
  }

  /**
   * Add a wonder to the city
   */
  addWonder(wonderName) {
    if (!this.wondersBuilt.includes(wonderName)) {
      this.wondersBuilt.push(wonderName);
      this.applyWonderEffect(wonderName);
      return true;
    }
    return false;
  }

  /**
   * Apply effect of a wonder
   */
  applyWonderEffect(wonderName) {
    // Wonder effects would be implemented here
    switch(wonderName) {
      case 'great_library':
        this.science += 5;
        break;
      case 'colossus':
        this.gold += 3;
        break;
      case 'lighthouse':
        this.defense += 3;
        break;
      case 'hanging_gardens':
        this.food += 4;
        break;
      case 'oracle':
        this.culture += 5;
        break;
      case 'pyramids':
        this.production += 4;
        break;
      case 'great_wall':
        this.defense += 10;
        break;
      case 'statue_of_zeus':
        this.defense += 5;
        break;
    }
  }

  /**
   * Check if city can build something
   */
  canBuild(itemType) {
    // This would check if the city has required buildings, techs, etc.
    // For now, just return true
    return true;
  }

  /**
   * Queue an item for production
   */
  queueProduction(itemType) {
    if (this.canBuild(itemType)) {
      this.productionQueue.push(itemType);
      return true;
    }
    return false;
  }

  /**
   * Remove an item from the production queue
   */
  dequeueProduction(itemType) {
    const index = this.productionQueue.indexOf(itemType);
    if (index !== -1) {
      this.productionQueue.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Process city turns - called each turn
   */
  processTurn() {
    // Calculate tile yields
    // This would normally receive terrain data as parameter
    this.calculateTileYields();
    
    // Add specialist yields
    this.science += this.specialists.scientist * 3;
    this.gold += this.specialists.merchant * 3;
    this.culture += this.specialists.artist * 3;
    
    // Add food to storage for growth
    this.addFood(this.food);
    
    // Ensure positive values
    this.food = Math.max(0, this.food);
    this.production = Math.max(0, this.production);
    this.gold = Math.max(0, this.gold);
    this.science = Math.max(0, this.science);
    this.culture = Math.max(0, this.culture);
    
    // Handle resistance status
    if (this.isInResistance) {
      this.resistanceTurnsLeft--;
      if (this.resistanceTurnsLeft <= 0) {
        this.isInResistance = false;
      }
    }
  }

  /**
   * Damage the city
   */
  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.health = 0;
      return true; // City destroyed
    }
    return false; // City still alive
  }

  /**
   * Heal the city
   */
  heal(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  /**
   * Check if city is connected to capital
   */
  isConnected() {
    return this.isConnectedToCapital;
  }

  /**
   * Get city's total yield per turn
   */
  getTotalYield() {
    return {
      food: this.food,
      production: this.production,
      gold: this.gold,
      science: this.science,
      culture: this.culture
    };
  }
}

module.exports = City;