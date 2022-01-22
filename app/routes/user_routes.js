//  NPM packaged
const express = require('express')
const crypto = require('crypto')
const passport = require('passport')
const bcrypt = require('bcrypt')
const asyncHandler = require('express-async-handler')

// Require
const { BadCredentialsError, BadParamsError } = require('../../lib/custom_errors')
const User = require('../models/user')

// see above for explanation of "salting", 10 rounds is recommended
const bcryptSaltRounds = 10

// will check token and set `res.user`
const requireToken = passport.authenticate('bearer', { session: false })

// instantiate a router (mini app that only handles routes)
const router = express.Router()

// POST
// SIGN UP
router.post('/sign-up', asyncHandler(async (req, res, next) => {
  const { username, email, password, password_confirmation } = req.body.credentials

  if (!username || !email || !password || password !== password_confirmation) {
    throw new BadParamsError()
  }

  // generate a hash from the provided password, returning a promise
  const hashed = await bcrypt.hash(req.body.credentials.password, bcryptSaltRounds)

  const user = await User.create({
    username,
    email,
    hashedPassword: hashed
  })

  res.status(201).json({ user: user.toObject() })
}))

// POST
// SIGN IN
router.post('/sign-in', asyncHandler(async (req, res, next) => {
  const { password, email } = req.body.credentials

  const user = await User.findOne({ email })

  if (!user) {
    throw new BadCredentialsError()
  }

  let correctPassword = await bcrypt.compare(password, user.hashedPassword)

  if (correctPassword) {
    const token = crypto.randomBytes(16).toString('hex')
    user.token = token

    // save the token to the DB as a property on user
    await user.save()
  } else {
    throw new BadCredentialsError()
  }

  res.status(201).json({ user: user.toObject() })
}))

// PATCH
// CHANGE password
router.patch('/change-password', requireToken, asyncHandler(async (req, res, next) => {
  const { passwords } = req.body

  // gets user from db
  const user = await User.findById(req.user.id)

  console.log(user)
  // check that the old password is correct
  const correctPassword = await bcrypt.compare(passwords.old, user.hashedPassword)

  if (!passwords.new || !correctPassword) {
    throw new BadParamsError()
  }

  // hash new password
  const newPass = await bcrypt.hash(passwords.new, bcryptSaltRounds)

  // set it to user
  user.hashedPassword = newPass

  // save user
  await user.save()

  // response
  res.sendStatus(204)
}))

// DELETE
// SIGN OUT
router.delete('/sign-out', requireToken, asyncHandler(async (req, res, next) => {
  // create a new random token for the user, invalidating the current one
  req.user.token = crypto.randomBytes(16).toString('hex')
  // save the token and respond with 204
  await req.user.save()

  res.sendStatus(204)
}))

module.exports = router
