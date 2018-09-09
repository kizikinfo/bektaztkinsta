const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

const Account = new Schema({
    username: String,
    password: String,
    ati: String,
    tattisi: String,
    botStatus: Boolean,
    running: Boolean,
    ls: {
        sc: Number,
        ucursor: String,
        cursor: String,
        direction: String,
        startTime: Number,
        iUserId: Number,
        apiStartTime: Number,
        apiCounter: Number,
        case: Number,
        myPersonalLimit: Number,
        index: Number,
        veryStartTime: Number
    },
    params: {
        picture: String,
        followerCount: Number,
        followingCount: Number
    },
    arr: []
});

Account.plugin(passportLocalMongoose);

module.exports = mongoose.model('accounts', Account);
