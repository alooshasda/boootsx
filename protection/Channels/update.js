const { MessageEmbed } = require("discord.js");
const { emojis, Bots } = require("../../config.json");
const database = require("quick.db");

module.exports = client => ({
  once: true,
  event: 'channelUpdate',
  async run(oldChannel, newChannel) {
    if (!oldChannel.guild || !newChannel.guild) return;
    if(!oldChannel.guild.me.hasPermission('ADMINISTRATOR')) return;
    if(oldChannel.position !== newChannel.position) return;
    if(oldChannel.rawPosition !== newChannel.rawPosition) return;
    const data = database.get(`protection_${oldChannel.guild.id}.antichannels`);
    if(!data) return;
    if (data && data.toggle == "off") return;
      var DataRole = database.get(`protection_${oldChannel.guild.id}.whitelist`);
      var DataLog = database.get(`protection_${oldChannel.guild.id}.log`); 
      if(DataLog) DataLog = oldChannel.guild.channels.cache.get(DataLog);
      const fetchedLogs = await oldChannel.guild.fetchAuditLogs({ limit: 1, type: "CHANNEL_UPDATE" })//.then(logs => logs.entries.find(entry => entry.target.id == oldChannel.id) )
      const CreateLog = fetchedLogs.entries.first();
      if(!fetchedLogs) return;
      let { executor, target, reason } = CreateLog;
      if(!executor || !target) return;
      const user = oldChannel.guild.members.cache.get(executor.id);
      if(!user) return;
      if(target.id !== oldChannel.id) return;
      if(user.id === oldChannel.guild.ownerID) return;
      if(user.id == client.user.id) return;
      if(Bots.includes(executor.id)) return;
      let admin = false;  
      let em = emojis.err;      
      let em1 = emojis.err;          
      if(user && DataRole) {
        DataRole.forEach(r => {
        if(user.roles.cache.get(r.id)) admin = true;
        })
      }      if(!admin) { 
      em1 = emojis.done;  
      newChannel.edit({
      name: oldChannel.name,
      rateLimitPerUser: oldChannel.rateLimitPerUser,
      userLimit: oldChannel.userLimit,
      bitrate: oldChannel.bitrate,
      nsfw: oldChannel.nsfw,
      topic: oldChannel.topic,
      reason: "antichannels",
      }) 
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
      }
      })
      em = emojis.done
      }
      if (data.action == "removeRoles") {
      user.roles.cache.map(role => role).forEach(role => {
      if (role.permissions.has('MANAGE_CHANNELS') && role.editable)
      {
      user.roles.remove(role).catch();
      }
      })
      em = emojis.done
    }
    }
    let text;
    let type;
    if(oldChannel.name !== newChannel.name) {
     type = `الاسم`
    }
    if(oldChannel.rateLimitPerUser !== newChannel.rateLimitPerUser) {
     type = `مدة الرسائل`
    }
    if(oldChannel.topic !== newChannel.topic) {
     type = `الوصف`
    }
    if(oldChannel.type == "text") {
    text = `**${emojis.channel} | الشات الذي تم تعديله :**`    
    }
    if(oldChannel.type == "voice") {
    text = `**${emojis.voice} | الروم الذي تم تعديله :**`
    }
    if(oldChannel.type == "category") {
    text = `**${emojis.category} | الكاتورجي الذي تم تعديله :**`
    }
    if (data.action == "ban") data.action = 'حظر'
    if (data.action == "kick") data.action = 'طرد'
    if (data.action == "removePreUser") data.action = 'ازالة صلاحيات المستخدم'
    if (data.action == "removeRoles") data.action = 'سحب رتب المستخدم';
    
    
    const owner = oldChannel.guild.members.cache.get(oldChannel.guild.ownerID);

     let sendlog = new MessageEmbed() 
    .setAuthor(oldChannel.guild.name, oldChannel.guild.iconURL({ dynamic: true }))
    .setTitle(`**تنبية لـ حماية الشاتات**`)
    .addField(`**${emojis.admin} | الفاعل :**`, user)
    .addField(text, `\`${oldChannel.name}\``)
    .addField(`**> لقد تم أتخاذ الإجراءات المحدده**`,[
    `**${em} | ${data.action}**`,
    `**${em1} | تم ارجاع ${type || `${oldChannel.name} نفس ماكان سابقا`}**`])
    .setThumbnail(user.user.avatarURL())
    .setColor('RANDOM')
    .setTimestamp();
    if(DataLog) DataLog.send(sendlog).catch();
    if(!DataLog && owner) owner.send(sendlog).catch();
  }
});