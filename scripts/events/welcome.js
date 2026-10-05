const { drive } = global.utils;
const { nickNameBot } = global.GoatBot.config;
const { createCanvas, loadImage } = require("canvas");
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

module.exports = {
  config: {
    name: "welcome",
    version: "9.0",
    author: "TAHA KHAN",
    category: "events"
  },

  langs: {
    en: {
      defaultWelcomeMessage: "𝗪𝗲𝗹𝗰𝗼𝗺𝗲 {userName} 🎉\n┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n✦ Glad to have you here! Enjoy your stay and make great memories 🌸",
      botAddedMessage:
        "━━━━━━━━━━━━━━━━━━━\n🤖 ᴛʜᴀɴᴋ ʏᴏᴜ ғᴏʀ ᴀᴅᴅɪɴɢ ᴍᴇ ᴛᴏ ᴛʜᴇ ɢʀᴏᴜᴘ! 💖\n\n⚙️ ʙᴏᴛ ᴘʀᴇꜰɪx : /\n📜 ᴛʏᴘᴇ /help ᴛᴏ sᴇᴇ ᴀʟʟ ᴄᴏᴍᴍᴀɴᴅs\n\n✨ ʟᴇᴛ's ᴍᴀᴋᴇ ᴛʜɪs ɢʀᴏᴜᴘ ᴇᴠᴇɴ ᴍᴏʀᴇ ꜰᴜɴ ᴛᴏɢᴇᴛʜᴇʀ! 😄\n━━━━━━━━━━━━━━━━━━━"
    }
  },

  onStart: async ({ threadsData, message, event, api, usersData, getLang }) => {
    if (event.logMessageType !== "log:subscribe") return;

    const { threadID } = event;
    const threadData = await threadsData.get(threadID);
    if (!threadData.settings.sendWelcomeMessage) return;

    const addedMembers = event.logMessageData.addedParticipants;
    const threadName   = threadData.threadName || "our group";
    const prefix       = global.utils.getPrefix(threadID);
    const inviterID    = event.author;

    for (const user of addedMembers) {
      const userID = user.userFbId;
      const botID  = api.getCurrentUserID();

      if (userID == botID) {
        if (nickNameBot) await api.changeNickname(nickNameBot, threadID, botID);
        return message.send(getLang("botAddedMessage", prefix));
      }

      const userName    = user.fullName;
      const inviterName = await usersData.getName(inviterID);
      const memberCount = event.participantIDs.length;

      let { welcomeMessage = getLang("defaultWelcomeMessage") } = threadData.data;
      welcomeMessage = welcomeMessage
        .replace(/\{userName\}/g,    userName)
        .replace(/\{userTag\}/g,     userName)
        .replace(/\{threadName\}/g,  threadName)
        .replace(/\{memberCount\}/g, memberCount)
        .replace(/\{inviterName\}/g, inviterName);

      let welcomeImagePath = null;
      try {
        welcomeImagePath = await createWelcomeCard({
          userName, threadName, memberCount,
          inviterName, newUserID: userID,
          inviterID, threadID, api
        });
      } catch (err) {
        console.error("Welcome image creation failed:", err);
      }

      const form = {
        body:     welcomeMessage,
        mentions: [{ tag: userName, id: userID }]
      };

      if (welcomeImagePath && fs.existsSync(welcomeImagePath)) {
        form.attachment = fs.createReadStream(welcomeImagePath);
      } else if (threadData.data.welcomeAttachment) {
        const attachments = threadData.data.welcomeAttachment
          .map(f => drive.getFile(f, "stream"));
        form.attachment = (await Promise.allSettled(attachments))
          .filter(({ status }) => status === "fulfilled")
          .map(({ value }) => value);
      }

      message.send(form);

      if (welcomeImagePath && fs.existsSync(welcomeImagePath)) {
        setTimeout(() => { try { fs.unlinkSync(welcomeImagePath); } catch (_) {} }, 5000);
      }
    }
  }
};

