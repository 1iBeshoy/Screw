const { Schema, model } = require("mongoose");

const move = new Schema({
    card: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        enum: ['draw', 'take', 'throw'],
        required: true
    },
    location: { // to/from
        type: String,
        enum: ['deck', 'floor', 'player'],
        required: true
    },
    locPlayer: {
        type: String
    },
    by: {
        type: String,
        required: true
    },
    date: {
        type: Number,
        required: true
    }
})

const round = new Schema({
    number: {
        type: Number,
        required: true
    },
    moves: {
        type: [move],
        default: []
    },
    availableCards: {
        type: [availableCards],
        default: []
    },
    usedCards: {
        type: [Number],
        default: null
    },
    currentPlayerIndex: {
        type: Number,
        default: 0
    },
    screwPlayerIndex: { // player index
        type: Number,
        default: -1
    },
    winner: {
        type: [String],
        default: []
    },
    active: {
        type: Boolean,
        required: true
    }
})

const status = new Schema({
    type: {
        type: String,
        enum: ['waiting', 'playing', 'ended', 'deleted'],
        required: true
    },
    by: {
        type: String,
        required: true
    },
    date: { // the date in ms
        type: Number,
        required: true
    },
    active: {
        type: Boolean,
        required: true
    }
})

const player = new Schema({
    ID: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    cards: {
        type: [Number],
        default: []
    },
    ready: {
        type: Boolean,
        default: false
    },
    score: {
        type: Number,
    }
})

const availableCards = new Schema({
    cards: {
        type: [Number],
        required: true
    },
    shuffle: {
        type: Number,
        required: true
    },
    active: {
        type: Boolean,
        required: true
    }
})

const gameSchema = new Schema({
    code: {
        type: String,
        required: true,
        unique: true
    },
    players: {
        type: [player],
        default: []
    },
    status: {
        type: [status],
        default: []
    },
    rounds: {
        type: [round],
        default: []
    },
    numberOfRounds: {
        type: Number,
        default: 4
    },
    maxMoveTime: {
        type: Number,
        default: -1
    },
    maxPlayers: {
        type: Number,
        default: 14
    },
    winner: {
        type: [String],
        default: []
    },
    dbVersion: {
        type: Number,
        default: 1
    }
})

const game = model('game', gameSchema);
module.exports = game;