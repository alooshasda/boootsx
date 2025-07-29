const { MessageEmbed, MessageAttachment } = require('discord.js');
const { emojis } = require("../../config.json");
const mange = require("quick.db");
const inlinereply = require('discord-reply');
const disbut = require("discord-buttons");
const bot = '1155433278485045248'
module.exports.run = async(message, args, client, prefix, lang) => {
    let type;
    const data = mange.get(`protection_${message.guild.id}`);
    let roles = message.mentions.roles.map(m => m)
    if(!roles.length) roles = message.mentions.members.map(m => m)
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
    "antilink":{
    toggle: "off",
    action: null
    },
    "antiserver":{
    toggle: "off",
    action: null
    }, 
    })
    if(data && !data.whitelist) data.whitelist = mange.set(`protection_${message.guild.id}.whitelist`,[])
    if(!roles) return message.channel.send(embed.setDescription(`> ${emojis.err} **${prefix}set-whitelist (user / role)**`));

    const embed = new MessageEmbed()
    .setAuthor(message.guild.name, message.guild.iconURL({ dynamic: true }))
    .setColor("RANDOM")
    .setFooter(`- Requested By: ${message.author.username}`, message.author.avatarURL({ dynamic: true }))

    let toggle = false;
    let role_adding = [];
    let role_delete = [];
       roles.forEach(role => {
      if(!data.whitelist.filter(r => r == role.id).length) return;
      toggle = true
      role_adding.push(role);
      })
      if(toggle) {

var msg = await message.channel.send(embed.setDescription(` ⏲️ - ** لقد تم تحديد هذا العنصر مسبقا ! \n هل تريد أزالته ؟,\nيمكنك الجواب عن طريقة كتابة امر \`نعم\`**`));
message.channel.awaitMessages(c => c.author.id === message.author.id, {
time: 25000,
errors: ['time'],
max: 1
}).then(collector => {
var Message = collector.first();
var c = Message.content.toLowerCase().trim();
if (c === 'نعم' || c === 'yes' || c === 'y'){
Message.delete();
var newData = data.whitelist.filter(r => r !== roles) || [];
       let new_Role = [];
       let Delete_Role = [];
      roles.forEach(role => {
      if(data.whitelist.filter(r => r == role.id).length) return Delete_Role.push(role);
      new_Role.push(role.id);
      })
mange.set(`protection_${message.guild.id}.whitelist`,new_Role)
msg.edit(embed.setDescription(`> ✅ - **تم أزالة ${Delete_Role.join(",")} بنجاح**`));
message.react('✅');
console.log(data)
} else {
Message.delete();
msg.delete();
}
}).catch(() => {
msg.delete();
});

return;
      }
    
    var msg = await message.channel.send(
      embed.setDescription(`> ⏲️ - **هل أنت متأكد من اضافة ${roles.join(',')}**\n**يمكنك الجواب عن طريقة كتابة امر \`نعم\`**`)
    );
    message.channel
      .awaitMessages(c => c.author.id === message.author.id, {
        time: 25000,
        errors: ["time"],
        max: 1
      })
      .then(collector => {
        var Message = collector.first();
        var c = Message.content.toLowerCase().trim();
        if (c === "نعم" || c === "yes" || c === "y") {
          Message.delete();
          let b = 0;
              roles.forEach(r => {
              mange.push(`protection_${message.guild.id}.whitelist`, r.id);
          })

          msg.edit(
            embed.setDescription(`> ✅ - **لقد تم اضافة \`${roles.length}\` عنصر في القائمة البيضاء**`)
          );
          message.react("✅");
        } else {
          Message.delete();
          msg.delete();
        }
      })
      .catch(() => {
        msg.delete();
      });

    message.channel.send(embed);
}
module.exports.help = {
  name: 'set-whitelist',
  description: 'تحديد ( رتب , اشخاص ) يتم اضافتهم في القائمة البيضاء التي تسمح لهم بالتعديل على حمايات البوت',
  usage: ["set-whitelist (on / off) (role / user)"],
  args: true,
  owner: true,
  admin: false,
  permissions: ["ADMINISTRATOR"],
  cooldown: 20
}