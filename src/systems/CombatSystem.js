/**
 * Combat System
 * Handles combat mechanics between units and cities
 */
module.exports = function(gameEngine) {
  class CombatSystem {
    constructor(game) {
      this.game = game;
    }

    update(delta) {
      // Process any ongoing combat encounters
      // In a turn-based game, this might just handle post-combat effects
    }

    /**
     * Performs a combat action between two units
     * @param {Object} attacker - The attacking entity
     * @param {Object} defender - The defending entity
     * @returns {Object} Result of the combat
     */
    performCombat(attacker, defender) {
      // Validate combatants
      if (!attacker || !attacker.unit || !defender || !defender.unit) {
        return { success: false, error: 'Invalid combatants' };
      }

      // Check if these units are enemies
      if (attacker.unit.owner === defender.unit.owner) {
        return { success: false, error: 'Cannot attack friendly unit' };
      }

      // Calculate base attack and defense values
      const attackValue = this.calculateAttackValue(attacker, defender);
      const defenseValue = this.calculateDefenseValue(defender, attacker);

      // Apply random factor to make combat less deterministic
      const randomness = 0.15; // 15% randomness
      const randomFactor = 1 + (Math.random() * randomness * 2 - randomness);
      
      const modifiedAttack = attackValue * randomFactor;
      
      // Calculate damage
      const rawDamage = Math.max(1, modifiedAttack - defenseValue);
      
      // Apply damage to defender
      const defenderWasDestroyed = defender.unit.takeDamage(rawDamage);
      
      // Calculate experience gain for attacker
      const experienceGain = this.calculateExperienceGain(attacker, defender, rawDamage);
      attacker.unit.gainExperience(experienceGain);
      
      // Check if attacker gets wounded in return
      if (Math.random() < 0.3) { // 30% chance of counterattack
        const counterDamage = Math.max(1, defenseValue * 0.3);
        const attackerWasWounded = attacker.unit.takeDamage(counterDamage);
      }

      // Log combat result
      console.log(`Combat: ${attacker.unit.type}(${attacker.unit.owner}) attacked ${defender.unit.type}(${defender.unit.owner})`);
      console.log(`Damage dealt: ${rawDamage}, Defender destroyed: ${defenderWasDestroyed}`);

      // Return combat result
      return {
        success: true,
        attacker: {
          id: attacker.id,
          damageTaken: 0, // Would be updated if attacker took counter damage
          destroyed: false
        },
        defender: {
          id: defender.id,
          damageTaken: rawDamage,
          destroyed: defenderWasDestroyed
        },
        experienceGained: experienceGain
      };
    }

    /**
     * Calculates the effective attack value considering various factors
     */
    calculateAttackValue(attacker, defender) {
      let attackValue = attacker.unit.attack;

      // Apply terrain bonuses
      if (attacker.position) {
        const attackerTile = this.getTileAt(attacker.position.x, attacker.position.y);
        if (attackerTile) {
          attackValue *= attackerTile.terrainModifier;
        }
      }

      // Apply unit promotions or special abilities
      if (attacker.unit.promoted) {
        attackValue *= 1.2; // 20% bonus for promoted units
      }

      // Apply civilization bonuses against specific unit types
      // (would be based on technology/research)
      const civilizationBonus = this.getCivilizationCombatBonus(
        attacker.unit.owner, 
        defender.unit.type
      );
      attackValue += civilizationBonus;

      // Apply unit-specific bonuses (e.g., anti-cavalry units vs cavalry)
      const unitSpecificBonus = this.getUnitSpecificBonus(attacker.unit.type, defender.unit.type);
      attackValue += unitSpecificBonus;

      return attackValue;
    }

    /**
     * Calculates the effective defense value considering various factors
     */
    calculateDefenseValue(defender, attacker) {
      let defenseValue = defender.unit.defense;

      // Apply terrain bonuses
      if (defender.position) {
        const defenderTile = this.getTileAt(defender.position.x, defender.position.y);
        if (defenderTile) {
          defenseValue += defenderTile.defenseBonus;
        }
      }

      // Apply city defense bonus if defending in a city
      if (defender.city) {
        defenseValue += 5; // Cities provide significant defensive bonus
      }

      // Apply promotions or special abilities
      if (defender.unit.promoted) {
        defenseValue *= 1.15; // 15% bonus for promoted units
      }

      // Apply unit-specific defensive bonuses
      const unitSpecificBonus = this.getUnitDefenseBonus(defender.unit.type, attacker.unit.type);
      defenseValue += unitSpecificBonus;

      return defenseValue;
    }

    /**
     * Calculates experience gain for successful combat
     */
    calculateExperienceGain(attacker, defender, damageDealt) {
      // Base experience from defeated unit's strength
      let expGain = defender.unit.attack + defender.unit.defense;
      
      // Bonus for defeating stronger opponents
      if ((defender.unit.attack + defender.unit.defense) > (attacker.unit.attack + attacker.unit.defense)) {
        expGain *= 1.5;
      }
      
      // Additional experience based on damage dealt
      expGain *= (damageDealt / defender.unit.maxHealth);
      
      // Experience cap per combat
      expGain = Math.min(expGain, 50);
      
      return Math.floor(expGain);
    }

    /**
     * Determines if an attack is valid
     */
    isValidAttack(attacker, defender) {
      // Check if both units exist
      if (!attacker || !attacker.unit || !defender || !defender.unit) {
        return false;
      }

      // Check if they are enemies
      if (attacker.unit.owner === defender.unit.owner) {
        return false;
      }

      // Check if attacker has enough movement points to attack
      if (attacker.unit.actionsRemaining <= 0) {
        return false;
      }

      // Check if defender is within attack range
      const distance = this.getDistanceBetween(attacker, defender);
      if (distance > attacker.unit.range) {
        return false;
      }

      return true;
    }

    /**
     * Performs a ranged attack
     */
    performRangedAttack(attacker, defender) {
      // Ranged attacks have different rules
      // Typically don't trigger counterattacks
      if (!this.isValidAttack(attacker, defender)) {
        return { success: false, error: 'Invalid ranged attack' };
      }

      // Calculate base attack value without risk of counterattack
      const attackValue = this.calculateAttackValue(attacker, defender);
      const defenseValue = this.calculateDefenseValue(defender, attacker);

      // Ranged attacks often have reduced effectiveness
      const rangedPenalty = 0.75;
      const modifiedAttack = attackValue * rangedPenalty;

      // Calculate damage
      const rawDamage = Math.max(1, modifiedAttack - defenseValue);

      // Apply damage to defender
      const defenderWasDestroyed = defender.unit.takeDamage(rawDamage);

      // Experience gain for ranged kill
      const experienceGain = Math.floor(this.calculateExperienceGain(attacker, defender, rawDamage) * 0.7);
      attacker.unit.gainExperience(experienceGain);

      // Attacker consumes an action but not necessarily all movement
      attacker.unit.performAction();

      return {
        success: true,
        attacker: {
          id: attacker.id,
          actionsUsed: 1
        },
        defender: {
          id: defender.id,
          damageTaken: rawDamage,
          destroyed: defenderWasDestroyed
        },
        experienceGained: experienceGain
      };
    }

    /**
     * Performs a city attack
     */
    attackCity(attacker, city) {
      // Validate attack
      if (!attacker || !attacker.unit || !city || !city.defense) {
        return { success: false, error: 'Invalid city attack' };
      }

      if (attacker.unit.owner === city.owner) {
        return { success: false, error: 'Cannot attack friendly city' };
      }

      // City combat has special rules
      const attackValue = this.calculateAttackValue(attacker, { unit: { defense: city.defense } });
      
      // Cities have high defense but don't counterattack
      const cityDefense = city.defense + this.getCityDefenseBonus(city);
      const rawDamage = Math.max(1, attackValue - cityDefense);

      // Instead of destroying the city immediately, reduce its health
      city.health = Math.max(0, city.health - rawDamage);

      // Units don't gain experience from attacking cities
      // But they might gain experience if they eliminate defending units

      const cityDestroyed = city.health <= 0;

      return {
        success: true,
        attacker: { id: attacker.id },
        city: {
          id: city.id,
          damageTaken: rawDamage,
          destroyed: cityDestroyed
        }
      };
    }

    /**
     * Helper function to get tile at position
     */
    getTileAt(x, y) {
      // This would normally access the actual tile data
      // For now, return a mock tile
      return {
        x: x,
        y: y,
        defenseBonus: 0,
        terrainModifier: 1.0
      };
    }

    /**
     * Helper function to get distance between two entities
     */
    getDistanceBetween(entity1, entity2) {
      if (!entity1.position || !entity2.position) {
        return Infinity;
      }

      return Math.abs(entity1.position.x - entity2.position.x) + 
             Math.abs(entity1.position.y - entity2.position.y);
    }

    /**
     * Gets civilization-specific combat bonuses
     */
    getCivilizationCombatBonus(civilization, opponentUnitType) {
      // This would be based on civilization traits and techs
      // For now, returning 0
      return 0;
    }

    /**
     * Gets unit-specific bonuses against other unit types
     */
    getUnitSpecificBonus(unitType, targetUnitType) {
      // Classic rock-paper-scissors relationships
      const bonuses = {
        'spearman': { 'cavalry': 5 },  // Spearmen counter cavalry
        'archer': { 'warrior': 2 },    // Archers effective vs warriors
        'cavalry': { 'archer': 3 }     // Cavalry effective vs archers
      };

      const unitBonuses = bonuses[unitType];
      if (unitBonuses && unitBonuses[targetUnitType]) {
        return unitBonuses[targetUnitType];
      }

      return 0;
    }

    /**
     * Gets unit-specific defensive bonuses
     */
    getUnitDefenseBonus(unitType, attackerType) {
      // Defensive bonuses based on attacker type
      const bonuses = {
        'warrior': { 'archer': 2 },    // Warriors have cover vs archers
        'archer': { 'warrior': -1 }    // Archers vulnerable to melee
      };

      const unitBonuses = bonuses[unitType];
      if (unitBonuses && unitBonuses[attackerType]) {
        return unitBonuses[attackerType];
      }

      return 0;
    }

    /**
     * Gets city defense bonus based on improvements
     */
    getCityDefenseBonus(city) {
      // Cities get bonuses from walls, castles, etc.
      let bonus = 0;
      if (city.improvements) {
        if (city.improvements.includes('walls')) bonus += 5;
        if (city.improvements.includes('castle')) bonus += 10;
      }
      return bonus;
    }
  }

  return new CombatSystem(gameEngine);
};