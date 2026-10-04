const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "song",
    aliases: ["sing", "music", "yta", "audio"],
    version: "5.2.0",
    author: "👑 𝐓𝐀𝐇𝐀 𝐊𝐇𝐀𝐍 👑",
    countDown: 5,
    role: 0,
    description: "Search 10 songs with image preview and select to download",
    category: "media",
    guide: "{pn} [song name / link]",
    priority: 1
  },

  onStart: async function ({ message, args, event }) {
    if (!args[0]) {
      return message.reply("🎵 **Jani! Kisi gaane ka naam tou do.**\n(e.g: /song wajah tum ho)");
    }

    const searchQuery = args.join(" ");
    const cacheDir = path.join(__dirname, "cache");
    await fs.ensureDir(cacheDir);

    let searchMsg;
    try {
      searchMsg = await message.reply("🔍 Songs dhoondhe ja rahe hain, thoda intazar karein...");

      // Multi-search endpoints fallback
      const searchEndpoints = [
        `https://api.nexray.eu.cc/search/yt?q=${encodeURIComponent(searchQuery)}`,
        `https://api.nexray.eu.cc/search/youtube?q=${encodeURIComponent(searchQuery)}`,
        `https://uzairrajputapis.qzz.io/api/ytsearch?query=${encodeURIComponent(searchQuery)}`,
        `https://uzairrajputapis.qzz.io/api/yt?search=${encodeURIComponent(searchQuery)}`
      ];

      let items = null;

      for (const url of searchEndpoints) {
        try {
          const res = await axios.get(url, { timeout: 12000 });
          const raw = res.data?.result || res.data?.results || res.data?.data || res.data;
          
          if (Array.isArray(raw) && raw.length > 0) {
            items = raw;
            break;
          }
        } catch (e) {
          continue;
        }
      }

      // If Search List fails, directly fallback to Single Song Download
      if (!items || items.length === 0) {
        if (searchMsg?.messageID) message.unsend(searchMsg.messageID);
        return downloadDirectSong(message, searchQuery, cacheDir);
      }

      // Top 10 Limit
      const list = items.slice(0, 10);

      // ── STYLISH NUMBER & MENU DESIGN ──
      let listTxt = `╭─────────────🅢🅞🅝🅖─────────────╮\n`;
      listTxt += `│  🎵 𝐒𝐄𝐀𝐑𝐂𝐇 𝐑𝐄𝐒𝐔𝐋𝐓𝐒 ( Top 10 )\n`;
      listTxt += `├───────────────────────────────╯\n\n`;

      list.forEach((item, index) => {
        const num = index + 1 < 10 ? `0${index + 1}` : `${index + 1}`;
        const title = item.title || "Unknown Title";
        const duration = item.duration || item.timestamp || "N/A";
        const channel = item.channel || item.author?.name || "YouTube";

        listTxt += `╭─ [ ${num} ] ◈ ${title}\n`;
        listTxt += `╰─► ⏱️ ${duration}  │  👤 ${channel}\n\n`;
      });

      listTxt += `──━━━━━ [ 𝐒𝐄𝐋𝐄𝐂𝐓 𝐒𝐎𝐍𝐆 ] ━━━━━──\n`;
      listTxt += `👉 **1 se ${list.length} tak number likh kar reply karein.**\n\n`;
      listTxt += `👑 **Powered by:** 👑 𝐓𝐀𝐇𝐀 𝐊𝐇𝐀𝐍 👑`;

      if (searchMsg?.messageID) message.unsend(searchMsg.messageID);

      // Top Result Thumbnail Preview
      let firstThumb = list[0]?.thumbnail || list[0]?.image;
      let attachment = null;
      let thumbPath = path.join(cacheDir, `thumb_${Date.now()}.jpg`);

      if (firstThumb && typeof firstThumb === "string") {
        try {
          const imgRes = await axios.get(firstThumb, { responseType: "arraybuffer", timeout: 8000 });
          await fs.writeFile(thumbPath, Buffer.from(imgRes.data));
          attachment = fs.createReadStream(thumbPath);
        } catch (e) {}
      }

      const msgOptions = { body: listTxt };
      if (attachment) msgOptions.attachment = attachment;

      const sentMsg = await message.reply(msgOptions);

      // Cleanup Thumb Cache
      if (fs.existsSync(thumbPath)) {
        setTimeout(() => { try { fs.unlinkSync(thumbPath); } catch (e) {} }, 10000);
      }

      // Register Reply State
      global.GoatBot.onReply.set(sentMsg.messageID, {
        commandName: this.config.name,
        messageID: sentMsg.messageID,
        author: event.senderID,
        searchResults: list
      });

    } catch (err) {
      console.error("Song Search Error:", err?.message);
      if (searchMsg?.messageID) message.unsend(searchMsg.messageID);
      // Automatic Fallback on General Error
      return downloadDirectSong(message, searchQuery, cacheDir);
    }
  },

  onReply: async function ({ message, event, Reply }) {
    const { author, searchResults, messageID } = Reply;
    if (event.senderID !== author) return;

    const choice = parseInt(event.body.trim());
    if (isNaN(choice) || choice < 1 || choice > searchResults.length) {
      return message.reply(`⚠️ Please 1 se ${searchResults.length} ke darmayan number reply karein.`);
    }

    const selectedSong = searchResults[choice - 1];
    const selectedQuery = selectedSong.url || selectedSong.title;

    message.unsend(messageID);
    const cacheDir = path.join(__dirname, "cache");

    return downloadDirectSong(message, selectedQuery, cacheDir, selectedSong);
  }
};

