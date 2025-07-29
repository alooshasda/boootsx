const Discord = require("discord.js");
const client = new Discord.Client();
const { readdirSync } = require("fs");
const cooldowns = new Discord.Collection();
client.commands = new Discord.Collection();
const Enmap = require("enmap");
const database = require("quick.db");
const inlinereply = require("discord-reply");
const moment = require("moment");
const events = readdirSync('events');
const protection = readdirSync('protection');
const ms = require("ms");
require("./src/defineProperties");
const disbut = require("discord-buttons");
disbut(client);
client.on('error', console.error);
client.on('warn', console.warn);

events.filter(e => !e.endsWith('.js')).forEach(folder => {
  readdirSync('events/' + folder).forEach(event => {
    event = require(`./events/${folder}/${event}`)(client);
    if (event.once !== false) client.on(event.event, event.run);
  });
});
protection.filter(e => !e.endsWith('.js')).forEach(folder => {
  readdirSync('protection/' + folder).forEach(event => {
    event = require(`./protection/${folder}/${event}`)(client);
    if (event.once !== false) client.on(event.event, event.run);
  });
});

const commandsFolders = readdirSync("commands").filter(
  folder => !folder.includes(".")
);

for (let commandFolder of commandsFolders) {
  const files = readdirSync("commands/" + commandFolder).filter(file =>
    file.endsWith(".js")
  );
  for (let commandFile of files) {
    let cmd = require(`./commands/${commandFolder}/${commandFile}`);
    cmd.category = commandFolder;
    client.commands.set(cmd.help.name, cmd);
  }
}




client.on("guildCreate", guild => {
  let embed = new Discord.MessageEmbed()
    .setColor(`#D25CFF`)
    .setDescription(`Thanks You For Add Me 
    
    [Support](https://discord.gg/pHgvmBTzPB)`);

  guild.owner.send(embed);
});










client.login("MTEzNDE2MDQ1OTQwMzEwODUxNA.G55rf2.q5vSBmhzmzuUwIx4xU9sTGFfQEOKPotuVM5K4Q")