const ACCESS_TOKEN = "6628568379%7Cc1e620fa708a1d5696fb991c1bde5662";

async function downloadHighQualityProfile(userID) {
  try {
    const url = `https://graph.facebook.com/${userID}/picture?width=500&height=500&access_token=${ACCESS_TOKEN}`;
    const res = await axios({ method: 'GET', url, responseType: 'arraybuffer', timeout: 10000 });
    return Buffer.from(res.data, 'binary');
  } catch { return null; }
}

async function downloadImage(url) {
  try {
    const res = await axios({ method: 'GET', url, responseType: 'arraybuffer', timeout: 10000 });
    return Buffer.from(res.data, 'binary');
  } catch { return null; }
}

async function getGroupImage(threadID, api) {
  try {
    const info = await api.getThreadInfo(threadID);
    if (info.imageSrc) {
      const res = await axios({ method: 'GET', url: info.imageSrc, responseType: 'arraybuffer', timeout: 10000 });
      return Buffer.from(res.data, 'binary');
    }
  } catch {}
  return null;
}

function unicodeToPlain(str) {
  if (!str) return '';

  const ranges = [
    [0x1D400, 0x1D419, 'A'], [0x1D41A, 0x1D433, 'a'],
    [0x1D434, 0x1D44D, 'A'], [0x1D44E, 0x1D467, 'a'],
    [0x1D468, 0x1D481, 'A'], [0x1D482, 0x1D49B, 'a'],
    [0x1D5D4, 0x1D5ED, 'A'], [0x1D5EE, 0x1D607, 'a'],
    [0x1D63C, 0x1D655, 'A'], [0x1D656, 0x1D66F, 'a'],
    [0x1D7CE, 0x1D7D7, '0'],
    [0xFF21, 0xFF3A, 'A'], [0xFF41, 0xFF5A, 'a'],
    [0xFF10, 0xFF19, '0'],
    [0x24B6, 0x24CF, 'A'], [0x24D0, 0x24E9, 'a'],
  ];

  const singles = {
    0x1D49C: 'A', 0x212C: 'B', 0x2102: 'C', 0x2145: 'D',
    0x2130: 'E', 0x2131: 'F', 0x210A: 'g', 0x210B: 'H',
    0x2110: 'I', 0x2111: 'I', 0x2112: 'L', 0x2113: 'l',
    0x2115: 'N', 0x2118: 'P', 0x211A: 'Q', 0x211B: 'R',
    0x211C: 'R', 0x2124: 'Z', 0x2128: 'Z',
    0x2070: '0', 0x00B9: '1', 0x00B2: '2', 0x00B3: '3',
    0x2074: '4', 0x2075: '5', 0x2076: '6', 0x2077: '7',
    0x2078: '8', 0x2079: '9',
  };

  let result = '';
  for (const char of str) {
    const cp = char.codePointAt(0);

    if (singles[cp] !== undefined) {
      result += singles[cp];
      continue;
    }

    let mapped = false;
    for (const [start, end, base] of ranges) {
      if (cp >= start && cp <= end) {
        const baseCode = base.codePointAt(0);
        result += String.fromCodePoint(baseCode + (cp - start));
        mapped = true;
        break;
      }
    }

    if (!mapped) result += char;
  }
  return result;
}

function safeStr(str) {
  if (!str) return '';
  try { return Buffer.from(str, 'latin1').toString('utf8'); } catch { return str; }
}

function readableText(str) {
  return unicodeToPlain(safeStr(str));
}

function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawCircleAvatar(ctx, img, cx, cy, r) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(img, cx - r, cy - r, r * 2, r * 2);
  ctx.restore();
}

