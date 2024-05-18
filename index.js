const TelegramBot = require('node-telegram-bot-api');

// Replace with your bot token
const token = '6887731995:AAFY7Z3NRbc64A80N7tNn5pI2CKdC6jcZtY';

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true });

// Handle /start command
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Welcome! Click the button below to start.', {
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: 'Click Me',
                        callback_data: 'button_click'
                    }
                ]
            ]
        }
    });
});

// Handle callback queries
bot.on('callback_query', (callbackQuery) => {
    const message = callbackQuery.message;
    const chatId = message.chat.id;

    if (callbackQuery.data === 'button_click') {
        bot.sendMessage(chatId, 'Button clicked!');
    }
});

console.log('Bot is running...');