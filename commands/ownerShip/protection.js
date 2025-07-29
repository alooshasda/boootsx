const { MessageEmbed, MessageAttachment } = require('discord.js');
const { protection, emojis } = require("../../config.json");
const mange = require("quick.db");
const inlinereply = require('discord-reply');
const disbut = require("discord-buttons");
const bot = '1155433278485045248'
const i = protection;
module.exports.run = async(message, args, client, prefix, lang) => {
    let index;
    let type;
    var data = mange.get(`protection_${message.guild.id}`);
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
    "antiserver":{
    toggle: "off",
    action: null
    }, 
    })
    let text = [
    '**يرجى منك أختيار نوع الحماية**',
    '**هل تريد تفعيل او الغاء الحماية**',
    '**الأجراء المتخذ**'
    ]
    let Velue = [
    'حماية الرتب',
    'حماية الشاتات',
    'حماية البوتات',
    'حماية الروابط',
    'حماية الخادم',
    'حماية كاملة',
    'تفعيل الحماية',
    'الغاء تفعيل الحماية',
    'حظر الفاعل',
    'طرد الفاعل',
    'سحب صلاحيات الفاعل',
    'سحب رتب الفاعل',
    'ازالة صلاحية البوت',
    'حظر البوت',
    'طرد البوت'
    ]
    const embed = new MessageEmbed()
    .setAuthor(message.guild.name, message.guild.iconURL({ dynamic: true }))
    .setTitle(text[0])
    .setColor("RANDOM")
    .setFooter(`- Requested By: ${message.author.username}`, message.author.avatarURL({ dynamic: true }))
  let general = new disbut.MessageMenuOption()
    .setLabel("اوامر العامة")
    //.setEmoji(emojis[0])
    .setValue("general");


   let antiroles = new disbut.MessageMenuOption()
    .setLabel(Velue[0])
    .setValue("antiroles")
    .setDescription("حماية التعديل ، الانشاء ، الحذف")
     if(!data) antiroles.setEmoji(emojis.off[1])
     if(data && data.antiroles.toggle == "on") antiroles.setEmoji(emojis.on[1])
     if(data && data.antiroles.toggle == "off") antiroles.setEmoji(emojis.off[1])

   let antichannels = new disbut.MessageMenuOption()
    .setLabel(Velue[1])
    .setValue("antichannels")
    .setDescription("حماية التعديل ، الانشاء ، الحذف")
     if(!data) antichannels.setEmoji(emojis.off[1])
     if(data && data.antichannels.toggle == "on") antichannels.setEmoji(emojis.on[1])
     if(data && data.antichannels.toggle == "off") antichannels.setEmoji(emojis.off[1])

   let antibots = new disbut.MessageMenuOption()
    .setLabel(Velue[2])
    .setValue("antibots")
    .setDescription("حماية دخول البوتات الغير معروفة")
     if(!data) antibots.setEmoji(emojis.off[1])
     if(data && data.antibots.toggle == "on") antibots.setEmoji(emojis.on[1])
     if(data && data.antibots.toggle == "off") antibots.setEmoji(emojis.off[1])

   let antilink = new disbut.MessageMenuOption()
    .setLabel(Velue[3])
    .setValue("antilink")
    .setDescription("حماية ارسال الروابط")
     if(!data) antilink.setEmoji(emojis.off[1])
     if(data && data.antilink && data.antilink.toggle == "on") antilink.setEmoji(emojis.on[1])
     if(data && data.antilink && data.antilink.toggle == "off") antilink.setEmoji(emojis.off[1])

   let antiserver = new disbut.MessageMenuOption()
    .setLabel(Velue[4])
    .setValue("antiserver")
    .setDescription("حماية التعديل على الخادم")
    .setEmoji(emojis.off[1])
     if(data.antiserver && data.antiserver.toggle == "on") antiserver.setEmoji(emojis.on[1])
     if(data.antiserver && data.antiserver.toggle == "off") antiserver.setEmoji(emojis.off[1])

   let antiall = new disbut.MessageMenuOption()
    .setLabel(Velue[5])
    .setValue("antiall")
    .setDescription("تفعيل جميع الحمايات")
    .setEmoji(emojis.reason[1])


     let on = new disbut.MessageButton()
      .setLabel(Velue[6])
      .setEmoji(emojis.done)
      .setStyle ('green')
      .setID("on");

      let off = new disbut.MessageButton()
      .setLabel(Velue[7])
      .setEmoji(emojis.err)
      .setStyle ('red')
      .setID("off");

      let removePreBot = new disbut.MessageButton()
      .setLabel(Velue[12])
      .setEmoji(bot)
      .setStyle ('red')
      .setID("removePreBot");

      let banBot = new disbut.MessageButton()
      .setLabel(Velue[13])
      .setEmoji(bot)
      .setStyle ('red')
      .setID("banBot");
 
      let kickBot = new disbut.MessageButton()
      .setLabel(Velue[14])
      .setEmoji(bot)
      .setStyle ('red')
      .setID("kickBot");

      let ban = new disbut.MessageButton()
      .setLabel(Velue[8])
      .setStyle ('blurple')
      .setID("ban");

      let kick = new disbut.MessageButton()
      .setLabel(Velue[9])
      .setStyle ('blurple')
      .setID("kick");

      let removePreUser = new disbut.MessageButton()
      .setLabel(Velue[10])
      .setStyle ('blurple')
      .setID("removePreUser");

      let removeRoles = new disbut.MessageButton()
      .setLabel(Velue[11])
      .setStyle ('blurple')
      .setID("removeRoles");


      let to = new disbut.MessageMenu()
      .setID("help")
      .addOptions(antiroles,antichannels,antibots, antiserver, antiall)
      .setPlaceholder("Choose Protection:");

    let msg = await message.channel.send(embed).then(e =>  
        e.edit(embed, to));


    const filter = ( Menu ) => Menu.clicker.user.id === message.author.id;
    const collector = msg.createMenuCollector(filter,{ time: 230000 });
      collector.on("collect", async menu => {
      if (
        menu.values[0] == "antiroles" ||
        menu.values[0] == "antichannels" ||
        menu.values[0] == "antibots" ||
        menu.values[0] == "antilink" ||
        menu.values[0] == "antiserver" ||    menu.values[0] == "antiall"

      ) {
      index = menu.values[0];
      type = menu.values[0];
      if(type == 'antiroles') type = 'حماية الرتب';
      if(type == 'antichannels') type = 'حماية الرتب';
      if(type == 'antiall') type = 'حماية كاملة'
      embed.setAuthor(type, message.guild.iconURL({ dynamic: true }))
      let btn = new disbut.MessageActionRow()
      .addComponents([on, off]);
      embed.setTitle(text[1])
      menu.message.update(embed, { components: [btn] }) 
      }
      });
  
      const filter1 = ( Menu ) => Menu.clicker.user.id === message.author.id;
      const collector1 = msg.createButtonCollector(filter,{ time: 230000 });
      collector1.on("collect", async button => {
      if (button.id == "on") { 
      mange.set(`protection_${message.guild.id}.${index}.toggle`, 'on')      
      if(index == "antiall") {
      i.forEach(t => {
      mange.set(`protection_${message.guild.id}.${t}.toggle`, 'on')
      })
     }
      let btn = new disbut.MessageActionRow()
       embed.setTitle(text[2]),btn.addComponents([ban, kick, removeRoles, removePreUser]);
         button.message.update(embed, { components: [btn] })
      }

      if (button.id == "ban" || button.id == "kick" || button.id == "removeRoles" || button.id == "removePreUser") {
      mange.set(`protection_${message.guild.id}.${index}.action`, button.id)
      if(index == "antibots") {
         let btn = new disbut.MessageActionRow()
         .addComponents([removePreBot, banBot,kickBot]);
         embed.setTitle(`**الأجراء المتخذ للبوت :**`);
         return button.message.update(embed, { components: [btn] })
      }
      if(index == "antiall") {
      i.forEach(t => {
      mange.set(`protection_${message.guild.id}.${t}.action`, button.id)
      })
        let btn = new disbut.MessageActionRow()
         .addComponents([removePreBot, banBot,kickBot]);
         embed.setTitle(`**الأجراء المتخذ للبوت عند دخوله :**`);
         return button.message.update(embed, { components: [btn] })
      }
      embed.setTitle(`**${emojis.on[0]} - تم التفعيل بنجاح**`)
      button.message.update(embed, { components: [] })
      }
      if (button.id == "removePreBot") {
      mange.set(`protection_${message.guild.id}.antibots.actionBot`, 'removePreBot')
      embed.setTitle(`**${emojis.on[0]} - تم التفعيل بنجاح**`)
      button.message.update(embed, { components: [] })
      }
      if (button.id == "kickBot") {
      mange.set(`protection_${message.guild.id}.antibots.actionBot`, 'kick')
      embed.setTitle(`**${emojis.on[0]} - تم التفعيل بنجاح**`)
      button.message.update(embed, { components: [] })
      }
      if (button.id == "banBot") {
      mange.set(`protection_${message.guild.id}.antibots.actionBot`, 'ban')
      embed.setTitle(`**${emojis.on[0]} - تم التفعيل بنجاح**`)
      button.message.update(embed, { components: [] })
      }
      if (button.id == "off") {
      mange.set(`protection_${message.guild.id}.antibots.toggle`, 'off')
      if(index == "antiall") {
      i.forEach(t => {
      mange.set(`protection_${message.guild.id}.${t}.toggle`, 'off')
      })
      }
      embed.setTitle(`**${emojis.off[0]} - تم الغاء تفعيل الحماية**`)
      button.message.update(embed, { components: [] })
      }
    });
    }

module.exports.help = {
  name: 'protection',
  description: 'تفعيل الحمايات',
  aliases: ['pro'],
  owner: true,
  admin: false,
  permissions: ["ADMINISTRATOR"],
  cooldown: 20
}