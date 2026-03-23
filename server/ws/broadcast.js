export class WsBroadcast {
  constructor(db) {
    this.db = db;
    this.clients = new Set();
  }

  /**
   * Handle a new WebSocket connection.
   * Adds the client and sends the current scoreboard snapshot.
   */
  handleConnection(ws) {
    this.clients.add(ws);

    ws.on('close', () => this.removeClient(ws));
    ws.on('error', () => this.removeClient(ws));

    // Send initial scoreboard snapshot
    try {
      const scoreboard = this._buildScoreboard();
      ws.send(JSON.stringify({ type: 'scoreboard', data: scoreboard }));
    } catch {
      // Client may have disconnected immediately
    }
  }

  /**
   * Send a JSON message to all connected clients.
   */
  broadcast(message) {
    const payload = typeof message === 'string' ? message : JSON.stringify(message);
    const deadClients = [];
    for (const client of this.clients) {
      try {
        if (client.readyState === 1) { // WebSocket.OPEN
          client.send(payload);
        }
      } catch {
        deadClients.push(client);
      }
    }
    for (const client of deadClients) {
      this.removeClient(client);
    }
  }

  /**
   * Broadcast a new QSO to all clients.
   */
  broadcastQso(qso) {
    this.broadcast({ type: 'qso', data: qso });
  }

  /**
   * Broadcast a full scoreboard update.
   */
  broadcastScoreboard(data) {
    this.broadcast({ type: 'scoreboard', data });
  }

  /**
   * Remove a client from the tracked set.
   */
  removeClient(ws) {
    this.clients.delete(ws);
  }

  /**
   * Build the current scoreboard from the active contest.
   */
  _buildScoreboard() {
    // Find the active contest (if any)
    const contest = this.db.prepare(
      "SELECT id FROM contests WHERE status = 'active' LIMIT 1"
    ).get();

    if (!contest) return [];

    return this.db.prepare(`
      SELECT
        station_callsign,
        COUNT(*) AS qso_count,
        SUM(points) AS total_points,
        SUM(is_multiplier) AS multipliers,
        SUM(points) * MAX(1, SUM(is_multiplier)) AS score
      FROM qsos
      WHERE contest_id = ?
      GROUP BY station_callsign
      ORDER BY score DESC
    `).all(contest.id);
  }
}
