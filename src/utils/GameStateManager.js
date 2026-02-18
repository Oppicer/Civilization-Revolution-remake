/**
 * Game State Manager for Civilization Revolution Remake
 * Handles saving, loading, and managing game state
 */

const fs = require('fs').promises;
const path = require('path');

class GameStateManager {
  constructor(gameEngine) {
    this.game = gameEngine;
    this.saveDirectory = path.join(__dirname, '../saves');
    this.currentSaveName = null;
  }

  /**
   * Save the current game state to a file
   * @param {string} saveName - Name of the save file
   * @returns {Promise<boolean>} Whether the save was successful
   */
  async saveGame(saveName) {
    try {
      // Ensure save directory exists
      await this.ensureSaveDirectory();

      // Prepare game state for serialization
      const gameStateData = this.prepareGameStateForSerialization();

      // Create save file path
      const savePath = path.join(this.saveDirectory, `${saveName}.json`);

      // Write game state to file
      await fs.writeFile(savePath, JSON.stringify(gameStateData, null, 2));

      console.log(`Game saved successfully as ${saveName}`);
      this.currentSaveName = saveName;
      return true;
    } catch (error) {
      console.error('Error saving game:', error);
      return false;
    }
  }

  /**
   * Load a game state from a file
   * @param {string} saveName - Name of the save file
   * @returns {Promise<boolean>} Whether the load was successful
   */
  async loadGame(saveName) {
    try {
      // Create save file path
      const savePath = path.join(this.saveDirectory, `${saveName}.json`);

      // Read game state from file
      const data = await fs.readFile(savePath, 'utf8');
      const gameStateData = JSON.parse(data);

      // Restore game state from loaded data
      this.restoreGameStateFromSerialization(gameStateData);

      console.log(`Game loaded successfully from ${saveName}`);
      this.currentSaveName = saveName;
      return true;
    } catch (error) {
      console.error('Error loading game:', error);
      return false;
    }
  }

  /**
   * Prepare game state for serialization
   * @returns {Object} Serializable game state
   */
  prepareGameStateForSerialization() {
    // Extract essential game state data
    const serializableState = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      gameState: {
        players: this.serializePlayers(),
        currentTurn: this.game.gameState.currentTurn,
        turnPhase: this.game.gameState.turnPhase,
        map: this.serializeMap(),
        selectedEntity: this.game.gameState.selectedEntity ? this.game.gameState.selectedEntity.id : null,
        isRunning: this.game.gameState.isRunning,
        gameSpeed: this.game.gameState.gameSpeed,
        gameDate: this.game.gameState.gameDate
      },
      entities: this.serializeEntities(),
      systems: this.serializeSystems()
    };

