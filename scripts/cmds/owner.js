const fs = require("fs-extra");
const axios = require("axios");
const path = require("path");

module.exports = {
  config: {
    name: "owner",
    aliases: ["info", "admin"],
    version: "1.4.0",
    author: "𝐓𝐀𝐇𝐀 𝐊𝐇𝐀𝐍",
    role: 0,
    shortDescription: "Owner information with image",
    category: "info",
    guide: {
      en: "{pn}"
    }
  },

  onStart: async function ({ message }) {
    const ownerText = 
`╭─ 👑 Oᴡɴᴇʀ Iɴғᴏ 👑 ─╮
│ 👤 Nᴀᴍᴇ       : 𝐓𝐀𝐇𝐀 𝐊𝐇𝐀𝐍
│ 🦋 Nɪᴄᴋ       : 𝐓𝐀𝐇𝐀 𝐊𝐇𝐀𝐍
│ 🎂 Aɢᴇ        : 19
│ 💘 Rᴇʟᴀᴛɪᴏɴ   : STFU
│ 🎓 Pʀᴏғᴇssɪᴏɴ : 𝐉𝐎𝐁
│ 📚 Eᴅᴜᴄᴀᴛɪᴏɴ  : 𝐆𝐎𝐕𝐄𝐓 𝐒𝐂𝐇𝐎𝐎𝐋
│ 🏡 Lᴏᴄᴀᴛɪᴏɴ   : 𝐋𝐀𝐇𝐎𝐑𝐄, 𝐏𝐀𝐊𝐈𝐒𝐓𝐀𝐍
├─ 🔗 Cᴏɴᴛᴀᴄᴛ ─╮
│ 📘 Facebook  : id=100075933317520
│ 💬 Messenger : id=100075933317520
│ 📞 WhatsApp  : +923474771404
╰────────────────╯`;

    const cacheDir = path.join(__dirname, "cache");
    await fs.ensureDir(cacheDir);
    const imgPath = path.join(cacheDir, `owner_${Date.now()}.jpg`);

    const imgLink = "https://i.imgur.com/1tUVG85.jpeg";

    try {
      // Axios stream download
      const response = await axios({
        method: "GET",
        url: imgLink,
        responseType: "stream"
      });

      const writer = fs.createWriteStream(imgPath);
      response.data.pipe(writer);

      writer.on("finish", async () => {
        await message.reply({
          body: ownerText,
          attachment: fs.createReadStream(imgPath)
        });

        // Cleanup temporary image file
        setTimeout(() => {
          if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
        }, 5000);
      });

      writer.on("error", (err) => {
        console.error("Image Save Error:", err);
        return message.reply(ownerText);
      });

    } catch (error) {
      console.error("Owner Command Error:", error);
      // Agar image fetch na bhi ho sake to text reply chala jayega
      return message.reply(ownerText);
    }
  }
};
