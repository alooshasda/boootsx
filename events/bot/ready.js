const Discord = require("discord.js");
const db = require("quick.db");
module.exports = client => ({
  event: 'ready',
  run() {
    console.log('Logged in As ' + client.user.tag);
    console.table([{ Username: client.user.username, Servers: client.guilds.cache.size }]);
    client.user.setPresence({
      status: "online",
      activity: {
        name: db.get(`game`) || "Midulla Store",
        type: "PLAYING",
      }
    })
  }
});