/**
 * Input System
 * Handles user input for the game
 */
module.exports = function(gameEngine) {
  class InputSystem {
    constructor(game) {
      this.game = game;
      this.app = game.app;
      
      // Store current state of inputs
      this.keysPressed = new Set();
      this.mouseState = {
        x: 0,
        y: 0,
        clicked: false,
        clickPosition: {x: 0, y: 0},
        button: 0
      };
      
      // Register event listeners
      this.setupEventListeners();
      
      // Store selected entity
      this.selectedEntity = null;
    }

    setupEventListeners() {
      // Keyboard events
      window.addEventListener('keydown', (event) => {
        this.keysPressed.add(event.key.toLowerCase());
        
        // Handle specific key combinations
        if (event.key === 'Escape') {
          this.deselectCurrentEntity();
        }
      });
      
      window.addEventListener('keyup', (event) => {
        this.keysPressed.delete(event.key.toLowerCase());
      });
      
      // Mouse events
      this.app.view.addEventListener('mousedown', (event) => {
        this.handleMouseDown(event);
      });
      
      this.app.view.addEventListener('mouseup', (event) => {
        this.handleMouseUp(event);
      });
      
      this.app.view.addEventListener('mousemove', (event) => {
        this.handleMouseMove(event);
      });
      
      // Touch events for mobile support
      this.app.view.addEventListener('touchstart', (event) => {
        event.preventDefault();
        this.handleTouchStart(event);
      });
      
      this.app.view.addEventListener('touchend', (event) => {
        event.preventDefault();
        this.handleTouchEnd(event);
      });
      
      this.app.view.addEventListener('touchmove', (event) => {
        event.preventDefault();
        this.handleTouchMove(event);
      });
    }

    handleMouseDown(event) {
      this.mouseState.clicked = true;
      this.mouseState.clickPosition = {x: event.clientX, y: event.clientY};
      this.mouseState.button = event.button;
      
      // Convert screen coordinates to game coordinates
      const rect = this.app.view.getBoundingClientRect();
      const gameX = (event.clientX - rect.left) / this.app.renderer.resolution;
      const gameY = (event.clientY - rect.top) / this.app.renderer.resolution;
      
      // Determine which tile was clicked
      const tileX = Math.floor(gameX / this.game.systems.RenderSystem.tileSize);
      const tileY = Math.floor(gameY / this.app.renderer.resolution);
      
      this.processTileClick(tileX, tileY, event.button);
    }

    handleMouseUp(event) {
      this.mouseState.clicked = false;
      this.mouseState.button = 0;
    }

    handleMouseMove(event) {
      this.mouseState.x = event.clientX;
      this.mouseState.y = event.clientY;
    }

    handleTouchStart(event) {
      if (event.touches.length > 0) {
        const touch = event.touches[0];
        this.handleMouseDown({
          clientX: touch.clientX,
          clientY: touch.clientY,
          button: 0
        });
      }
    }

    handleTouchEnd(event) {
      this.handleMouseUp({});
    }

    handleTouchMove(event) {
      if (event.touches.length > 0) {
        const touch = event.touches[0];
        this.handleMouseMove({
          clientX: touch.clientX,
          clientY: touch.clientY
        });
      }
    }

    processTileClick(tileX, tileY, button) {
      // Find entity at this tile position
      const clickedEntity = this.findEntityAt(tileX, tileY);
      
      if (button === 0) { // Left click
        if (clickedEntity && clickedEntity.unit) {
          // Select unit if it belongs to current player
          if (clickedEntity.unit.owner === this.getCurrentPlayerId()) {
            this.selectEntity(clickedEntity);
          }
        } else if (this.selectedEntity) {
          // Move selected unit to clicked tile if possible
          this.moveSelectedUnit(tileX, tileY);
        }
      } else if (button === 2) { // Right click
        if (this.selectedEntity) {
          // Contextual action based on what was right-clicked
          if (clickedEntity) {
            // Attack if enemy unit, or interact with friendly/city
            this.performContextualAction(this.selectedEntity, clickedEntity);
          } else {
            // Move to position
            this.moveSelectedUnit(tileX, tileY);
          }
        }
      }
    }

    findEntityAt(x, y) {
      // Look through all entities to find one at the specified position
      for (const entity of this.game.entities) {
        if (entity.position && 
            Math.floor(entity.position.x) === x && 
            Math.floor(entity.position.y) === y) {
          return entity;
        }
      }
      return null;
    }

    selectEntity(entity) {
      this.selectedEntity = entity;
      this.highlightEntity(entity);
    }

    deselectCurrentEntity() {
      this.selectedEntity = null;
      this.clearHighlights();
    }

    moveSelectedUnit(x, y) {
      if (this.selectedEntity && this.selectedEntity.unit && this.selectedEntity.position) {
        // Check if movement is valid
        if (this.isValidMove(this.selectedEntity, x, y)) {
          // Update the unit's position
          this.selectedEntity.position.x = x;
          this.selectedEntity.position.y = y;
          
          // Consume movement points
          this.selectedEntity.unit.move(x, y);
          
          // Send action to server for multiplayer
          this.sendAction('unit_move', {
            unitId: this.selectedEntity.id,
            toX: x,
            toY: y
          });
        }
      }
    }

    isValidMove(entity, toX, toY) {
      // Check if destination is walkable
      // Check if movement points are available
      // Check if destination is within movement range
      
      if (!entity.unit) return false;
      
      // Calculate distance
      const distance = Math.abs(entity.position.x - toX) + Math.abs(entity.position.y - toY);
      
      // Simple validation: unit must have enough movement points
      // In a real game, this would also consider terrain costs
      return distance <= entity.unit.movement;
    }

    performContextualAction(sourceEntity, targetEntity) {
      if (!sourceEntity || !targetEntity) return;
      
      // Determine the action based on the entities involved
      if (targetEntity.unit && targetEntity.unit.owner !== sourceEntity.unit.owner) {
        // Combat action
        this.initiateCombat(sourceEntity, targetEntity);
      } else if (targetEntity.city && targetEntity.city.owner !== sourceEntity.unit.owner) {
        // Siege city
        this.siegeCity(sourceEntity, targetEntity);
      } else {
        // Other contextual actions
        console.log('Performing contextual action between entities');
      }
    }

    initiateCombat(attacker, defender) {
      // Calculate combat outcome
      const attackPower = attacker.unit.attack;
      const defensePower = defender.unit.defense;
      
      // Simple combat resolution
      const attackerDamage = Math.max(1, defensePower - attackPower);
      const defenderDamage = Math.max(1, attackPower - defensePower);
      
      // Apply damage
      const attackerDestroyed = attacker.unit.takeDamage(defenderDamage);
      const defenderDestroyed = defender.unit.takeDamage(attackerDamage);
      
      // Report combat result
      this.reportCombatResult(attacker, defender, attackerDestroyed, defenderDestroyed);
      
      // Send action to server
      this.sendAction('combat', {
        attackerId: attacker.id,
        defenderId: defender.id,
        attackerDamage,
        defenderDamage,
        attackerDestroyed,
        defenderDestroyed
      });
    }

    siegeCity(attacker, city) {
      // Handle city siege mechanics
      console.log(`Unit ${attacker.id} is besieging city ${city.id}`);
    }

    reportCombatResult(attacker, defender, attackerDestroyed, defenderDestroyed) {
      if (defenderDestroyed) {
        console.log(`Attacker destroyed defender!`);
        // Grant experience to attacker
        attacker.unit.gainExperience(25);
      }
      
      if (attackerDestroyed) {
        console.log(`Defender destroyed attacker!`);
        // Remove attacker from game
        this.removeFromGame(attacker);
      }
    }

    highlightEntity(entity) {
      // Visual feedback for selected entity
      console.log(`Highlighting entity at (${entity.position.x}, ${entity.position.y})`);
    }

    clearHighlights() {
      // Remove visual highlights
      console.log('Clearing highlights');
    }

    getCurrentPlayerId() {
      // This would return the current player's ID
      // For now, returning a mock value
      return 0;
    }

    sendAction(actionType, data) {
      // Send action to game server for multiplayer
      // This would use socket.io in a real implementation
      console.log(`Sending action: ${actionType}`, data);
    }

    removeFromGame(entity) {
      // Remove entity from the game
      const index = this.game.entities.indexOf(entity);
      if (index !== -1) {
        this.game.entities.splice(index, 1);
      }
    }

    update(delta) {
      // Process continuous input (like holding keys)
      this.processContinuousInput();
    }

    processContinuousInput() {
      // Handle keys that are held down
      if (this.keysPressed.has('w') || this.keysPressed.has('arrowup')) {
        // Move camera up
      }
      if (this.keysPressed.has('s') || this.keysPressed.has('arrowdown')) {
        // Move camera down
      }
      if (this.keysPressed.has('a') || this.keysPressed.has('arrowleft')) {
        // Move camera left
      }
      if (this.keysPressed.has('d') || this.keysPressed.has('arrowright')) {
        // Move camera right
      }
    }
  }

  return new InputSystem(gameEngine);
};