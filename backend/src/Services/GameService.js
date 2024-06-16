const { GameRepository } = require("../Repositories/GameRepository");
const { PlayerRepository } = require("../Repositories/PlayerRepository");
const CardService = require("./CardService");
const { generateID } = require("../Utils/ID")
const moment = require("moment");

class GameService {
    constructor(code) {
        this.code = code;
        this.game = null;
    }

    async isExists() {
        let game = await GameRepository.getGameData(this.code);

        if(!game) return false

        this.game = game;
        return true;
    }

    async create(host, numberOfRounds, maxMoveTime, maxPlayers, frontendDate = 0) {
        let code;
        while (true) {
            let game = await GameRepository.getGameData(code);
            if (!game) break;

            code = generateID();
        }

        let newGame = {
            code,
            player: [{
                ID: host.ID,
                name: host.name
            }],
            status: [{
                type: "waiting",
                by: host.ID,
                frontendDate,
                date: moment.now(),
                active: true
            }]
        }

        if(maxMoveTime) newGame.maxMoveTime = maxMoveTime;
        if(maxPlayers) newGame.maxPlayers = maxPlayers;
        if(numberOfRounds) newGame.numberOfRounds = numberOfRounds;

        let game = await GameRepository.setGameData(newGame);
        if(!game) return false;

        this.game = game;

        return this;
    }

    async start(host = null, checkReady = false, frontendDate = 0) {
        if(host && this.game.players[0].ID !== host.ID) throw new Error("Only the host can start the game!");

        const currentGameStatus = this.game.status.find(status => status.active);
        if (currentGameStatus.type !== 'waiting') throw new Error("The game cannot start in its current state");

        if(checkReady) {
            this.game.players.forEach(player => {
                if(!player.ready) throw new Error("All players must be ready!");
            })
        }

        if(this.game.players.length < 2) throw new Error("The game can start with at least two players");
        if(this.game.players.length > this.game.maxPlayers) throw new Error("Exceded the maximum players");

        currentGameStatus.active = false;
        this.game.status.push({
            type: 'playing',
            by: host.ID,
            frontendDate,
            date: moment.now(),
            active: true
        });

        this.startNewRound();

        return this;
    }

    async startNewRound() {
        const currentRound = this.getCurrentRound();
        if (currentRound) throw new Error("Current round is still active");

        const roundNumber = this.game.rounds.length + 1;
        if (roundNumber > this.game.numberOfRounds) throw new Error("Exceeded the number of rounds");

        const gameDeck = CardService.createDeck();
        if (!gameDeck) {
            throw new Error("Failed to create a new deck for the round!");
        }

        this.game.players.forEach(player => {
            player.cards = CardService.createPlayerDeck(gameDeck).map(card => card.ID);
        });

        this.game.rounds.push({
            number: roundNumber,
            availableCards: [gameDeck.map(card => card.ID)],
            usedCards: [CardService.drawCard(gameDeck)?.ID],
            currentPlayerIndex: Math.round(Math.random() * (this.game.players.length)) - 1,
            active: true
        });

        await this.startPlayerTurnTimer();

        return this;
    }

    async endRound() {
        const currentRound = this.getCurrentRound();
        if (!currentRound) throw new Error("No active round to end");

        let leastScore = Infinity;
        let winners = [];

        this.game.players.forEach(player => {
            const playerScore = CardService.getPlayerScore(player);

            if (playerScore < leastScore) {
                leastScore = playerScore;
                winners = [player.ID];
            } else if (playerScore === leastScore && !winners.includes(player.ID)) {
                winners.push(player.ID);
            }
        });

        this.game.players.forEach(player => {
            if (!winners.includes(player.ID)) {
                const playerScore = CardService.getPlayerScore(player);
                player.score = (player.score || 0) + playerScore;
            }
        });

        currentRound.winner = winners.map(winner => winner.ID).join(',');
        currentRound.active = false;

        if (currentRound.number >= this.game.numberOfRounds) {
            await this.endGame();
        } else {
            await this.startNewRound();
        }

        return this;
    }

    async end(frontendDate = 0) {
        const currentGameStatus = this.game.status.find(state => state.active);
        if (currentGameStatus.type !== "playing") throw new Error("Can't end this game!");

        let leastScore = CardService.getPlayerScore(this.game.players[0]);
        let winners = [this.game.players[0].ID];

        this.game.players.forEach(player => {
            const playerScore = player.score

            if (playerScore < leastScore) {
                leastScore = playerScore;
                winners = [player.ID];
            } else if (playerScore === leastScore && !winners.includes(player.ID)) {
                winners.push(player.ID);
            }
        });

        currentGameStatus.active = false;
        this.game.status.push({
            type: "ended",
            by: winners.join(','),
            frontendDate,
            date: moment.now(),
            active: true
        });

        this.game.winner = winners.map(winner => winner.ID).join(',');

        return this;
    }

