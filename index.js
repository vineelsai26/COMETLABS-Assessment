const bodyParser = require('body-parser')
const express = require('express')
const axios = require('axios')

const mongoose = require('mongoose')
const User = require('./models/User')
const Question = require('./models/Question')
const Submission = require('./models/Submission')

const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')

require('dotenv').config()

const app = express()
const MONGODB_URL = process.env.MONGODB_URL
const SPHERE_PROBLEMS_URL = process.env.SPHERE_PROBLEMS_URL
const SPHERE_PROBLEMS_TOKEN = process.env.SPHERE_PROBLEMS_TOKEN
const SPHERE_SUBMISSIONS_URL = process.env.SPHERE_SUBMISSIONS_URL
const PORT = process.env.PORT || 3000

let refreshTokens = []

mongoose.connect(MONGODB_URL)

app.use(express.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

axios.defaults.headers.post['Content-Type'] = 'application/json'


app.get('/', authenticateToken, (req, res) => {
    res.send(`Hello ${req.user.name} you are ${req.user.role}`)
})

app.post('/signup', async (req, res) => {
    const name = req.body.name
    const email = req.body.email
    const password = req.body.password
    const role = req.body.role

    const user = new User({
        name,
        email,
        password,
        role
    })

    await user.save().then(() => {
        const accessToken = generateAccessToken(user)
        const refreshToken = generateRefreshToken(user)

        res.send({ email: user.email, accessToken: accessToken, refreshToken: refreshToken })
    }).catch(err => {
        res.status(400).send(err)
    })
})

app.post('/login', async (req, res) => {
    const email = req.body.email
    const password = req.body.password

    const user = await User.findOne({ email: email })

    if (!user) {
        return res.status(401).send('User not found')
    } else {
        const isPasswordValid = await bcrypt.compare(password, user.password)

        if (!isPasswordValid) {
            return res.status(401).send('Password is invalid')
        } else {
            const accessToken = generateAccessToken(user)
            const refreshToken = generateRefreshToken(user)

            res.send({ email: user.email, accessToken: accessToken, refreshToken: refreshToken })
        }
    }
})

app.post('/logout', (req, res) => {
    refreshTokens = refreshTokens.filter(token => token !== req.body.refreshToken)
    res.send('Logged out')
})

app.post('/refresh', (req, res) => {
    const refreshToken = req.body.refreshToken
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
                    const accessToken = generateAccessToken(user)

                    return res.status(200).send({ accessToken: accessToken, refreshToken: refreshToken })
                }
            })

        }
    }
})

app.get('/displayQuestions', authenticateToken, async (req, res) => {
    if (req.user.role == 'admin') {
        await axios.get(SPHERE_PROBLEMS_URL + '?access_token=' + SPHERE_PROBLEMS_TOKEN).then(response => {
            res.send(response.data)
        }).catch(err => {
            res.status(400).send(err)
        })
    } else {
        res.send('You are not authorized')
    }
})

app.get('/displayUploadedQuestions', authenticateToken, async (req, res) => {
    if (req.user.role == 'admin') {
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

app.post('/addQuestion', authenticateToken, async (req, res) => {
    if (req.user.role == 'admin') {
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

app.post('/updateQuestion', authenticateToken, async (req, res) => {
    if (req.user.role == 'admin') {
        await axios.get(SPHERE_PROBLEMS_URL + '/' + req.body.id + '?access_token=' + SPHERE_PROBLEMS_TOKEN).then(response => {
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

app.post('/submission', authenticateToken, async (req, res) => {
    await axios.post(SPHERE_SUBMISSIONS_URL + '?access_token=' + SPHERE_PROBLEMS_TOKEN, {
        "problemId": req.body.problemId,
        "source": req.body.source,
        "compilerId": req.body.compilerId || 1
    }).then(async (response) => {
        await axios.get(SPHERE_SUBMISSIONS_URL + '/' + response.data.id + '?access_token=' + SPHERE_PROBLEMS_TOKEN).then(async (response) => {
            await saveSubmissionResult(response, req, res)
        }).catch(err => {
            res.status(400).send(err)
        })
    }).catch(err => {
        res.status(400).send(err)
    })
})

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

app.listen(PORT)
