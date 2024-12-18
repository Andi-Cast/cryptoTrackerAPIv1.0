const mongoose = require('mongoose');

const tradeSchema = new mongoose.Schema({
    amount: {
        type: Number,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    total: {
        type: Number,
        required: true
    },
    timestamp: {
        type: Date,
        required: true
    },
    type: {
        type: String,
        enum: ['buy', 'sell'],
        required: true
    }
});

const assetSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true
    },
    name: {
        type: String,
        required: true
    },
    image: {
        type: String,
    },
    quantity: {
        type: Number,
        default: 0
    },
    costBasis: {
        type: Number,
        default: 0
    },
    averagePrice: {
        type: Number,
        default: 0
    },
    currentMarketValue: {
        type: Number,
        default: 0
    },
    pnl: {
        type: Number,
        default: 0
    },
    trades: [tradeSchema]
});

module.exports = mongoose.model('Asset', assetSchema);