const fs = require("fs-extra");
const request = require("request");
const path = require("path");

module.exports = {
  config: {
    name: "owner",
    aliases: ["info"],
    version: "1.3.0",
    author: "𝐓𝐀𝐇𝐀 𝐊𝐇𝐀𝐍",
    role: 0,
    shortDescription: "Owner information with image",
    category: "Information",
    guide: {
      en: "owner"
    }
  },

  onStart: async function ({ api, event }) {
    const ownerText = 
`╭─ 👑 Oᴡɴᴇʀ Iɴғᴏ 👑 ─╮
│ 👤 Nᴀᴍᴇ       : 𝐓𝐀𝐇𝐀 𝐊𝐇𝐀𝐍
│ 🦋 Nɪᴄᴋ       : 𝐓𝐀𝐇𝐀 𝐊𝐇𝐀𝐍
│ 🎂 Aɢᴇ        : 19
│ 💘 Rᴇʟᴀᴛɪᴏɴ : STFU
│ 🎓 Pʀᴏғᴇssɪᴏɴ : 𝐉𝐎𝐁
│ 📚 Eᴅᴜᴄᴀᴛɪᴏn   : 𝐆𝐎𝐕𝐄𝐓 𝐒𝐂𝐇𝐎𝐎𝐋
│ 🏡 Lᴏᴄᴀᴛɪᴏɴ : 𝐋𝐀𝐇𝐎𝐄𝐑 𝐏𝐀𝐊𝐈𝐒𝐀𝐍
├─ 🔗 Cᴏɴᴛᴀᴄᴛ ─╮
│ 📘 Facebook  :  id=100075933317520
│ 💬 Messenger: id=100075933317520
│ 📞 WhatsApp  : 923474771404
╰────────────────╯`;

    const cacheDir = path.join(__dirname, "cache");
    const imgPath = path.join(cacheDir, "owner.jpg");

    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

    const imgLink = "https://i.imgur.com/1tUVG85.jpeg";

    const send = () => {
      api.sendMessage(
        {
          body: ownerText,
          attachment: fs.createReadStream(imgPath)
        },
        event.threadID,
        () => fs.unlinkSync(imgPath),
        event.messageID
      );
    };

    request(encodeURI(imgLink))
      .pipe(fs.createWriteStream(imgPath))
      .on("close", send)
  }
};
