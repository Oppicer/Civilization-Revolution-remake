/**
 * Pathfinding utility for Civilization Revolution Remake
 * Implements A* pathfinding algorithm for unit movement
 */

class Pathfinder {
  constructor(gameEngine) {
    this.game = gameEngine;
  }

  /**
   * Find the shortest path between two points using A* algorithm
   * @param {number} startX - Starting X coordinate
   * @param {number} startY - Starting Y coordinate
   * @param {number} endX - Destination X coordinate
   * @param {number} endY - Destination Y coordinate
   * @param {number} maxMovement - Maximum movement points of the unit
   * @returns {Array|null} Array of coordinates representing the path, or null if no path exists
   */
  findPath(startX, startY, endX, endY, maxMovement = null) {
    // If destination is the same as start, return empty path
    if (startX === endX && startY === endY) {
      return [];
    }

    // Check if destination is accessible
    const endTile = this.getTileAt(endX, endY);
    if (!endTile || !endTile.walkable) {
      return null;
    }

    // Initialize open and closed sets
    const openSet = [];
    const closedSet = new Set();

    // Create start node
    const startNode = {
      x: startX,
      y: startY,
      g: 0, // Cost from start to this node
      h: this.heuristic(startX, startY, endX, endY), // Heuristic cost to end
      f: 0 + this.heuristic(startX, startY, endX, endY), // Total cost
      parent: null
    };

    openSet.push(startNode);

    while (openSet.length > 0) {
      // Get node with lowest f score
      openSet.sort((a, b) => a.f - b.f);
      const currentNode = openSet.shift();

      // Check if we've reached the destination
      if (currentNode.x === endX && currentNode.y === endY) {
        // Reconstruct path
        return this.reconstructPath(currentNode);
      }

      // Add current node to closed set
      closedSet.add(`${currentNode.x},${currentNode.y}`);

      // Explore neighbors
      const neighbors = this.getNeighbors(currentNode.x, currentNode.y);
      
      for (const neighbor of neighbors) {
        const neighborKey = `${neighbor.x},${neighbor.y}`;
        
        // Skip if neighbor is in closed set
        if (closedSet.has(neighborKey)) {
          continue;
        }

        // Calculate tentative g score
        const movementCost = this.getMovementCost(currentNode, neighbor);
        const tentativeG = currentNode.g + movementCost;

        // Skip if this path is not better than a previously found one
        if (maxMovement !== null && tentativeG > maxMovement) {
          continue;
        }

        // Check if neighbor is already in open set with a better g score
        const existingNeighborIndex = openSet.findIndex(node => 
          node.x === neighbor.x && node.y === neighbor.y
        );

        if (existingNeighborIndex !== -1) {
          const existingNeighbor = openSet[existingNeighborIndex];
          if (tentativeG < existingNeighbor.g) {
            existingNeighbor.g = tentativeG;
            existingNeighbor.f = tentativeG + existingNeighbor.h;
            existingNeighbor.parent = currentNode;
          }
        } else {
          // Add neighbor to open set
          const neighborNode = {
            x: neighbor.x,
            y: neighbor.y,
            g: tentativeG,
            h: this.heuristic(neighbor.x, neighbor.y, endX, endY),
            f: tentativeG + this.heuristic(neighbor.x, neighbor.y, endX, endY),
            parent: currentNode
          };
          
          openSet.push(neighborNode);
        }
      }
    }

    // No path found
    return null;
  }

  /**
   * Calculate heuristic distance (Manhattan distance)
   * @param {number} x1 - First point X
   * @param {number} y1 - First point Y
   * @param {number} x2 - Second point X
   * @param {number} y2 - Second point Y
   * @returns {number} Heuristic distance
   */
  heuristic(x1, y1, x2, y2) {
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
  }

  /**
   * Get walkable neighbors of a tile
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {Array} Array of neighboring coordinates
   */
  getNeighbors(x, y) {
    const neighbors = [];
    const directions = [
      {x: 0, y: -1},  // North
      {x: 1, y: 0},   // East
      {x: 0, y: 1},   // South
      {x: -1, y: 0}   // West
    ];

    for (const dir of directions) {
      const newX = x + dir.x;
      const newY = y + dir.y;

      // Check if neighbor is within map bounds
      if (this.isValidCoordinate(newX, newY)) {
        const tile = this.getTileAt(newX, newY);
        
        // Only add if tile is walkable
        if (tile && tile.walkable) {
          neighbors.push({x: newX, y: newY});
        }
      }
    }

    return neighbors;
  }

  /**
   * Get movement cost between two adjacent tiles
   * @param {Object} from - From node
   * @param {Object} to - To node
   * @returns {number} Movement cost
   */
  getMovementCost(from, to) {
    // Get the terrain cost of the destination tile
    const tile = this.getTileAt(to.x, to.y);
    if (!tile) return Infinity;

    // Base movement cost depends on terrain
    return tile.terrainModifier || 1;
  }

  /**
   * Check if coordinates are valid (within map bounds)
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {boolean} Whether coordinates are valid
   */
  isValidCoordinate(x, y) {
    if (!this.game.gameState.map) return false;
    return x >= 0 && x < this.game.gameState.map.length && 
           y >= 0 && y < this.game.gameState.map[0].length;
  }

  /**
   * Get tile at coordinates
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {Object|null} Tile object or null if invalid
   */
  getTileAt(x, y) {
    if (!this.isValidCoordinate(x, y)) return null;
    if (!this.game.gameState.map) return null;
    return this.game.gameState.map[x][y];
  }

  /**
   * Reconstruct path from end node to start
   * @param {Object} endNode - End node
   * @returns {Array} Array of coordinates representing the path
   */
  reconstructPath(endNode) {
    const path = [];
    let currentNode = endNode;

    while (currentNode.parent) {
      path.unshift({x: currentNode.x, y: currentNode.y});
      currentNode = currentNode.parent;
    }

    // Don't include the starting position in the path
    return path;
  }

  /**
   * Get movement path for a unit with specific movement capabilities
   * @param {Object} unitEntity - Unit entity
   * @param {number} endX - Destination X
   * @param {number} endY - Destination Y
   * @returns {Array|null} Path or null if not reachable
   */
  findPathForUnit(unitEntity, endX, endY) {
    if (!unitEntity.position || !unitEntity.unit) {
      return null;
    }

    const startX = unitEntity.position.x;
    const startY = unitEntity.position.y;
    const maxMovement = unitEntity.unit.movement;

    return this.findPath(startX, startY, endX, endY, maxMovement);
  }

  /**
   * Check if a unit can reach a destination
   * @param {Object} unitEntity - Unit entity
   * @param {number} endX - Destination X
   * @param {number} endY - Destination Y
   * @returns {boolean} Whether the destination is reachable
   */
  canReach(unitEntity, endX, endY) {
    const path = this.findPathForUnit(unitEntity, endX, endY);
    return path !== null;
  }
}

module.exports = Pathfinder;