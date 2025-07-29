const Discord = require('discord.js');
module.exports.run = async(message, args, client, prefix, lang) => {
    if (!message.member.hasPermission("ADMINISTRATOR"))
    return message.reply(new Discord.MessageEmbed().setColor("#4c56c2").setDescription(`لا تملك صلاحيات`))
    message.channel.updateOverwrite(message.channel.guild.roles.everyone, {
      SEND_MESSAGES: true,
      ADD_REACTIONS: true
    }).then(() => {
      message.channel.send(new Discord.MessageEmbed().setColor("#4c56c2").setDescription(`تم فتح الروم`).setFooter(`By : ${message.author.username}`))
    })
  }


module.exports.help = {
  name: "unlock",
  description: "Commands Unlock Channels",
  aliases: ['فتح']
}