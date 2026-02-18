/**
 * Render System
 * Handles rendering of game entities using PixiJS
 */
module.exports = function(gameEngine) {
  class RenderSystem {
    constructor(game) {
      this.game = game;
      this.app = game.app;
      this.stage = game.stage;
      
      // Create containers for different render layers
      this.mapContainer = new PIXI.Container();
      this.unitContainer = new PIXI.Container();
      this.uiContainer = new PIXI.Container();
      
      this.stage.addChild(this.mapContainer);
      this.stage.addChild(this.unitContainer);
      this.stage.addChild(this.uiContainer);
      
      // Initialize tile graphics
      this.tileGraphics = new Map();
      this.unitSprites = new Map();
      
      // Tile size for rendering
      this.tileSize = 64;
    }

    update(delta) {
      // Update rendering based on game state
      this.renderMap();
      this.renderUnits();
      this.renderUI();
    }

    renderMap() {
      // Clear existing tiles
      this.mapContainer.removeChildren();

      // Get map data from game state (this would come from a MapComponent or similar)
      const mapWidth = 20; // This should come from actual map data
      const mapHeight = 15;
      
      for (let x = 0; x < mapWidth; x++) {
        for (let y = 0; y < mapHeight; y++) {
          // Create a tile graphic based on the tile type
          const tileType = this.getTileTypeAt(x, y); // This method would access actual tile data
          
          const tileSprite = this.createTileSprite(tileType, x, y);
          tileSprite.x = x * this.tileSize;
          tileSprite.y = y * this.tileSize;
          
          this.mapContainer.addChild(tileSprite);
        }
      }
    }

    getTileTypeAt(x, y) {
      // This would normally look up the actual tile data
      // For now, we'll simulate some basic terrain distribution
      if (x === 0 || y === 0 || x === 19 || y === 14) return 'water';
      if (x === 5 && y === 5) return 'mountain';
      if (x % 7 === 0 && y % 7 === 0) return 'forest';
      return 'grass';
    }

    createTileSprite(tileType, x, y) {
      const graphics = new PIXI.Graphics();
      
      // Color mapping for different tile types
      const colors = {
        'grass': 0x4CAF50,
        'water': 0x2196F3,
        'mountain': 0x9E9E9E,
        'forest': 0x388E3C,
        'desert': 0xFFEB3B,
        'tundra': 0xE0E0E0
      };
      
      const color = colors[tileType] || 0xFFFFFF;
      
      graphics.beginFill(color);
      graphics.lineStyle(1, 0x000000, 0.5);
      graphics.drawRect(0, 0, this.tileSize, this.tileSize);
      graphics.endFill();
      
      // Add texture or pattern based on tile type
      if (tileType === 'water') {
        // Add waves pattern
        graphics.lineStyle(1, 0x0D47A1, 0.7);
        for (let i = 0; i < 3; i++) {
          const waveY = 10 + i * 15;
          graphics.moveTo(0, waveY);
          for (let x = 0; x < this.tileSize; x += 5) {
            graphics.lineTo(x, waveY + Math.sin((x + Date.now() / 500) / 10) * 3);
          }
        }
      } else if (tileType === 'forest') {
        // Add tree symbols
        graphics.beginFill(0x1B5E20);
        for (let i = 0; i < 5; i++) {
          const treeX = 10 + Math.random() * 44;
          const treeY = 10 + Math.random() * 44;
          graphics.drawCircle(treeX, treeY, 4);
        }
        graphics.endFill();
      }
      
      return graphics;
    }

    renderUnits() {
      // Clear existing unit sprites
      this.unitContainer.removeChildren();

      // Render each unit in the game
      for (const entity of this.game.entities) {
        if (entity.unit && entity.position) {
          const unitSprite = this.createUnitSprite(entity.unit, entity.position);
          unitSprite.x = entity.position.x * this.tileSize;
          unitSprite.y = entity.position.y * this.tileSize;
          
          this.unitContainer.addChild(unitSprite);
        }
      }
    }

    createUnitSprite(unit, position) {
      const container = new PIXI.Container();
      
      // Base shape for the unit
      const unitGraphic = new PIXI.Graphics();
      unitGraphic.beginFill(this.getPlayerColor(unit.owner));
      unitGraphic.lineStyle(2, 0x000000);
      
      // Different shapes for different unit types
      switch(unit.type) {
        case 'warrior':
          unitGraphic.drawPolygon([32, 10, 54, 54, 10, 54]); // Triangle
          break;
        case 'archer':
          unitGraphic.drawRect(20, 20, 24, 24); // Square
          break;
        case 'scout':
          unitGraphic.drawCircle(32, 32, 15); // Circle
          break;
        case 'settler':
          unitGraphic.drawRoundedRect(15, 15, 34, 34, 5); // Rounded square
          break;
        default:
          unitGraphic.drawRect(20, 20, 24, 24); // Default to square
      }
      
      unitGraphic.endFill();
      container.addChild(unitGraphic);
      
      // Health bar
      const healthPercent = unit.health / unit.maxHealth;
      const healthBar = new PIXI.Graphics();
      healthBar.beginFill(0xFF0000);
      healthBar.drawRect(10, 5, 44, 5);
      healthBar.endFill();
      
      const healthFill = new PIXI.Graphics();
      healthFill.beginFill(0x00FF00);
      healthFill.drawRect(10, 5, 44 * healthPercent, 5);
      healthFill.endFill();
      
      container.addChild(healthBar);
      container.addChild(healthFill);
      
      return container;
    }

    getPlayerColor(playerId) {
      // Return color based on player ID
      const colors = [
        0xFF0000, // Red
        0x0000FF, // Blue
        0x00FF00, // Green
        0xFFFF00, // Yellow
        0xFF00FF, // Magenta
        0x00FFFF  // Cyan
      ];
      
      return colors[playerId % colors.length];
    }

    renderUI() {
      // Clear existing UI elements
      this.uiContainer.removeChildren();

      // Draw UI elements like resource bars, turn indicators, etc.
      this.renderResourceBars();
      this.renderTurnIndicator();
    }

    renderResourceBars() {
      // Display player resources
      const player = this.getCurrentPlayer(); // This would get the current player
      
      if (player) {
        let yPos = 10;
        for (const [resource, amount] of Object.entries(player.resources)) {
          const text = new PIXI.Text(`${resource}: ${amount}`, {
            fontFamily: 'Arial',
            fontSize: 14,
            fill: 0xFFFFFF,
            align: 'left'
          });
          text.x = 10;
          text.y = yPos;
          this.uiContainer.addChild(text);
          
          yPos += 20;
        }
      }
    }

    renderTurnIndicator() {
      // Show whose turn it is
      const currentPlayer = this.getCurrentPlayer();
      if (currentPlayer) {
        const turnText = new PIXI.Text(`Turn: Player ${currentPlayer.id} (${currentPlayer.name})`, {
          fontFamily: 'Arial',
          fontSize: 18,
          fill: 0xFFFFFF,
          align: 'center'
        });
        turnText.x = this.app.screen.width / 2 - turnText.width / 2;
        turnText.y = 10;
        this.uiContainer.addChild(turnText);
      }
    }

    getCurrentPlayer() {
      // This would return the current player
      // For now, returning a mock player
      return {
        id: 0,
        name: 'Player 1',
        resources: {
          gold: 150,
          food: 120,
          production: 80,
          science: 45,
          culture: 30
        }
      };
    }
  }

  return new RenderSystem(gameEngine);
};