function fitText(ctx, text, maxPx, maxSize = 34, minSize = 14, bold = true) {
  let t = text;
  let size = maxSize;
  const w = bold ? 'bold' : '400';
  ctx.font = `${w} ${size}px "Segoe UI", Arial`;
  while (ctx.measureText(t).width > maxPx && size > minSize) {
    size--;
    ctx.font = `${w} ${size}px "Segoe UI", Arial`;
  }
  if (ctx.measureText(t).width > maxPx) {
    while (ctx.measureText(t + '…').width > maxPx && t.length > 1) t = t.slice(0, -1);
    t += '…';
  }
  return { text: t, size };
}

/* ========================================================================
   ULTRA-STYLISH CYBER GLASSMORPHISM WELCOME CARD GENERATOR
   ======================================================================== */
async function createWelcomeCard({
  userName, threadName, memberCount,
  inviterName, newUserID, inviterID, threadID, api
}) {
  const W = 1200, H = 630;
  const canvas = createCanvas(W, H);
  const ctx    = canvas.getContext('2d');

  async function loadProfile(uid) {
    const buf = await downloadHighQualityProfile(uid);
    if (buf) return loadImage(buf).catch(() => null);
    try {
      const info = await api.getUserInfo([uid]);
      const src  = info[uid]?.thumbSrc;
      if (src) { const b2 = await downloadImage(src); if (b2) return loadImage(b2).catch(() => null); }
    } catch {}
    return null;
  }

  const [newUserImg, inviterImg, groupImg] = await Promise.all([
    loadProfile(newUserID),
    loadProfile(inviterID),
    getGroupImage(threadID, api).then(b => b ? loadImage(b).catch(() => null) : null)
  ]);

  const safeUser    = readableText(userName);
  const safeInviter = readableText(inviterName);
  const safeGroup   = readableText(threadName);

  // 1. BASE BACKGROUND & NEON LIGHT ORBS
  ctx.fillStyle = '#060710';
  ctx.fillRect(0, 0, W, H);

  // Top-left Purple Ambient Orb
  let g1 = ctx.createRadialGradient(150, 100, 0, 150, 100, 450);
  g1.addColorStop(0, 'rgba(120, 40, 230, 0.35)');
  g1.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = g1;
  ctx.fillRect(0, 0, W, H);

  // Bottom-right Cyan Ambient Orb
  let g2 = ctx.createRadialGradient(1000, 500, 0, 1000, 500, 500);
  g2.addColorStop(0, 'rgba(0, 220, 255, 0.28)');
  g2.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = g2;
  ctx.fillRect(0, 0, W, H);

  // Center Pink Subtle Orb
  let g3 = ctx.createRadialGradient(600, 315, 0, 600, 315, 300);
  g3.addColorStop(0, 'rgba(255, 0, 120, 0.12)');
  g3.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = g3;
  ctx.fillRect(0, 0, W, H);

  // 2. CYBER GRID OVERLAY
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 40) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y < H; y += 40) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  // Floating Sparkles / Particles
  const rng = s => { let x = Math.sin(s) * 10000; return x - Math.floor(x); };
  for (let i = 0; i < 180; i++) {
    const px = rng(i * 1.7) * W;
    const py = rng(i * 3.3) * H;
    const pr = rng(i * 5.9) * 1.6 + 0.3;
    const alpha = rng(i * 9.1) * 0.7 + 0.15;
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.beginPath(); ctx.arc(px, py, pr, 0, Math.PI * 2); ctx.fill();
  }

  // Outer Border Box
  ctx.save();
  ctx.shadowColor = 'rgba(0, 200, 255, 0.4)';
  ctx.shadowBlur = 20;
  ctx.strokeStyle = 'rgba(0, 220, 255, 0.25)';
  ctx.lineWidth = 2;
  roundRect(ctx, 10, 10, W - 20, H - 20, 24);
  ctx.stroke();
  ctx.restore();

  // 3. LEFT HERO PANEL (NEW MEMBER GLASS CARD)
  const cardX = 35, cardY = 35, cardW = 420, cardH = 560;

  // Glass Panel Base
  ctx.save();
  ctx.fillStyle = 'rgba(18, 20, 36, 0.65)';
  roundRect(ctx, cardX, cardY, cardW, cardH, 20);
  ctx.fill();

  // Glass Stroke Border
  const cardG = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
  cardG.addColorStop(0, 'rgba(0, 220, 255, 0.5)');
  cardG.addColorStop(0.5, 'rgba(255, 0, 120, 0.2)');
  cardG.addColorStop(1, 'rgba(120, 40, 230, 0.5)');
  ctx.strokeStyle = cardG;
  ctx.lineWidth = 1.5;
  roundRect(ctx, cardX, cardY, cardW, cardH, 20);
  ctx.stroke();
  ctx.restore();

  // Left Section Content
  const leftCX = cardX + cardW / 2;
  const avatarY = cardY + 180;
  const avatarR = 110;

  // Welcome Pill Tag
  {
    const tagText = "★ NEW MEMBER ★";
    ctx.save();
    ctx.font = 'bold 13px "Segoe UI", Arial';
    ctx.textAlign = 'center';
    const tw = ctx.measureText(tagText).width + 30;
    const th = 30, tx = leftCX - tw / 2, ty = cardY + 30;

    ctx.fillStyle = 'rgba(0, 220, 255, 0.12)';
    roundRect(ctx, tx, ty, tw, th, 15); ctx.fill();

    ctx.strokeStyle = 'rgba(0, 220, 255, 0.6)';
    ctx.lineWidth = 1;
    roundRect(ctx, tx, ty, tw, th, 15); ctx.stroke();

    ctx.fillStyle = '#00f0ff';
    ctx.fillText(tagText, leftCX, ty + 19);
    ctx.restore();
  }

  // Multi-Ring Glowing Neon Avatar
  ctx.save();
  ctx.shadowColor = '#00f0ff'; ctx.shadowBlur = 35;
  ctx.strokeStyle = '#00f0ff'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(leftCX, avatarY, avatarR + 10, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.shadowColor = '#ff0078'; ctx.shadowBlur = 25;
  ctx.strokeStyle = '#ff0078'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.arc(leftCX, avatarY, avatarR + 18, -Math.PI * 0.4, Math.PI * 0.6); ctx.stroke();
  ctx.restore();

  // Avatar Image
  if (newUserImg) {
    drawCircleAvatar(ctx, newUserImg, leftCX, avatarY, avatarR);
  } else {
    ctx.fillStyle = '#101426';
    ctx.beginPath(); ctx.arc(leftCX, avatarY, avatarR, 0, Math.PI * 2); ctx.fill();
    ctx.save();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `bold ${Math.round(avatarR * 0.7)}px Arial`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillText('👤', leftCX, avatarY);
    ctx.restore();
  }

  // User Name Display
  {
    const maxW = cardW - 40;
    ctx.save();
    ctx.textAlign = 'center';
    const { text, size } = fitText(ctx, safeUser, maxW, 32, 16);
    ctx.font = `bold ${size}px "Segoe UI", Arial`;
    
    const textG = ctx.createLinearGradient(leftCX - maxW/2, 0, leftCX + maxW/2, 0);
    textG.addColorStop(0, '#ffffff');
    textG.addColorStop(1, '#d0e0ff');
    ctx.fillStyle = textG;
    ctx.shadowColor = 'rgba(0,0,0,0.9)'; ctx.shadowBlur = 12;
    ctx.fillText(text, leftCX, avatarY + avatarR + 45);
    ctx.restore();
  }

  // Member Count Badge
  {
    const bText = `✦  ${ordinal(memberCount)} Member  ✦`;
    ctx.save();
    ctx.font = 'bold 16px "Segoe UI", Arial';
    ctx.textAlign = 'center';
    const bw = ctx.measureText(bText).width + 36;
    const bh = 42, bx = leftCX - bw / 2, by = avatarY + avatarR + 80;

    const bg = ctx.createLinearGradient(bx, 0, bx + bw, 0);
    bg.addColorStop(0, 'rgba(255, 0, 120, 0.25)');
    bg.addColorStop(0.5, 'rgba(120, 40, 230, 0.35)');
    bg.addColorStop(1, 'rgba(0, 220, 255, 0.25)');
    ctx.fillStyle = bg;
    roundRect(ctx, bx, by, bw, bh, 12); ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'; ctx.lineWidth = 1;
    roundRect(ctx, bx, by, bw, bh, 12); ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 5;
    ctx.fillText(bText, leftCX, by + 26);
    ctx.restore();
  }

  // 4. RIGHT CONTENT SECTION
  const rightX = 490, rightW = W - rightX - 35;

  // Big Header "WELCOME TO"
  ctx.save();
  ctx.textAlign = 'left';
  ctx.font = 'bold 46px "Segoe UI", Arial';
  const headG = ctx.createLinearGradient(rightX, 0, rightX + rightW, 0);
  headG.addColorStop(0, '#00f0ff');
  headG.addColorStop(0.5, '#ffffff');
  headG.addColorStop(1, '#ff0078');
  ctx.fillStyle = headG;
  ctx.shadowColor = 'rgba(0, 240, 255, 0.4)'; ctx.shadowBlur = 15;
  ctx.fillText('WELCOME TO OUR', rightX, 95);
  ctx.restore();

  // Decorative Accent Line
  ctx.save();
  const lineG = ctx.createLinearGradient(rightX, 0, rightX + 220, 0);
  lineG.addColorStop(0, '#00f0ff');
  lineG.addColorStop(1, 'transparent');
  ctx.strokeStyle = lineG; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(rightX, 110); ctx.lineTo(rightX + 220, 110); ctx.stroke();
  ctx.restore();

  // GROUP CARD (Frosted Glass Panel)
  const groupY = 140, groupH = 120;
  ctx.save();
  ctx.fillStyle = 'rgba(20, 24, 45, 0.55)';
  roundRect(ctx, rightX, groupY, rightW, groupH, 16); ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)'; ctx.lineWidth = 1;
  roundRect(ctx, rightX, groupY, rightW, groupH, 16); ctx.stroke();
  ctx.restore();

  // Group Image & Name
  const gAvSize = 80, gAx = rightX + 20, gAy = groupY + (groupH - gAvSize) / 2;
  if (groupImg) {
    ctx.save();
    roundRect(ctx, gAx, gAy, gAvSize, gAvSize, 14); ctx.clip();
    ctx.drawImage(groupImg, gAx, gAy, gAvSize, gAvSize);
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 220, 255, 0.6)'; ctx.lineWidth = 2;
    roundRect(ctx, gAx, gAy, gAvSize, gAvSize, 14); ctx.stroke();
    ctx.restore();
  } else {
    ctx.fillStyle = '#12162d';
    roundRect(ctx, gAx, gAy, gAvSize, gAvSize, 14); ctx.fill();
    ctx.save();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = '38px Arial'; ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillText('🏠', gAx + gAvSize / 2, gAy + gAvSize / 2);
    ctx.restore();
  }

  {
    const gTx = gAx + gAvSize + 20;
    const gTw = rightW - gAvSize - 40;
    
    ctx.save();
    ctx.textAlign = 'left'; ctx.font = 'bold 12px "Segoe UI", Arial';
    ctx.fillStyle = 'rgba(0, 220, 255, 0.8)';
    ctx.fillText('COMMUNITY / GROUP', gTx, groupY + 35);
    ctx.restore();

    ctx.save();
    ctx.textAlign = 'left';
    const { text: gn, size: gs } = fitText(ctx, safeGroup, gTw, 28, 15);
    ctx.font = `bold ${gs}px "Segoe UI", Arial`;
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 8;
    ctx.fillText(gn, gTx, groupY + 75);
    ctx.restore();
  }

  // INVITER CARD (Frosted Glass Panel)
  const invY = 280, invH = 110;
  ctx.save();
  ctx.fillStyle = 'rgba(20, 24, 45, 0.55)';
  roundRect(ctx, rightX, invY, rightW, invH, 16); ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)'; ctx.lineWidth = 1;
  roundRect(ctx, rightX, invY, rightW, invH, 16); ctx.stroke();
  ctx.restore();

  // Inviter Avatar & Name
  const invAvR = 36;
  const invCX = rightX + 20 + invAvR;
  const invCY = invY + invH / 2;

  if (inviterImg) {
    ctx.save();
    ctx.shadowColor = '#ff0078'; ctx.shadowBlur = 15;
    ctx.strokeStyle = 'rgba(255, 0, 120, 0.8)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(invCX, invCY, invAvR + 3, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
    drawCircleAvatar(ctx, inviterImg, invCX, invCY, invAvR);
  } else {
    ctx.fillStyle = '#12162d';
    ctx.beginPath(); ctx.arc(invCX, invCY, invAvR, 0, Math.PI * 2); ctx.fill();
    ctx.save();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = '28px Arial'; ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillText('👤', invCX, invCY);
    ctx.restore();
  }

  {
    const iTx = invCX + invAvR + 20;
    const iTw = rightW - (iTx - rightX) - 20;

    ctx.save();
    ctx.textAlign = 'left'; ctx.font = 'bold 12px "Segoe UI", Arial';
    ctx.fillStyle = 'rgba(255, 0, 120, 0.85)';
    ctx.fillText('ADDED BY', iTx, invY + 38);
    ctx.restore();

    ctx.save();
    ctx.textAlign = 'left';
    const { text: iname, size: is } = fitText(ctx, safeInviter, iTw, 26, 14);
    ctx.font = `bold ${is}px "Segoe UI", Arial`;
    ctx.fillStyle = '#f0f0f8';
    ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 8;
    ctx.fillText(iname, iTx, invY + 72);
    ctx.restore();
  }

  // FOOTER BRANDING CARD ("POWERED BY TAHA KHAN")
  const footY = 415, footH = 80;
  ctx.save();
  const footG = ctx.createLinearGradient(rightX, footY, rightX + rightW, footY + footH);
  footG.addColorStop(0, 'rgba(120, 40, 230, 0.2)');
  footG.addColorStop(1, 'rgba(0, 220, 255, 0.1)');
  ctx.fillStyle = footG;
  roundRect(ctx, rightX, footY, rightW, footH, 16); ctx.fill();

  ctx.strokeStyle = 'rgba(120, 40, 230, 0.4)'; ctx.lineWidth = 1.5;
  roundRect(ctx, rightX, footY, rightW, footH, 16); ctx.stroke();
  ctx.restore();

  {
    const cx = rightX + rightW / 2;
    const cy = footY + footH / 2;

    ctx.save();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = 'bold 22px "Segoe UI", Arial';
    
    const pGrad = ctx.createLinearGradient(cx - 150, 0, cx + 150, 0);
    pGrad.addColorStop(0, '#00f0ff');
    pGrad.addColorStop(0.5, '#ffffff');
    pGrad.addColorStop(1, '#ff0078');
    ctx.fillStyle = pGrad;
    ctx.shadowColor = 'rgba(0, 240, 255, 0.6)'; ctx.shadowBlur = 12;
    ctx.fillText('✦ POWERED BY TAHA KHAN ✦', cx, cy);
    ctx.restore();
  }

  // Sub-footer subtle tagline
  ctx.save();
  ctx.textAlign = 'right'; ctx.font = 'italic 13px "Segoe UI", Arial';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.fillText('Enjoy your stay & make great memories ✨', W - 35, H - 25);
  ctx.restore();

  // Save Canvas Buffer
  const tempPath = path.join(__dirname, `temp_welcome_${Date.now()}.png`);
  await fs.writeFile(tempPath, canvas.toBuffer('image/png'));
  return tempPath;
}
