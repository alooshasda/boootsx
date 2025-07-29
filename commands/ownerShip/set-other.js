const { MessageEmbed, MessageAttachment } = require('discord.js');
const { emojis } = require("../../config.json");
const mange = require("quick.db");
const inlinereply = require('discord-reply');
const disbut = require("discord-buttons");
const bot = '1155433278485045248'
module.exports.run = async(message, args, client, prefix, lang) => {
    const data = mange.get(`protection_${message.guild.id}`);
    if(!['on','off'].includes(args[0])) 
    return message.lineReply(`> ${prefix}set-other (on / off) (role / channel)`)
    const un = message.guild.roles.cache.get(
        args[1] ? args[1].toRoleId() : ""
      ) || message.guild.channels.cache.get(
        args[1] ? args[1].toChannelId() : ""
      );

    if(!data) data = mange.set(`protection_${message.guild.id}`, {
    "whitelist": [],
    "log": null,
    "antiroles": {
    toggle: "off",
    action: null
    },
    "antichannels":{
    toggle: "off",
    action: null
    },
    "antibots":{
    toggle: "off",
    actionBot: null,
    action: null
    },
    "antiprune":{
    toggle: "off",
    action: null
    },
    "antilink":{
    toggle: "off",
    action: null
    },
    "backup":{
    toggle: "off",
    action: null
    },
    "antiserver":{
    toggle: "off",
    action: null
    }, 
    })
    if(data && !data.whitelist) data.whitelist = mange.set(`protection_${message.guild.id}.whitelist`,[])
    if(!un) return message.channel.send(`> ${emojis.err} **${prefix}set-other ( on / off) channel **`);
    let type;
    let index;
    let toggle;
    if(args[0] == "on") {
    toggle = 'تفعيل'
    if(un.type !== "text") {
    return message.channel.send(`${emojis.err} - **لقد تم نقل الأمر الى: ${prefix}set-whitelist**`);  
    }
    if(un.type == "text") {
    type = "لوق"
    index = un.name
    mange.set(`protection_${message.guild.id}.log`,un.id);
    un.send('> **رسالة تجربة فقط.**')
    }
    }
    if(args[0] == "off") {
    toggle = 'الغاء تفعيل'
    if(un.type !== "text") {
    return message.channel.send(`${emojis.err} - **لقد تم نقل الأمر الى: ${prefix}set-whitelist**`);   
    }
    if(un.type == "text") {
    type = "لوق"
    index = un.name
    mange.set(`protection_${message.guild.id}.log`,null);
    }
    }
    const embed = new MessageEmbed()
    .setAuthor(message.guild.name, message.guild.iconURL({ dynamic: true }))
    .setTitle(`**لقد تم ${toggle} ${type} : \`${index}\` بنجاح !**`)
    .setColor("RANDOM")
    .setFooter(`- Requested By: ${message.author.username}`, message.author.avatarURL({ dynamic: true }))
    message.channel.send(embed);
}
module.exports.help = {
  name: 'set-other',
  description: 'تحديد رتبة للموثوقين وسجل الحماية',
  usage: ["set-other (on / off) (role / channel)"],
  args: true,
  owner: false,
  admin: true,
  permissions: ["ADMINISTRATOR"],
  cooldown: 5
}