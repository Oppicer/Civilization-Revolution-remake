/**
 * Main Game Engine for Civilization Revolution Remake
 */

const PIXI = require('pixi.js');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

class GameEngine {
  constructor() {
    // Initialize Pixi Application
    this.app = new PIXI.Application({
      width: 1200,
      height: 800,
      backgroundColor: 0x1099bb,
      antialias: true
    });

    this.renderer = this.app.renderer;
    this.stage = this.app.stage;

    // Game state
    this.gameState = {
      players: [],
      currentTurn: 0,
      map: null,
      selectedEntity: null,
      isRunning: false
    };

    // Initialize game systems
    this.systems = {};
    this.components = {};
    this.entities = [];
    this.entityIdCounter = 0;

    // Initialize ECS (Entity Component System)
    this.initializeECS();

    // Initialize game loop
    this.gameLoop = this.gameLoop.bind(this);
    this.app.ticker.add(this.gameLoop);

    // Setup server
    this.setupServer();
  }

  initializeECS() {
    // Import components
    this.components.Position = require('./components/Position');
    this.components.Tile = require('./components/Tile');
    this.components.Unit = require('./components/Unit');
    this.components.Player = require('./components/Player');
    this.components.Resource = require('./components/Resource');
    this.components.City = require('./components/City');

    // Import systems
    this.systems.RenderSystem = require('./systems/RenderSystem')(this);
    this.systems.InputSystem = require('./systems/InputSystem')(this);
    this.systems.MovementSystem = require('./systems/MovementSystem')(this);
    this.systems.CombatSystem = require('./systems/CombatSystem')(this);
    this.systems.ResourceSystem = require('./systems/ResourceSystem')(this);

    // Import utilities
    this.Pathfinder = require('./utils/Pathfinder')(this);
    this.GameStateManager = new (require('./utils/GameStateManager'))(this);
  }

  setupServer() {
    this.serverApp = express();
    this.server = http.createServer(this.serverApp);
    this.io = socketIo(this.server);

    // Serve static files
    this.serverApp.use(express.static('public'));
    
    // Serve game page
    this.serverApp.get('/', (req, res) => {
      res.sendFile(__dirname + '/index.html');
    });

    // Handle socket connections
    this.io.on('connection', (socket) => {
      console.log('Player connected:', socket.id);

      // Send initial game state
      socket.emit('game_state', this.gameState);

      socket.on('disconnect', () => {
        console.log('Player disconnected:', socket.id);
      });

      socket.on('player_action', (data) => {
        this.handlePlayerAction(data, socket.id);
        // Broadcast action to other players
        socket.broadcast.emit('player_action', data);
      });
    });

    const PORT = process.env.PORT || 3000;
    this.server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  }

  handlePlayerAction(data, playerId) {
    switch(data.type) {
      case 'end_turn':
        this.endCurrentTurn();
        break;
      case 'move_unit':
        this.moveUnit(data.unitId, data.toX, data.toY);
        break;
      case 'attack':
        this.performCombat(data.attackerId, data.defenderId);
        break;
      case 'build_unit':
        this.buildUnit(data.playerId, data.unitType, data.x, data.y);
        break;
      case 'build_city':
        this.buildCity(data.playerId, data.x, data.y, data.cityName);
        break;
      case 'select_unit':
        this.selectUnit(data.unitId);
        break;
      case 'select_city':
        this.selectCity(data.cityId);
        break;
      case 'save_game':
        this.saveGame(data.save_name);
        break;
      case 'load_game':
        this.loadGame(data.save_name);
        break;
    }
  }

  /**
   * Creates a new entity with the given components
   */
  createEntity(components = {}) {
    const entityId = this.entityIdCounter++;
    const entity = { id: entityId, ...components };
    
    this.entities.push(entity);
    return entity;
  }

  /**
   * Finds an entity by ID
   */
  getEntityById(id) {
    return this.entities.find(entity => entity.id === id);
  }

  /**
   * Removes an entity by ID
   */
  removeEntityById(id) {
    const index = this.entities.findIndex(entity => entity.id === id);
    if (index !== -1) {
      this.entities.splice(index, 1);
    }
  }

