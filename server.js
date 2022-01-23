// require necessary NPM packages
require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const http = require('http')
const socketio = require('socket.io')

// imports
const db = require('./config/db')
const auth = require('./lib/auth')
const errorHandler = require('./lib/error_handler')
const requestLogger = require('./lib/request_logger')

// routes
const userRoutes = require('./app/routes/user_routes')
const roomRoutes = require('./app/routes/room_routes')
const messageRoutes = require('./app/routes/message_routes')

// ports
const serverDevPort = 3040
const clientDevPort = 7165

// database connection
mongoose.connect(db, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true
}).then(console.log('MongoDB connection successfull'))

// app & server created
const app = express()
const server = http.createServer(app)

// cors
app.use(cors({ origin: process.env.CLIENT_ORIGIN || `http://localhost:${clientDevPort}` }))

const io = socketio(
  (server,
  {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      allowedHeaders: ['my-custom-header'],
      credentials: false
    }
  })
).listen(server)

// register passport authentication middleware
app.use(auth)
app.use(express.json())

// this parses requests sent by `$.ajax`, which use a different content type
app.use(express.urlencoded({ extended: true }))

// log each request as it comes in for debugging
app.use(requestLogger)

// route files
app.use(userRoutes)
app.use(roomRoutes)
app.use(messageRoutes)

// Error Handler
app.use(errorHandler)

server.listen(serverDevPort, () => {
  console.log('Server running on port', serverDevPort)
})

io.on('connection', socket => {
  console.log(socket.id, 'connected user')

  socket.on('message', data => {
    socket.broadcast.emit('message', data)
  })
})

/* ================================= Jonah Socket Io ================================== */

/* module.exports = IoServer
socket Io setups
const iolistener = require('socket.io')(
  (server,
  {
    cors: {
      origin: process.env.IO_CORS,
      methods: ['GET', 'POST'],
      allowedHeaders: ['my-custom-header'],
      credentials: false
    }
  })
).listen(server)
const IoServer = Io.create(iolistener)

 addListeners(IoServer)

 const Io = require('./src/IoServer')
const {addListeners} = require('./src/SocketListeners') */
