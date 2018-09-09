const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Port = new Schema({
    p: Number
});

module.exports = mongoose.model('ports', Port);