  /**
   * Initializes the game map
   */
  initializeMap(width = 20, height = 15) {
    this.gameState.map = [];
    
    for (let x = 0; x < width; x++) {
      this.gameState.map[x] = [];
      for (let y = 0; y < height; y++) {
        // Create different terrain types based on position
        let type, terrainModifier;
        
        // Create some basic terrain patterns
        if (x === 0 || y === 0 || x === width-1 || y === height-1) {
          type = 'water';
          terrainModifier = 0;
        } else if (x === 5 && y === 5) {
          type = 'mountain';
          terrainModifier = 3;
        } else if (x % 7 === 0 && y % 7 === 0) {
          type = 'forest';
          terrainModifier = 2;
        } else {
          type = 'grass';
          terrainModifier = 1;
        }
        
        const tile = new this.components.Tile(x, y, type, terrainModifier);
        
        // Add some resources to certain tiles
        if (x % 5 === 0 && y % 5 === 0 && type !== 'water' && type !== 'mountain') {
          tile.resource = new this.components.Resource(
            ['food', 'gold', 'production'][Math.floor(Math.random() * 3)], 
            Math.floor(Math.random() * 10) + 5,
            {x, y}
          );
        }
        
        this.gameState.map[x][y] = tile;
      }
    }
  }

  /**
   * Adds a player to the game
   */
  addPlayer(name, civilization = 'default') {
    const colors = ['#FF0000', '#0000FF', '#00FF00', '#FFFF00'];
    const color = colors[this.gameState.players.length % colors.length];
    
    const player = new this.components.Player(
      this.gameState.players.length,
      name,
      color,
      civilization
    );
    
    this.gameState.players.push(player);
    return player;
  }

  /**
   * Starts the game
   */
  start() {
    console.log("Starting Civilization Revolution Remake...");
    
    // Initialize game world
    this.initializeMap();
    
    // Add players
    this.addPlayer("Player 1", "Egyptian");
    this.addPlayer("Player 2", "Roman");
    
    // Create initial units
    this.createInitialUnits();
    
    // Create initial cities
    this.createInitialCities();
    
    // Start game loop
    this.gameState.isRunning = true;
    
    // Add canvas to document
    document.body.appendChild(this.app.view);
  }

  /**
   * Creates initial units for players
   */
  createInitialUnits() {
    // Player 1 starts at (5, 5)
    const player1 = this.gameState.players[0];
    const warrior1 = this.createEntity({
      unit: new this.components.Unit('warrior', 0, 5, 5),
      position: new this.components.Position(5, 5)
    });
    
    const settler1 = this.createEntity({
      unit: new this.components.Unit('settler', 0, 5, 6),
      position: new this.components.Position(5, 6)
    });
    
    // Player 2 starts at (15, 10)
    const player2 = this.gameState.players[1];
    const warrior2 = this.createEntity({
      unit: new this.components.Unit('warrior', 1, 15, 10),
      position: new this.components.Position(15, 10)
    });
    
    const archer2 = this.createEntity({
      unit: new this.components.Unit('archer', 1, 15, 9),
      position: new this.components.Position(15, 9)
    });
    
    // Add units to players
    player1.addUnit(warrior1.id);
    player1.addUnit(settler1.id);
    player2.addUnit(warrior2.id);
    player2.addUnit(archer2.id);
  }

  /**
   * Creates initial cities for players
   */
  createInitialCities() {
    // Player 1 creates a city at (4, 5)
    const player1 = this.gameState.players[0];
    const city1 = this.createEntity({
      city: new this.components.City(0, 4, 5, "Memphis"),
      position: new this.components.Position(4, 5)
    });
    
    // Player 2 creates a city at (14, 10)
    const player2 = this.gameState.players[1];
    const city2 = this.createEntity({
      city: new this.components.City(1, 14, 10, "Roma"),
      position: new this.components.Position(14, 10)
    });
    
    // Add cities to players
    player1.addCity(city1.id);
    player2.addCity(city2.id);
    
    // Assign nearby tiles to cities
    city1.city.assignTile(4, 5); // City center
    city1.city.assignTile(3, 5);
    city1.city.assignTile(5, 5);
    city1.city.assignTile(4, 4);
    city1.city.assignTile(4, 6);
    
    city2.city.assignTile(14, 10); // City center
    city2.city.assignTile(13, 10);
    city2.city.assignTile(15, 10);
    city2.city.assignTile(14, 9);
    city2.city.assignTile(14, 11);
  }

  /**
   * Ends the current player's turn
   */
  endCurrentTurn() {
    const currentPlayer = this.gameState.players[this.gameState.currentTurn];
    
    if (currentPlayer) {
      // End current player's turn
      currentPlayer.endTurn();
      
      // Reset all units for next turn
      for (const entity of this.entities) {
        if (entity.unit && entity.unit.owner === currentPlayer.id) {
          entity.unit.resetTurn();
        }
      }
      
      // Move to next player
      this.gameState.currentTurn = (this.gameState.currentTurn + 1) % this.gameState.players.length;
      
      // Start next player's turn
      const nextPlayer = this.gameState.players[this.gameState.currentTurn];
      nextPlayer.startTurn();
      
      console.log(`Turn changed to player ${nextPlayer.id} (${nextPlayer.name})`);
    }
  }

