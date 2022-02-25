const mongoose = require('mongoose')

const questionSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    }
})

module.exports = mongoose.model('Question', questionSchema)
