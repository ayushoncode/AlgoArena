/**
 * socket/match.js — in-match events (code_change, submit_code, verdict)
 *
 * Day 22–24: code_change / opponent_typing / submit_code handlers.
 * Placeholder registered here so the event namespace is reserved.
 */

function registerMatch(io) {
  // Match events are scoped to a roomId — wired in Day 22
  // io.on('connection', ...) for match-specific events goes here
  console.log('[Match] socket handlers registered (stub)')
}

module.exports = { registerMatch }
