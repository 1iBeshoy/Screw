const { Card } = require("./models/Card");
const { DeveloperError } = require("../Utils/DeveloperError");

class CardRepository {
    static async setCardData(cardData) {
        try {
            let card = await this.getCardData(cardData.ID);
    
            if(card) {
                await Card.updateOne(cardData).catch((error) => { throw new DeveloperError("error while updating card data", error, "Repositories/CardRepository.js", "setCardData", 10) });
            } else {
                await Card.create(cardData).catch((error) => { throw new DeveloperError("error while creating new card", error, "Repositories/CardRepository.js", "setCardData", 12) });
            }

            return card;
        } catch(error) {
            if(!(error instanceof DeveloperError)) {
                new DeveloperError("unknown error", error, "Repositories/CardRepository.js", "setCardData", 4);
            }

            return false;
        }
    }

    static async getCardData(cardID) {
        try {
            let card = await Card.findOne({ ID: cardID }).catch((error) => { throw new DeveloperError("error while getting card data", error, "Repositories/CardRepository.js", "getCardData", 27) });;

            if(!card) return null;

            return card;
        } catch(error) {
            if(!(error instanceof DeveloperError)) {
                new DeveloperError("unknown error", error, "Repositories/CardRepository.js", "getCardData", 25);
            }

            return false;
        }
    }

    static async getAllCard(filter = {}, projection= null, options = {}) {
        try {
            let result = await Card.find(filter, projection, options).catch((error) => { throw new DeveloperError("error while getting cards data", error, "Repositories/CardRepository.js", "getAllCards", 43) });;
            return result;
        } catch(error) {
            if(!(error instanceof DeveloperError)) {
                new DeveloperError("unknown error", error, "Repositories/CardRepository.js", "getAllCards", 41);
            }

            return false;
        }
    }
}

module.exports = { CardRepository };