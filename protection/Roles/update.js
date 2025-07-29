const { MessageEmbed } = require("discord.js");
const { emojis, Bots } = require("../../config.json");
const database = require("quick.db");
module.exports = client => ({
  once: true,
  event: 'roleUpdate',
  async run(oldRole, newRole) {
    if (!oldRole.guild || !newRole.guild) return;
    if(!oldRole.guild.me.hasPermission('ADMINISTRATOR')) return;
    if(oldRole.position !== oldRole.position) return;
    if(oldRole.rawPosition !== oldRole.rawPosition) return;
    var data = database.get(`protection_${oldRole.guild.id}.antiroles`);
    if(!data) return;
    if(data && data.toggle == "off") return;
      var DataRole = database.get(`protection_${oldRole.guild.id}.whitelist`);
      var DataLog = database.get(`protection_${oldRole.guild.id}.log`); 
      if(DataLog) DataLog = oldRole.guild.channels.cache.get(DataLog);
      const fetchedLogs = await oldRole.guild.fetchAuditLogs({ limit: 1, type: "ROLE_UPDATE" });
      if(!fetchedLogs) return;
      const CreateLog = fetchedLogs.entries.first();
      if(!CreateLog) return;
      let { executor, target, reason } = CreateLog;
      if(!executor && !target) return;
      let user = oldRole.guild.members.cache.get(executor.id);
      if(!user) return;
      if(target.id !== oldRole.id) return;
      if(user.id == oldRole.guild.ownerID) return;
      if(user.id == client.user.id) return;   
      if(Bots.includes(user.id)) return;
      let em = emojis.err;
      let em1 = emojis.err
      let admin = false;   
      if(user && DataRole) {
        DataRole.forEach(r => {
        if(user.roles.cache.get(r.id)) admin = true;
        })
      }      if(!admin) {
      newRole.edit({
      name: oldRole.name,
      color: oldRole.color || "#000000",
      hoist: oldRole.hoist,
      permissions: oldRole.permissions,
      reason: "antiroles"
      }); 
      

    if (user.bannable && data.action == "ban") {
    user.ban({ days: 7, reason: 'antiroles' }).catch();
    em = emojis.done
    }
    if (user.kickable && data.action == "kick") {
    user.kick('antichannels').catch();
    em = emojis.done
    }
    if (data.action == "removePreUser") {
    user.roles.cache.map(role => role).forEach(role => {
    if (role.permissions.has('MANAGE_ROLES') && role.editable)
    {
    role.setPermissions(0).catch();
    }
    })
    em = emojis.done
    }
    if (data.action == "removeRoles") {
    user.roles.cache.map(role => role).forEach(role => {
    if (role.permissions.has('MANAGE_ROLES') && role.editable)
    {
    user.roles.remove(role).catch();
    }
    })
    em = emojis.done
    }
    }
    let type;
    if(oldRole.name !== newRole.name) {
     type = `الاسم`
     em1 = emojis.done;  
    }
    if(oldRole.color !== newRole.color) {
     type = `اللون`
     em1 = emojis.done;  
    }
    if(oldRole.permissions !== newRole.permissions) {
     type = `الصلاحيات`
     em1 = emojis.done;  
    }
    let action;
    if (data.action == "ban") action = 'حظر'
    if (data.action == "kick") action = 'طرد'
    if (data.action == "removePreUser") action = 'ازالة صلاحيات المستخدم'
    if (data.action == "removeRoles") action = 'سحب رتب المستخدم';
     let embed = new MessageEmbed() 
    .setAuthor(oldRole.guild.name, oldRole.guild.iconURL({ dynamic: true }))
    .setTitle(`**تنبية لـ حماية الرتب**`)
    .addField(`**${emojis.admin} | الفاعل :**`, user)
    .addField(`**${emojis.role} | الرتبة التي تم تعديلها :**`, `\`${oldRole.name}\``)
    .addField(`**> لقد تم أتخاذ الإجراءات المحدده**`,[
    `**${em} | ${action}**`,
    `**${em1} | تم ارجاع ${type || `${oldRole.name} نفس ماكان سابقا`}**`])
    .setThumbnail(user.user.avatarURL())
    .setColor('RANDOM')
    .setTimestamp();
    if(DataLog) DataLog.send(embed).catch();
    if(!DataLog) oldRole.guild.owner.createDM().then(oldRole.guild.owner.send(embed)).catch();
  }
});