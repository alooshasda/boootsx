
const Discord  = require("discord.js");
const { MessageEmbed } = require("discord.js");
const disbut = require("discord-buttons");
const { emojis, devs } = require("../../config");
module.exports.run = async(message, args, client, prefix, lang) => {
 if(args.length) {
  const command = 
      client.commands.get(args[0]) || 
      client.commands.find( cmd => cmd.help.aliases && 
      cmd.help.aliases.includes(args[0])
    );
    if (!command) return;
    var cmd = command.help;
    let embed = new MessageEmbed()
    .setTitle("**Command: " + cmd.name + "**")
    if(cmd.description) embed.setDescription(`**${cmd.description}**`)
    .setColor("#8e04f2")
    .setFooter(
    `- Requested By: ${message.author.tag}`,
    message.author.avatarURL()
    );
    if (cmd.aliases)
    embed.addField(
    `**اختصارات للأمر :**`,
    prefix + cmd.aliases.join("," + prefix)
    );
    if (cmd.usage)
    embed.addField(
    "**شرح للأمر :**",
    `${prefix + cmd.usage.join("\n" + prefix).replace(/\[p]/g, prefix)
        .replace(/\[author]/g, message.author)
        .replace(/\[userID]/g, message.author.id)
        .replace(/\[user]/g, message.author)
        .replace(/\[userName]/g, message.author.username)}`
    );
    if (cmd.Examples)
    embed.addField(
    "**أمثله للأمر :**",
    prefix + cmd.Examples.join("\n" + prefix).replace(/\[p]/g, prefix)
        .replace(/\[author]/g, message.author)
        .replace(/\[userID]/g, message.author.id)
        .replace(/\[user]/g, message.author)
        .replace(/\[userName]/g, message.author.username)
    );
    if (cmd.admin && !message.member.hasPermission([cmd.permissions]))
    embed.addField("**صلاحية الأمر :**", "`" + cmd.permissions + "`");
    if (cmd.owner)
    embed.addField("** الأمر فقط لصاحب الخادم :**", `<@${message.guild.ownerID}>`);
     return message.channel.send(embed);
}


  let emojis = {
   public:["<:vicPublic:906573448334172192>","906573448334172192"],
   moderator:["<:vicAdmins:906573463500767243>","906573463500767243"],
   protection:["<:vicprotection:906573433255628820>","906573433255628820"],
   settings:["<:vicSettings:906573479497846804>","906573479497846804"]
   }


    const embed = new MessageEmbed()
    .setAuthor(message.guild.name, message.guild.iconURL({ dynamic: true }))
    .setTitle(`**<:Victor_2:925834548837769256> Set up your server protection now what are you waiting for !**`)
    .setColor("#4c56c2")
     .setThumbnail(client.user.displayAvatarURL())
    .setFooter(`- Requested By: ${message.author.username}`,message.author.avatarURL({ dynamic: true }))
    const edit = new MessageEmbed()
    .setAuthor(message.guild.name, message.guild.iconURL({ dynamic: true }))
    .setColor("#4c56c2")
    .setThumbnail(client.user.displayAvatarURL())
    .setFooter(`- Requested By: ${message.author.username}`,message.author.avatarURL({ dynamic: true }))


let button = new disbut.MessageButton()
.setEmoji("906226471914324078")
.setStyle ('url')
.setLabel('Support')
.setDisabled(false)
.setURL('https://discord.gg/pHgvmBTzPB');
let button1 = new disbut.MessageButton()
.setEmoji("906226471914324078")
.setStyle ('url')
.setLabel('Invite')
.setDisabled(false)
.setURL('d');

  let general = new disbut.MessageMenuOption()
    .setLabel("Public Commands")
    .setDescription("أوامر العامة")
    .setEmoji(emojis.public[1])
    .setValue("public");

  let moderator = new disbut.MessageMenuOption()
    .setLabel("Moderator Commands")
    .setDescription("أوامر الأدارية")
    .setEmoji(emojis.moderator[1])
    .setValue("moderator");

  let protection = new disbut.MessageMenuOption()
    .setLabel("Protection Commands")
    .setDescription("أوامر الحماية")
    .setEmoji(emojis.protection[1])
    .setValue("protection");

  let settings = new disbut.MessageMenuOption()
    .setLabel("Settings Commands")
    .setDescription("أوامر تخص البوت")
    .setEmoji(emojis.settings[1])
    .setValue("settings");


  
  let select = new disbut.MessageMenu()
    .setID("help")
    .addOptions(general, moderator, protection, settings)
    .setPlaceholder("Choose Helpful:");

  let btn = new disbut.MessageActionRow().addComponents([button, button1]);
  let group2 = new disbut.MessageActionRow().addComponent(select);
  /*let msg = await message.lineReplyNoMention(embed).then(e =>  
        e.edit(embed, { components: [group2,btn] }));*/
  let msg = await message.channel.send(embed, { components: [group2,btn] });

    const filter = ( Menu ) => Menu.clicker.user.id === message.author.id;
    const collector = msg.createMenuCollector(filter,{ time: 230000 });
    const public_command = client.commands.filter(cmd => cmd.category == 'general' && cmd.help.description).map((cmd) => `**${prefix}${cmd.help.name} ${cmd.help.aliases && `[${cmd.help.aliases.join(',')}] ` || ""}\`${cmd.help.description}\`**`).join("\n");
    const moderator_command = client.commands.filter(cmd => cmd.category == 'Moderator' && cmd.help.description).map((cmd) => `**${prefix}${cmd.help.name} ${cmd.help.aliases && `[${cmd.help.aliases.join(',')}] ` || ""}\`${cmd.help.description}\`**`).join("\n");
    const protection_command = client.commands.filter(cmd => cmd.category == 'ownerShip' && cmd.help.description).map((cmd) => `**${prefix}${cmd.help.name} ${cmd.help.aliases && `[${cmd.help.aliases.join(',')}] ` || ""}\`${cmd.help.description}\`**`).join("\n");
    const settings_command = client.commands.filter(cmd => cmd.category == 'settings' && cmd.help.description).map((cmd) => `**${prefix}${cmd.help.name} ${cmd.help.aliases && `[${cmd.help.aliases.join(',')}] ` || ""}\`${cmd.help.description}\`**`).join("\n");


  collector.on("collect", async menu => {
    if (menu.id !== "help") return;
    if (menu.values[0] === "public") {
     select = new disbut.MessageMenu()
     .setID("help")
     .addOptions(moderator, protection, settings)
     .setPlaceholder("Public Commands");
     group2 = new disbut.MessageActionRow()
      .addComponent(select);
      menu.message.update(edit.setDescription(
`> **<:906573448334172192:926056936984678452> Public Commands:**
**${prefix}help <cmd> \`معلومات عن أمر ما\`**
${public_command}`), { components: [group2, btn] });
    }
    if (menu.values[0] === "moderator") {
      select = new disbut.MessageMenu()
      .setID("help")
      .addOptions(general, protection, settings)
      .setPlaceholder("Moderator Commands");
      group2 = new disbut.MessageActionRow().addComponent(select);
      menu.message.update(edit.setDescription(
`> **<:906573463500767243:926056936531718215> Moderator Commands :**
${moderator_command}`), { components: [group2, btn] });
    }
    if (menu.values[0] === "protection") {
      select = new disbut.MessageMenu()
      .setID("help")
      .addOptions(general, moderator, settings)
      .setPlaceholder("Protection Commands");
      group2 = new disbut.MessageActionRow().addComponent(select);
      menu.message.update(edit.setDescription(
`> **<:906573433255628820:926056936808546304> Protection Commands :**
${protection_command}`), { components: [group2, btn] });
    }

 if (menu.values[0] === "settings") {
    select = new disbut.MessageMenu()
    .setID("help")
    .addOptions(general, moderator, protection)
    .setPlaceholder("Choose Helpful:");
      group2 = new disbut.MessageActionRow().addComponent(select);
      menu.message.update(edit.setDescription(
`> **<:906573479497846804:926056937395716097> Settings Commands :**
${settings_command}`), { components: [group2, btn] });
     // menu.reply.think(true).then(m => m.edit(edit.setDescription("**جارى العمل عليها ...**")))
    }
  })

        collector.on("end",() => collector.stop());
};



//general, moderator, protection, settings
module.exports.help = {
  name: "help",
  description: "قائمة المساعدة"
}

