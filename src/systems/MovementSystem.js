/**
 * Movement System
 * Handles movement logic for units
 */
module.exports = function(gameEngine) {
  class MovementSystem {
    constructor(game) {
      this.game = game;
    }

    update(delta) {
      // Process movement for all movable entities
      for (const entity of this.game.entities) {
        if (entity.unit && entity.movement && entity.position) {
          this.processUnitMovement(entity, delta);
        }
      }
    }

    processUnitMovement(entity, delta) {
      // Check if the unit has movement orders
      if (entity.movement.targetPosition) {
        // Calculate movement vector
        const dx = entity.movement.targetPosition.x - entity.position.x;
        const dy = entity.movement.targetPosition.y - entity.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // If we're close enough to the target, stop moving
        if (distance < 0.1) {
          this.arriveAtDestination(entity);
          return;
        }
        
        // Normalize direction vector
        const dirX = dx / distance;
        const dirY = dy / distance;
        
        // Calculate speed based on unit's movement capability
        const speed = entity.unit.movement * delta * 0.05; // Adjust multiplier as needed
        
        // Move towards target but don't overshoot
        const moveDistance = Math.min(speed, distance);
        
        entity.position.x += dirX * moveDistance;
        entity.position.y += dirY * moveDistance;
        
        // Update remaining movement points
        // In a turn-based system, this would be handled differently
      }
    }

    arriveAtDestination(entity) {
      // Clear movement target
      if (entity.movement) {
        entity.movement.targetPosition = null;
        
        // Snap to grid position
        entity.position.x = Math.round(entity.position.x);
        entity.position.y = Math.round(entity.position.y);
        
        // Notify that movement is complete
        this.onMovementComplete(entity);
      }
    }

    onMovementComplete(entity) {
      // Trigger any effects that happen when movement completes
      console.log(`Unit arrived at position (${entity.position.x}, ${entity.position.y})`);
      
      // Consume movement points in turn-based mode
      if (entity.unit) {
        // Calculate distance traveled and consume appropriate movement points
        const distanceTraveled = this.calculateDistanceTraveled(entity);
        entity.unit.movement = Math.max(0, entity.unit.movement - Math.ceil(distanceTraveled));
      }
    }

    calculateDistanceTraveled(entity) {
      // In a real implementation, this would calculate the actual path distance
      // For now, return 1 for each move action
      return 1;
    }

    requestMovement(entity, targetX, targetY) {
      // Validate movement request
      if (!this.canMoveTo(entity, targetX, targetY)) {
        return false;
      }
      
      // Check if unit has enough movement points
      if (!this.hasEnoughMovementPoints(entity, targetX, targetY)) {
        return false;
      }
      
      // Set movement target
      if (!entity.movement) {
        entity.movement = {};
      }
      entity.movement.targetPosition = {x: targetX, y: targetY};
      
      // Consume movement points
      const distance = this.getPathDistance(entity.position.x, entity.position.y, targetX, targetY);
      entity.unit.movement = Math.max(0, entity.unit.movement - Math.ceil(distance));
      
      return true;
    }

    canMoveTo(entity, x, y) {
      // Check if destination is within map bounds
      if (x < 0 || y < 0 || x >= 20 || y >= 15) { // Assuming 20x15 map
        return false;
      }
      
      // Check if destination tile is passable
      const tile = this.getTileAt(x, y);
      if (tile && !tile.walkable) {
        return false;
      }
      
      // Check if destination is occupied by friendly unit
      const occupyingUnit = this.getUnitAt(x, y);
      if (occupyingUnit && occupyingUnit.owner === entity.unit.owner) {
        return false;
      }
      
      return true;
    }

    hasEnoughMovementPoints(entity, targetX, targetY) {
      // Calculate required movement points based on pathfinding
      const requiredPoints = this.getPathDistance(
        entity.position.x, 
        entity.position.y, 
        targetX, 
        targetY
      );
      
      return entity.unit.movement >= requiredPoints;
    }

    getPathDistance(startX, startY, endX, endY) {
      // Using Manhattan distance for grid-based movement
      // In a real implementation, this would use proper pathfinding
      return Math.abs(endX - startX) + Math.abs(endY - startY);
    }

    getTileAt(x, y) {
      // This would normally access the actual tile data
      // For now, return a mock tile
      return {
        x: x,
        y: y,
        walkable: x !== 0 || y !== 0, // Make (0,0) unwalkable as example
        terrainModifier: 1.0
      };
    }

    getUnitAt(x, y) {
      // Find unit at the specified position
      for (const entity of this.game.entities) {
        if (entity.unit && 
            Math.floor(entity.position.x) === x && 
            Math.floor(entity.position.y) === y) {
          return entity.unit;
        }
      }
      return null;
    }
  }

  return new MovementSystem(gameEngine);
};