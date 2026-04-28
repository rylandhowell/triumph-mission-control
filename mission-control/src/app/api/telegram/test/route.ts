import { NextResponse } from "next/server";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

// Read token/chatId from .env.local or from request body for testing
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const token = body.token || process.env.TELEGRAM_BOT_TOKEN;
    const chatId = body.chatId || process.env.TELEGRAM_CHAT_ID;

    if (!token) {
      return NextResponse.json({ ok: false, error: "Bot token is required" }, { status: 400 });
    }

    if (!chatId) {
      // Try to get chatId from getUpdates
      const updatesUrl = `https://api.telegram.org/bot${token}/getUpdates`;
      const updatesRes = await fetch(updatesUrl);
      const updatesData = await updatesRes.json();

      if (updatesData.ok && updatesData.result?.length > 0) {
        const lastUpdate = updatesData.result[updatesData.result.length - 1];
        const detectedChatId =
          lastUpdate.message?.chat?.id || lastUpdate.my_chat_member?.chat?.id;

        if (detectedChatId) {
          return NextResponse.json({
            ok: true,
            step: "detected_chat_id",
            chatId: String(detectedChatId),
            message: `Found chat ID: ${detectedChatId}. Save this and send a test message.`,
          });
        }
      }

      return NextResponse.json({
        ok: false,
        error: "No chat ID provided and couldn't detect one. Send a message to your bot first, then try again.",
      }, { status: 400 });
    }

    // Send test message
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: "🏗️ <b>Triumph Homes - Mission Control</b>\n\nTelegram integration is working! You'll receive build updates here.",
        parse_mode: "HTML",
      }),
    });
    const data = await res.json();

    if (data.ok) {
      // Save to .env.local
      const envPath = join(process.cwd(), ".env.local");
      try {
        const content = `# Telegram Bot Configuration\nTELEGRAM_BOT_TOKEN=${token}\nTELEGRAM_CHAT_ID=${chatId}\n`;
        writeFileSync(envPath, content);
      } catch {
        // non-fatal if we can't write
      }

      return NextResponse.json({
        ok: true,
        step: "test_sent",
        message: "Test message sent! Check your Telegram.",
      });
    } else {
      return NextResponse.json({
        ok: false,
        error: data.description || "Failed to send test message",
      }, { status: 400 });
    }
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
