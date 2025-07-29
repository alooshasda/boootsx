const { MessageEmbed } = require("discord.js");
const { emojis, Bots } = require("../../config.json");
const database = require("quick.db");
module.exports = client => ({
  event: "roleCreate",
  async run(role) {
      if (!role.guild) return;
      if(!role.guild.me.hasPermission('ADMINISTRATOR')) return;
      const queue = client.queue;
      const data = database.get(`protection_${role.guild.id}.antiroles`);
      if(!data) return;
      if (data && data.toggle == "off") return;
      var DataRole = database.get(`protection_${role.guild.id}.whitelist`);
      var DataLog = database.get(`protection_${role.guild.id}.log`); 
      if(DataLog) DataLog = role.guild.channels.cache.get(DataLog);
      const fetchedLogs = await role.guild.fetchAuditLogs({ limit: 1, type: "ROLE_CREATE" });
      const CreateLog = fetchedLogs.entries.first();
      if(!CreateLog) return;
      let { executor, target, reason } = CreateLog;
      if(!executor && !target) return;
      let user = role.guild.members.cache.get(executor.id);
      if(!user) return;
      if (user.id == user.guild.ownerID) return;
      if(user.id === client.user.id) return;   
      if(Bots.includes(user.id)) return;
      let em = emojis.err;   
      let em1 = emojis.err;   
      let admin = false;       
      if(user && DataRole) {
        DataRole.forEach(r => {
        if(user.roles.cache.get(r.id)) admin = true;
        })
      }      if(!admin) {
      em1 = emojis.done
      role.delete('antiroles| حماية الرولات')
      const perRole = user.roles.cache.find(e => e.permissions.has("MANAGE_ROLES"));
      if (user.bannable && data.action == "ban") {
      user.ban({ days: 7, reason: 'antiroles' }).catch();
      em = emojis.done
      }
      if (user.kickable && data.action == "kick") {
      user.kick('antiroles').catch();
      em = emojis.done
      }
      if (data.action == "removePreUser") {
      user.roles.cache.map(role => role).forEach(role => {
      if (role.permissions.has('MANAGE_ROLES') && role.editable)
      {
      role.setPermissions(0).catch();
      em = emojis.done
      }
      })
     
      }
      if (data.action == "removeRoles") {
      user.roles.cache.map(role => role).forEach(role => {
      if (role.permissions.has('MANAGE_ROLES') && role.editable)
      {
      user.roles.remove(role).catch();
      em = emojis.done
      }
      })
      
    }
    }    
    let text;
    let type;
    text = `**${emojis.role} | الرتبة الذي تم انشائه :**`
    type = `الرتبة`
    let action;
    if (data.action == "ban") action = 'حظر'
    if (data.action == "kick") action = 'طرد'
    if (data.action == "removePreUser") action = 'ازالة صلاحيات المستخدم'
    if (data.action == "removeRoles") action = 'سحب رتب المستخدم';
     let sendlog = new MessageEmbed() 
    .setAuthor(role.guild.name, role.guild.iconURL({ dynamic: true }))
    .setTitle(`**تنبية لـ حماية الرتب**`)
    .addField(`**${emojis.admin} | الفاعل :**`, user)
    .addField(text, `\`${role.name}\``)
    .addField(`**> لقد تم أتخاذ الإجراءات المحدده**`,[
    `**${em} | ${action}**`,
    `**${em1} | تم حذف ${type}**`])
    .setThumbnail(user.user.avatarURL())
    .setColor('RANDOM')
    .setTimestamp();
    if(DataLog) DataLog.send(sendlog).catch();
    if(!DataLog) role.guild.owner.createDM().then(role.guild.owner.send(sendlog)).catch();
  }   
});