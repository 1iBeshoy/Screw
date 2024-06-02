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

    async create(host, numberOfRounds, maxMoveTime, maxPlayers) {
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

    async start(host = null, checkReady = false) {
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
            availableCards: [{
                cards: gameDeck.map(card => card.ID),
                shuffle: 1,
                active: true
            }],
            usedCards: [CardService.drawCard(gameDeck)?.ID],
            currentPlayerIndex: Math.round(Math.random() * (this.game.players.length)) - 1,
            active: true
        });

        return this;
    }

    async endRound() {
        const currentRound = this.getCurrentRound();
        if (!currentRound) throw new Error("No active round to end");

        let leastScore = CardService.getPlayerScore(this.game.players[0]);
        let winners = [this.game.players[0].ID];

        this.game.players.forEach(player => {
            const playerScore = CardService.getPlayerScore(player);

            if (playerScore < leastScore) {
                leastScore = playerScore;
                winners = [player.ID];
            } else if (playerScore === leastScore && !winners.includes(player.ID)) {
                winners.push(player.ID);
            }
        });

        for(player in this.game.players) {
            if(winners.includes(player.ID)) continue;
            const playerScore = CardService.getPlayerScore(player);
            const playerTotalScore = player.score;
            
            player.score = (isNaN(playerScore) ? playerTotalScore + playerScore : playerScore);
        }

        currentRound.winner = winners.map(winner => winner.ID).join(',');
        currentRound.active = false;

        if (currentRound.number === this.game.numberOfRounds) {
            await this.endGame();
        } else {
            await this.startNewRound();
        }

        return this;
    }

    async end() {
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
            by: winners.map(winner => winner.ID).join(','),
            date: moment.now(),
            active: true
        });

        this.game.winner = winners.map(winner => winner.ID).join(',');

        return this;
    }

    async drawCard(fromLocation, fromPlayer = null, fromPlayerCardIndex = null, byPlayer) {
        validatePlayer(this.game.players, byPlayer.ID);
        let drawnCard = null;

        switch (fromLocation) {
            case "deck":
                drawnCard = CardService.drawCard(await this.getActiveDeck());
                break;
            case "floor":
                drawnCard = this.game.floor.pop();
                break;
            case "player":
                if (fromPlayerCardIndex <= -1 || fromPlayerCardIndex >= 4)
                    throw new Error("Trying to draw an invalid card!");

                let gamePlayer = validatePlayer(this.game.players, fromPlayer.ID);
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
            card: drawnCard,
            type: "draw",
            location: fromLocation,
            locPlayer: fromPlayer?.email ?? '',
            by: byPlayer.email,
            date: moment().toISOString()
        });

        await GameRepository.saveGame(this.game);
        return drawnCard;
    }

    getCurrentRound() {
        return this.game.rounds.find(round => round.active);
    }

    validateCard(deckToValidateFrom, cardID) {
        if(CardService.getCardById(cardID) === null)
            throw new Error("Invalid card!");

        const cardIndex = deckToValidateFrom.findIndex(card => card.id === cardID);
        if (cardIndex === -1)
            throw new Error("Invalid card!");
        
        return deckToValidateFrom[cardIndex];
    }

    validatePlayer(players, playerToFindID) {
        const player = players.find(player => player.ID === playerToFindID);
        if (!player)
            throw new Error(`Unauthorized Move!`);

        return player;
    }
}

module.exports = { GameService };