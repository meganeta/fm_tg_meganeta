const TelegramBot = require('node-telegram-bot-api');

// Replace with your bot token
const token = '6887731995:AAFY7Z3NRbc64A80N7tNn5pI2CKdC6jcZtY';

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true });

// Handle /start command
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, '欢迎捏！请按下方按钮来进入炮机/郊狼群控模式！（测试中...）', {
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: '请点我',
                        callback_data: 'button_start'
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
    const userFirstName = callbackQuery.from.first_name;

    if (callbackQuery.data === 'button_start') {
        bot.sendMessage(chatId,`${userFirstName} 欢迎光临!`);
        bot.sendMessage(chatId, '当前状态：待机中...', {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: '轻柔 🥱',
                            callback_data: 'mode_1'
                        }
                    ],
                    [
                        {
                            text: '挑逗 🥰',
                            callback_data: 'mode_2'
                        }
                    ],
                    [
                        {
                            text: '激烈 😵‍💫',
                            callback_data: 'mode_3'
                        }
                    ],
                    [
                        {
                            text: '魔鬼 😈',
                            callback_data: 'mode_4'
                        }
                    ],
                ]
            }
        });
    }
});

console.log('Bot is running...');