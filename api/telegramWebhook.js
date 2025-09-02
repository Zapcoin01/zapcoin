export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Only POST allowed");
  }

  const body = req.body;
  const telegramToken = process.env.TELEGRAM_BOT_TOKEN; // 🔑 use env var
  const telegramUrl = `https://api.telegram.org/bot${telegramToken}/sendMessage`;

  if (body.message && body.message.chat) {
    const chatId = body.message.chat.id;
    const messageText = body.message.text || "";

    // Extract referral code
    let referralCode = null;
    if (messageText.startsWith("/start")) {
      const parts = messageText.split(" ");
      referralCode = parts.length > 1 ? parts[1] : null;
    }

    // Always show welcome flow (not only on "/start")
    const welcome = `🎉 Welcome to ZapCoin Mining Bot ⚡\n\nGet ready to earn $ZAP coins effortlessly!\n\n🚀 Invite friends, play, and collect rewards. The more you engage, the more $ZAP you earn!`;

    const payload = {
      chat_id: chatId,
      text: welcome,
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "⚡ Open ZapCoin App",
              web_app: {
                url: `https://zapcoin-murex.vercel.app?start=${referralCode || ""}`
              }
            }
          ],
          [
            { text: "💬 Join Community", url: "https://t.me/moopanda1m" }
          ],
          [
            { text: "🐦 Follow Twitter", url: "https://x.com/FlipgameTon" }
          ]
        ]
      }
    };

    await fetch(telegramUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    return res.status(200).send("Welcome sent");
  }

  return res.status(200).send("No action taken");
}