    return serializableState;
  }

  /**
   * Restore game state from serialized data
   * @param {Object} gameStateData - Serialized game state
   */
  restoreGameStateFromSerialization(gameStateData) {
    // Restore basic game state
    this.game.gameState.players = this.deserializePlayers(gameStateData.gameState.players);
    this.game.gameState.currentTurn = gameStateData.gameState.currentTurn;
    this.game.gameState.turnPhase = gameStateData.gameState.turnPhase;
    this.game.gameState.map = this.deserializeMap(gameStateData.gameState.map);
    this.game.gameState.isRunning = gameStateData.gameState.isRunning;
    this.game.gameState.gameSpeed = gameStateData.gameState.gameSpeed;
    this.game.gameState.gameDate = gameStateData.gameState.gameDate;

    // Restore entities
    this.game.entities = this.deserializeEntities(gameStateData.entities);
    
    // Link selected entity
    if (gameStateData.gameState.selectedEntity) {
      this.game.gameState.selectedEntity = this.game.getEntityById(gameStateData.gameState.selectedEntity);
    }

    // Restore system states
    this.deserializeSystems(gameStateData.systems);

    console.log('Game state restored from save');
  }

  /**
   * Serialize player data
   * @returns {Array} Serialized player data
   */
  serializePlayers() {
    return this.game.gameState.players.map(player => ({
      id: player.id,
      name: player.name,
      color: player.color,
      civilization: player.civilization,
      resources: { ...player.resources },
      units: [...player.units],
      cities: [...player.cities],
      technologies: [...player.technologies],
      policies: [...player.policies],
      isHuman: player.isHuman,
      victoryPoints: player.victoryPoints,
      techProgress: { ...player.techProgress },
      hasTurn: player.hasTurn
    }));
  }

  /**
   * Deserialize player data
   * @param {Array} playerData - Serialized player data
   * @returns {Array} Deserialized player objects
   */
  deserializePlayers(playerData) {
    const Player = this.game.components.Player;
    return playerData.map(data => {
      const player = new Player(data.id, data.name, data.color, data.civilization);
      
      // Restore properties
      player.resources = { ...data.resources };
      player.units = [...data.units];
      player.cities = [...data.cities];
      player.technologies = [...data.technologies];
      player.policies = [...data.policies];
      player.isHuman = data.isHuman;
      player.victoryPoints = data.victoryPoints;
      player.techProgress = { ...data.techProgress };
      player.hasTurn = data.hasTurn;
      
      return player;
    });
  }

  /**
   * Serialize map data
   * @returns {Array} Serialized map data
   */
  serializeMap() {
    if (!this.game.gameState.map) return null;
    
    const serializedMap = [];
    for (let x = 0; x < this.game.gameState.map.length; x++) {
      serializedMap[x] = [];
      for (let y = 0; y < this.game.gameState.map[x].length; y++) {
        const tile = this.game.gameState.map[x][y];
        serializedMap[x][y] = {
          x: tile.x,
          y: tile.y,
          type: tile.type,
          terrainModifier: tile.terrainModifier,
          resource: tile.resource ? {
            type: tile.resource.type,
            value: tile.resource.value,
            position: { ...tile.resource.position },
            isStrategic: tile.resource.isStrategic,
            isLuxury: tile.resource.isLuxury,
            isBonus: tile.resource.isBonus,
            usedBy: tile.resource.usedBy,
            accessedBy: [...tile.resource.accessedBy]
          } : null,
          improvement: tile.improvement,
          walkable: tile.walkable,
          defenseBonus: tile.defenseBonus
        };
      }
    }
    
    return serializedMap;
  }

  /**
   * Deserialize map data
   * @param {Array} mapData - Serialized map data
   * @returns {Array} Deserialized map
   */
  deserializeMap(mapData) {
    if (!mapData) return null;
    
    const Tile = this.game.components.Tile;
    const Resource = this.game.components.Resource;
    
    const deserializedMap = [];
    for (let x = 0; x < mapData.length; x++) {
      deserializedMap[x] = [];
      for (let y = 0; y < mapData[x].length; y++) {
        const tileData = mapData[x][y];
        const tile = new Tile(tileData.x, tileData.y, tileData.type, tileData.terrainModifier);
        
        // Restore tile properties
        tile.improvement = tileData.improvement;
        tile.walkable = tileData.walkable;
        tile.defenseBonus = tileData.defenseBonus;
        
        // Restore resource if it exists
        if (tileData.resource) {
          tile.resource = new Resource(
            tileData.resource.type,
            tileData.resource.value,
            tileData.resource.position
          );
          
          tile.resource.isStrategic = tileData.resource.isStrategic;
          tile.resource.isLuxury = tileData.resource.isLuxury;
          tile.resource.isBonus = tileData.resource.isBonus;
          tile.resource.usedBy = tileData.resource.usedBy;
          tile.resource.accessedBy = [...tileData.resource.accessedBy];
        }
        
        deserializedMap[x][y] = tile;
      }
    }
    
    return deserializedMap;
  }

  /**
   * Serialize entities
   * @returns {Array} Serialized entity data
   */
  serializeEntities() {
    return this.game.entities.map(entity => {
      const serializedEntity = { id: entity.id };
      
      // Serialize each component
      if (entity.position) {
        serializedEntity.position = {
          x: entity.position.x,
          y: entity.position.y
        };
      }
      
      if (entity.unit) {
        serializedEntity.unit = {
          type: entity.unit.type,
          owner: entity.unit.owner,
          health: entity.unit.health,
          maxHealth: entity.unit.maxHealth,
          attack: entity.unit.attack,
          defense: entity.unit.defense,
          movement: entity.unit.movement,
          maxMovement: entity.unit.maxMovement,
          range: entity.unit.range,
          level: entity.unit.level,
          experience: entity.unit.experience,
          upgradeThreshold: entity.unit.upgradeThreshold,
          actionsRemaining: entity.unit.actionsRemaining,
          promoted: entity.unit.promoted
        };
      }
      
      if (entity.tile) {
        serializedEntity.tile = {
          x: entity.tile.x,
          y: entity.tile.y,
          type: entity.tile.type,
          terrainModifier: entity.tile.terrainModifier,
          walkable: entity.tile.walkable,
          defenseBonus: entity.tile.defenseBonus
        };
      }
      
      if (entity.resource) {
        serializedEntity.resource = {
          type: entity.resource.type,
          value: entity.resource.value,
          position: { ...entity.resource.position },
          isStrategic: entity.resource.isStrategic,
          isLuxury: entity.resource.isLuxury,
          isBonus: entity.resource.isBonus,
          usedBy: entity.resource.usedBy,
          accessedBy: [...entity.resource.accessedBy]
        };
      }
      
      if (entity.player) {
        serializedEntity.player = {
          id: entity.player.id,
          name: entity.player.name,
          color: entity.player.color,
          civilization: entity.player.civilization,
          resources: { ...entity.player.resources },
          units: [...entity.player.units],
          cities: [...entity.player.cities],
          technologies: [...entity.player.technologies],
          policies: [...entity.player.policies],
          isHuman: entity.player.isHuman,
          victoryPoints: entity.player.victoryPoints,
          techProgress: { ...entity.player.techProgress },
          hasTurn: entity.player.hasTurn
        };
      }
      
      return serializedEntity;
    });
  }

  /**
   * Deserialize entities
   * @param {Array} entitiesData - Serialized entity data
   * @returns {Array} Deserialized entities
   */
  deserializeEntities(entitiesData) {
    const entities = [];
    
    for (const entityData of entitiesData) {
      const entity = { id: entityData.id };
      
      // Deserialize components
      if (entityData.position) {
        const Position = this.game.components.Position;
        entity.position = new Position(entityData.position.x, entityData.position.y);
      }
      
      if (entityData.unit) {
        const Unit = this.game.components.Unit;
        entity.unit = new Unit(
          entityData.unit.type,
          entityData.unit.owner,
          entityData.unit.x || 0,
          entityData.unit.y || 0
        );
        
        // Restore unit properties
        entity.unit.health = entityData.unit.health;
        entity.unit.maxHealth = entityData.unit.maxHealth;
        entity.unit.attack = entityData.unit.attack;
        entity.unit.defense = entityData.unit.defense;
        entity.unit.movement = entityData.unit.movement;
        entity.unit.maxMovement = entityData.unit.maxMovement;
        entity.unit.range = entityData.unit.range;
        entity.unit.level = entityData.unit.level;
        entity.unit.experience = entityData.unit.experience;
        entity.unit.upgradeThreshold = entityData.unit.upgradeThreshold;
        entity.unit.actionsRemaining = entityData.unit.actionsRemaining;
        entity.unit.promoted = entityData.unit.promoted;
      }
      
      if (entityData.tile) {
        const Tile = this.game.components.Tile;
        entity.tile = new Tile(
          entityData.tile.x,
          entityData.tile.y,
          entityData.tile.type,
          entityData.tile.terrainModifier
        );
        
        // Restore tile properties
        entity.tile.walkable = entityData.tile.walkable;
        entity.tile.defenseBonus = entityData.tile.defenseBonus;
      }
      
      if (entityData.resource) {
        const Resource = this.game.components.Resource;
        entity.resource = new Resource(
          entityData.resource.type,
          entityData.resource.value,
          entityData.resource.position
        );
        
        // Restore resource properties
        entity.resource.isStrategic = entityData.resource.isStrategic;
        entity.resource.isLuxury = entityData.resource.isLuxury;
        entity.resource.isBonus = entityData.resource.isBonus;
        entity.resource.usedBy = entityData.resource.usedBy;
        entity.resource.accessedBy = [...entityData.resource.accessedBy];
      }
      
      if (entityData.player) {
        const Player = this.game.components.Player;
        entity.player = new Player(
          entityData.player.id,
          entityData.player.name,
          entityData.player.color,
          entityData.player.civilization
        );
        
        // Restore player properties
        entity.player.resources = { ...entityData.player.resources };
        entity.player.units = [...entityData.player.units];
        entity.player.cities = [...entityData.player.cities];
        entity.player.technologies = [...entityData.player.technologies];
        entity.player.policies = [...entityData.player.policies];
        entity.player.isHuman = entityData.player.isHuman;
        entity.player.victoryPoints = entityData.player.victoryPoints;
        entity.player.techProgress = { ...entityData.player.techProgress };
        entity.player.hasTurn = entityData.player.hasTurn;
      }
      
      entities.push(entity);
    }
    
    return entities;
  }

  /**
   * Serialize system states
   * @returns {Object} Serialized system states
   */
  serializeSystems() {
    const serializedSystems = {};
    
    // For now, we'll just serialize basic system information
    // More complex systems might require custom serialization methods
    for (const [name, system] of Object.entries(this.game.systems)) {
      if (typeof system.serialize === 'function') {
        serializedSystems[name] = system.serialize();
      } else {
        // Default serialization for systems without custom method
        serializedSystems[name] = {
          name: name,
          enabled: typeof system.update === 'function'
        };
      }
    }
    
    return serializedSystems;
  }

  /**
   * Deserialize system states
   * @param {Object} systemsData - Serialized system states
   */
  deserializeSystems(systemsData) {
    // Systems are typically recreated during game initialization
    // We might need to restore specific states if the systems support it
    console.log('Systems restored from save');
  }

  /**
   * Ensure the save directory exists
   * @returns {Promise<void>}
   */
  async ensureSaveDirectory() {
    try {
      await fs.mkdir(this.saveDirectory, { recursive: true });
    } catch (error) {
      console.error('Error creating save directory:', error);
      throw error;
    }
  }

  /**
   * Get list of available saves
   * @returns {Promise<Array>} List of save names
   */
  async getSaveList() {
    try {
      await this.ensureSaveDirectory();
      const files = await fs.readdir(this.saveDirectory);
      return files.filter(file => file.endsWith('.json')).map(file => file.replace('.json', ''));
    } catch (error) {
      console.error('Error getting save list:', error);
      return [];
    }
  }

  /**
   * Delete a save file
   * @param {string} saveName - Name of the save to delete
   * @returns {Promise<boolean>} Whether the deletion was successful
   */
  async deleteSave(saveName) {
    try {
      const savePath = path.join(this.saveDirectory, `${saveName}.json`);
      await fs.unlink(savePath);
      console.log(`Save ${saveName} deleted`);
      return true;
    } catch (error) {
      console.error('Error deleting save:', error);
      return false;
    }
  }

  /**
   * Auto-save the game
   * @returns {Promise<boolean>} Whether the auto-save was successful
   */
  async autoSave() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const autoSaveName = `autosave_${timestamp}`;
    return await this.saveGame(autoSaveName);
  }

  /**
   * Quick save the game
   * @returns {Promise<boolean>} Whether the quick save was successful
   */
  async quickSave() {
    return await this.saveGame('quicksave');
  }

  /**
   * Quick load the game
   * @returns {Promise<boolean>} Whether the quick load was successful
   */
  async quickLoad() {
    const saves = await this.getSaveList();
    if (saves.includes('quicksave')) {
      return await this.loadGame('quicksave');
    }
    console.log('No quicksave found');
    return false;
  }
}

module.exports = GameStateManager;