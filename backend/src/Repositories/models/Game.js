const { Schema, model } = require("mongoose");

const move = new Schema({
    card: {
        type: Object,
        required: true
    },
    type: {
        type: String,
        enum: ['take', 'throw'],
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
        type: [Object],
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
        type: [Object],
        default: []
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
        type: [Object],
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
        type: [Object],
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
    players: [player],
    status: [status],
    maxMoveTime: {
        type: Number,
        default: -1
    },
    maxPlayers: {
        type: Number
    },
    winner: {
        type: [Object],
        default: []
    },
    dbVersion: {
        type: Number,
        default: 1
    }
})

const game = model('game', gameSchema);
module.exports = game;