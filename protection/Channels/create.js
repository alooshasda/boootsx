const { MessageEmbed } = require("discord.js");
const { emojis, Bots } = require("../../config.json");
const database = require("quick.db");
module.exports = client => ({
  event: "channelCreate",
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
      const fetchedLogs = await channel.guild.fetchAuditLogs({ limit: 1, type: "CHANNEL_CREATE" });
      const CreateLog = fetchedLogs.entries.first();
      if(!CreateLog) return;  
      let { executor, target, reason } = CreateLog;
      if(!executor && !target) return;
      const user = channel.guild.members.cache.get(executor.id);
      if(!user) return;
      if(executor.id == channel.guild.ownerID) return; 
      if(executor.id == client.user.id) return;   
      if(Bots.includes(executor.id)) return;
      console.log(executor.roles)
      let em = emojis.err;   
      let em1 = emojis.err;   
      let admin = false;       
      if(user && DataRole) {
        DataRole.forEach(r => {
        if(user.roles.cache.get(r.id)) admin = true;
        })
      }
      if(!admin) {
      em1 = emojis.done
      channel.delete()
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
    }    
    let text;
    let type;
    if(channel.type == "text") {
    text = `**${emojis.channel} | الشات الذي تم انشائه :**`
    type = `شات`
    }
    if(channel.type == "voice") {
    text = `**${emojis.voice} | الروم الذي تم انشائه :**`
    type = `روم`
    }
    if(channel.type == "category") {
    text = `**${emojis.category} | الكاتورجي الذي تم انشائه :**`
    type = `كاتورجي`
    }
    let action;
    if (data.action == "ban") action = 'حظر'
    if (data.action == "kick") action = 'طرد'
    if (data.action == "removePreUser") action = 'ازالة صلاحيات المستخدم'
    if (data.action == "removeRoles") action = 'سحب رتب المستخدم';
     let sendlog = new MessageEmbed() 
    .setAuthor(channel.guild.name, channel.guild.iconURL({ dynamic: true }))
    .setTitle(`**تنبية لـ حماية الشاتات**`)
    .addField(`**${emojis.admin} | الفاعل :**`, user)
    .addField(text, `\`${channel.name}\``)
    .addField(`**> لقد تم أتخاذ الإجراءات المحدده**`,[
    `**${em} | ${action}**`,
    `**${em1} | تم حذف ${type}**`])
    .setThumbnail(user.user.avatarURL())
    .setColor('RANDOM')
    .setTimestamp();
    if(DataLog && DataLog) DataLog.send(sendlog).catch();
    if(!DataLog && channel.guild.owner) channel.guild.owner.send(sendlog).catch();
  }   
});