const { MessageEmbed } = require("discord.js");
const { emojis, Bots } = require("../../config.json");
const database = require("quick.db");
module.exports = client => ({
event: "roleDelete",
async run(role) {
      if (!role.guild) return;
      if(!role.guild.me.hasPermission('ADMINISTRATOR')) return;
      const data = database.get(`protection_${role.guild.id}.antiroles`);
      if(!data) return;
      if (data && data.toggle == "off") return;
      var DataRole = database.get(`protection_${role.guild.id}.whitelist`);
      var DataLog = database.get(`protection_${role.guild.id}.log`); 
      if(DataLog) DataLog = role.guild.channels.cache.get(DataLog);
      const fetchedLogs = await role.guild.fetchAuditLogs({ limit: 1, type: "ROLE_DELETE" });
      const CreateLog = fetchedLogs.entries.first();
      if(!CreateLog) return;
      let { executor, target, reason } = CreateLog;
      if(!executor && !target) return;
      const user = role.guild.members.cache.get(executor.id);
      if(executor.id === role.guild.ownerID) return;
      if(executor.id === client.user.id) return;   
      if(Bots.includes(executor.id)) return; 
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
      role.guild.roles.create({
      data: {
      name: role.name,
      color: role.color,
      icon: role.iconURL,
      mentionable: role.mentionable,
      hoist: role.hoist,
      permissions: role.permissions
      }
      });
      if (user.bannable && data.action == "ban") {
      user.ban({ days: 7, reason: 'antiroles' }).catch();
      em = emojis.done;
      }
      if (user.kickable && data.action == "kick") {
      user.kick('antiroles').catch();
      em = emojis.done;
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
      let action;
      if (data.action == "ban") action = 'حظر'
      if (data.action == "kick") action = 'طرد'
      if (data.action == "removePreUser") action = 'ازالة صلاحيات المستخدم'
      if (data.action == "removeRoles") action = 'سحب رتب المستخدم';
      let embed = new MessageEmbed() 
      .setAuthor(role.guild.name, role.guild.iconURL({ dynamic: true }))
      .setTitle(`**تنبية لـ حماية الرتب**`)
      .addField(`**${emojis.admin} | الفاعل :**`, user)
      .addField(`**${emojis.role} | الرتبة المحذوفه :**`, `\`${role.name}\``)
      .addField(`**> لقد تم أتخاذ الإجراءات المحدده**`,[
      `**${em} | ${action}**`])
      .setThumbnail(user.user.avatarURL())
      .setColor('RANDOM')
      .setTimestamp();
      if(DataLog) DataLog.send(embed).catch();
      if(!DataLog) role.guild.owner.createDM().then(role.guild.owner.send(embed)).catch();

}   
});