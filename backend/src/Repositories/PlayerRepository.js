const { Player } = require("./models/Player");
const { DeveloperError } = require("../Utils/DeveloperError");

class PlayerRepository {
    static async setPlayerData(playerData) {
        try {
            let player = await this.getPlayerData(playerData.ID);
    
            if(player) {
                await player.updateOne(playerData).catch((error) => { throw new DeveloperError("error while updating player data", error, "Repositories/PlayerRepository.js", "setPlayerData", 10) });
            } else {
                await Player.create(playerData).catch((error) => { throw new DeveloperError("error while creating new player", error, "Repositories/PlayerRepository.js", "setPlayerData", 12) });
            }

            return player;
        } catch(error) {
            if(!(error instanceof DeveloperError)) {
                new DeveloperError("unknown error", error, "Repositories/PlayerRepository.js", "setPlayerData", 5);
            }

            return false;
        }
    }

    static async getPlayerData(playerID = null, email = null) {
        try {
            let filter = {};
            if(playerID) filter.ID = playerID;
            if(email) filter.email = email;

            let player = await Player.findOne(filter).catch((error) => { throw new DeveloperError("error while getting player data", error, "Repositories/PlayerRepository.js", "getPlayerData", 31) });;

            if(!player) return null;

            return player;
        } catch(error) {
            if(!(error instanceof DeveloperError)) {
                new DeveloperError("unknown error", error, "Repositories/PlayerRepository.js", "getPlayerData", 25);
            }

            return false;
        }
    }

    static async getAllPlayers(filter = {}, projection= null, options = {}) {
        try {
            let result = await Player.find(filter, projection, options).catch((error) => { throw new DeveloperError("error while getting players data", error, "Repositories/PlayerRepository.js", "getAllPlayers", 47) });;
            return result;
        } catch(error) {
            if(!(error instanceof DeveloperError)) {
                new DeveloperError("unknown error", error, "Repositories/PlayerRepository.js", "getAllPlayers", 45);
            }

            return false;
        }
    }
}

module.exports = { PlayerRepository };