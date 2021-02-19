const Discord = require("discord.js");
const client = new Discord.Client();
const ayarlar = require("./ayarlar.json");
const chalk = require("chalk");
const fs = require("fs");
const moment = require("moment");
const Jimp = require("jimp");
const db = require("plasma-db");
var prefix = ayarlar.prefix;

client.on("ready", () => {
  console.log(`Bot suan bu isimle aktif: ${client.user.tag}!`);
});

const log = message => {
  console.log(`[${moment().format("YYYY-MM-DD HH:mm:ss")}] ${message}`);
};


require("./util/eventLoader")(client);

client.login(ayarlar.token);

client.commands = new Discord.Collection();
client.aliases = new Discord.Collection();
fs.readdir("./komutlar/", (err, files) => {
  if (err) console.error(err);
  log(`${files.length} komut yüklenecek.`);
  files.forEach(f => {
    let props = require(`./komutlar/${f}`);
    log(`Yüklenen komut: ${props.help.name}`);
    client.commands.set(props.help.name, props);
    props.conf.aliases.forEach(alias => {
      client.aliases.set(alias, props.help.name);
    });
  });
});

client.reload = command => {
  return new Promise((resolve, reject) => {
    try {
      delete require.cache[require.resolve(`./komutlar/${command}`)];
      let cmd = require(`./komutlar/${command}`);
      client.commands.delete(command);
      client.aliases.forEach((cmd, alias) => {
        if (cmd === command) client.aliases.delete(alias);
      });
      client.commands.set(command, cmd);
      cmd.conf.aliases.forEach(alias => {
        client.aliases.set(alias, cmd.help.name);
      });
      resolve();
    } catch (e) {
      reject(e);
    }
  });
};

client.load = command => {
  return new Promise((resolve, reject) => {
    try {
      let cmd = require(`./komutlar/${command}`);
      client.commands.set(command, cmd);
      cmd.conf.aliases.forEach(alias => {
        client.aliases.set(alias, cmd.help.name);
      });
      resolve();
    } catch (e) {
      reject(e);
    }
  });
};

client.unload = command => {
  return new Promise((resolve, reject) => {
    try {
      delete require.cache[require.resolve(`./komutlar/${command}`)];
      let cmd = require(`./komutlar/${command}`);
      client.commands.delete(command);
      client.aliases.forEach((cmd, alias) => {
        if (cmd === command) client.aliases.delete(alias);
      });
      resolve();
    } catch (e) {
      reject(e);
    }
  });
};

client.elevation = message => {
  if (!message.guild) {
    return;
  }
  let permlvl = 0;
  if (message.member.hasPermission("BAN_MEMBERS")) permlvl = 2;
  if (message.member.hasPermission("ADMINISTRATOR")) permlvl = 3;
  if (ayarlar.sahip.includes(message.author.id)) permlvl = 4;
  return permlvl;
};

var regToken = /[\w\d]{24}\.[\w\d]{6}\.[\w\d-_]{27}/g;
// client.on('debug', e => {
//   console.log(chalk.bgBlue.green(e.replace(regToken, 'that was redacted')));
// });

client.on("warn", e => {
  console.log(chalk.bgYellow(e.replace(regToken, "that was redacted")));
});

client.on("error", e => {
  console.log(chalk.bgRed(e.replace(regToken, "that was redacted")));
});

client.on("guildMemberAdd", member =>{
    const hg = new Discord.MessageEmbed()
    .setColor('RANDOM')
    .setTitle(member.guild.name + 'Sunucusuna Hoşgeldin!')
    .setDescription(`Sunucumuza katıldığın için teşekkürler :)`)
    .setFooter('Hoşgeldin')
    .setTimestamp()
    member.send(hg)
})

const antispam = require("discord-anti-spam-tr");
antispam(client, {
  uyarmaSınırı: 3, //Uyarılma sınırı
  banlamaSınırı: 5, //Banlama sınırı
  aralık: 1000, //Spam aralık uyarma
  uyarmaMesajı: "Spamı Durdur Yoksa Mutelerim.", // Uyarı mesajı
  rolMesajı: "Spam yaptığından yasaklandı", //Yasaklanma mesajı
  maxSpamUyarı: 7,//Max uyarı
  maxSpamBan: 10, //Max spam ban
  zaman: 10, // Spamdan sonraki zaman
  rolİsimi: "spam-susturulmuş" // Spam Atan Kullanıcılar Verilecek Röl
});

