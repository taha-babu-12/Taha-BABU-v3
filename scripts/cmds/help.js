Cmd install help.js module.exports = {
  config: {
    name: "help",
    version: "4.0",
    author: "TAHA KHAN",
    role: 0,
    description: "Bot ke saare commands ki list aur stylish menu dekhein",
    category: "menu",
    guide: {
      en: "{pn} [command_name]"
    }
  },

  onStart: async function ({ message, args, prefix }) {
    const { commands } = global.GoatBot;
    const inputCmd = args[0] ? args[0].toLowerCase() : null;

    // 1. Single Command Detail Mode (*help <command_name>)
    if (inputCmd) {
      const command = commands.get(inputCmd);

      if (!command) {
        return message.reply(`❌ **"${inputCmd}"** naam ka koi command nahi mila! Sahi command name likhein.`);
      }

      const { config } = command;
      const roleText = config.role === 0 ? "All Users" : config.role === 1 ? "Group Admin" : "Bot Admin / Owner";

      const detailMsg = 
`╔═══════════════════════╗
   📌 **COMMAND DETAILS**
╚═══════════════════════╝
┃
┣ 🏷️ ┗➤ 𝐍𝐀𝐌𝐄: ${config.name}
┣ 📝 ┗➤ 𝐃𝐄𝐒𝐂: ${config.description || "No description"}
┣ 📁 ┗➤ 𝐂𝐀𝐓𝐄𝐆𝐎𝐑𝐘: ${config.category || "menu"}
┣ 👤 ┗➤ 𝐑𝐎𝐋𝐄: ${roleText} (${config.role})
┣ 👑 ┗➤ 𝐀𝐔𝐓𝐇𝐎𝐑: ${config.author || "TAHA KHAN"}
┣ ⚡┗➤ 𝐔𝐄𝐒𝐈𝐍𝐆 ${prefix}${config.name} ${config.guide?.en ? config.guide.en.replace("{pn}", "") : ""}
┃
╚═══════════════════════╝
✨ 𝐏𝐎𝐖𝐄𝐑 𝐁𝐘 𝐓𝐀𝐇𝐀 𝐊𝐇𝐀𝐍 ✨`;

      return message.reply(detailMsg);
    }

    // 2. Full Menu Mode (Stylish Text Design)
    const categories = {};

    commands.forEach((cmd) => {
      const category = cmd.config.category || "menu";
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(cmd.config.name);
    });

    let menuMsg = 
`╔══════════════════════════╗
     💎 𝐓𝐀𝐇𝐀 𝐊𝐇𝐀𝐍 𝐁𝐎𝐓 𝐌𝐄𝐍𝐔💎
╚══════════════════════════╝
┃
┣ 🤖 ┗➤ 𝐁𝐎𝐓 𝐍𝐀𝐌𝐄: 𝐓𝐀𝐇𝐀 𝐁𝐎𝐓
┣ 👑 ┗➤ 𝐎𝐖𝐍𝐄𝐑: 𝐓𝐀𝐇𝐀 𝐊𝐇𝐀𝐍
┣ ⚡ ┗➤ 𝐏𝐑𝐄𝐅𝐈𝐗: [ ${prefix} ]
┣ 📊 ┗➤ 𝐓𝐎𝐓𝐀𝐋 𝐂𝐀𝐌𝐌𝐀𝐍𝐃𝐒 ${commands.size}
┃
╠══════════════════════════╝\n`;

    for (const [cat, cmdList] of Object.entries(categories)) {
      menuMsg += `\n📁┗➤${cat.toUpperCase()}❥♡\n`;
      menuMsg += `┗➤ ${cmdList.join(" • ")}\n`;
    }

    menuMsg += 
`\n════════════════════════════
💡 **Tip:** Kisi specific command ki detail dekhne ke liye type karein:
👉 \`${prefix}help <command_name>\`

✨ *𝐏𝐎𝐖𝐄𝐑𝐄𝐃 𝐁𝐘 𝐓𝐀𝐇𝐀 𝐊𝐇𝐀𝐍* ✨`;

    return message.reply(menuMsg);
  }
};
