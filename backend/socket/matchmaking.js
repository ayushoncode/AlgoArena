/**
 * socket/matchmaking.js — in-memory matchmaking queue
 *
 * Day 12: skeleton that logs join_queue events.
 * Day 13: full in-memory queue per topic.
 * Day 14: Elo rating band matching with 10-second expansion.
 */

/**
 * registerMatchmaking(io)
 * Called once from index.js with the Socket.io server instance.
 * Sets up the join_queue listener on every new socket connection.
 */
function registerMatchmaking(io) {
  io.on('connection', (socket) => {
    // join_queue — emitted by Lobby.jsx when user clicks "Find Match"
    socket.on('join_queue', ({ topic, rating }) => {
      console.log(`[Matchmaking] join_queue — socket=${socket.id} topic=${topic} rating=${rating}`)
      // Day 13: push into in-memory queue and attempt to match
    })

    socket.on('disconnect', (reason) => {
      console.log(`[Socket] disconnected — socket=${socket.id} reason=${reason}`)
      // Day 13: remove from queue if still waiting
    })
  })
}

module.exports = { registerMatchmaking }
