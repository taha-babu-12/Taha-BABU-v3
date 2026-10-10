const axios = require("axios");

module.exports = {
	config: {
		name: "anihot",
		version: "0.0.9",
		author: "TAHA KHAN",
		countDown: 5,
		role: 2, // 👈 2 means Only Bot Admin / Owner can use this command
		description: {
			en: "𝐆𝐞𝐭 𝐑𝐚𝐧𝐝𝐨𝐦 𝐀𝐧𝐢𝐦𝐞 𝐇𝐨𝐭 𝐈𝐦𝐚𝐠𝐞"
		},
		category: "18+",
		guide: {
			en: "{pn}"
		}
	},

	onStart: async function ({ message }) {
		try {
			const api = "https://azadx69x-all-apis-top.vercel.app/api/anihot";

			const res = await axios.get(api, {
				responseType: "stream"
			});

			return message.reply({
				body: "😋 𝐀𝐧𝐢𝐦𝐞 𝐇𝐨𝐭 𝐈𝐦𝐚𝐠𝐞",
				attachment: res.data
			});

		} catch (err) {  
			console.log(err);  
			return message.reply("❌ Error: API down hai ya image fetch nahi ho saki!");  
		}  
	}
};
