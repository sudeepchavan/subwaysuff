/**
 * Subway Surfers 2D - Shop, Inventory, Upgrades & Mission System
 * Persists high scores, coin economy, character/board unlocks, and mission progression.
 */

class ShopManager {
  constructor() {
    this.storageKey = 'subway_surfers_save_v1';
    this.data = {
      coins: 150,
      highScore: 0,
      selectedCharacter: 'jake',
      unlockedCharacters: ['jake'],
      selectedBoard: 'classic',
      unlockedBoards: ['classic'],
      hoverboardInventory: 3,
      upgrades: {
        magnet: 0,
        jetpack: 0,
        sneakers: 0,
        multiplier: 0
      },
      missions: [
        { id: 'coins_50', progress: 0, target: 50, type: 'coins_single', reward: 150, text: 'Collect 50 coins in one run', completed: false },
        { id: 'score_2000', progress: 0, target: 2000, type: 'score_single', reward: 200, text: 'Score 2,000 points in one run', completed: false },
        { id: 'jump_15', progress: 0, target: 15, type: 'jumps', reward: 120, text: 'Jump 15 times', completed: false }
      ]
    };

    this.upgradeCosts = [400, 800, 1500, 3000, 6000];
    this.load();
  }

  load() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.data = { ...this.data, ...parsed };
      }
    } catch (e) {
      console.warn('Failed to load save from localStorage', e);
    }
  }

  save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    } catch (e) {
      console.warn('Failed to save to localStorage', e);
    }
  }

  addCoins(amount) {
    this.data.coins += amount;
    this.save();
    return this.data.coins;
  }

  spendCoins(amount) {
    if (this.data.coins >= amount) {
      this.data.coins -= amount;
      this.save();
      return true;
    }
    return false;
  }

  setHighScore(score) {
    if (score > this.data.highScore) {
      this.data.highScore = Math.floor(score);
      this.save();
      return true;
    }
    return false;
  }

  // --- Upgrades ---

  getUpgradeLevel(powerupId) {
    return this.data.upgrades[powerupId] || 0;
  }

  getUpgradeCost(powerupId) {
    const lvl = this.getUpgradeLevel(powerupId);
    if (lvl >= this.upgradeCosts.length) return null; // MAX
    return this.upgradeCosts[lvl];
  }

  buyUpgrade(powerupId) {
    const cost = this.getUpgradeCost(powerupId);
    if (cost === null) return false;

    if (this.spendCoins(cost)) {
      this.data.upgrades[powerupId] = (this.data.upgrades[powerupId] || 0) + 1;
      this.save();
      return true;
    }
    return false;
  }

  getPowerupDuration(powerupId) {
    const config = CONSTANTS.POWERUPS[powerupId.toUpperCase()];
    if (!config) return 10;
    const level = this.getUpgradeLevel(powerupId);
    return config.BASE_DURATION + level * (config.DURATION_PER_LEVEL || 2.5);
  }

  // --- Characters & Boards ---

  getSelectedCharacter() {
    return CONSTANTS.CHARACTERS.find(c => c.id === this.data.selectedCharacter) || CONSTANTS.CHARACTERS[0];
  }

  unlockCharacter(charId) {
    const char = CONSTANTS.CHARACTERS.find(c => c.id === charId);
    if (!char) return false;

    if (!this.data.unlockedCharacters.includes(charId)) {
      if (this.spendCoins(char.price)) {
        this.data.unlockedCharacters.push(charId);
        this.selectCharacter(charId);
        this.save();
        return true;
      }
      return false;
    }
    this.selectCharacter(charId);
    return true;
  }

  selectCharacter(charId) {
    if (this.data.unlockedCharacters.includes(charId)) {
      this.data.selectedCharacter = charId;
      this.save();
      return true;
    }
    return false;
  }

  getSelectedBoard() {
    return CONSTANTS.BOARDS.find(b => b.id === this.data.selectedBoard) || CONSTANTS.BOARDS[0];
  }

  unlockBoard(boardId) {
    const board = CONSTANTS.BOARDS.find(b => b.id === boardId);
    if (!board) return false;

    if (!this.data.unlockedBoards.includes(boardId)) {
      if (this.spendCoins(board.price)) {
        this.data.unlockedBoards.push(boardId);
        this.selectBoard(boardId);
        this.save();
        return true;
      }
      return false;
    }
    this.selectBoard(boardId);
    return true;
  }

  selectBoard(boardId) {
    if (this.data.unlockedBoards.includes(boardId)) {
      this.data.selectedBoard = boardId;
      this.save();
      return true;
    }
    return false;
  }

  buyHoverboardPack(count = 3, cost = 250) {
    if (this.spendCoins(cost)) {
      this.data.hoverboardInventory += count;
      this.save();
      return true;
    }
    return false;
  }

  consumeHoverboard() {
    if (this.data.hoverboardInventory > 0) {
      this.data.hoverboardInventory--;
      this.save();
      return true;
    }
    return false;
  }

  // --- Missions Progression ---

  reportStat(type, value = 1) {
    let anyCompleted = false;
    for (const m of this.data.missions) {
      if (m.completed) continue;

      if (m.type === type) {
        if (type.includes('_single')) {
          m.progress = Math.max(m.progress, value);
        } else {
          m.progress += value;
        }

        if (m.progress >= m.target) {
          m.completed = true;
          this.addCoins(m.reward);
          anyCompleted = true;
        }
      }
    }
    if (anyCompleted) {
      this.save();
    }
    return anyCompleted;
  }
}

