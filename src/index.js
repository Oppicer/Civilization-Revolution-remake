/**
 * Civilization Revolution Remake - Main Entry Point
 */

const GameEngine = require('./game');

// Create and start the game
const game = new GameEngine();

// Start the game engine
game.start();

module.exports = GameEngine;