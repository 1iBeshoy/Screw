const { CardRepository } = require("../Repositories/CardRepository");
const cards = [];

class CardService {
    async loadCards() {
        let loadedCards = await CardRepository.getAllCard();

        if(!loadedCards || loadedCards.length <= 0) return false;

        cards = loadedCards;

        return true;
    }

    getCard(cardID) {
        if(cards.length <= 0) return false;
        
        return cards.find(card => card.ID == cardID) || null;
    }

    async addCard(cardData) {
        let newCard = await CardRepository.setCardData(cardData);
        if(!newCard) return false;

        cards.push(newCard);

        return true;
    }

    async removeCard(cardID) {
        let card = await CardRepository.setCardData({ ID: cardID, deleted: true });
        if(!card) return false;

        let cardIndex = cards.findIndex(card => card.ID == cardID);
        if(cardIndex !== -1) cards.splice(cardIndex, 1);

        return true;
    }

    createDeck() {
        if(cards.length <= 0) return false;
        
        const deck = [];
        cards.forEach(card => {
            for (let i = 0; i < card.amount; i++) deck.push({ ...card });
        });
    
        return shuffle(deck);
    }
    
    // shuffles the given deck
    shuffle(deck) {
        // Fisher-Yates shuffle algorithm to randomize the deck
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
    
        return deck;
    }
    
    // Draws a card from the given deck.
    drawCard(deck) {
        if (deck.length === 0) return null;
    
        return deck.pop();
    }
    
    // Creates a player's deck by drawing four cards from the provided deck.
    createPlayerDeck(deck) {
        const playerDeck = [];
        for (let i = 0; i < 4; i++) {
            const drawnCard = drawCard(deck);
            if (drawnCard) playerDeck.push(drawnCard);
        }
    
        return playerDeck;
    }
    
    // Calculates the total score of a player based on the points of the cards in their deck.
    getPlayerScore(player) {
        return player.cards.map(card => this.getCard(card)).reduce((score, card) => score + card.points, 0);
    }
}

module.exports = new CardService();