const Discord = require("discord.js")

module.exports.run = async(message, args, client) => {
    if (!message.member.hasPermission("ADMINISTRATOR"))
    return message.reply(new Discord.MessageEmbed().setColor("#4c56c2").setDescription(`لا تملك صلاحيات`))
    var list_all = [];
    message.guild.members.cache.forEach(bb => {
      if (!bb.user.bot) return;
      list_all.push(`<@${bb.user.id}>`);
    });
    
    let embed = new Discord.MessageEmbed()
    .setAuthor(`${message.author.username}`, `${message.author.avatarURL({dynamic:true})}`)
    .setDescription(list_all.join(" \n "))
    .setColor("#4c56c2")

    
    message.channel.send(embed);
  }


module.exports.help = {
  name: "allbots",
  description: "To see All bots in server",
}