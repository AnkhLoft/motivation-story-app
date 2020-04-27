const functions = require('firebase-functions').region('europe-west2')
const admin = require('firebase-admin')
const app = require('express')()
const asyncHandler = require('express-async-handler')
const firebase = require('firebase')
const configs = require("./configs.json")

admin.initializeApp({
  credential: admin.credential.cert(configs.serviceAccountKey),
  databaseURL: "https://motivation-story-app.firebaseio.com"
})

firebase.initializeApp(configs.firebase)

const db = admin.firestore()

app.get('/stories', asyncHandler(async (req, res) => {
  const response = await db.collection('stories').orderBy('createdAt', 'desc').get()
  let stories = []
  response.forEach(doc => {
    stories.push({
      id: doc.id,
      ...doc.data()
    })
  })

  return res.json({ data: stories })
}))

app.post('/story', asyncHandler(async (req, res) => {
  const newStory = {
    user: req.body.user,
    description: req.body.description,
    title: req.body.title,
    createdAt: new Date().toISOString()
  }
  const response = await db.collection('stories').add(newStory)

  return res.json({ message: `Story with id ${response.id} created successfully!` })
}))

// Signup route
app.post('/signup', asyncHandler(async (req, res) => {
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    username: req.body.username,
    avatar: req.body.avatar
  }

  // Check if this new user already exists
  const userSnapshot = await db.collection('users').doc(newUser.email).get()

  if (userSnapshot.exists) {
    return res.status(400).json({ message: 'That user already exists', data: null })
  }
  
  const response = await firebase.auth().createUserWithEmailAndPassword(newUser.email, newUser.password)
  const token = await response.user.getIdToken() 
  return res.status(201).json({ message: 'User created successfully!', data: { token } })
}))

exports.api = functions.https.onRequest(app);