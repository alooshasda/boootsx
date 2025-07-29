module.exports.run = async(message, args, client, prefix, lang) => {
  
  message.channel.send("**Pong !!**").then(msg => {
    const png = msg.createdTimestamp - message.createdTimestamp
    const ws = client.ws.ping
    msg.edit(`\`\`\`js\nBot Ping: ${ws}\nDiscord API ${png}\`\`\``)
  })
  
}

module.exports.help = {
  name: "ping",
  description: "Display speed of the bot.",
  aliases: ['p']
}