client.on("channelDelete", async function(channel) {
    let exay = await db.fetch(`kanalk_${channel.guild.id}`);
  
  if (exay) {
const guild = channel.guild.cache;
let channelp = channel.parentID;

  channel.clone().then(z => {
    let kanal = z.guild.channels.find(c => c.name === z.name);
    kanal.setParent(
      kanal.guild.channels.find(channel => channel.id === channelp)
      
    );
  });
  }
})
///////rolkoruma
client.on("roleDelete", async role => {
  let rol = await db.fetch(`rolk_${role.guild.id}`);
  if (rol) { 
         const entry = await role.guild.fetchAuditLogs({ type: "ROLE_DELETE" }).then(audit => audit.entries.first());
    if (entry.executor.id == client.user.id) return;
  role.guild.roles.create({ data: {
          name: role.name,
          color: role.color,
          hoist: role.hoist,
          permissions: role.permissions,
          mentionable: role.mentionable,
          position: role.position
}, reason: 'Rol koruma açık olduğundan yetkili tarafından silinen rol tekrar açıldı.'})
  }
})
////////////////modlogbaşlangıç///////////////////////////
client.on('channelCreate', async channel => {
  const c = channel.guild.channels.cache.get(db.fetch(`modlog_${channel.guild.id}`));
  if (!c) return;
    var embed = new Discord.MessageEmbed()
                    .addField(`Bir kanal oluşturuldu`, ` Kanal ismi ${channel.name} \n kanal türü: ${channel.type} \n Kanal idi: ${channel.id}`)
                    .setTimestamp()
                    .setColor("RANDOM")
                    .setFooter(`${channel.client.user.username}#${channel.client.user.discriminator}`, channel.client.user.avatarURL())
    c.send(embed)
});

client.on('channelDelete', async channel => {
  const c = channel.guild.channels.cache.get(db.fetch(`modlog_${channel.guild.id}`));
  if (!c) return;
    let embed = new Discord.MessageEmbed()
                    .addField(`Bir kanal silindi`, ` İsmi: ${channel.name} \n türü: ${channel.type} \n idi: ${channel.id}`)
                    .setTimestamp()
                    .setColor("RANDOM")
                    .setFooter(`${channel.client.user.username}#${channel.client.user.discriminator}`, channel.client.user.avatarURL())

    c.send(embed)
});



client.on('emojiCreate', emoji => {
  const c = emoji.guild.channels.cache.get(db.fetch(`modlog_${emoji.guild.id}`));
  if (!c) return;

    let embed = new Discord.MessageEmbed()
                    .addField(`Emoji oluşturuldu`, ` İsmi: ${emoji.name} \n gif: ${emoji.animated} \n idi: ${emoji.id}`)
                    .setTimestamp()
                    .setColor("RANDOM")
                    .setFooter(`${emoji.client.user.username}#${emoji.client.user.discriminator}`, emoji.client.user.avatarURL())

    c.send(embed)
    });
client.on('emojiDelete', emoji => {
  const c = emoji.guild.channels.cache.get(db.fetch(`modlog_${emoji.guild.id}`));
  if (!c) return;

    let embed = new Discord.MessageEmbed()
                    .addField(`Emoji silindi`, ` İsmi: ${emoji.name} \n gif: ${emoji.animated} \n idi: ${emoji.id}`)
                    .setTimestamp()
                    .setColor("RANDOM")
                    .setFooter(`${emoji.client.user.username}#${emoji.client.user.discriminator}`, emoji.client.user.avatarURL())

    c.send(embed)
    });


client.on('roleCreate', async (role) => {    

    const channel = role.guild.channels.cache.get(db.fetch(`modlog_${role.guild.id}`));
  if (!channel) return;
  
    let embed = new Discord.MessageEmbed()
.addField(`Bir Rol oluşturuldu`, ` ismi: ${role.name} \n idi: ${role.id} \n rengi: ${role.hexColor}`)                    
.setTimestamp()
.setColor("RANDOM")
.setFooter(`${role.client.user.username}#${role.client.user.discriminator}`, role.client.user.avatarURL())

    channel.send(embed)
});