  /**
   * Moves a unit to a new position
   */
  moveUnit(unitId, toX, toY) {
    const unitEntity = this.getEntityById(unitId);
    const currentPlayer = this.gameState.players[this.gameState.currentTurn];
    
    if (!unitEntity || !unitEntity.unit || unitEntity.unit.owner !== currentPlayer.id) {
      return false;
    }
    
    // Check if movement is valid
    const distance = Math.abs(unitEntity.position.x - toX) + Math.abs(unitEntity.position.y - toY);
    if (distance > unitEntity.unit.movement) {
      return false;
    }
    
    // Update unit position
    unitEntity.position.set(toX, toY);
    unitEntity.unit.move(toX, toY);
    
    console.log(`Moved unit ${unitId} to (${toX}, ${toY})`);
    return true;
  }

  /**
   * Performs combat between two units
   */
  performCombat(attackerId, defenderId) {
    const attacker = this.getEntityById(attackerId);
    const defender = this.getEntityById(defenderId);
    
    if (!attacker || !defender || !attacker.unit || !defender.unit) {
      return false;
    }
    
    // Check if this is valid combat (enemies, within range, etc.)
    if (attacker.unit.owner === defender.unit.owner) {
      return false;
    }
    
    // Perform combat using Combat System
    const result = this.systems.CombatSystem.performCombat(attacker, defender);
    
    // Handle combat results
    if (result.success) {
      if (result.defender.destroyed) {
        this.removeEntityById(defenderId);
      }
      if (result.attacker.destroyed) {
        this.removeEntityById(attackerId);
      }
    }
    
    return result;
  }

  /**
   * Builds a new unit
   */
  buildUnit(playerId, unitType, x, y) {
    const player = this.gameState.players[playerId];
    if (!player) return false;
    
    // Check if player can afford the unit
    const costs = {
      warrior: { gold: 50, production: 30 },
      archer: { gold: 60, production: 35 },
      settler: { gold: 100, production: 50 }
    };
    
    if (!costs[unitType] || !player.canAfford(costs[unitType])) {
      return false;
    }
    
    // Spend resources
    player.spendResources(costs[unitType]);
    
    // Create new unit
    const newUnit = this.createEntity({
      unit: new this.components.Unit(unitType, playerId, x, y),
      position: new this.components.Position(x, y)
    });
    
    // Add unit to player
    player.addUnit(newUnit.id);
    
    console.log(`Built ${unitType} for player ${playerId} at (${x}, ${y})`);
    return newUnit;
  }

  /**
   * Selects a unit
   */
  selectUnit(unitId) {
    this.gameState.selectedEntity = this.getEntityById(unitId);
  }

  /**
   * Selects a city
   */
  selectCity(cityId) {
    this.gameState.selectedCity = this.getEntityById(cityId);
  }

  /**
   * Builds a new city
   */
  buildCity(playerId, x, y, cityName = null) {
    const player = this.gameState.players[playerId];
    if (!player) return false;

    // Check if player can afford the city (for now, just check if they have a settler there)
    // In a real implementation, we'd check if there's a settler unit at this location
    const settlerAtLocation = this.entities.find(entity => 
      entity.unit && 
      entity.unit.type === 'settler' && 
      entity.unit.owner === playerId &&
      entity.position.x === x &&
      entity.position.y === y
    );

    if (!settlerAtLocation) {
      console.log("No settler unit found at location to build city");
      return false;
    }

    // Create new city
    const newCity = this.createEntity({
      city: new this.components.City(playerId, x, y, cityName),
      position: new this.components.Position(x, y)
    });

    // Add city to player
    player.addCity(newCity.id);

    // Assign the center tile to the city
    newCity.city.assignTile(x, y);

    // Remove the settler unit that founded the city
    player.removeUnit(settlerAtLocation.id);
    this.removeEntityById(settlerAtLocation.id);

    console.log(`City ${newCity.city.name} built for player ${playerId} at (${x}, ${y})`);
    return newCity;
  }

  /**
   * Saves the game
   */
  async saveGame(saveName) {
    const success = await this.GameStateManager.saveGame(saveName);
    if (success) {
      console.log(`Game saved as ${saveName}`);
    } else {
      console.error(`Failed to save game as ${saveName}`);
    }
    return success;
  }

  /**
   * Loads the game
   */
  async loadGame(saveName) {
    const success = await this.GameStateManager.loadGame(saveName);
    if (success) {
      console.log(`Game loaded from ${saveName}`);
    } else {
      console.error(`Failed to load game from ${saveName}`);
    }
    return success;
  }

  /**
   * Main game loop
   */
  gameLoop(delta) {
    if (!this.gameState.isRunning) return;
    
    // Update all systems
    Object.values(this.systems).forEach(system => {
      if (typeof system.update === 'function') {
        system.update(delta);
      }
    });
  }
}

module.exports = GameEngine;