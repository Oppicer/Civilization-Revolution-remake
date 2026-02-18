/**
 * Position Component
 * Represents the position of an entity in the game world
 */
class Position {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  set(x, y) {
    this.x = x;
    this.y = y;
  }

  distanceTo(otherPosition) {
    return Math.sqrt(Math.pow(this.x - otherPosition.x, 2) + Math.pow(this.y - otherPosition.y, 2));
  }
}

module.exports = Position;