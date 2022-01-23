// NPM packages
const express = require('express')
const passport = require('passport')
const router = express.Router()
const customErrors = require('../../lib/custom_errors')
const Room = require('../models/rooms.js')
const asyncHandler = require('express-async-handler')

const requireToken = passport.authenticate('bearer', { session: false })
const { BadCredentialsError } = customErrors
/* Errors: BadParamsError, handle404, requireOwnership */

router.post(
  '/create-room',
  requireToken,
  asyncHandler(async (req, res, next) => {
    req.body.room.owner = req.user._id

    if (!req.body.room.name) {
      throw new BadCredentialsError()
    }

    const room = await Room.create(req.body.room)

    res.status(201).json({ room })
  })
)

router.get(
  '/index-rooms',
  requireToken,
  asyncHandler(async (req, res, next) => {
    console.log('got')
    // get all rooms
    const rooms = await Room.find()

    res.status(200).json({ rooms })
  })
)

module.exports = router
