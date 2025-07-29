 const { MessageEmbed } = require("discord.js");
const { emojis, Bots } = require("../../config.json");
const database = require("quick.db");
module.exports = client => ({
  once: true,
  event: 'guildUpdate',
  async run(oldGuild, newGuild) {
      if (
      oldGuild.name == newGuild.name &&
      oldGuild.icon == newGuild.icon &&
      oldGuild.description == newGuild.description &&
      oldGuild.region == newGuild.region
      )
      return;
      var DataRole = database.get(`protection_${oldGuild.id}.whitelist`);
      var DataLog = database.get(`protection_${oldGuild.id}.log`); 
      if(DataLog) DataLog = oldGuild.guild.channels.cache.get(DataLog);
      const fetchedLogs = await oldGuild.guild.fetchAuditLogs({ limit: 1, type: "GUILD_UPDATE" });
      const CreateLog = fetchedLogs.entries.first();
      if(!CreateLog) return;
      let { executor, target, reason } = CreateLog;
      if(!executor && !target) return;
      let user = oldGuild.guild.members.cache.get(executor.id);
      let type;
      if(oldGuild.name !== newGuild.name) type = 'اسم خادم';
      if(oldGuild.icon !== newGuild.icon) type = 'صورة خادم';
      if(oldGuild.description !== newGuild.description) type = 'وصف خادم';
      if(oldGuild.region !== newGuild.region) type = 'منظقة خادم';
      if(oldGuild.banner !== newGuild.banner) type = 'بنر خادم';
   //   console.log(`${type} (${user.user.username})`)
      //console.log(oldGuild.name)
  }
})