    async handleTurnTimeout() {
        const currentRound = this.getCurrentRound();
        currentRound.moves.push({
            card: -1,
            type: 'skip',
            location: 'player',
            by: 'system',
            date: moment.now()
        });
        currentRound.currentPlayerIndex = (currentRound.currentPlayerIndex + 1) % this.game.players.length;
        
        this.startPlayerTurnTimer();
    }

    async resetPlayerTurnTimer() {
        if (this.turnTimeout) {
            clearTimeout(this.turnTimeout);
        }

        this.turnTimeout = null;

        currentRound.currentPlayerIndex = (currentRound.currentPlayerIndex + 1) % this.game.players.length;
        
        this.startPlayerTurnTimer();
    }

    async startPlayerTurnTimer() {
        if (this.turnTimeout) clearTimeout(this.turnTimeout);

        const maxMoveTime = this.game.maxMoveTime;
        if (maxMoveTime > 0) {
            this.turnTimeout = setTimeout(async () => {
                await this.handleTurnTimeout();
            }, maxMoveTime);
        }
    }

    async checkRoundStatusAndHandleTurn() {
        const roundFinished = await this.isRoundFinished();
        if (roundFinished) {
            await this.endRound();
        } else {
            await this.startPlayerTurnTimer();
        }
    }

    async isRoundFinished() {
        const currentRound = this.getCurrentRound();
        if (!currentRound) throw new Error("No active round");
    
        if (currentRound.screwPlayerIndex !== -1 && currentRound.currentPlayerIndex === currentRound.screwPlayerIndex) {
            return true;
        }
    
        const noCardsLeft = this.game.players.some(player => player.cards.length === 0);
        if (noCardsLeft) return true;
        
        return false;
    }

    async drawCard(fromLocation, fromPlayer = null, fromPlayerCardIndex = null, byPlayer, frontendDate) {
        this.validatePlayer(this.game.players, byPlayer.ID);
        let drawnCard = null;

        switch (fromLocation) {
            case "deck":
                drawnCard = CardService.drawCard(await this.getAvailableCards());
                break;
            case "floor":
                drawnCard = this.game.floor.pop();
                break;
            case "player":
                if (fromPlayerCardIndex <= -1 || fromPlayerCardIndex >= 4)
                    throw new Error("Trying to draw an invalid card!");

                let gamePlayer = this.validatePlayer(this.game.players, fromPlayer.ID);
                const gamePlayerCard = gamePlayer.cards[fromPlayerCardIndex];

                if (gamePlayerCard === -1 || !gamePlayerCard)
                    throw new Error("Trying to draw an invalid card!");

                gamePlayer.cards[fromPlayerCardIndex] = -1;
                drawnCard = gamePlayerCard;
                break;
            default:
                throw new Error("Invalid move!");
        }

        this.game.moves.push({
            card: drawnCard.ID,
            type: "draw",
            location: fromLocation,
            locPlayer: fromPlayer?.ID ?? null,
            by: byPlayer.ID,
            frontendDate,
            date: moment.now()
        });

        return this;
    }

    async throwCard(toLocation, thrownCard, toPlayer = null, toPlayerCardIndex = null, byPlayer, frontendDate) {
        let byGamePlayer = this.validatePlayer(this.game.players, byPlayer.ID);
        let byGamePlayerCard = this.validateCard(byGamePlayer.cards, thrownCard?.ID);

        switch(toLocation) {
            case "floor":
                this.game.floor.push(byGamePlayerCard)
                break;
            case "player":
                if(toPlayerCardIndex > 0 || toPlayerCardIndex <= 4)
                    throw new Error("Invalid move!");

                let gamePlayer = this.validatePlayer(this.game.players, toPlayer.ID);
                const gamePlayerCard = gamePlayer.cards.at(toPlayerCardIndex);

                if(gamePlayerCard !== -1)
                    throw new Error("Invalid move!");

                gamePlayer.cards[toPlayerCardIndex] = thrownCard;
                break;
            default:
                throw new Error("Invalid move!");
        }

        this.game.moves.push({
            card: thrownCard.ID,
            type: "throw",
            location: toLocation,
            locPlayer: toPlayer?.ID  ?? '',
            by: byPlayer.ID,
            frontendDate,
            date: moment.now()
        });

        return this;
    }

