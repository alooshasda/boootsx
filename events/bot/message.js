const bot = require("../../config");
const { Collection, MessageEmbed, WebhookClient } = require("discord.js");
const db = require("quick.db");
const cooldowns = new Collection();
const logcmd = new WebhookClient(
  "1153804979207929936", "BSQCT9FrPRTUUYvgAARFGQkNj3x4RTacj2sNHcru2IYcC74N8Hf_0hfo-KAYxivHVSpy"
);

module.exports = client => ({
  event: 'message',
  run(message) {
    if (bot.status == false) return;
    if (message.author.bot || !message.guild) return
    var data = db.get(`settings_${message.guild.id}`);
    if (!data) data = db.set(`settings_${message.guild.id}`, {
      prefix: "-",
      language: "ar"
    });
    let lang;
    let prefix = db.get(`settings_${message.guild.id}.prefix`);
    let settings = db.get(`settings_${message.guild.id}.language`);
    if (settings == 'ar') lang = true;
    if (settings == 'en') lang = false;
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    var commandName = args.shift().toLowerCase();
    if (!message.content.startsWith(prefix)) return;
    const command =
      client.commands.get(commandName) ||
      client.commands.find(cmd => cmd.help.aliases &&
        cmd.help.aliases.includes(commandName)
      );
    if (!command) return;
    var cmd = command.help;

    let loghook = new MessageEmbed()
      .setTitle(`**${client.user.username}**`)
      .addField(
        "**Member:**",
        `\`${message.author.tag}\` | <@${message.author.id}>`
      )
      .addField(
        "**Server:**",
        `\`${message.guild.name}\` | ${message.guild.id}`
      )
      .addField("**Member Count:**", `\`${message.guild.memberCount}\``)
      .addField("**Prefix:**", `\`${prefix}\``)
      .addField("**Command:**", `\`${commandName} ${args.join(' ')}\``)
      .addField(
        "**Channel:**",
        `\`${message.channel.name}\` | ${message.channel.id}`
      )
      .setThumbnail(message.guild.iconURL({ dynamic: true }))
      .setAuthor(message.guild.name, message.guild.iconURL({ dynamic: true }))
      .setFooter(message.author.username, message.author.avatarURL({ dynamic: true }))
      .setTimestamp()
      .setColor("RANDOM");

    logcmd.send(loghook);

    let embed = new MessageEmbed()
      .setTitle("**Command: " + cmd.name + "**")
    if (cmd.description) embed.setDescription(`**${cmd.description}**`)
      .setColor("#8e04f2")
      .setFooter(
        `- Requested By: ${message.author.tag}`,
        message.author.avatarURL()
      )
    if (cmd.aliases)
      embed.addField(
        `**Command Aliases:**`,
        prefix + cmd.aliases.join("," + prefix)
      );
    if (cmd.usage)
      embed.addField(
        "**Usage Command:**",
        `${prefix + cmd.usage.join("\n" + prefix).replace(/\[p]/g, prefix)
          .replace(/\[author]/g, message.author)
          .replace(/\[userID]/g, message.author.id)
          .replace(/\[user]/g, message.author)
          .replace(/\[userName]/g, message.author.username)}`
      );
    if (cmd.Examples)
      embed.addField(
        "**Examble Command:**",
        prefix + cmd.Examples.join("\n" + prefix).replace(/\[p]/g, prefix)
          .replace(/\[author]/g, message.author)
          .replace(/\[userID]/g, message.author.id)
          .replace(/\[user]/g, message.author)
          .replace(/\[userName]/g, message.author.username)
      );
    if (cmd.admin && !message.member.hasPermission([cmd.permissions]))
      embed.addField("**صلاحية الأمر :**", "`" + cmd.permissions + "`");
    if (cmd.owner)
      embed.addField("** الأمر فقط لـ :**", `<@${message.guild.ownerID}>`);
    if (cmd.args && !args.length) return message.channel.send(embed);
    if (command.help.admin && !message.member.hasPermission(command.help.permissions))
      return;
    if (cmd.devs && !bot.devs.includes(message.author.id)) return;
    if (cmd.owner && message.author.id !== message.guild.ownerID)

      return message.channel.send('**الأمر فقط لمالك السيرفر !**')

    if (!cooldowns.has(cmd.name)) {
      cooldowns.set(cmd.name, new Collection());
    }
    const now = Date.now();
    const timestamps = cooldowns.get(cmd.name);
    const cooldownAmount = (cmd.cooldown || 3) * 1000;
    if (timestamps.has(message.author.id)) {
      const expirationTime = timestamps.get(message.author.id) + cooldownAmount;
      if (now < expirationTime) {
        const timeLeft = (expirationTime - now) / 1000;
        return message.channel.send(
          `**${bot.emojis.err} - Please Wiat \`${timeLeft.toFixed()}\` Secs !**`
        )
          .then(msg => {
            msg.delete({ timeout: 2500 });
          });
      }
    }
    timestamps.set(message.author.id, now);
    setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

    try {
      command.run(message, args, client, prefix, lang);
    } catch (err) {
      return console.log(err)
    }
  }
});