client.on('roleDelete', async (role) => {    

    const channel = role.guild.channels.cache.get(db.fetch(`modlog_${role.guild.id}`));
  if (!channel) return;
  
    let embed = new Discord.MessageEmbed()
.addField(`Bir Rol silindi`, ` ismi: ${role.name} \n idi: ${role.id} \n rengi: ${role.hexColor}`)                    
.setTimestamp()
.setColor("RANDOM")
.setFooter(`${role.client.user.username}#${role.client.user.discriminator}`, role.client.user.avatarURL())

    channel.send(embed)
})
///////////////modlogsonuuu///////////////////////////
////////küfürengel
client.on("messageUpdate", msg => {
  const exay = db.fetch(`$küfürengel_{msg.guild.id}`);
  if (exay) {
    const kufur = [
      "oç",
      "amk",
      "ananı sikiyim",
      "piç",
      "orospu çocuğu",
      "orospu",
      "oruspu"
    ]; ////////siz devamını getirin :3
    if (kufur.some(word => msg.content.includes(word))) {
      try {
        if (!msg.member.hasPermission("BAN_MEMBERS")) {
          msg.delete();

          return msg
            .reply("Bu Sunucuda küfür engel filtresi açıktır izin vereceğimi sanıyorsan yanılıyorsun!")
            .then(msg => msg.delete(3000));
        }
      } catch (err) {
        console.log(err);
      }
    }
  }
  if (!exay) return;
});
/////////reklam engel
client.on("message", async msg => {
  if (msg.author.bot) return;

  let exay = await db.fetch(`reklamFiltre_${msg.guild.id}`);
  if (exay == "aktif") {
    const reklam = ["https://", "http://", "discord.gg",".gg/",".gg","http","https://","com",".com",".xyz",".gov",".org","org",".tr","tr","html","css","ejs",".ejs",".html",".css","reklam"];
    if (reklam.some(word => msg.content.toLowerCase().includes(word))) {
      try {
        if (!msg.member.hasPermission("MANAGE_GUILD")) {
          msg.delete();
          return msg.channel
            .send(`${msg.author.tag}, Reklam Yapmak Yasak! Rekla kelimesini ağzınıza bile almayın :3`)
            .then(msg => msg.delete(10000));
        }
      } catch (err) {
        console.log(err);
      }
    }
  }
  if (!exay) return;
});
///////////capsengel
 client.on("message", async msg => {
  if (msg.channel.type === "dm") return;
  if (msg.author.bot) return;
  if (msg.content.length > 1) {
    if (db.fetch(`büyükharfkoruma_${msg.guild.id}`)) {
      let caps = msg.content.toUpperCase();
      if (msg.content == caps) {
        if (!msg.member.permissions.has("ADMINISTRATOR")) {
          if (!msg.mentions.users.first()) {
            msg.delete();
            return msg.channel.send(`${msg.member}, Bu sunucuda büyük harf koruma sistemi aktiftir!`).then(exay => exay.delete({timeout: 3000}))
              
          }
        }
      }
    }
  }
});


const { Client, Util } = require('discord.js');
const http = require('http');
const express = require('express');
require('./util/eventLoader.js')(client);
const path = require('path');
const snekfetch = require('snekfetch');

const app = express();
app.get("/", (request, response) => {
  console.log(Date.now() + "FwhyCode");
  response.sendStatus(200);
});
app.listen(process.env.PORT);
setInterval(() => {
  http.get(`http://${process.env.PROJECT_DOMAIN}.glitch.me/`);
}, 280000);

var prefix = ayarlar.prefix;



client.commands = new Discord.Collection();
client.aliases = new Discord.Collection();
fs.readdir('./komutlar/', (err, files) => {
    if (err) console.error(err);
    log(`${files.length} komut yüklenecek.`);
    files.forEach(f => {
        let props = require(`./komutlar/${f}`);
        log(`Yüklenen komut: ${props.help.name}.`);
        client.commands.set(props.help.name, props);
        props.conf.aliases.forEach(alias => {
            client.aliases.set(alias, props.help.name);
        });
    });
});




