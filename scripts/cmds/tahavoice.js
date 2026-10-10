module.exports = {
  config: {
    name: "tahavoice",
    aliases: ["voiceai", "voiceon", "aivoice"],
    version: "2.0",
    author: "TAHA KHAN",
    role: 1, // Group Admin or Bot Admin
    countDown: 3,
    description: "Voice AI on/off karo — har message ka voice mein AI jawab dega.",
    category: "ai",
    guide: {
      en: "{pn} [on/off/status]"
    }
  },

  onStart: async function ({ api, event, args, message, Threads, role, prefix }) {
    const { threadID, messageID } = event;
    const action = (args[0] || '').toLowerCase();

    // Permission Check
    if (role < 1) {
      return message.reply("❌ Ye command sirf Group Admin ya Bot Admin use kar sakte hain!");
    }

    if (!action || action === 'status') {
      const settings = await Threads.get(threadID) || {};
      const isOn = settings?.data?.tahavoice === true;

      return message.reply(
        `╭──── « 🎙️ TAHA VOICE » ────⟡\n` +
        `│\n` +
        `│ Status: ${isOn ? '✅ ON' : '❌ OFF'}\n` +
        `│\n` +
        `│ 📌 Use:\n` +
        `│   ${prefix}tahavoice on\n` +
        `│   ${prefix}tahavoice off\n` +
        `│\n` +
        `│ 🎤 ON hone ke baad har\n` +
        `│    message ka AI voice\n` +
        `│    mein jawab ayega!\n` +
        `│\n` +
        `│ 👑 TAHA BOT SYSTEM\n` +
        `╰────────────────────⟡`
      );
    }

    if (!['on', 'off'].includes(action)) {
      return message.reply(`❌ Usage: ${prefix}tahavoice [on/off/status]`);
    }

    const enable = action === 'on';
    
    // Save settings in GoatBot Threads DB
    const threadData = await Threads.get(threadID) || {};
    const currentData = threadData.data || {};
    currentData.tahavoice = enable;
    await Threads.set(threadID, { data: currentData });

    try {
      if (api.setMessageReaction) {
        api.setMessageReaction(enable ? '✅' : '❌', messageID, () => {}, true);
      }
    } catch (_) {}

    if (enable) {
      return message.reply(
        `╭──── « 🎙️ VOICE AI ON » ────⟡\n` +
        `│\n` +
        `│ ✅ Taha Voice ON ho gayi!\n` +
        `│\n` +
        `│ 🎤 Ab is group ke har\n` +
        `│    message ka jawab AI\n` +
        `│    voice mein dega!\n` +
        `│\n` +
        `│ ⚠️ Band karne ke liye:\n` +
        `│   ${prefix}tahavoice off\n` +
        `│\n` +
        `│ 👑 TAHA BOT SYSTEM\n` +
        `╰──────────────────────⟡`
      );
    } else {
      return message.reply(
        `╭──── « 🎙️ VOICE AI OFF » ────⟡\n` +
        `│\n` +
        `│ ❌ Taha Voice OFF ho gayi!\n` +
        `│\n` +
        `│ 🔇 Ab voice jawab band\n` +
        `│    ho gaya hai.\n` +
        `│\n` +
        `│ 👑 TAHA BOT SYSTEM\n` +
        `╰──────────────────────⟡`
      );
    }
  }
};
