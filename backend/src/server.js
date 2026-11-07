import app from './app.js'

const configuredPort = process.env.PORT ?? '5000'
const port = Number(configuredPort)

if (!/^\d+$/.test(configuredPort) || !Number.isInteger(port) || port < 1 || port > 65535) {
  console.error('PORT must be a whole number from 1 to 65535.')
  process.exit(1)
}

const server = app.listen(port, '127.0.0.1', () => {
  console.log(`FarmMarket API: http://127.0.0.1:${port}/api/health`)
})

server.on('error', error => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Stop the other server or choose a different PORT.`)
  } else {
    console.error(`Could not start the server (${error.code ?? 'unknown error'}).`)
  }
  process.exit(1)
})