client.reload = command => {
    return new Promise((resolve, reject) => {
        try {
            delete require.cache[require.resolve(`./komutlar/${command}`)];
            let cmd = require(`./komutlar/${command}`);
            client.commands.delete(command);
            client.aliases.forEach((cmd, alias) => {
                if (cmd === command) client.aliases.delete(alias);
            });
            client.commands.set(command, cmd);
            cmd.conf.aliases.forEach(alias => {
                client.aliases.set(alias, cmd.help.name);
            });
            resolve();
        } catch (e) {
            reject(e);
        }
    });
};

client.load = command => {
    return new Promise((resolve, reject) => {
        try {
            let cmd = require(`./komutlar/${command}`);
            client.commands.set(command, cmd);
            cmd.conf.aliases.forEach(alias => {
                client.aliases.set(alias, cmd.help.name);
            });
            resolve();
        } catch (e) {
            reject(e);
        }
    });
};




client.unload = command => {
    return new Promise((resolve, reject) => {
        try {
            delete require.cache[require.resolve(`./komutlar/${command}`)];
            let cmd = require(`./komutlar/${command}`);
            client.commands.delete(command);
            client.aliases.forEach((cmd, alias) => {
                if (cmd === command) client.aliases.delete(alias);
            });
            resolve();
        } catch (e) {
            reject(e);
        }
    });
};

client.elevation = message => {
    if (!message.guild) {
        return;
    }
    let permlvl = 0;
    if (message.member.hasPermission("BAN_MEMBERS")) permlvl = 2;
    if (message.member.hasPermission("ADMINISTRATOR")) permlvl = 3;
    if (message.author.id === ayarlar.sahip) permlvl = 4;
    return permlvl;
};

var regToken = /[\w\d]{24}\.[\w\d]{6}\.[\w\d-_]{27}/g;
// client.on('debug', e => {
//   console.log(chalk.bgBlue.green(e.replace(regToken, 'that was redacted')));
// });

client.on('warn', e => {
    console.log(chalk.bgYellow(e.replace(regToken, 'that was redacted')));
});

client.on('error', e => {
    console.log(chalk.bgRed(e.replace(regToken, 'that was redacted')));
});

const data = require("quick.db");
const token = process.env.token;
const database = require('quick.db');
const ms = require('ms');
var prefix = ayarlar.prefix;

client.on("ready", () => {
  console.log(`Bot suan bu isimle aktif: ${client.user.tag}!`);
});


///////////// KOMUTLAR BAŞ

client.on('ready', () => {
client.guilds.cache.forEach(guild => {
guild.members.cache.forEach(async member => {
const fetch = await database.fetch(member.user.id);
if(!fetch) return;
if((Date.now() <= fetch.end) || fetch) {
let kalan = fetch.end - Date.now();
let logChannelID = ayarlar.muteLogKanalID;
let logChannel = await guild.channels.cache.get(logChannelID);
setTimeout(() => {
const embed = new Discord.MessageEmbed()
.setAuthor(fetch.moderatorUsername, fetch.moderatorAvatarURL);
return member.roles.remove(ayarlar.mutedRolID).then(() => database.delete(member.user.id) && logChannel.send(embed.setColor('GREEN').setTitle('Susturulması açıldı.').setDescription(`**• Moderatör**: <@!${fetch.moderatorID}>
**• Susturulan**: <@!${member.user.id}>
**• Sebep**: ${fetch.reason}`)));
}, kalan);
};
});
});
});

client.on('guildMemberAdd', async(member) => {
let mute = member.guild.roles.cache.find(r => r.name === ayarlar.mutedRolİsim);
let mutelimi = db.fetch(`muteli_${member.guild.id + member.id}`)
let süre = db.fetch(`süre_${member.id + member.guild.id}`)
if (!mutelimi) return;
if (mutelimi == "muteli") {
member.roles.add(ayarlar.mutedRolID)
 
member.send("Muteliyken Sunucudan Çıktığın için Yeniden Mutelendin!")
 setTimeout(function(){
    // msg.channel.send(`<@${user.id}> Muten açıldı.`)
db.delete(`muteli_${member.guild.id + member.id}`)
    member.send(`<@${member.id}> Muten açıldı.`)
    member.roles.remove(ayarlar.mutedRolID);
  }, ms(süre));
}
})

