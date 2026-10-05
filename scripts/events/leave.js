const axios = require("axios");

module.exports = {
  config: {
    name: "leave",
    version: "1.0",
    author: "YeasiN",
    category: "events"
  },

  onStart: async ({ threadsData, message, event, api, usersData }) => {

    if (event.logMessageType !== "log:unsubscribe") return;

    const { threadID } = event;
    const threadData = await threadsData.get(threadID);
    if (!threadData?.settings?.sendLeaveMessage) return;

    const { leftParticipantFbId } = event.logMessageData;


    if (leftParticipantFbId == api.getCurrentUserID()) return;

    const userName = await usersData.getName(leftParticipantFbId);


    const isSelfLeave = leftParticipantFbId == event.author;
    if (!isSelfLeave) return;

    const text = `👉 ${userName} CHLA GYA BEKARI INSAN😅`;


    const gifUrl = "https://i.postimg.cc/DZLhjf5r/VID-20250826-WA0002.gif";

    let gifStream = null;
    try {
      const response = await axios.get(gifUrl, { responseType: "stream" });
      gifStream = response.data;
    } catch (e) {
      console.error("GIF download error:", e.message);
    }

    const form = {
      body: text,
      mentions: [{ tag: userName, id: leftParticipantFbId }],
      attachment: gifStream || undefined
    };

    await message.send(form);

    if (!gifStream) {
      await message.send("⚠ GIF FAILED TO LOAD ⚠");
    }
  }
};
