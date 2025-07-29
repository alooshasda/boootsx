const { MessageEmbed } = require("discord.js");
const { emojis, Bots } = require("../../config.json");
const database = require("quick.db");
module.exports = client => ({
  event: "channelDelete",
  async run(channel) {
    if (!channel.guild) return;
    if(!channel.guild.me.hasPermission('ADMINISTRATOR')) return;
    const queue = client.queue;
    const data = database.get(`protection_${channel.guild.id}.antichannels`);
    if(!data) return;
    if (data && data.toggle == "off") return;
      var DataRole = database.get(`protection_${channel.guild.id}.whitelist`); 
      var DataLog = database.get(`protection_${channel.guild.id}.log`); 
      if(DataLog) DataLog = channel.guild.channels.cache.get(DataLog);
      const fetchedLogs = await channel.guild.fetchAuditLogs({ limit: 1, type: "CHANNEL_DELETE" }).then(logs => 
       logs.entries.find(entry =>  
       entry.target.id === channel.id)).then(entry => {
       if(!entry.executor && !entry.target) return;
      const user = channel.guild.members.cache.get(entry.executor.id);
      if(!user) return;
      if(entry.executor.id === channel.guild.ownerID) return;
      if(entry.executor.id === client.user.id) return;   
      if(Bots.includes(entry.executor.id)) return;
      let em = emojis.err;  
      let em1 = emojis.err;   
      let admin = false;     
      if(user && DataRole) {
        DataRole.forEach(r => {
        if(user.roles.cache.get(r.id)) admin = true;
        })
      }          if(!admin) {
        em1 = emojis.done;
        channel.guild.channels.create(channel.name,{
        parent: channel.parentID,
        position: channel.rawPosition,
        type: channel.type,
        rateLimitPerUser: channel.rateLimitPerUser,
        userLimit: channel.userLimit,
        bitrate: channel.bitrate,
        nsfw: channel.nsfw,
        topic: channel.topic,
        reason: "antichannels",
        permissionOverwrites: channel.permissionOverwrites
      }).then(newChannel => {

    if (user.bannable && data.action == "ban") {
    user.ban({ days: 7, reason: 'antichannels' }).catch();
    em = emojis.done
    }
    if (user.kickable && data.action == "kick") {
    user.kick('antichannels').catch();
    em = emojis.done
    }
      if (data.action == "removePreUser") {
      user.roles.cache.map(role => role).forEach(role => {
      if (role.permissions.has('MANAGE_CHANNELS') && role.editable)
      {
      role.setPermissions(0).catch();
       em = emojis.done
      }
      })
      
      }
      if (data.action == "removeRoles") {
      user.roles.cache.map(role => role).forEach(role => {
      if (role.permissions.has('MANAGE_CHANNELS') && role.editable)
      {
      user.roles.remove(role).catch();
       em = emojis.done
      }
      })
     
    }
    })
    }
    let text;
    let type;
    if(channel.type == "text") {
    text = `**${emojis.channel} | الشات المحذوف :**`
    type = `شات`
    }
    if(channel.type == "voice") {
    text = `**${emojis.voice} | الروم المحذوف :**`
    type = `روم`
    }
    if(channel.type == "category") {
    text = `**${emojis.category} | الكاتورجي المحذوف :**`
    type = `كاتورجي`
    }
    let action;
    if (data.action == "ban") action = 'حظر'
    if (data.action == "kick") action = 'طرد'
    if (data.action == "removePreUser") action = 'ازالة صلاحيات المستخدم'
    if (data.action == "removeRoles") action = 'سحب رتب المستخدم';
     let embed = new MessageEmbed() 
    .setAuthor(channel.guild.name, channel.guild.iconURL({ dynamic: true }))
    .setTitle(`**تنبية لـ حماية الشاتات**`)
    .addField(`**${emojis.admin} | الفاعل :**`, user)
    .addField(text, `\`${channel.name}\``)
    .addField(`**> لقد تم أتخاذ الإجراءات المحدده**`,[
    `**${em} | ${action}**`,
    `**${em1} | تم ارجاع ${type}**`])
    .setThumbnail(user.user.avatarURL())
    .setColor('RANDOM')
    .setTimestamp();
    if(DataLog) DataLog.send(embed).catch();
    if(!DataLog) channel.guild.owner.send(embed).catch();
    })
  } 
});