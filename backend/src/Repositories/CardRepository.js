const { Card } = require("./models/Card");
const { CustomError } = require("../Utils/Error");

class CardRepository {
    static async setCardData(cardData) {
        try {
            let card = await this.getCardData(cardData.ID);
    
            if(card) {
                await Card.updateOne(cardData).catch((error) => { throw new CustomError("error while updating card data", error, "Repositories/CardRepository.js", "setCardData", 10) });
            } else {
                await Card.create(cardData).catch((error) => { throw new CustomError("error while creating new card", error, "Repositories/CardRepository.js", "setCardData", 12) });
            }
        } catch(error) {
            if(!(error instanceof CustomError)) {
                new CustomError("unknown error", error, "Repositories/CardRepository.js", "setCardData", 4);
            }
        }
    }

    static async getCardData(cardID) {
        try {
            let card = await Card.findOne({ ID: cardID }).catch((error) => { throw new CustomError("error while getting card data", error, "Repositories/CardRepository.js", "getCardData", 23) });;

            if(!card) return false;

            return card;
        } catch(error) {
            if(!(error instanceof CustomError)) {
                new CustomError("unknown error", error, "Repositories/CardRepository.js", "getCardData", 21);
            }
        }
    }

    static async getAllCard(filter = {}, projection= null, options = {}) {
        try {
            let result = await Card.find(filter, projection, options).catch((error) => { throw new CustomError("error while getting cards data", error, "Repositories/CardRepository.js", "getAllCards", 37) });;
            return result;
        } catch(error) {
            if(!(error instanceof CustomError)) {
                new CustomError("unknown error", error, "Repositories/CardRepository.js", "getAllCards", 35);
            }
        }
    }
}

module.exports = { CardRepository };