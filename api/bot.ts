import { GoogleGenerativeAI } from "@google/generative-ai";
import { Bot, webhookCallback  ,Keyboard , Context  } from "grammy";
import { FileFlavor, hydrateFiles } from "@grammyjs/files";
import fs from "fs"; 
import crypto from "crypto";
import path from "path";

const token = process.env.BOT_TOKEN;
if (!token) throw new Error("BOT_TOKEN is unset");
const genAI = new GoogleGenerativeAI("AIzaSyBsosV1Pj7Ok3s_roUXYzgdZD7Duj-Y47E");
const model = genAI.getGenerativeModel({ model: "gemini-pro"});
const bot = new Bot<MyContext>(token);
bot.api.config.use(hydrateFiles(bot.token));
console.log("Bot is up and running!");
type MyContext = FileFlavor<Context>;
const start_keyboard = [
    " 🌐 Languages",
    "📚 About",
    "📞 Contact",
  ];
const buttonRows = start_keyboard.map((start_keyboard) => [Keyboard.text(start_keyboard)]);
const keyboard = Keyboard.from(buttonRows).resized();
interface GenerativePart {
    inlineData: {
      data: string;
      mimeType: string;
    };
  }

  bot.command("start", async (ctx) => {
    const welcomeMessage = `🤖 Welcome to *Mali*, your personal AI Assistant powered by Google's *Gemini Pro*\\!\n\n` +
        `🚀I excel in coding and writing tasks\\.\n\n` +
        `🌐Explore *Supported Languages* for customization\\.\n\n` +
        `🔔 Check out our *channel* for updates\\. 🔍\n\n` +
        `🖼️ *Send me an image and ask anything*\\! I can provide insights based on images too\\.\n\n` + // Added instruction
        `Ready\\? Ask me anything\\!`;

    await ctx.reply(welcomeMessage, {
        // Assuming 'keyboard' is previously defined with relevant options
        reply_markup: keyboard,
        parse_mode: "MarkdownV2",
    });
});
bot.hears("📚 About", async (ctx) => {
    const aboutMessage = "🚧 *About Mali v1.1\\* 🚧\n\n" +
        "\\- 🤖 AI Assistant powered by Google's Gemini Pro API\\.\n" +
        "\\- 🎯 High accuracy in Q&A, coding, and creative writing\\.\n" +
        "\\- 🛠 Markdown support for code snippets\\.\n" +
        "\\- 📈 Capabilities: coding assistance, creative writing, and answering based on image context 🖼️\\.\n" + // Added capability with emoji
        "\\- 🔄 *No memory of past conversations* \\(WIP🚧\\)\\.\n" +
        "\\- 🗺 Explore *Supported Languages*\\.\n" +
        "\\- 🔜 More features in development\\.\n\n" +
        "🚀 Ready to assist\\! Ask anything\\!";

    await ctx.reply(aboutMessage, {
        parse_mode: "MarkdownV2",
    });
});
 
// languages
bot.hears("🌐 Languages", async (ctx) => {
    const languages = [
        "Arabic (ar)", "Bengali (bn)", "Bulgarian (bg)",
        "Chinese (zh) [Simplified and Traditional]", "Croatian (hr)", "Czech (cs)",
        "Danish (da)", "Dutch (nl)", "English (en)",
        "Estonian (et)", "Finnish (fi)", "French (fr)",
        "German (de)", "Greek (el)", "Hebrew (iw)",
        "Hindi (hi)", "Hungarian (hu)", "Indonesian (id)",
        "Italian (it)", "Japanese (ja)", "Korean (ko)",
        "Latvian (lv)", "Lithuanian (lt)", "Norwegian (no)",
        "Polish (pl)", "Portuguese (pt)", "Romanian (ro)",
        "Russian (ru)", "Serbian (sr)", "Slovak (sk)",
        "Slovenian (sl)", "Spanish (es)", "Swahili (sw)",
        "Swedish (sv)", "Thai (th)", "Turkish (tr)",
        "Ukrainian (uk)", "Vietnamese (vi)"
    ];

    const languagesMessage = `Gemini Pro supports the following languages:\n\n- ${languages.join("\n- ")}\n\nIf your language is not listed, please use the English language for the best results.❤️‍🔥`;

    await ctx.reply(languagesMessage);
});


bot.hears("📞 Contact", async (ctx) => {
    const contactMessage = `📞 *Contact* 📞\n\n📧 *Email*: \`mani@maniw\\.space\`\n💡 *For Collaborations or Suggestions*\\: Feel free to reach out to us via email\\.`;


    await ctx.reply(contactMessage, { parse_mode: "MarkdownV2" });
});
function escapeMarkdownV2Characters(text: string) {
    return text.replace(/[_\[\]()~>#+-=|{}.!]/g, (x: string) => '\\' + x);
}



bot.on('message:photo', async (ctx) => {
    const photo = ctx.message?.photo?.slice(-1)[0];
    if (!photo) return;
    const prompt = ctx.message?.caption || "Nothing provided, just say what you see";
    console.log(prompt);
    const file = await ctx.getFile();
    const fileName = crypto.randomBytes(16).toString('hex') + ".jpg";
    const filePath = path.join("/tmp", fileName);
    await file.download(filePath);
    console.log(filePath);
    const mimeType = "image/jpeg";
    const generativePart = fileToGenerativePart(filePath, mimeType);

    await ctx.replyWithChatAction('typing');
    let typing = true;
    const typingInterval = setInterval(() => {
        if (typing) ctx.replyWithChatAction('typing');
    }, 5000);

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });
        const result = await model.generateContent([prompt, generativePart]);
        const response = await result.response;
        const text = await response.text();
        typing = false;
        clearInterval(typingInterval);
        
        const escapedResponseText = escapeMarkdownV2Characters(text);
        await ctx.reply(escapedResponseText, { parse_mode: "MarkdownV2" });
    } catch (error) {
        // Stop typing action in case of error
        typing = false;
        clearInterval(typingInterval);
        console.error(error);
        await ctx.reply("Sorry, I encountered an error while processing your photo❌. Please try again.");
    }
});
function fileToGenerativePart(path: string, mimeType: string) {
    return {
        inlineData: {
            data: Buffer.from(fs.readFileSync(path)).toString("base64"),
            mimeType
        },
    };
}

let typingInterval: NodeJS.Timeout;
bot.on("message:text", async (ctx) => {
    if (
        ["📚 About", "📞 Contact", "🌐 Languages"].includes(ctx.message.text as string)
      ) {return; }
    try {
        const message = ctx.message.text;
        const prompt = message;

        await ctx.replyWithChatAction('typing');
        let typing = true;
        typingInterval = setInterval(() => {
            if (typing) ctx.replyWithChatAction('typing');
        }, 5000); 

        const result = await model.generateContent(prompt as string );
        const response = await result.response;
        const response_text = await response.text();

        typing = false;
        clearInterval(typingInterval);
        const escapedResponseText = escapeMarkdownV2Characters(response_text);

        await ctx.reply(escapedResponseText, { parse_mode: "MarkdownV2" });
    } catch (error) {
        // Stop typing action in case of error
        clearInterval(typingInterval);
        console.error(error);
        await ctx.reply("Sorry, I encountered an error while processing your request❌. Maybe your prompt is NSFW🔞 or not in a supported language🌐.");
    }
});
export default webhookCallback(bot, "http");