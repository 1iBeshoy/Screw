const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const playerOverTimeStatsSchema = new mongoose.Schema({
    played: {
        type: Number,
        default: 0
    },
    won: {
        type: Number,
        default: 0
    },
    winStreak: {
        type: Number,
        default: 0
    },
    bestWinStreak: {
        type: Number,
        default: 0
    },
    level: {
        type: Number,
        default: 0
    },
    exp: {
        type: Number,
        default: 0
    },
    date: {
        type: Number,
        required: true
    }
})

const stats = new mongoose.Schema({
    played: {
        type: Number,
        default: 0
    },
    won: {
        type: Number,
        default: 0
    },
    winStreak: {
        type: Number,
        default: 0
    },
    bestWinStreak: {
        type: Number,
        default: 0
    },
    level: {
        type: Number,
        default: 0
    },
    exp: {
        type: Number,
        default: 0
    }
})

const log = new mongoose.Schema({
    field: {
        type: String,
        enum: ['ID', 'name', 'email', 'password', 'guest', 'deleted']
    },
    oldValue: {
        type: String
    },
    newValue: {
        type: String
    },
    executor: {
        type: String
    },
    reason: {
        type: String
    },
    frontendDate: {
        type: Number
    },
    date: {
        type: Number
    }
})

const playerSchema = new mongoose.Schema({
    ID: {
        type: String,
        unique: true,
        required: true
    },
    name: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        unique: true
    },
    password: {
        type: String,
    },
    guest: {
        type: Boolean,
        required: true
    },
    games: {
        type: [String],
        default: []
    },
    inGame: {
        type: Boolean,
        default: false
    },
    stats: {
        type: stats,
        default: () => ({})
    },
    overTimeStats: {
        type: [playerOverTimeStatsSchema],
        default: []
    },
    log: {
        type: [log],
        default: []
    },
    deleted: {
        type: Boolean,
        default: false
    },
    dbVersion: {
        type: Number,
        default: 1
    }
})

playerSchema.pre("save", async function(next) {
    if(!this.isModified("password")) return next();

    await bcrypt.genSalt(10).then(async(salt) => {
        this.password = await bcrypt.hash(this.password, salt);
    })

    next();
})

const Player = mongoose.model('player', playerSchema);
module.exports = { Player };