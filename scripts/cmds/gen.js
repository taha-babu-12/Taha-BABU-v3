const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs-extra");
const os = require("os");
const path = require("path");

const API_BASE = "https://xrahat-gen.vercel.app";
const GENERATE_ENDPOINT = `${API_BASE}/api/generate`;

module.exports = {
  config: {
    name: "gen",
    version: "1.0.0",
    author: "TAHA KHAN",
    countDown: 10,
    role: 0,

    shortDescription: {
      en: "AI video generator from image",
      ur: "Pic se AI video banane wala command"
    },

    longDescription: {
      en: "Reply to an image and generate an AI video using a prompt",
      ur: "Kisi pic par reply karke prompt likhein aur AI video banayein"
    },

    category: "AI",

    guide: {
      en: "{pn} <prompt>\nReply to an image before using the command.",
      ur: "{pn} <prompt>\nCommand use karne se pehle pic par reply karein."
    }
  },

  onStart: async function ({ api, event, args }) {
    const {
      threadID,
      messageID,
      messageReply
    } = event;

    // =========================
    // Check replied message
    // =========================

    if (
      !messageReply ||
      !Array.isArray(messageReply.attachments) ||
      messageReply.attachments.length === 0
    ) {
      return api.sendMessage(
        "⚠️ Kisi pic par reply karke command dein.\n\n" +
        "Example:\n" +
        "!gen dancing in a neon city",
        threadID,
        messageID
      );
    }

    // =========================
    // Find image attachment
    // =========================

    const attachment = messageReply.attachments.find(
      (a) =>
        a.type === "photo" ||
        a.type === "image" ||
        a.type === "sticker" ||
        a.type === "animated_image"
    );

    if (
      !attachment ||
      !(
        attachment.url ||
        attachment.previewUrl ||
        attachment.largePreviewUrl
      )
    ) {
      return api.sendMessage(
        "⚠️ Reply ki gayi message me koi valid image nahi mili.",
        threadID,
        messageID
      );
    }

    // =========================
    // Get prompt
    // =========================

    const prompt = (args || [])
      .join(" ")
      .trim();

    if (!prompt) {
      return api.sendMessage(
        "⚠️ Saath me prompt bhi likhein.\n\n" +
        "Example:\n" +
        "!gen dancing in a neon city",
        threadID,
        messageID
      );
    }

    const imageUrl =
      attachment.url ||
      attachment.previewUrl ||
      attachment.largePreviewUrl;

    let waitMessageID = null;
    let tempFilePath = null;

    try {
      // =========================
      // Wait message
      // =========================

      waitMessageID = await new Promise((resolve) => {
        api.sendMessage(
          "⏳ Thoda sabar karein, video ban rahi hai...",
          threadID,
          (err, info) => {
            resolve(
              info ? info.messageID : null
            );
          },
          messageID
        );
      });

      // =========================
      // Download image
      // =========================

      const imageResponse = await axios.get(
        imageUrl,
        {
          responseType: "arraybuffer",
          timeout: 670000
        }
      );

      const imageBuffer = Buffer.from(
        imageResponse.data
      );

      // =========================
      // Create FormData
      // =========================

      const form = new FormData();

      form.append(
        "image",
        imageBuffer,
        {
          filename: "input.jpg",
          contentType: "image/jpeg"
        }
      );

      form.append("prompt", prompt);
      form.append("mode", "image");

      // =========================
      // Generate video
      // =========================

      const genResponse = await axios.post(
        GENERATE_ENDPOINT,
        form,
        {
          headers: {
            ...form.getHeaders()
          },

          maxBodyLength: Infinity,
          maxContentLength: Infinity,

          timeout: 2780000,

          responseType: "arraybuffer",

          validateStatus: () => true
        }
      );

      const contentType =
        genResponse.headers[
          "content-type"
        ] || "";

      // =========================
      // API JSON error
      // =========================

      if (
        contentType.includes(
          "application/json"
        )
      ) {
        let errorJson = null;

        try {
          errorJson = JSON.parse(
            Buffer.from(
              genResponse.data
            ).toString("utf-8")
          );
        } catch (_) {}

        throw new Error(
          (errorJson &&
            (
              errorJson.Result ||
              errorJson.error ||
              errorJson.message
            )) ||
            "Generation failed"
        );
      }

      // =========================
      // Validate video response
      // =========================

      if (
        genResponse.status < 200 ||
        genResponse.status >= 300
      ) {
        throw new Error(
          `API returned status ${genResponse.status}`
        );
      }

      if (
        !contentType.startsWith("video/")
      ) {
        throw new Error(
          "Unexpected response from generate API"
        );
      }

      // =========================
      // Get extension
      // =========================

      const ext =
        (
          contentType
            .split("/")[1] ||
          "mp4"
        )
          .split(";")[0]
          .trim();

      // =========================
      // Save video temporarily
      // =========================

      const videoBuffer = Buffer.from(
        genResponse.data
      );

      tempFilePath = path.join(
        os.tmpdir(),
        `gen_${Date.now()}_${Math.floor(
          Math.random() * 1000000
        )}.${ext}`
      );

      await fs.writeFile(
        tempFilePath,
        videoBuffer
      );

      // =========================
      // Send video
      // =========================

      await new Promise(
        (resolve, reject) => {
          api.sendMessage(
            {
              body:
                "✅ Aapki video taiyar ho gayi hai!\n\n" +
                `📝 Prompt: ${prompt}`,

              attachment:
                fs.createReadStream(
                  tempFilePath
                )
            },

            threadID,

            (err) => {
              if (err) {
                reject(err);
              } else {
                resolve();
              }
            },

            messageID
          );
        }
      );

      // =========================
      // Remove wait message
      // =========================

      if (waitMessageID) {
        try {
          api.unsendMessage(
            waitMessageID
          );
        } catch (_) {}
      }

    } catch (error) {
      console.error(
        "[gen.js] error:",
        error?.response?.data ||
          error?.message ||
          error
      );

      // Remove wait message
      if (waitMessageID) {
        try {
          api.unsendMessage(
            waitMessageID
          );
        } catch (_) {}
      }

      return api.sendMessage(
        "❌ Video nahi ban saki.\n" +
        "Thodi der baad dobara try karein.",
        threadID,
        messageID
      );

    } finally {
      // =========================
      // Cleanup temporary file
      // =========================

      if (tempFilePath) {
        fs.unlink(
          tempFilePath,
          () => {}
        );
      }
    }
  }
};