    async takeCard(card, player, playerCardIndex, fromLoc, fromPlayer = null, frontendDate = 0) {
        const gamePlayer = this.validatePlayer(this.game.players, player.ID);
        gamePlayer.cards[playerCardIndex] = card.ID;

        this.game.moves.push({
            card: card.ID,
            type: "take",
            location: fromLoc,
            locPlayer: fromPlayer?.ID  ?? '',
            by: player.ID,
            frontendDate,
            date: moment.now()
        });

        return this;
    }

    async getCurrentRound() {
        return this.game.rounds.find(round => round.active);
    }

    async getAvailableCards() {
        let currentRound = await this.getCurrentRound();
        if(!currentRound) throw new Error("No active round!");

        let availableCards = currentRound.availableCards;

        if(!availableCards || availableCards.length <= 0) {
            if(currentRound.usedCards.length >= 2) {
                let floor = currentRound.usedCards[currentRound.usedCards.length - 1];
                let shuffledCards = CardService.shuffle(currentRound.usedCards.pop());

                availableCards = shuffledCards;
                currentRound.usedCards = [floor];

                return shuffledCards;
            }

            const newDeck = CardService.createDeck();

            currentRound.availableCards.push(newDeck.map(card => card.ID));

            return newDeck;
        }            

        return availableCards;
    }

    async addPlayer(newPlayer) {
        if (this.game.players.length >= (this.game.maxPlayers || 14)) throw new Error(`Game reached players limit`);
        if (this.game.status.find(status => status.active).type !== 'waiting') throw new Error(`Players can only join games in the waiting state`);
        if (this.game.players.some(player => player.ID === newPlayer.ID)) throw new Error(`${newPlayer.player.name} already in the game`);
        if (newPlayer.player.inGame) throw new Error(`${newPlayer.player.name} can't join two games at the same time`);

        this.game.players.push({
            ID: newPlayer.ID,
            name: newPlayer.player.name                
        })

        return this;
    }

    async removePlayer(playerToRemove) {
        if (this.game.status.find(status => status.active === true).type !== 'waiting') throw new Error(`Players can only leave games in the waiting state`);

        const gamePlayerIndex = this.game.players.findIndex(player => player.ID === playerToRemove.ID);
        if (gamePlayerIndex === -1) throw new Error(`${playerToRemove.player.name} is not in the game`);
        this.game.players.splice(gamePlayerIndex, 1);

        return this;
    }

    getGameStatus() {
        return this.game.status.find(status => status.active) || null;
    }

    async getCard(isGameDeck, isFloor, player, index) {
        if (isGameDeck) {
            const activeDeck = this.getAvailableCards();
            return activeDeck[activeDeck.length -1] || null;
        }

        if (isFloor) {
            const currentRound = await this.getCurrentRound();
            return currentRound.usedCards[currentRound.usedCards.length - 1] || null;
        }
    
        if (player) {
            const gamePlayer = this.game.players.find(p => p.ID === player.ID);
            if (gamePlayer && typeof index === 'number' && index >= 0 && index < gamePlayer.cards.length) {
                return gamePlayer.cards[index] || null;
            }
        }
    
        return null;
    }

    /**
     * @returns the game object for the front-end. It must be sent on each move to make sure the game is synchronized
     */
    async getGameObject() {
        const players = this.game.players.map((player, index) => ({
                index: index,
                ID: player.ID,
                name: player.name,
                cards: player.cards?.every(card => card != null ? 1 : 0) ?? [],
                ready: player.ready,
                score: player.score        
            })
        );

        const activeStatus = this.game.status.find(status => status.active);
        const activeDeck = this.getAvailableCards();

        return {
            code: this.game.code,
            players: players,
            status: activeStatus?.type ?? null,
            deckSize: activeDeck?.length || 0,
            usedCards: currentRound?.usedCards.length || 0,
            currentTurn: currentRound?.currentPlayerIndex ?? null,
            screwPlayerIndex: currentRound?.screwPlayerIndex ?? null,
            roundNumber: currentRound?.number ?? null,
            // roundMoves: currentRound?.moves.map(move => ({
            //     card: move.card,
            //     type: move.type,
            //     location: move.location,
            //     locPlayer: move.locPlayer,
            //     by: move.by,
            //     date: move.date
            // })) ?? [],
            winner: currentRound?.winner ?? [],
            maxMoveTime: this.game.maxMoveTime,
            numberOfRounds: this.game.numberOfRounds,
            maxPlayers: this.game.maxPlayers,
            gameWinners: this.game.winner ?? []
        }
    }

    validateCard(deck, cardID) {
        const card = deck.find(card => card.ID === cardID);
        if (!card) throw new Error("Invalid card ID");
        return card;
    }
    
    validatePlayer(players, playerID) {
        const player = players.find(player => player.ID === playerID);
        if (!player) throw new Error("Invalid player ID");
        return player;
    }
}

module.exports = { GameService };