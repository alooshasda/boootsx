const Discord = require('discord.js');
module.exports.run = async(message, args, client, prefix, lang) => {
    if (!message.member.hasPermission("ADMINISTRATOR"))
    return message.reply(new Discord.MessageEmbed().setColor("#4c56c2").setDescription(`لا تملك صلاحيات`))
    message.channel.updateOverwrite(message.channel.guild.roles.everyone, {
      SEND_MESSAGES: false,
      ADD_REACTIONS: false
    }).then(() => {
      message.channel.send(new Discord.MessageEmbed().setColor("#4c56c2").setDescription(`تم اغلاق الروم`).setFooter(`By : ${message.author.username}`))
    })
  }


module.exports.help = {
  name: "lock",
  description: "Commands Lock Channels",
  aliases: ['قفل']
}