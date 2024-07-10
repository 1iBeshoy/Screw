const { PlayerRepository } = require("../Repositories/PlayerRepository");
const { GameRepository } = require("../Repositories/GameRepository");
const { generateID } = require("../Utils/ID")
const bcrypt = require("bcrypt");
const moment = require("moment");

class PlayerService {
    constructor(ID) {
        this.ID = ID;
        this.player = null;
    }

    async getPlayerByName(name) {
        const player = await PlayerRepository.getPlayerData({ name: name });
        if(!player) return false;

        this.player = player;

        return this;
    }

    async getPlayerByEmail(email) {
        const player = await PlayerRepository.getPlayerData({ email: email });
        if(!player) return false;

        this.player = player;

        return this;
    }

    async isExists() {
        let player = await PlayerRepository.getPlayerData({ID: this.ID});

        if(!player) return false;

        this.player = player;
        return true;
    }

    async createPlayer(guest, name, email = null, password = null) {
        let ID = generateID();
        while(true) {
            let duplicatedID = await PlayerRepository.getPlayerData({ID: ID});
            if(duplicatedID == null) break;

            ID = generateID();
        }

        let playerData = { ID: ID, name: name, guest: true };
        if(!guest) {
            playerData.email = email;
            playerData.password = password;
            playerData.guest = false;
        }

       let newPlayer = await PlayerRepository.setPlayerData(playerData);
       if(!newPlayer) return false;

       this.player = newPlayer;

       return this;
    }

    async upgradeToFullAccount(email, password) {
        if (!this.player) throw new Error("Player not loaded");
        if (!this.player.guest) throw new Error("Player is not a guest");
    
        let duplicatedEmail = await this.getPlayerByEmail(email);
        if (duplicatedEmail) throw new Error("Player with that email already exists!");
    
        this.player.email = email;
        this.player.password = password;
        this.player.guest = false;
    
        return this;
    }

    setName(newName) {
        if (!this.player) throw new Error("Player not loaded");

        this.player.name = newName;

        return this;
    }

    async checkPassword(password) {
        if (!this.player) throw new Error("Player not loaded");

        return await bcrypt.compareSync(password, this.player.password);
    }

    setPassword(newPassword) {
        if (!this.player) throw new Error("Player not loaded");

        this.player.password = newPassword;
        
        return this;
    }

    async addGame(code) {
        if (!this.player) throw new Error("Player not loaded");

        if (this.player.games.includes(code)) throw new Error("Player already joined that game!");

        const game = await GameRepository.getGameData(code);
        if (!game) throw new Error("Game with this code doesn't exist");

        this.player.games.push(code);

        return this;
    }

    async removeGame(code) {
        if (!this.player) throw new Error("Player not loaded");

        const indexToRemove = this.player.games.findIndex(game => game === code);

        if (indexToRemove === -1) throw new Error("Game not found!");

        this.player.games.splice(indexToRemove, 1);

        return this;
    }

    async setInGame(bool) {
        if (!this.player) throw new Error("Player not loaded");

        this.player.inGame = bool;

        return this;
    }

    async updateStats(newStats) {
        if (!this.player) throw new Error("Player not loaded");

        this.player.stats = {
            ...this.player.stats,
            ...newStats
        };

        return this;
    }

    async updateOverTimeStats(newStat) {
        if (!this.player) throw new Error("Player not loaded");

        const dateFormatted = moment(newStat.date).format('DD:MM:YYYY');
        const existingStat = this.player.overTimeStats.find(stat => {
            const statDateFormatted = moment(stat.date).format('DD:MM:YYYY');
            return statDateFormatted === dateFormatted;
        });
    
        if (existingStat) {
            existingStat.played += newStat.played || 0;
            existingStat.won += newStat.won || 0;
            existingStat.winStreak = Math.max(existingStat.winStreak, newStat.winStreak) || 0;
            existingStat.bestWinStreak = Math.max(existingStat.bestWinStreak, newStat.bestWinStreak) || 0;
            existingStat.level = Math.max(existingStat.level, newStat.level) || 0;
            existingStat.exp += newStat.exp || 0;
        } else {
            this.player.overTimeStats.push(newStat);
        }
    
        return this;
    }

    checkLevel() {
        while (this.player.stats.exp >= Math.round(getExpForNextLevel(this.player.stats.level))) {
            this.player.stats.exp -= Math.round(getExpForNextLevel(this.player.stats.level));
            this.player.stats.level += 1;
        }

        return this;
    }

    async save() {
        try {
            await this.player.save();
            return true;
        } catch (error) {
            console.error(`Error while updating '${this.player.email}'\nThe Error`, error);
            throw new Error("Error while updating the player");
        }
    }
}

module.exports = { PlayerService };