const mongoose = require("mongoose");

const cards = new mongoose.Schema({
    id: {
        type: Number,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    imgSrc: {
        type: String,
        required: true
    },
    points: {
        type: Number,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        enum: ['number', 'seeOther', 'seeSelf', 'seeAll', 'exchange', 'throw']
    },
    gameVersion: {
        type: Number,
        required: true
    },
    dbVersion: {
        type: Number,
        default: 1
    }
});

const Card = mongoose.model('Cards', cards);
module.exports = { Card };