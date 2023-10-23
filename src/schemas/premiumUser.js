const { model, Schema } = require('mongoose');

let user = Schema({
    Id: { type: String, default: null },
    PremID: { type: String, default: null },
    isPremium: { type: Boolean, default: false },
    redeemedAt: { type: Number, default: null },
    expiresAt: { type: Number, default: null },
    plan: { type: String, default: null },
});

module.exports = model("premium", user);
