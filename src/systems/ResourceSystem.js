/**
 * Resource System
 * Handles resource generation, collection, and management
 */
module.exports = function(gameEngine) {
  class ResourceSystem {
    constructor(game) {
      this.game = game;
    }

    update(delta) {
      // Process resource generation for all entities
      for (const entity of this.game.entities) {
        if (entity.resource) {
          this.processResourceGeneration(entity, delta);
        }
      }
      
      // Process resource collection by players
      this.processResourceCollection(delta);
    }

    processResourceGeneration(entity, delta) {
      // Update resource availability over time
      if (entity.resource.value < entity.resource.maxValue) {
        // Resources regenerate slowly over time
        entity.resource.value = Math.min(
          entity.resource.maxValue,
          entity.resource.value + entity.resource.growthRate * delta * 0.01
        );
      }
    }

    processResourceCollection(delta) {
      // Handle resource collection by units
      for (const entity of this.game.entities) {
        if (entity.unit && entity.position) {
          // Check if unit is on a resource tile
          const resourceAtLocation = this.getResourceAtPosition(
            entity.position.x, 
            entity.position.y
          );
          
          if (resourceAtLocation && resourceAtLocation.isAccessibleTo(entity.unit.owner)) {
            // Collect resource
            this.collectResource(entity, resourceAtLocation, delta);
          }
        }
      }
    }

    collectResource(unitEntity, resource, deltaTime) {
      // Check if unit can collect this type of resource
      if (!this.canCollectResource(unitEntity.unit, resource)) {
        return false;
      }

      // Calculate collection rate
      const collectionRate = this.getCollectionRate(unitEntity.unit, resource);
      
      // Amount to collect
      const amountToCollect = collectionRate * deltaTime * 0.01;
      
      // Cap collection to available resource
      const actualAmount = Math.min(amountToCollect, resource.value);
      
      // Add resource to player
      const player = this.getPlayerById(unitEntity.unit.owner);
      if (player) {
        player.addResource(resource.type, actualAmount);
        
        // Reduce resource at location
        resource.value -= actualAmount;
        
        // Log collection event
        console.log(`Player ${player.id} collected ${actualAmount} ${resource.type} at (${unitEntity.position.x}, ${unitEntity.position.y})`);
        
        return true;
      }
      
      return false;
    }

    canCollectResource(unit, resource) {
      // Different units can collect different resources
      switch(unit.type) {
        case 'worker':
          // Workers can collect most resources
          return true;
        case 'settler':
          // Settlers can sometimes collect resources
          return ['food', 'gold'].includes(resource.type);
        case 'scout':
          // Scouts can gather basic resources
          return ['food'].includes(resource.type);
        default:
          // Most military units can't collect resources
          return false;
      }
    }

    getCollectionRate(unit, resource) {
      // Base collection rate varies by unit type
      let rate = 0;
      
      switch(unit.type) {
        case 'worker':
          rate = 2.0; // Workers are efficient collectors
          break;
        case 'settler':
          rate = 1.0; // Settlers are OK at collecting
          break;
        case 'scout':
          rate = 0.5; // Scouts are not great at collection
          break;
        default:
          rate = 0.1; // Military units are inefficient
      }
      
      // Apply technology bonuses
      const techBonus = this.getTechnologyBonus(unit.owner, 'resource_collection');
      rate *= (1 + techBonus);
      
      // Apply terrain bonuses
      const tile = this.getTileAt(unit.position.x, unit.position.y);
      if (tile && tile.improvement) {
        // Improvements like farms, mines increase collection efficiency
        switch(tile.improvement) {
          case 'farm':
            if (resource.type === 'food') rate *= 1.5;
            break;
          case 'mine':
            if (['gold', 'production'].includes(resource.type)) rate *= 1.5;
            break;
          case 'camp':
            if (['food', 'production'].includes(resource.type)) rate *= 1.3;
            break;
        }
      }
      
      return rate;
    }

    /**
     * Generates resources for a city based on its tiles
     */
    generateCityResources(cityEntity) {
      if (!cityEntity.city) return;
      
      const player = this.getPlayerById(cityEntity.city.owner);
      if (!player) return;
      
      // Calculate resources from worked tiles
      const resourcesGenerated = {
        food: 0,
        production: 0,
        gold: 0,
        science: 0,
        culture: 0
      };
      
      // Each city works a certain number of tiles
      const workedTiles = this.getWorkedTiles(cityEntity);
      
      for (const tile of workedTiles) {
        // Add base tile yield
        resourcesGenerated.food += tile.getYield('food');
        resourcesGenerated.production += tile.getYield('production');
        resourcesGenerated.gold += tile.getYield('gold');
        resourcesGenerated.science += tile.getYield('science');
        resourcesGenerated.culture += tile.getYield('culture');
        
        // Add resource yield if present
        if (tile.resource) {
          const resourceValue = tile.getResourceValue();
          resourcesGenerated[tile.resource.type] += resourceValue;
        }
      }
      
      // Apply city-specific modifiers
      if (cityEntity.city.specialists) {
        for (const [specialist, count] of Object.entries(cityEntity.city.specialists)) {
          switch(specialist) {
            case 'scientist':
              resourcesGenerated.science += count * 3;
              resourcesGenerated.gold += count * 1;
              break;
            case 'merchant':
              resourcesGenerated.gold += count * 3;
              resourcesGenerated.production += count * 1;
              break;
            case 'artist':
              resourcesGenerated.culture += count * 3;
              resourcesGenerated.science += count * 1;
              break;
          }
        }
      }
      
      // Apply player-wide modifiers
      const playerModifiers = this.getPlayerResourceModifiers(player.id);
      for (const [resource, modifier] of Object.entries(playerModifiers)) {
        resourcesGenerated[resource] *= (1 + modifier);
      }
      
      // Add resources to player
      for (const [resource, amount] of Object.entries(resourcesGenerated)) {
        if (amount > 0) {
          player.addResource(resource, Math.floor(amount));
        }
      }
      
      // Log resource generation
      console.log(`City ${cityEntity.id} generated resources:`, resourcesGenerated);
    }

    /**
     * Gets the tiles worked by a city
     */
    getWorkedTiles(cityEntity) {
      // In a real implementation, this would return the tiles assigned to work
      // For now, return a simple radius around the city
      const tiles = [];
      const centerX = cityEntity.position.x;
      const centerY = cityEntity.position.y;
      
      // Work tiles within radius 2
      for (let x = centerX - 2; x <= centerX + 2; x++) {
        for (let y = centerY - 2; y <= centerY + 2; y++) {
          // Skip center tile if it's the city
          if (x === centerX && y === centerY) continue;
          
          // Check if within circular range
          const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
          if (distance <= 2) {
            tiles.push(this.getTileAt(x, y));
          }
        }
      }
      
      return tiles;
    }

    /**
     * Gets resource at a specific position
     */
    getResourceAtPosition(x, y) {
      // This would normally access the actual resource data
      // For now, return a mock resource
      if (x === 5 && y === 5) {
        return {
          type: 'gold',
          value: 100,
          maxValue: 100,
          growthRate: 0.1,
          isAccessibleTo: () => true
        };
      } else if (x === 8 && y === 3) {
        return {
          type: 'food',
          value: 80,
          maxValue: 80,
          growthRate: 0.2,
          isAccessibleTo: () => true
        };
      }
      
      return null;
    }

    /**
     * Gets tile at a specific position
     */
    getTileAt(x, y) {
      // This would normally access the actual tile data
      // For now, return a mock tile
      return {
        x: x,
        y: y,
        getYield: (resourceType) => {
          // Base yields vary by tile type
          if (x % 4 === 0 && y % 4 === 0) {
            // Bonus tile
            return resourceType === 'food' ? 3 : resourceType === 'production' ? 2 : 1;
          } else if (x % 7 === 0 || y % 7 === 0) {
            // Forest tile
            return resourceType === 'production' ? 1 : resourceType === 'food' ? 1 : 0;
          } else {
            // Regular tile
            return resourceType === 'food' ? 2 : resourceType === 'production' ? 1 : 1;
          }
        },
        resource: this.getResourceAtPosition(x, y),
        getResourceValue: () => {
          const resource = this.getResourceAtPosition(x, y);
          return resource ? resource.value : 0;
        },
        improvement: null
      };
    }

    /**
     * Gets a player by ID
     */
    getPlayerById(playerId) {
      // This would normally access the actual player data
      // For now, return a mock player
      return {
        id: playerId,
        addResource: (type, amount) => {
          console.log(`Added ${amount} ${type} to player ${playerId}`);
        }
      };
    }

    /**
     * Gets resource modifiers for a player
     */
    getPlayerResourceModifiers(playerId) {
      // This would normally access player's technologies, policies, etc.
      // For now, return neutral modifiers
      return {
        food: 0,
        production: 0,
        gold: 0,
        science: 0,
        culture: 0
      };
    }

    /**
     * Gets technology bonus for a player
     */
    getTechnologyBonus(playerId, techType) {
      // This would normally check the player's research
      // For now, return 0
      return 0;
    }
  }

  return new ResourceSystem(gameEngine);
};