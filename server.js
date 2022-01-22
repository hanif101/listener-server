// require necessary NPM packages
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const http = require('http')
const socketio = require('socket.io')

// const Io = require('./src/IoServer')

// require route files
const userRoutes = require('./app/routes/user_routes')
const roomRoutes = require('./app/routes/room_routes')
const messageRoutes = require('./app/routes/message_routes')

// require middleware
const errorHandler = require('./lib/error_handler')
const requestLogger = require('./lib/request_logger')

// require database configuration logic
// `db` will be the actual Mongo URI as a string
const db = require('./config/db')

// require configured passport authentication middleware
const auth = require('./lib/auth')
const res = require('express/lib/response')

// define server and client ports
// used for cors and local port declaration
const serverDevPort = 3040
const clientDevPort = 7165

// establish database connection
// use new version of URL parser
// use createIndex instead of deprecated ensureIndex
mongoose.connect(db, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true
}).then(console.log('MongoDB connection successfull::'))

// instantiate express application object
const app = express()
const server = http.createServer(app)
// const iolistener = require('socket.io')(
//   (server,
//   {
//     cors: {
//       origin: 'http://localhost:7165',
//       methods: ['GET', 'POST'],
//       allowedHeaders: ['my-custom-header'],
//       credentials: false
//     }
//   })
// ).listen(server)
// const IoServer = Io.create(server)

// set CORS headers on response from this API using the `cors` NPM package
// `CLIENT_ORIGIN` is an environment variable that will be set on Heroku
// set CORS headers on response from this API using the `cors` NPM package
// `CLIENT_ORIGIN` is an environment variable that will be set on Heroku
app.use(cors())

// define port for API to run on

// const port = process.env.PORT || serverDevPort

// register passport authentication middleware
app.use(auth)

// add `express.json` middleware which will parse JSON requests into
// JS objects before they reach the route files.
// The method `.use` sets up middleware for the Express application
app.use(express.json())
// this parses requests sent by `$.ajax`, which use a different content type
app.use(express.urlencoded({ extended: true }))

// log each request as it comes in for debugging
app.use(requestLogger)

// register route files
app.use(exampleRoutes)
app.use(userRoutes)
app.use(roomRoutes)
app.use(messageRoutes)

// register error handling middleware
// note that this comes after the route middlewares, because it needs to be
// passed any error messages from them
app.use(errorHandler)

// run API on designated port (4741 in this case)

const io = socketio(server, {
  cors: {
    origin: 'http://localhost:7165',
    methods: ['GET', 'POST'],
    allowedHeaders: ['my-custom-header'],
    credentials: false
  }
})

io.on('connection', (socket) => {
  console.log('Socket connection made', socket.id)
  socket.on('chat', (data) => {
    io.sockets.emit('chat', data)
  })
})

server.listen(serverDevPort, () => {
  console.log('Server running on port', serverDevPort)
})

// needed for testing
// module.exports = IoServer