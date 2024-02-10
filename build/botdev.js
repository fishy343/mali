"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const generative_ai_1 = require("@google/generative-ai");
const grammy_1 = require("grammy");
const files_1 = require("@grammyjs/files");
const fs_1 = __importDefault(require("fs"));
const crypto_1 = __importDefault(require("crypto"));
const path_1 = __importDefault(require("path"));
const token = "6847272220:AAFtX0KbnUiq0XYm7tUfzVZvojRsnAgg79g";
const genAI = new generative_ai_1.GoogleGenerativeAI("AIzaSyBsosV1Pj7Ok3s_roUXYzgdZD7Duj-Y47E");
const model = genAI.getGenerativeModel({ model: "gemini-pro" });
const bot = new grammy_1.Bot(token);
bot.api.config.use((0, files_1.hydrateFiles)(bot.token));
console.log("Bot is up and running!");
const start_keyboard = [
    " 🌐 Languages",
    "📚 About",
    "📞 Contact",
];
const buttonRows = start_keyboard.map((start_keyboard) => [grammy_1.Keyboard.text(start_keyboard)]);
const keyboard = grammy_1.Keyboard.from(buttonRows).resized();
bot.command("start", async (ctx) => {
    const welcomeMessage = `🤖 Welcome to *Mali*, your personal AI Assistant powered by Google's *Gemini Pro*\\!\n\n🚀I excel in coding and writing tasks\\. \n\n🌐Explore *Supported Languages* for customization\\.\n\n🔔 Check out our *channel* for updates\\. 🔍\n\nReady\\? Ask me anything\\!`;
    await ctx.reply(welcomeMessage, {
        reply_markup: keyboard,
        parse_mode: "MarkdownV2",
    });
});
bot.hears("📚 About", async (ctx) => {
    const aboutMessage = `🚧 *About Mali v0\\.1* 🚧\n\n\\- 🤖 AI Assistant powered by Google's Gemini Pro API\\.\n\\- 🎯 High accuracy in Q&A, coding, and creative writing\\.\n\\- 🛠️ Markdown support for code snippets\\.\n\\- 📈 Capabilities: coding assistance, creative writing\\.\n\\- 🔄 *No memory of past conversations* \\(WIP🚧\\)\\.\n\\- 🗺️ Explore *Supported Languages*\\.\n\\- 🔜 More features in development\\.\n\n🚀 Ready to assist\\! Ask anything\\!`;
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
function escapeMarkdownV2Characters(text) {
    return text.replace(/[_\[\]()~>#+-=|{}.!]/g, (x) => '\\' + x);
}
bot.on('message:photo', async (ctx) => {
    var _a, _b, _c;
    const photo = (_b = (_a = ctx.message) === null || _a === void 0 ? void 0 : _a.photo) === null || _b === void 0 ? void 0 : _b.slice(-1)[0];
    if (!photo)
        return;
    const prompt = ((_c = ctx.message) === null || _c === void 0 ? void 0 : _c.caption) || "Nothing provided, just say what you see";
    console.log(prompt);
    const file = await ctx.getFile();
    const fileName = crypto_1.default.randomBytes(16).toString('hex') + ".jpg";
    const filePath = path_1.default.join("/tmp", fileName);
    await file.download(filePath);
    console.log(filePath);
    const mimeType = "image/jpeg";
    const generativePart = fileToGenerativePart(filePath, mimeType);
    const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });
    const result = await model.generateContent([prompt, generativePart]);
    const response = await result.response;
    const text = await response.text();
    const escapedResponseText = escapeMarkdownV2Characters(text);
    await ctx.reply(escapedResponseText, { parse_mode: "MarkdownV2" });
});
function fileToGenerativePart(path, mimeType) {
    return {
        inlineData: {
            data: Buffer.from(fs_1.default.readFileSync(path)).toString("base64"),
            mimeType
        },
    };
}
let typingInterval;
bot.on("message:text", async (ctx) => {
    if (["📚 About", "📞 Contact", "🌐 Languages"].includes(ctx.message.text)) {
        return;
    }
    try {
        const message = ctx.message.text;
        const prompt = message;
        await ctx.replyWithChatAction('typing');
        let typing = true;
        typingInterval = setInterval(() => {
            if (typing)
                ctx.replyWithChatAction('typing');
        }, 5000);
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const response_text = await response.text();
        typing = false;
        clearInterval(typingInterval);
        const escapedResponseText = escapeMarkdownV2Characters(response_text);
        await ctx.reply(escapedResponseText, { parse_mode: "MarkdownV2" });
    }
    catch (error) {
        // Stop typing action in case of error
        clearInterval(typingInterval);
        console.error(error);
        await ctx.reply("Sorry, I encountered an error while processing your request❌. Maybe your prompt is NSFW🔞 or not in a supported language🌐.");
    }
});
bot.start();
