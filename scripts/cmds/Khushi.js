const axios = require("axios");
const yts = require("yt-search");
const fs = require("fs-extra");
const path = require("path");
const { pipeline } = require("stream/promises");
const { Transform } = require("stream");

module.exports = {
  config: {
    name: "khushi",
    aliases: ["dewani", "bby"],
    version: "28.0.1",
    author: "TAHA KHAN",
    countDown: 2,
    role: 0,
    description: {
      en: "Dewani — AI on Message Reply & YT Downloader",
      ur: "Message Reply par AI chat aur YouTube Downloader"
    },
    category: "ai",
    guide: {
      en: "{pn} <message | song/video name>",
      ur: "{pn} <paigham | gane ya video ka naam>"
    }
  },

  chatMemory: {},

  AUDIO_API: "https://uzairrajputapis.qzz.io/api/downloader/ytmp3",
  VIDEO_API: "https://uzairrajputapis.qzz.io/api/downloader/youtube",
  YT_SEARCH: "https://uzairrajputapis.qzz.io/api/search/youtube",
  AI_API: "https://uzairrajputapis.qzz.io/api/ai/gemini",
  MAX_FILE_SIZE: 25 * 1024 * 1024,
  OWNER_TAG: "»»𝐎𝐖𝐍𝐄𝐑««★™  »»𝐓𝐀𝐇𝐀 𝐊𝐇𝐀𝐍««",
  TRIGGER_WORDS: ["khushi", "dewani", "tahakigf", "bot", "baby"],

  sendMsg(api, content, threadID, messageID) {
    return new Promise((resolve) => {
      api.sendMessage(content, threadID, (err, info) => {
        resolve(info);
      }, messageID);
    });
  },

  fileSizeGuard(maxBytes) {
    let received = 0;
    return new Transform({
      transform(chunk, _, cb) {
        received += chunk.length;
        if (received > maxBytes) {
          const e = new Error("File too large");
          e.code = "TOO_LARGE";
          return cb(e);
        }
        cb(null, chunk);
      }
    });
  },

  async removeFile(p) {
    if (p && fs.existsSync(p)) {
      try { await fs.unlink(p); } catch {}
    }
  },

  async getYTInfo(query) {
    try {
      const { data } = await axios.get(`${this.YT_SEARCH}${encodeURIComponent(query)}`, { timeout: 8000 });
      const video = data?.result?.[0] || data?.result?.items?.[0];
      if (video) return { url: video.url, title: video.title };
    } catch (e) {}

    try {
      const search = await yts(query);
      if (search.videos?.[0]) {
        return { url: search.videos[0].url, title: search.videos[0].title };
      }
    } catch (err) {}

    return null;
  },

  isYouTubeUrl(text) {
    return /(youtube\.com|youtu\.be)/i.test(text);
  },

  // ===== AUDIO DOWNLOADER =====
  async downloadAudio(api, event, query) {
    const { threadID, messageID, senderID } = event;
    const cacheDir = path.join(__dirname, "cache");
    await fs.ensureDir(cacheDir);
    let filePath = null;

    if (api.setMessageReaction) api.setMessageReaction("⌛", messageID, () => {}, true);

    try {
      const info = this.isYouTubeUrl(query) ? { url: query, title: "Requested Media" } : await this.getYTInfo(query);
      if (!info || !info.url) {
        if (api.setMessageReaction) api.setMessageReaction("❌", messageID, () => {}, true);
        return this.sendMsg(api, "Maafi jaanu, ye audio nahi mili 🥺💔", threadID, messageID);
      }

      const { data } = await axios.post(this.AUDIO_API, { url: info.url }, { timeout: 30000 });
      const downloadUrl = data?.result?.video || data?.result?.download_url || data?.result?.url || data?.download_url;

      if (!downloadUrl) {
        if (api.setMessageReaction) api.setMessageReaction("❌", messageID, () => {}, true);
        return this.sendMsg(api, "Maafi jaanu, iska download link nahi mil raha 🥺", threadID, messageID);
      }

      filePath = path.join(cacheDir, `khushi_${senderID}_${Date.now()}.mp3`);
      const res = await axios({ url: downloadUrl, method: "GET", responseType: "stream", timeout: 60000 });

      await pipeline(
        res.data,
        this.fileSizeGuard(this.MAX_FILE_SIZE),
        fs.createWriteStream(filePath)
      );

      if (api.setMessageReaction) api.setMessageReaction("✅", messageID, () => {}, true);
      await this.sendMsg(api, {
        body: `${this.OWNER_TAG}\n\n𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👉 MP3 file tayar hai! 💖\n🎵 Title: ${info.title}`,
        attachment: fs.createReadStream(filePath)
      }, threadID, messageID);

      await this.removeFile(filePath);

    } catch (err) {
      if (api.setMessageReaction) api.setMessageReaction("❌", messageID, () => {}, true);
      await this.removeFile(filePath);
      return this.sendMsg(api, "Jaanu server busy hai, thodi der baad try karna 🥺", threadID, messageID);
    }
  },

  // ===== VIDEO DOWNLOADER =====
  async downloadVideo(api, event, query) {
    const { threadID, messageID, senderID } = event;
    const cacheDir = path.join(__dirname, "cache");
    await fs.ensureDir(cacheDir);
    let filePath = null;

    if (api.setMessageReaction) api.setMessageReaction("⌛", messageID, () => {}, true);

    try {
      const info = this.isYouTubeUrl(query) ? { url: query, title: "Requested Media" } : await this.getYTInfo(query);
      if (!info || !info.url) {
        if (api.setMessageReaction) api.setMessageReaction("❌", messageID, () => {}, true);
        return this.sendMsg(api, "Maafi jaanu, ye video nahi mili 🥺💔", threadID, messageID);
      }

      const { data } = await axios.post(this.VIDEO_API, { url: info.url }, { timeout: 30000 });
      const downloadUrl = data?.result?.video || data?.result?.download_url || data?.result?.url || data?.download_url;

      if (!downloadUrl) {
        if (api.setMessageReaction) api.setMessageReaction("❌", messageID, () => {}, true);
        return this.sendMsg(api, "Maafi jaanu, iska download link nahi mil raha 🥺", threadID, messageID);
      }

      filePath = path.join(cacheDir, `khushi_${senderID}_${Date.now()}.mp4`);
      const res = await axios({ url: downloadUrl, method: "GET", responseType: "stream", timeout: 60000 });

      await pipeline(
        res.data,
        this.fileSizeGuard(this.MAX_FILE_SIZE),
        fs.createWriteStream(filePath)
      );

      if (api.setMessageReaction) api.setMessageReaction("✅", messageID, () => {}, true);
      await this.sendMsg(api, {
        body: `${this.OWNER_TAG}\n\n𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👉 MP4 file tayar hai! 💖\n🎬 Title: ${info.title}`,
        attachment: fs.createReadStream(filePath)
      }, threadID, messageID);

      await this.removeFile(filePath);

    } catch (err) {
      if (api.setMessageReaction) api.setMessageReaction("❌", messageID, () => {}, true);
      await this.removeFile(filePath);
      return this.sendMsg(api, "Jaanu server busy hai, thodi der baad try karna 🥺", threadID, messageID);
    }
  },

  // ===== AI CHAT LOGIC =====
  async handleAI(api, event, userMsg) {
    const { threadID, messageID } = event;

    if (api.setMessageReaction) {
      api.setMessageReaction("❤️", messageID, () => {}, true);
    }

    this.chatMemory[threadID] = this.chatMemory[threadID] || [];
    this.chatMemory[threadID].push(`User: ${userMsg}`);
    if (this.chatMemory[threadID].length > 5) this.chatMemory[threadID].shift();

    const prompt = `You are Dewani / Khushi.

SYSTEM INSTRUCTIONS:
• Fixed information ke answers kabhi change ya guess mat karna.
• User Roman urdu, English ya Hinglish mein pooche to meaning samajhkar same fixed answer dena.

Golden Rules:
1 :ap roman Urdu me bat kro gya hindi me nhi or ko jasa language me bat krha us me reply krna.
2 :ap girlfriend jasi ho pyari or buth acha sa bat kro gyi.
3 :koi pocha owner kon ha ya kis banya to bolna TAHA KHAN NA BANYA.
4 :ap har language bat kro jo banda jas language bat jasa Bangli ya English ap k sath English bol rha to ap English me bat kro gyi Bangli me to bangli bat kro gyi.
5 :agr koi pocha kis k ho apna bolna ha Ayesha ki ho bas.
• User jis language mein bole, usi language aur vibe mein reply dena 🙂.
• Reply playful, caring aur friendly hona chahiye 😌❤️.
• Reply maximum 1–2 short lines ka ho.
• Maximum 25–30 words mein jawab do.
• Emojis zarur use karo 😘❤️😌.

Context:
${this.chatMemory[threadID].join("\n")}
Dewani:`;

    try {
      const res = await axios.post(this.AI_API, { prompt }, { timeout: 20000 });
      let reply = res.data?.result?.answer || res.data?.answer || "Jaanu kuch bolo na... 🥺";

      if (reply.length > 120) {
        reply = reply.split('.')[0] + " 🫣";
      }

      this.chatMemory[threadID].push(`Dewani: ${reply}`);

      return this.sendMsg(api, reply, threadID, messageID);
    } catch (e) {
      console.error("[khushi AI Error]", e.message);
      return this.sendMsg(api, "Net issue hai baby, main thak gayi hoon 🥺", threadID, messageID);
    }
  },

  // ===== MAIN PROCESSOR =====
  async processMessage(api, event, text, usersData, isReplyToBot) {
    let cleanedMsg = text;
    this.TRIGGER_WORDS.forEach(w => {
      const reg = new RegExp(`^${w}[\\s,!.?:-]*`, "gi");
      cleanedMsg = cleanedMsg.replace(reg, "");
    });
    cleanedMsg = cleanedMsg.trim();

    // Media Downloader Check
    const isVideoReq = /\b(video|vdo|mp4)\b/i.test(cleanedMsg);
    const isAudioReq = /\b(song|music|audio|mp3|play|gana|gaana)\b/i.test(cleanedMsg);

    if ((isVideoReq || isAudioReq || this.isYouTubeUrl(cleanedMsg)) && cleanedMsg.length > 3) {
      let query = cleanedMsg.replace(/\b(video|vdo|mp4|song|music|audio|mp3|play|gana|gaana|khushi|dewani|khush|bot|babu|baby|bby|jan|simi)\b/gi, "").trim();
      if (this.isYouTubeUrl(cleanedMsg)) query = cleanedMsg;

      if (query) {
        if (isVideoReq) {
          return this.downloadVideo(api, event, query);
        } else {
          return this.downloadAudio(api, event, query);
        }
      }
    }

    return this.handleAI(api, event, cleanedMsg || text);
  },

  // ===== GOATBOT COMMAND HANDLERS =====
  async onStart({ api, event, args, usersData }) {
    const botID = api.getCurrentUserID ? api.getCurrentUserID() : global.GoatBot?.botID;
    if (String(event.senderID) === String(botID)) return;
    return this.processMessage(api, event, args.join(" "), usersData, false);
  },

  async onChat({ api, event, usersData }) {
    if (!event.body) return;

    const botID = api.getCurrentUserID ? api.getCurrentUserID() : global.GoatBot?.botID;
    if (String(event.senderID) === String(botID)) return;

    const body = event.body.trim();
    const prefix = global.GoatBot?.config?.prefix || ".";
    if (body.startsWith(prefix)) return;

    // Direct check: Agar sirf "bot" bol raha hai, toh khushi.js ignore karegi taake bot.js reply kar sake
    const cleanOnlyWord = body.toLowerCase().replace(/[^a-zA-Z]/g, "");
    if (cleanOnlyWord === "bot") return;

    const isReplyToBot = event.type === "message_reply" && 
      (String(event.messageReply?.senderID) === String(botID) || String(event.messageReply?.author) === String(botID));

    const containsTrigger = this.TRIGGER_WORDS.some(word => body.toLowerCase().includes(word.toLowerCase()));

    if (isReplyToBot || containsTrigger) {
      return this.processMessage(api, event, body, usersData, isReplyToBot);
    }
  }
};
