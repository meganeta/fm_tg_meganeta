const TelegramBot = require('node-telegram-bot-api');

// Replace with your bot token
const token = '6887731995:AAFY7Z3NRbc64A80N7tNn5pI2CKdC6jcZtY';

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true });

// Global variables
let userSelectList = []; // To store user selections
let mode_list = ['轻柔 🥱','挑逗 🥰','常规 😥','激烈 😵‍💫','魔鬼 😈'];

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
    const data = callbackQuery.data;

    switch (data) {
        case 'button_start':
            bot.sendMessage(chatId,`${userFirstName} 欢迎光临!`);
            handleControlMessage(chatId);
            break;
        case 'mode_1':
            handleGeneration(0,21,5000,5001,0)
            handleControlMessage(chatId);
            break;
        case 'mode_2':
            handleGeneration(0,21,5000,5001,0)
            handleControlMessage(chatId);
            break;
        case 'mode_3':
            handleGeneration(0,21,5000,5001,0)
            handleControlMessage(chatId);
            break;
        case 'mode_4':
            handleGeneration(0,21,5000,5001,0)
            handleControlMessage(chatId);
            break;
        case 'mode_5':
            handleGeneration(0,21,5000,5001,0)
            handleControlMessage(chatId);
            break;
        default:
            responseText = `Unknown option selected by ${userFirstName}.`
            bot.sendMessage(chatId, responseText);
    }
});

function handleGeneration(MinVal,MinVal_Var,MinDuration,MinDuration_Var,mode) {
    let val_speed = Math.floor(Math.random()*MinVal_Var) + MinVal;
    let duration = Math.floor(Math.random()*MinDuration_Var) + MinDuration;
    let length = userSelectList.length;
    // Execute a function after a delay of 2 seconds
    setTimeout(function() {
        userSelectList = userSelectList.shift();
    }, duration);
    userSelectList.push(`${userFirstName} 选择了`+mode_list[mode]+`，速度 `+val_speed.toString()+ `，时长 `+Math.round(duration/1000).toString()+`秒`);
}

function handleControlMessage(chatId) {
    if (userSelectList.length < 1){
        let concatenatedString = "待机中..."
    } else {
        let concatenatedString = userSelectList.slice(1).join('\n');
        concatenatedString = userSelectList[0]+" 执行中..."+"\n"+concatenatedString;
    }
    
    bot.sendMessage(chatId, '当前难度：中等\n当前状态: \n\n'+concatenatedString, {
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: mode_list[0], //0-20
                        callback_data: 'mode_1'
                    }
                ],
                [
                    {
                        text: mode_list[1], //20-40
                        callback_data: 'mode_2'
                    }
                ],
                [
                    {
                        text: mode_list[2], //40-60
                        callback_data: 'mode_3'
                    }
                ],
                [
                    {
                        text: mode_list[3], //60-80
                        callback_data: 'mode_4'
                    }
                ],
                [
                    {
                        text: mode_list[4], //80-100
                        callback_data: 'mode_5'
                    }
                ],
            ]
        }
    });
}

console.log('Bot is running...');