// Helper Function for Audio Download & Processing
async function downloadDirectSong(message, query, cacheDir, selectedMetaData = null) {
  let waitingMsg;
  const audioPath = path.join(cacheDir, `song_${Date.now()}.mp3`);

  try {
    waitingMsg = await message.reply("🎶 Please thoda intazar karein, song download ho raha hai...");

    const apiUrl = `https://api.nexray.eu.cc/downloader/ytplay?q=${encodeURIComponent(query)}`;

    const res = await axios.get(apiUrl, {
      timeout: 25000,
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    const data = res.data;

    let downloadUrl = data?.result?.download_url || data?.result?.url || data?.download_url;
    let title = data?.result?.title || selectedMetaData?.title || query;
    let duration = data?.result?.duration || selectedMetaData?.duration || "N/A";
    let channel = data?.result?.channel || selectedMetaData?.channel || "N/A";
    let views = data?.result?.views || "N/A";

    if (!downloadUrl || typeof downloadUrl !== "string") {
      if (waitingMsg?.messageID) message.unsend(waitingMsg.messageID);
      return message.reply("❌ Download link nahi mil saka. Direct gaane ka naam sahi se likh kar try karein.");
    }

    // Download Binary Stream (.mp3)
    const streamRes = await axios.get(downloadUrl, {
      responseType: "arraybuffer",
      timeout: 90000,
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    await fs.ensureDir(cacheDir);
    await fs.writeFile(audioPath, Buffer.from(streamRes.data));

    if (waitingMsg?.messageID) message.unsend(waitingMsg.messageID);

    // Stylish Final Audio Caption
    const caption = 
      `╭─────────────🎵 𝐒𝐎𝐍𝐆 🎵─────────────╮\n` +
      `│ 🎧 **Title:** ${title}\n` +
      `│ ⏱️ **Duration:** ${duration}\n` +
      `│ 📢 **Channel:** ${channel}\n` +
      `│ 👁️ **Views:** ${views}\n` +
      `├──────────────────────────────────────╯\n` +
      `👑 **Powered by:** 👑 𝐓𝐀𝐇𝐀 𝐊𝐇𝐀𝐍 👑`;

    await message.reply({
      body: caption,
      attachment: fs.createReadStream(audioPath)
    });

    if (fs.existsSync(audioPath)) {
      setTimeout(() => {
        try { fs.unlinkSync(audioPath); } catch (e) {}
      }, 10000);
    }

  } catch (err) {
    console.error("Song Direct Download Error:", err?.message);
    if (waitingMsg?.messageID) message.unsend(waitingMsg.messageID);
    return message.reply("❌ Audio process karte waqt error aaya. Thodi der baad try karein.");
  }
}
