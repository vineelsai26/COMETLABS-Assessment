// Imports
const bodyParser = require('body-parser')
const express = require('express')
const axios = require('axios')

const mongoose = require('mongoose')
const User = require('./models/User')
const Question = require('./models/Question')
const Submission = require('./models/Submission')

const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')

// load .env
require('dotenv').config()

// Express
const app = express()

// Constants
const MONGODB_URL = process.env.MONGODB_URL
const SPHERE_PROBLEMS_URL = process.env.SPHERE_PROBLEMS_URL
const SPHERE_PROBLEMS_TOKEN = process.env.SPHERE_PROBLEMS_TOKEN
const SPHERE_SUBMISSIONS_URL = process.env.SPHERE_SUBMISSIONS_URL
const PORT = process.env.PORT || 3000

let refreshTokens = []

// connect to mongoDB
mongoose.connect(MONGODB_URL)

// express extensions
app.use(express.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

// Axios headers
axios.defaults.headers.post['Content-Type'] = 'application/json'


app.get('/', authenticateToken, (req, res) => {
    // Greeting
    res.send(`Hello ${req.user.name} you are ${req.user.role}`)
})

// signup
app.post('/signup', async (req, res) => {
    // User details from POST request
    const name = req.body.name
    const email = req.body.email
    const password = req.body.password
    const role = req.body.role

    // Create user object
    const user = new User({
        name,
        email,
        password,
        role
    })

    // Save user to database
    await user.save().then(() => {
        // Generate access token and refresh token
        const accessToken = generateAccessToken(user)
        const refreshToken = generateRefreshToken(user)

        // Send response
        res.send({ email: user.email, accessToken: accessToken, refreshToken: refreshToken })
    }).catch(err => {
        // Send error response
        res.status(400).send(err)
    })
})

// login
app.post('/login', async (req, res) => {
    // User details from POST request
    const email = req.body.email
    const password = req.body.password

    // Find user in database
    const user = await User.findOne({ email: email })

    // Check if user exists
    if (!user) {
        return res.status(401).send('User not found')
    } else {
        // Check if password is correct for user
        const isPasswordValid = await bcrypt.compare(password, user.password)

        // Check if password is valid
        if (!isPasswordValid) {
            return res.status(401).send('Password is invalid')
        } else {
            // Generate access token and refresh token
            const accessToken = generateAccessToken(user)
            const refreshToken = generateRefreshToken(user)

            // Send response
            res.send({ email: user.email, accessToken: accessToken, refreshToken: refreshToken })
        }
    }
})

// logout
app.post('/logout', (req, res) => {
    // Get refresh token from request and remove it from array
    refreshTokens = refreshTokens.filter(token => token !== req.body.refreshToken)
    res.send('Logged out')
})

// regenerate auth token with refresh token
app.post('/refresh', (req, res) => {
    const refreshToken = req.body.refreshToken

    // Check if refresh token is valid
    if (refreshToken == null) {
        return res.status(401).send('Token is invalid')
    } else {
        if (!refreshTokens.includes(refreshToken)) {
            return res.status(403).send('Token is invalid')
        } else {
            jwt.verify(refreshToken, process.env.JWT_REFRESH_TOKEN, (err, user) => {
                if (err) {
                    return res.status(403).send('Token is invalid')
                } else {
                    // Generate new access token
                    const accessToken = generateAccessToken(user)

                    return res.status(200).send({ accessToken: accessToken, refreshToken: refreshToken })
                }
            })

        }
    }
})

// display all questions
app.get('/displayQuestions', authenticateToken, async (req, res) => {
    // is user admin
    if (req.user.role == 'admin') {
        // get directly from sphere api
        await axios.get(SPHERE_PROBLEMS_URL + '?access_token=' + SPHERE_PROBLEMS_TOKEN).then(response => {
            res.send(response.data)
        }).catch(err => {
            res.status(400).send(err)
        })
    } else {
        res.send('You are not authorized')
    }
})

// display questions uploaded by any admin
app.get('/displayUploadedQuestions', authenticateToken, async (req, res) => {
    if (req.user.role == 'admin') {
        // get question ids from mongoDB and send them to sphere api
        let questionsList = []
        await Question.find().then(async (questions) => {
            for (let i = 0; i < questions.length; i++) {
                await axios.get(SPHERE_PROBLEMS_URL + '/' + questions[i].id + '?access_token=' + SPHERE_PROBLEMS_TOKEN).then(response => {
                    questionsList.push(response.data)
                }).catch(err => {
                    res.send(err)
                })
            }
        })
        if (questionsList.length > 0) {
            res.send(questionsList)
        } else {
            res.send('No questions uploaded')
        }
    } else {
        res.send('You are not authorized')
    }
})

// add questions
app.post('/addQuestion', authenticateToken, async (req, res) => {
    if (req.user.role == 'admin') {
        // validate if question is valid
        if (req.body.name == null || req.body.description == null) {
            return res.status(400).send('Missing required fields')
        } else {
            await axios.post(SPHERE_PROBLEMS_URL + '?access_token=' + SPHERE_PROBLEMS_TOKEN, {
                "name": req.body.name,
                "body": req.body.description,
                "masterjudgeId": 1001
            }).then(async (response) => {
                await Question.create({
                    id: response.data.id
                })
                return res.send(response.data)
            }).catch(err => {
                res.status(400).send(err)
            })
        }
    } else {
        res.send('You are not authorized')
    }
})

// update questions
app.post('/updateQuestion', authenticateToken, async (req, res) => {
    if (req.user.role == 'admin') {
        // get previous question data from sphere api
        await axios.get(SPHERE_PROBLEMS_URL + '/' + req.body.id + '?access_token=' + SPHERE_PROBLEMS_TOKEN).then(response => {
            // if required fields are empty overwrite with previous data
            if (req.body.name == null) {
                req.body.name = response.data.name
            }
            if (req.body.name == null) {
                req.body.description = response.data.body
            }
        })
        await axios.put(SPHERE_PROBLEMS_URL + '/' + req.body.id + '?access_token=' + SPHERE_PROBLEMS_TOKEN, {
            "name": req.body.name,
            "body": req.body.description
        }).then(response => {
            return res.send(response.data)
        }).catch(err => {
            res.status(400).send(err)
        })
    } else {
        res.send('You are not authorized')
    }
})

// delete questions
app.post('/deleteQuestion', authenticateToken, async (req, res) => {
    if (req.user.role == 'admin') {
        await axios.delete(SPHERE_PROBLEMS_URL + '/' + req.body.id + '?access_token=' + SPHERE_PROBLEMS_TOKEN).then(async (response) => {
            await Question.deleteOne({ id: req.body.id })
            return res.send(response.data)
        }).catch(err => {
            res.status(400).send(err)
        })
    } else {
        res.send('You are not authorized')
    }
})

app.post('/listTestCase', authenticateToken, async (req, res) => {
    if (req.user.role == 'admin') {
        await axios.get(SPHERE_PROBLEMS_URL + '/' + req.body.id + '/' + 'testcases?access_token=' + SPHERE_PROBLEMS_TOKEN).then(response => {
            res.send(response.data)
        }).catch(err => {
            res.status(400).send(err)
        })
    } else {
        res.send('You are not authorized')
    }
})

app.post('/addTestCase', authenticateToken, async (req, res) => {
    if (req.user.role == 'admin') {
        await axios.post(SPHERE_PROBLEMS_URL + '/' + req.body.id + '/' + 'testcases?access_token=' + SPHERE_PROBLEMS_TOKEN, {
            "input": req.body.input,
            "output": req.body.output,
            "judgeId": 1
        }).then(response => {
            res.send(response.data)
        }).catch(err => {
            res.status(400).send(err)
        })
    } else {
        res.send('You are not authorized')
    }
})

app.post('/updateTestCase', authenticateToken, async (req, res) => {
    if (req.user.role == 'admin') {
        await axios.put(SPHERE_PROBLEMS_URL + '/' + req.body.id + '/' + 'testcases/' + req.body.number + '?access_token=' + SPHERE_PROBLEMS_TOKEN, {
            "input": req.body.input,
            "output": req.body.output
        }).then(response => {
            res.send(response.data)
        }).catch(err => {
            res.status(400).send(err)
        })
    } else {
        res.send('You are not authorized')
    }
})

// submit code
app.post('/submission', authenticateToken, async (req, res) => {
    await axios.post(SPHERE_SUBMISSIONS_URL + '?access_token=' + SPHERE_PROBLEMS_TOKEN, {
        "problemId": req.body.problemId,
        "source": req.body.source,
        "compilerId": req.body.compilerId || 1
    }).then(async (response) => {
        // sent code to sphere then get the result
        await axios.get(SPHERE_SUBMISSIONS_URL + '/' + response.data.id + '?access_token=' + SPHERE_PROBLEMS_TOKEN).then(async (response) => {
            await saveSubmissionResult(response, req, res)
        }).catch(err => {
            res.status(400).send(err)
        })
    }).catch(err => {
        res.status(400).send(err)
    })
})

// list submissions
app.get('/listAllSubmissions', authenticateToken, async (req, res) => {
    if (req.user.role == 'admin') {
        await Submission.find().then(async (submissions) => {
            res.send(submissions)
        }).catch(err => {
            res.status(400).send(err)
        })
    } else {
        res.send('You are not authorized')
    }
})

app.post('/listUserSubmissions', authenticateToken, async (req, res) => {
    if (req.user.role == 'admin') {
        await Submission.find({ userEmail: req.body.email }).then(async (submissions) => {
            res.send(submissions)
        }).catch(err => {
            res.status(400).send(err)
        })
    } else {
        res.send('You are not authorized')
    }
})

app.post('/listQuestionSubmissions', authenticateToken, async (req, res) => {
    if (req.user.role == 'admin') {
        await Submission.find({ problemId: req.body.problemId }).then(async (submissions) => {
            res.send(submissions)
        }).catch(err => {
            res.status(400).send(err)
        })
    } else {
        res.send('You are not authorized')
    }
})

app.get('/listSelfSubmissions', authenticateToken, async (req, res) => {
    await Submission.find({ userEmail: req.user.email }).then(async (submissions) => {
        res.send(submissions)
    }).catch(err => {
        res.status(400).send(err)
    })
})

// Submission takes time to run so check every second for the result
async function saveSubmissionResult(response, req, res) {
    if (response.data.result.status.name == 'compiling...') {
        sleep(1000).then(async () => {
            await axios.get(SPHERE_SUBMISSIONS_URL + '/' + response.data.id + '?access_token=' + SPHERE_PROBLEMS_TOKEN).then(async (response) => {
                await saveSubmissionResult(response, req, res)
            }).catch(err => {
                res.status(400).send(err)
            })
        })
    } else {
        const submission = await Submission.create({
            submissionId: response.data.id,
            problemId: response.data.problem.id,
            userEmail: req.user.email,
            submissionResponse: response.data.result.status.name
        }).then(() => {
            res.send(submission.submissionResponse)
        }).catch(err => {
            res.status(400).send(err)
        })
    }
}

// generate access token
function generateAccessToken(user) {
    return jwt.sign(
        {
            name: user.name,
            email: user.email,
            role: user.role
        },
        process.env.JWT_ACCESS_TOKEN,
        { expiresIn: '10m' }
    )
}

// generate refresh token
function generateRefreshToken(user) {
    const refreshToken = jwt.sign(
        {
            name: user.name,
            email: user.email,
            role: user.role
        },
        process.env.JWT_REFRESH_TOKEN
    )
    refreshTokens.push(refreshToken)
    return refreshToken
}

// middleware to authenticate token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if (token == null) {
        return res.status(401).send('Token is invalid')
    } else {
        jwt.verify(token, process.env.JWT_ACCESS_TOKEN, (err, user) => {
            if (err) {
                return res.status(403).send('Token is invalid')
            } else {
                req.user = user
                next()
            }
        })
    }
}

// listen on port
app.listen(PORT)
