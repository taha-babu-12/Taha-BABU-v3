const fs = require('fs-extra');
const path = require('path');

const sleep = ms => new Promise(r => setTimeout(r, ms));

if (!global.activeConvos) {
  global.activeConvos = new Map();
}

module.exports = {
  config: {
    name: "convo",
    aliases: ["convolution"],
    version: "2.6",
    author: "TAHA KHAN",
    role: 1, // Group Admin or Bot Admin
    countDown: 5,
    description: "Premium multi-step convolution with Group Lockdown setup",
    category: "tools",
    guide: {
      en: "{pn} on | {pn} off"
    }
  },

  onStart: async function ({ api, event, message, role }) {
    const { threadID, senderID, body } = event;
    const args = body.split(/\s+/);
    const action = args[1]?.toLowerCase();

    // Permission Check
    if (role < 1) {
      return message.reply(
        `╭─── « 🚫 ACCESS DENIED » ───⟡\n` +
        `│\n` +
        `│ ❌ Ye command sirf:\n` +
        `│    • Bot Admin\n` +
        `│    • Group Admin\n` +
        `│    use kr sakty hain.\n` +
        `│\n` +
        `╰───────────────⟡`
      );
    }

    // Action: OFF
    if (action === "off") {
      const activeList = [];
      global.activeConvos.forEach((val, key) => {
        activeList.push({ targetTID: key, ...val });
      });

      if (activeList.length === 0) {
        return message.reply(
          `╭─── « 🛑 CONVO OFF » ───⟡\n` +
          `│\n` +
          `│ ℹ️ Abhi koi active convo\n` +
          `│    nahi chal rahi.\n` +
          `│\n` +
          `╰───────────────⟡`
        );
      }

      let listMsg = `╭─── « 🛑 ACTIVE CONVOS » ───⟡\n│\n`;
      activeList.forEach((item, index) => {
        listMsg += `│ 【${index + 1}】 ${item.targetName || 'Unknown'}\n`;
        listMsg += `│     🆔 ${item.targetTID}\n│\n`;
      });
      listMsg += `│ 👉 Number reply kro jis ki\n│    convo band karni hy.\n╰───────────────⟡`;

      return message.reply(listMsg, (err, info) => {
        if (!err && info) {
          global.GoatBot.onReply.set(info.messageID, {
            commandName: "convo",
            author: senderID,
            step: "OFF_LIST",
            activeList
          });
        }
      });
    }

    // Action: ON
    if (action === "on") {
      const sent = await message.reply(
        `╭─── « 🚀 CONVO SETUP » ───⟡\n│\n│ ⌛ ▱▱▱▱▱▱▱▱▱▱ Initializing...\n│\n╰───────────────⟡`
      );
      await sleep(700);

      const setupMsg = 
`╭─── « 🚀 CONVO SETUP » ───⟡\n│\n│ ✅ ▰▰▰▰▰▰▰▰▰▰ Ready!\n│\n│ 𝐒𝐭𝐞𝐩 𝟏/𝟕 — Haters Name\n│\n│ 👉 Apna Name likho jo har\n│    message ke start mein\n│    lage ga.\n│\n│ (Ya "skip" type kro)\n╰───────────────⟡`;

      await api.editMessage(setupMsg, sent.messageID);

      global.GoatBot.onReply.set(sent.messageID, {
        commandName: "convo",
        author: senderID,
        step: 1,
        convoData: {}
      });
      return;
    }

    return message.reply(
      `╭─── « 💡 CONVO USAGE » ───⟡\n│\n│ *convo on   — Setup shuru kro\n│ *convo off  — Active convos band kro\n│\n╰───────────────⟡`
    );
  },

  onReply: async function ({ api, event, message, Reply }) {
    const { body, senderID } = event;
    if (Reply.author && senderID !== Reply.author) return;

    let { step, convoData = {}, activeList, files } = Reply;

    // Handle OFF Selection
    if (step === "OFF_LIST") {
      const index = parseInt(body) - 1;
      if (isNaN(index) || !activeList[index]) {
        return message.reply("❌ Invalid selection! Sahi number choose kro.");
      }
      const item = activeList[index];

      const sent = await message.reply(
        `╭─── « 🛑 STOPPING CONVO » ───⟡\n│\n│ ⌛ ▱▱▱▱▱▱▱▱▱▱ Processing...\n╰───────────────⟡`
      );
      await sleep(800);

      if (item.timeout) clearTimeout(item.timeout);
      global.activeConvos.delete(item.targetTID);

      const doneMsg = 
`╭─── « ✅ CONVO STOPPED » ───⟡\n│\n│ ✅ ▰▰▰▰▰▰▰▰▰▰ Done!\n│\n│ 🏷️ Group  : ${item.targetName || 'Unknown'}\n│ 🆔 TID    : ${item.targetTID}\n│ 🛑 Status : STOPPED\n│\n╰───────────────⟡`;

      return api.editMessage(doneMsg, sent.messageID);
    }

    // Step-by-Step Interactive Workflow
    switch (step) {
      case 1: {
        convoData.hatersName = body.toLowerCase() === "skip" ? "" : body;

        const convoPath = path.join(__dirname, "CONVO");
        let availableFiles = [];
        try {
          if (fs.existsSync(convoPath)) {
            availableFiles = fs.readdirSync(convoPath).filter(f => f.endsWith(".txt"));
          }
        } catch (e) {}

        let fileListMsg = `╭─── « 📂 STEP 2/7 — FILE » ───⟡\n│\n`;
        if (availableFiles.length > 0) {
          availableFiles.forEach((file, index) => {
            fileListMsg += `│ 【${index + 1}】 ${file.replace('.txt', '')}\n`;
          });
        } else {
          fileListMsg += `│ ⚠️ CONVO folder mein koi\n│    .txt file nahi mili!\n`;
        }
        fileListMsg += `│\n│ 👉 Number choose kro\n│    Ya "manual" likho khud\n│    messages dene ke liye.\n╰───────────────⟡`;

        return message.reply(fileListMsg, (err, info) => {
          if (!err && info) {
            global.GoatBot.onReply.set(info.messageID, {
              commandName: "convo",
              author: senderID,
              step: 2,
              convoData,
              files: availableFiles
            });
          }
        });
      }

      case 2: {
        if (body.toLowerCase() === "manual") {
          convoData.mode = "manual";
          const infoManual = await message.reply(
            `╭─── « ✏️ MANUAL MESSAGES » ───⟡\n│\n│ 👉 Apne messages yahan paste\n│    kro (ek message per line).\n│\n╰───────────────⟡`
          );
          global.GoatBot.onReply.set(infoManual.messageID, {
            commandName: "convo",
            author: senderID,
            step: 2.1,
            convoData
          });
        } else {
          const fileIndex = parseInt(body) - 1;
          if (isNaN(fileIndex) || !files || !files[fileIndex]) {
            return message.reply("❌ Invalid selection! Sahi number do ya 'manual' likho.");
          }
          convoData.mode = "file";
          convoData.fileName = files[fileIndex];
          const infoTid = await message.reply(
            `╭─── « 🆔 STEP 3/7 — TARGET » ───⟡\n│\n│ 👉 Jis group mein messages\n│    bhejna hai uski TID paste kro.\n│\n╰───────────────⟡`
          );
          global.GoatBot.onReply.set(infoTid.messageID, {
            commandName: "convo",
            author: senderID,
            step: 3,
            convoData
          });
        }
        break;
      }

      case 2.1: {
        convoData.messages = body.split("\n").filter(m => m.trim() !== "");
        if (convoData.messages.length === 0) return message.reply("❌ Kam se kam ek message to do!");
        const infoTidM = await message.reply(
          `╭─── « 🆔 STEP 3/7 — TARGET » ───⟡\n│\n│ ✅ ${convoData.messages.length} messages saved!\n│\n│ 👉 Target group ki TID paste kro.\n│\n╰───────────────⟡`
        );
        global.GoatBot.onReply.set(infoTidM.messageID, {
          commandName: "convo",
          author: senderID,
          step: 3,
          convoData
        });
        break;
      }

      case 3: {
        convoData.targetTID = body.trim();
        const infoSpeed = await message.reply(
          `╭─── « ⏱️ STEP 4/7 — SPEED » ───⟡\n│\n│ 🔹 Min : 10 seconds\n│ 🔹 Max : 100 seconds\n│\n│ 👉 Sirf number likho (e.g. 15)\n│\n╰───────────────⟡`
        );
        global.GoatBot.onReply.set(infoSpeed.messageID, {
          commandName: "convo",
          author: senderID,
          step: 4,
          convoData
        });
        break;
      }

      case 4: {
        const speed = parseInt(body);
        if (isNaN(speed) || speed < 10 || speed > 100) {
          return message.reply("❌ Invalid Speed! 10 se 100 ke darmiyan number do.");
        }
        convoData.speed = speed;
        const infoGN = await message.reply(
          `╭─── « 🏷️ STEP 5/7 — GROUP NAME » ───⟡\n│\n│ 👉 Target group ka naya naam\n│    likho ya "skip" type kro.\n│\n╰───────────────⟡`
        );
        global.GoatBot.onReply.set(infoGN.messageID, {
          commandName: "convo",
          author: senderID,
          step: 5,
          convoData
        });
        break;
      }

      case 5: {
        convoData.groupName = body.toLowerCase() === "skip" ? null : body;
        const infoNick = await message.reply(
          `╭─── « 👤 STEP 6/7 — NICKNAME » ───⟡\n│\n│ 👉 Members ka nickname set\n│    karna chahte ho?\n│    Naam likho ya "skip" kro.\n│\n╰───────────────⟡`
        );
        global.GoatBot.onReply.set(infoNick.messageID, {
          commandName: "convo",
          author: senderID,
          step: 6,
          convoData
        });
        break;
      }

      case 6: {
        convoData.nickname = body.toLowerCase() === "skip" ? null : body;
        const infoMentions = await message.reply(
          `╭─── « 👥 STEP 7/7 — MENTIONS » ───⟡\n│\n│ 👉 UIDs space de kar likho\n│    ya kisi ko @tag kro.\n│\n│    Ya "skip" type kro.\n│\n╰───────────────⟡`
        );
        global.GoatBot.onReply.set(infoMentions.messageID, {
          commandName: "convo",
          author: senderID,
          step: 7,
          convoData
        });
        break;
      }

      case 7: {
        if (body.toLowerCase() === "skip") {
          convoData.mentions = [];
        } else {
          const uids = new Set();
          if (event.mentions && Object.keys(event.mentions).length > 0) {
            Object.keys(event.mentions).forEach(id => uids.add(id));
          }
          body.split(/\s+/).forEach(id => {
            if (/^\d{10,20}$/.test(id)) uids.add(id);
          });
          convoData.mentions = Array.from(uids);
          if (convoData.mentions.length === 0 && body.toLowerCase() !== "skip") {
            return message.reply("⚠️ Mentions ke liye kisi ko @Tag kro ya UID likho.\n\n👉 Ya 'skip' type kro.");
          }
        }

        const summary =
          `╭─── « ✅ CONVO SUMMARY » ───⟡\n│\n` +
          `│ 👑 Haters Name : ${convoData.hatersName || "Default"}\n` +
          `│ 📂 Source      : ${convoData.mode === "file" ? convoData.fileName : "Manual Input"}\n` +
          `│ 🆔 Target TID  : ${convoData.targetTID}\n` +
          `│ ⏱️ Interval    : ${convoData.speed}s\n` +
          `│ 🏷️ New Title   : ${convoData.groupName || "No Change"}\n` +
          `│ 👤 Nickname    : ${convoData.nickname || "No Change"}\n` +
          `│ 👥 Mentions    : ${convoData.mentions.length > 0 ? convoData.mentions.length + " Users" : "Disabled"}\n` +
          `│\n│ 🚀 "confirm" type kro start ke liye!\n╰───────────────⟡`;

        const infoConfirm = await message.reply(summary);
        global.GoatBot.onReply.set(infoConfirm.messageID, {
          commandName: "convo",
          author: senderID,
          step: 8,
          convoData
        });
        break;
      }

      case 8: {
        if (body.toLowerCase() !== "confirm") {
          return message.reply("❌ Convo Setup Cancelled.");
        }

        const sent = await message.reply(
          `╭─── « 🚀 STARTING CONVO » ───⟡\n│\n│ ⌛ ▱▱▱▱▱▱▱▱▱▱ 0%\n│    Connecting to target...\n╰───────────────⟡`
        );
        await sleep(800);
        await api.editMessage(
          `╭─── « 🚀 STARTING CONVO » ───⟡\n│\n│ 🔄 ▰▰▰▰▰▱▱▱▱▱ 50%\n│    Fetching group info...\n╰───────────────⟡`,
          sent.messageID
        );
        await sleep(800);
        await api.editMessage(
          `╭─── « 🚀 STARTING CONVO » ───⟡\n│\n│ ✅ ▰▰▰▰▰▰▰▰▰▰ 100%\n│    Convolution LAUNCHED! 🔥\n╰───────────────⟡`,
          sent.messageID
        );

        this.startConvolution(api, convoData, event.threadID);
        break;
      }
    }
  },

  startConvolution: async function (api, data, originThreadID) {
    const { targetTID, speed, hatersName, mentions, groupName, nickname, mode, fileName, messages: manualMsgs } = data;

    let messages = [];
    if (mode === "file") {
      try {
        const filePath = path.join(__dirname, "CONVO", fileName);
        if (!fs.existsSync(filePath)) throw new Error("File not found");
        const content = fs.readFileSync(filePath, "utf-8");
        messages = content.split("\n").filter(l => l.trim() !== "");
      } catch (e) {
        return api.sendMessage(
          `╭─── « ❌ FILE ERROR » ───⟡\n│\n│ ${e.message}\n│\n╰───────────────⟡`,
          originThreadID
        );
      }
    } else {
      messages = manualMsgs;
    }

    if (!messages || messages.length === 0) {
      return api.sendMessage(
        `╭─── « ❌ ERROR » ───⟡\n│\n│ Koi message nahi mila send\n│ karne ke liye.\n│\n╰───────────────⟡`,
        originThreadID
      );
    }

    let targetName = "Unknown Group";
    let mentionUserNames = {};

    try {
      const info = await api.getThreadInfo(targetTID).catch(() => ({}));
      targetName = info.threadName || info.name || "Unnamed Group";

      if (mentions.length > 0) {
        for (const uid of mentions) {
          let name = "User";
          try {
            const user = await api.getUserInfo(uid);
            name = user[uid]?.name || "User";
          } catch {}
          mentionUserNames[uid] = name;
        }
      }
    } catch {}

    if (global.activeConvos.has(targetTID)) {
      const old = global.activeConvos.get(targetTID);
      if (old.timeout) clearTimeout(old.timeout);
    }

    if (groupName) {
      api.setTitle(groupName, targetTID, (err) => {
        if (err) console.log("Convo Rename Fail:", err.message);
      });
      targetName = groupName;
    }

    if (nickname) {
      api.getThreadInfo(targetTID, (err, info) => {
        if (!err && info.participantIDs) {
          info.participantIDs.forEach(uid => {
            api.changeNickname(nickname, targetTID, uid, () => {});
          });
        }
      });
    }

    let index = 0;
    const executeCycle = async () => {
      if (!global.activeConvos.has(targetTID)) return;
      if (index >= messages.length) index = 0;

      let msgBody = "";
      if (hatersName) msgBody += `${hatersName} `;

      let mentionData = [];
      let currentOffset = msgBody.length;

      if (mentions.length > 0) {
        mentions.forEach((uid) => {
          const name = mentionUserNames[uid] || "User";
          const tag = `@${name}`;
          msgBody += `${tag} `;
          mentionData.push({ id: uid, tag, fromIndex: currentOffset });
          currentOffset += tag.length + 1;
        });
      }

      msgBody += messages[index];

      api.sendMessage({ body: msgBody, mentions: mentionData }, targetTID, (err) => {
        if (err) console.log("Convo Msg Error:", err.message);
      });

      index++;
      const timeout = setTimeout(executeCycle, speed * 1000);
      global.activeConvos.set(targetTID, { timeout, originThreadID, targetName, lockedName: groupName });
    };

    global.activeConvos.set(targetTID, { originThreadID, targetName, lockedName: groupName });
    executeCycle();
  }
};
