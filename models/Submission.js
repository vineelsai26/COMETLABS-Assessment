const mongoose = require('mongoose')

const submissionSchema = new mongoose.Schema({
    problemId: {
        type: String,
        required: true
    },
    submissionId: {
        type: String,
        required: true,
        unique: true
    },
    userEmail: {
        type: String,
        required: true
    },
    submissionResponse: {
        type: String,
        required: true,
        default: 'No response'
    }
})

module.exports = mongoose.model('Submission', submissionSchema)