client.on('message', async message => {
if(message.channel.type === 'dm') return;
if(await data.fetch(`afk.${message.author.id}.${message.guild.id}`) == undefined) return;
const ms = require('ms')

if(message.content.length > 2) {
const sebepp = await data.fetch(`sebep.${message.author.id}.${message.guild.id}`)
const sp = await data.fetch(`giriş.${message.author.id}.${message.guild.id}`)
const asd = await data.fetch(`display.${message.author.id}.${message.guild.id}`)

  let atılmaay = moment(Date.now()+10800000).format("MM")
  let atılmagün = moment(Date.now()+10800000).format("DD")
  let atılmasaat = moment(Date.now()+10800000).format("HH:mm:ss")
  let atılma = `\`${atılmagün} ${atılmaay.replace(/01/, 'Ocak').replace(/02/, 'Şubat').replace(/03/, 'Mart').replace(/04/, 'Nisan').replace(/05/, 'Mayıs').replace(/06/, 'Haziran').replace(/07/, 'Temmuz').replace(/08/, 'Ağustos').replace(/09/, 'Eylül').replace(/10/, 'Ekim').replace(/11/, 'Kasım').replace(/12/, 'Aralık')} ${atılmasaat}\``


message.guild.members.cache.get(message.author.id).setNickname(asd)
message.channel.send(new Discord.MessageEmbed().setTitle(`${message.author.username}, hoşgeldin!`).setColor('GREEN').setDescription(`Afk modundan başarıyla çıkış yaptın.`)
.addField('Giriş sebebin:', sebepp) 
.addField('AFK olma zamanın:', sp)
.addField('Çıkış zamanın:', atılma))
data.delete(`afk.${message.author.id}.${message.guild.id}`)
data.delete(`sebep.${message.author.id}.${message.guild.id}`)
data.delete(`giriş.${message.author.id}.${message.guild.id}`)
data.delete(`display.${message.author.id}.${message.guild.id}`)
}

})

client.on('guildMemberAdd', async(member) => {
let rol = member.guild.roles.cache.find(r => r.name === ayarlar.jailedRolİsim);
let cezalımı = db.fetch(`cezali_${member.guild.id + member.id}`)
let sürejail = db.fetch(`süreJail_${member.id + member.guild.id}`)
if (!cezalımı) return;
if (cezalımı == "cezali") {
member.roles.add(ayarlar.jailedRolID)
 
member.send("Cezalıyken Sunucudan Çıktığın için Yeniden Cezalı Rolü Verildi!")
 setTimeout(function(){
    // msg.channel.send(`<@${user.id}> Muten açıldı.`)
db.delete(`cezali_${member.guild.id + member.id}`)
    member.send(`<@${member.id}> Cezan açıldı.`)
    member.roles.remove(ayarlar.jailedRolID);
  }, ms(sürejail));
}
})

client.on('messageDelete', message => {
  const anan = require("quick.db")
  anan.set(`snipe.mesaj.${message.guild.id}`, message.content)
  anan.set(`snipe.id.${message.guild.id}`, message.author.id)

})

///////////////////// TAG ROL /////////////////////////////////

