const { MessageEmbed } = require('discord.js');
const db = require("quick.db");
const inlinereply = require('discord-reply');
const { devs} = require("../../config.json");
module.exports.run = async(message, args, client) => {
   var data = db.get(`game`);

    if(!args[0].length) {
      return;
    }

     db.set(`game`, args.join(" "))
      client.user.setPresence({ 
        status: "idle",
         activity: {
               name: args.join(" "),
               type: "PLAYING",
          }

      });
  
      message.react('✅');
      

}


module.exports.help = {
  name: 'set-game',
  description: 'تغير البايو',
  cooldown: 2,
  args: true,
  devs: true
}