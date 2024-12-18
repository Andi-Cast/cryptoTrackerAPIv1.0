const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true 
    },
    password: {
        type: String,
        required: true,
        minLength: 8
    },
    firstname: {
        type: String,
        required: true,
        minlength: 1,
        maxlength: 100
    },
    lastname: {
        type: String,
        required: true,
        minlength: 1,
        maxlength: 100
    },
    roles: {
        User: {
            type: Number,
            default: 1111
        },
        Admin: Number
    },
    portfolio: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Asset'}],
    portfolioMarketValue: {
        type: Number,
        default: 0
    },
    portfolioCostBasis: {
        type: Number,
        default: 0
    },
    refreshToken: [String]
});

module.exports = mongoose.model('User', userSchema);