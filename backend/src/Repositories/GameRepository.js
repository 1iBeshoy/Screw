const Game = require("./models/Game");
const { CustomError } = require("../Utils/Error");

class GameRepository {
    static async setGameData(gameData) {
        try {
            let game = await this.getGameData(gameData.code);
    
            if(game) {
                await game.updateOne(gameData).catch((error) => { throw new CustomError("error while updating game data", error, "Repositories/GameRepository.js", "setGameData", 10) });
            } else {
                await Game.create(gameData).catch((error) => { throw new CustomError("error while creating new game", error, "Repositories/GameRepository.js", "setGameData", 12) });
            }

            return game;
        } catch(error) {
            if(!(error instanceof CustomError)) {
                new CustomError("unknown error", error, "Repositories/GameRepository.js", "setGameData", 5);
            }

            return false;
        }
    }

    static async getGameData(gameCode) {
        try {
            let game = await Game.findOne({ code: gameCode }).catch((error) => { throw new CustomError("error while getting game data", error, "Repositories/GameRepository.js", "getGameData", 27) });;

            if(!game) return null;

            return game;
        } catch(error) {
            if(!(error instanceof CustomError)) {
                new CustomError("unknown error", error, "Repositories/GameRepository.js", "getGameData", 25);
            }

            return false;
        }
    }

    static async getAllGames(filter = {}, projection= null, options = {}) {
        try {
            let result = await Game.find(filter, projection, options).catch((error) => { throw new CustomError("error while getting games data", error, "Repositories/GameRepository.js", "getAllGames", 43) });;
            
            return result;
        } catch(error) {
            if(!(error instanceof CustomError)) {
                new CustomError("unknown error", error, "Repositories/GameRepository.js", "getAllGames", 41);
            }
            
            return false;
        }
    }
}

module.exports = { GameRepository };