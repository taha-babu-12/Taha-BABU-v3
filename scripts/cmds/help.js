module.exports = {
  config: {
    name: "help",
    aliases: ["menu"],
    version: "11.0",
    author: "TAHA KHAN",
    role: 0,
    description: "Ultra VIP Interactive Command Navigation System",
    category: "menu",
    guide: {
      en: "{pn} [command_name]"
    }
  },

  onStart: async function ({ message, args, prefix }) {
    const { commands } = global.GoatBot;
    const input = args[0] ? args[0].toLowerCase() : null;

    // 1. Specific Command Detail View (*help vsong)
    if (input && commands.has(input)) {
      const command = commands.get(input);
      const { config } = command;
      const roleText = config.role === 0 ? "Everyone (All Users)" : config.role === 1 ? "Group Admin Only" : "Bot Owner Only";

      const detailMsg = 
`╔════════════════════════════════════════╗
      💎 𝐔 𝐋 𝐓 𝐑 𝐀   𝐂 𝐎 𝐌 𝐌 𝐀 𝐍 𝐃   𝐈 𝐍 𝐅 𝐎 💎
╚════════════════════════════════════════╝
 ⚡ 𝐍𝐀𝐌𝐄       : ${config.name.toUpperCase()}
 🏷️ 𝐀𝐋𝐈𝐀𝐒𝐄𝐒    : ${config.aliases && config.aliases.length > 0 ? config.aliases.join(" • ") : "None"}
 📝 𝐃𝐄𝐒𝐂𝐑𝐈𝐏𝐓𝐈𝐎𝐍 : ${config.description || "No description provided."}
 📁 𝐂𝐀𝐓𝐄𝐆𝐎𝐑𝐘   : ${config.category ? config.category.toUpperCase() : "GENERAL"}
 👤 𝐀𝐂𝐂𝐄𝐒𝐒     : ${roleText}
 ⏳ 𝐂𝐎𝐎𝐋𝐃𝐎𝐖𝐍   : ${config.countDown || 5} Seconds
 👑 𝐀𝐔𝐓𝐇𝐎𝐑     : ${config.author || "TAHA KHAN"}
 ⚙️ 𝐔𝐒𝐀𝐆𝐄      : \`${prefix}${config.name}${config.guide?.en ? config.guide.en.replace("{pn}", "") : ""}\`
══════════════════════════════════════════
    ✨ 𝐏 𝐎 𝐖 𝐄 𝐑 𝐄 𝐃   𝐁 𝐘   𝐓 𝐀 𝐇 𝐀   𝐊 𝐇 𝐀 𝐍 ✨`;

      return message.reply(detailMsg);
    }

    // 2. Full Categorized Ultra-Stylish Menu Mode
    const categories = {};
    commands.forEach((cmd) => {
      const cat = cmd.config.category ? cmd.config.category.toUpperCase() : "GENERAL";
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(cmd.config.name);
    });

    let categoryBlocks = "";

    Object.keys(categories).forEach((cat) => {
      categoryBlocks += 
`╭─────────────〔 📁 ${cat} 〕─────────────╮
│
│  ✦ ${categories[cat].map(c => `\`${c}\``).join(" • ")}
│
╰──────────────────────────────────────────╯\n\n`;
    });

    const ultraMenuMsg = 
`╔════════════════════════════════════════╗
      👑 𝐓 𝐀 𝐇 𝐀   𝐁 𝐎 𝐓   𝐌 𝐄 𝐍 𝐔 👑
╚════════════════════════════════════════╝
 🤖 𝐁𝐎𝐓 𝐍𝐀𝐌𝐄 : TAHA BOT
 👑 𝐎𝐖𝐍𝐄𝐑    : TAHA KHAN
 ⚡ 𝐏𝐑𝐄𝐅𝐈𝐗    : [ ${prefix} ]
 📊 𝐂𝐎𝐌𝐌𝐀𝐍𝐃𝐒 : ${commands.size} Active Modules
══════════════════════════════════════════

${categoryBlocks}══════════════════════════════════════════
💡 𝐓𝐈𝐏: Command details dekhne ke liye:
👉 \`${prefix}help <command_name>\` (Example: \`${prefix}help vsong\`)

    ✨ 𝐏 𝐎 𝐖 𝐄 𝐑 𝐄 𝐃   𝐁 𝐘   𝐓 𝐀 𝐇 𝐀   𝐊 𝐇 𝐀 𝐍 ✨`;

    return message.reply(ultraMenuMsg);
  }
};