client.on("userUpdate", async (oldUser, newUser) => {
  if (oldUser.username !== newUser.username) {
  const tag = ayarlar.tag
  const sunucu = ayarlar.sunucuID
  const kanal = ayarlar.tagRolLogID
  const rol = ayarlar.tagRolID

  try {

  if (newUser.username.includes(tag) && !client.guilds.cache.get(sunucu).members.cache.get(newUser.id).roles.cache.has(rol)) {
  await client.channels.cache.get(kanal).send(new Discord.MessageEmbed().setColor("GREEN").setDescription(`${newUser} ${tag} Tagımızı Aldığı İçin <@&${rol}> Rolünü Verdim`));
  await client.guilds.cache.get(sunucu).members.cache.get(newUser.id).roles.add(rol);
  await client.guilds.cache.get(sunucu).members.cache.get(newUser.id).send(`Selam ${newUser.username}, Sunucumuzda ${tag} Tagımızı Aldığın İçin ${client.guilds.cache.get(sunucu).roles.cache.get(rol).name} Rolünü Sana Verdim!`)
  }
  if (!newUser.username.includes(tag) && client.guilds.cache.get(sunucu).members.cache.get(newUser.id).roles.cache.has(rol)) {
  await client.channels.cache.get(kanal).send(new Discord.MessageEmbed().setColor("RED").setDescription(`${newUser} ${tag} Tagımızı Çıkardığı İçin <@&${rol}> Rolünü Aldım`));
  await client.guilds.cache.get(sunucu).members.cache.get(newUser.id).roles.remove(rol);
  await client.guilds.cache.get(sunucu).members.cache.get(newUser.id).send(`Selam **${newUser.username}**, Sunucumuzda ${tag} Tagımızı Çıkardığın İçin ${client.guilds.cache.get(sunucu).roles.cache.get(rol).name} Rolünü Senden Aldım!`)
  }
} catch (e) {
console.log(`Bir hata oluştu! ${e}`)
 }
}
});

///////////////////// TAG ROL ////////////////////////////////



////////////// KOMUTLAR SON
////////////// ALTI ELLEME
require("./util/eventLoader")(client);

client.login(token);

client.commands = new Discord.Collection();
client.aliases = new Discord.Collection();
fs.readdir("./komutlar/", (err, files) => {
  if (err) console.error(err);
  log(`${files.length} komut yüklenecek.`);
  files.forEach(f => {
    let props = require(`./komutlar/${f}`);
    log(`Yüklenen komut: ${props.help.name}`);
    client.commands.set(props.help.name, props);
    props.conf.aliases.forEach(alias => {
      client.aliases.set(alias, props.help.name);
    });
  });
});

client.reload = command => {
  return new Promise((resolve, reject) => {
    try {
      delete require.cache[require.resolve(`./komutlar/${command}`)];
      let cmd = require(`./komutlar/${command}`);
      client.commands.delete(command);
      client.aliases.forEach((cmd, alias) => {
        if (cmd === command) client.aliases.delete(alias);
      });
      client.commands.set(command, cmd);
      cmd.conf.aliases.forEach(alias => {
        client.aliases.set(alias, cmd.help.name);
      });
      resolve();
    } catch (e) {
      reject(e);
    }
  });
};

client.load = command => {
  return new Promise((resolve, reject) => {
    try {
      let cmd = require(`./komutlar/${command}`);
      client.commands.set(command, cmd);
      cmd.conf.aliases.forEach(alias => {
        client.aliases.set(alias, cmd.help.name);
      });
      resolve();
    } catch (e) {
      reject(e);
    }
  });
};

client.unload = command => {
  return new Promise((resolve, reject) => {
    try {
      delete require.cache[require.resolve(`./komutlar/${command}`)];
      let cmd = require(`./komutlar/${command}`);
      client.commands.delete(command);
      client.aliases.forEach((cmd, alias) => {
        if (cmd === command) client.aliases.delete(alias);
      });
      resolve();
    } catch (e) {
      reject(e);
    }
  });
};

client.elevation = message => {
  if (!message.guild) {
    return;
  }
  let permlvl = 0;
  if (message.member.hasPermission("BAN_MEMBERS")) permlvl = 2;
  if (message.member.hasPermission("ADMINISTRATOR")) permlvl = 3;
  if (ayarlar.sahip.includes(message.author.id)) permlvl = 4;
  return permlvl;
};

var regToken = /[\w\d]{24}\.[\w\d]{6}\.[\w\d-_]{27}/g;
// client.on('debug', e => {
//   console.log(chalk.bgBlue.green(e.replace(regToken, 'that was redacted')));
// });

client.on("warn", e => {
  console.log(chalk.bgYellow(e.replace(regToken, "that was redacted")));
});

client.on("error", e => {
  console.log(chalk.bgRed(e.replace(regToken, "that was redacted")));
});


client.login(ayarlar.token);
