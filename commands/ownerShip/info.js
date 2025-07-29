const { MessageEmbed, MessageAttachment } = require('discord.js');
const config = require("../../config.json");
const mange = require("quick.db");
const inlinereply = require('discord-reply');
const index = ["antiroles","antichannels","antibots","antilink","antiserver","backup"];
module.exports.run = async(message, args, client, prefix ) => {
    var data = mange.get(`protection_${message.guild.id}`);
    console.log(data)
    //mange.delete(`protection_${message.guild.id}`)
    if(!data) data = mange.set(`protection_${message.guild.id}`, {
    "whitelist":[],
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
    "antilink":{
    toggle: "off",
    action: null
    },
    "antiserver":{
    toggle: "off",
    action: null
    }, 
    }) 
    let role = [];
    let log;
    if (data.whitelist && data.whitelist.length) { 
       data.whitelist.forEach(r => {
       let get = message.guild.members.cache.get(r) || message.guild.roles.cache.get(r);
        if(!get) return;
        role.push(get);
      })

    }
    if (!data.log && data.log == null) log = `\`معطله\` ${config.emojis.off[0]}`;
    var channel = message.guild.channels.cache.get(data.log)
    if(channel) log = `${channel}`
    if(!channel) log = `\`معطله\` ${config.emojis.off[0]}`;
    index.forEach(t => {
    if (data[t] && data[t].toggle == "on") data[t].toggle = `\`مفعله\` ${config.emojis.on[0]}`
    if (data[t] && data[t].toggle == "off") data[t].toggle = `\`معطله\` ${config.emojis.off[0]}`
    if (data[t] && data[t].action == "ban") data[t].action = 'حظر'
    if (data[t] && data[t].action == "kick") data[t].action = 'طرد'
    if (data[t] && data[t].action == "removePreUser") data[t].action = 'ازالة صلاحيات المستخدم'
    if (data[t] && data[t].action == "removeRoles") data[t].action = 'سحب رتب المستخدم';
    if (data[t] && data[t].actionBot == "removePreBot") data[t].actionBot = 'ازالة صلاحيات البوت'
    if (data[t] && data[t].actionBot == "kick") data[t].actionBot = 'طرد البوت'
    if (data[t] && data[t].actionBot == "ban") data[t].actionBot = 'حظر البوت'
    })
    let actionBot = null;
//
    const embed = new MessageEmbed()
    .setAuthor(message.guild.name, message.guild.iconURL({ dynamic: true }))
    .setTitle(`**${config.emojis.shield} | الحمايات**`)
    .addField(`> ${config.emojis.role} **حماية الرتب**`,[
    `**حالة الحماية : ${data.antiroles.toggle}**`,
    `**الأجراء المتخذ : \`${data.antiroles.action || 'لم يتم التحديد'}\`**`, 
    `> ${config.emojis.channel} **حماية الشاتات**`,
    `**حالة الحماية : ${data.antichannels.toggle}**`,
    `**الأجراء المتخذ : \`${data.antichannels.action || 'لم يتم التحديد'}\`**`,  
    `> ${config.emojis.bot} **حماية البوتات**`,
    `**حالة الحماية : ${data.antibots.toggle}**`,
    `**الأجراء المتخذ : \`${data.antibots.action || 'لم يتم التحديد'}\`**`, 
    `**الأجراء المتخذ للبوت : \`${data.antibots.actionBot || 'لم يتم التحديد'}\`**`,
     `> ${config.emojis.any} **أخرى**`,
    `**القائمة البيضاء : ${
          role.join(",") || `\`معطله\` ${config.emojis.off[0]}`
        }**`,
    `**لوق الحماية : ${log}**`
    ])
    .setColor("RANDOM")
    .setFooter(`- Requested By: ${message.author.username}`, message.author.avatarURL({ dynamic: true }))
       message.channel.send(embed)

}

module.exports.help = {
  name: 'info',
  description: 'كشف عن الحمايات المحددة',
  cooldown: 5,
  admin: true,
  permissions: ["ADMINISTRATOR"]
}