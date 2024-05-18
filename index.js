const TelegramBot = require('node-telegram-bot-api');

// Replace with your bot token
const token = '6887731995:AAHxY5A2p7Adstq6a0Jmk18_9p0MDQyl4rg';

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true });

// Global variables
let userSelectList = []; // To store user selections
let speed_list = [];
let duration_list = [];
let mode_list = ['轻柔 🥱','挑逗 🥰','常规 😥','激烈 😵‍💫','魔鬼 😈'];

// Handle /tease_start command
bot.onText(/\/tease_start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, '欢迎来调教メガネタ捏！请按下方按钮来进入炮机/郊狼群控模式！（测试中...）', {
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

let init_flg = 1;

// Handle callback queries
bot.on('callback_query', (callbackQuery) => {
    const message = callbackQuery.message;
    const chatId = message.chat.id;
    const userFirstName = callbackQuery.from.first_name;
    const data = callbackQuery.data;

    if(init_flg){
        if(data != 'button_start'){
            bot.sendMessage(chatId,`您好 ${userFirstName} 请使用 /tease_start 开始。`);
        } else {
            init_flg = 0;
            bot.sendMessage(chatId,`${userFirstName} 开始了捏!`);
            handleControlMessage(chatId,message,0);
        }
    }else{
        switch (data) {
            case 'button_start':
                if(init_flg == 0){
                    bot.sendMessage(chatId,`已经开始了哦，请在下方信息选择!`);
                    handleControlMessage(chatId,message,0);
                }
                break;
            case 'mode_1':
                handlecase(chatId,message,userFirstName,0,21,5000,3001,0);
                break;
            case 'mode_2':
                handlecase(chatId,message,userFirstName,20,21,5000,3001,1);
                break;
            case 'mode_3':
                handlecase(chatId,message,userFirstName,40,21,5000,3001,2);
                break;
            case 'mode_4':
                handlecase(chatId,message,userFirstName,60,21,5000,3001,3);
                break;
            case 'mode_5':
                handlecase(chatId,message,userFirstName,80,21,5000,3001,4);
                break;
            default:
                responseText = `Unknown option selected by ${userFirstName}.`;
                bot.sendMessage(chatId, responseText);
        }
    }
});

/*
let executed = false;
let chatid_stored;
let message_stored;
*/

function handlecase(chatId,message,userFirstName,MinVal,MinVal_Var,MinDuration,MinDuration_Var,mode){
    if (userSelectList.length < 6) {
        handleGeneration(userFirstName,MinVal,MinVal_Var,MinDuration,MinDuration_Var,mode,chatId,message);
        handleControlMessage(chatId,message,1);
    }
}

/*
// Function to check the condition and execute myFunction only once
function waitForCondition() {
    if (!executed && userSelectList.length < 6) {
        // Execute the function
        handleControlMessage(chatid_stored,message_stored,0);
        executed = true; // Set the flag to true to indicate that the function has been executed
    } else {
        // Condition is not met or function already executed, wait and check again after a delay
        setTimeout(waitForCondition, 1000); // Check every 1 second (adjust as needed)
    }
}
*/

let speed_init = true;

function send_machine(val_speed){
    console.log("Send speed: "+val_speed.toString());
}

function handleGeneration(userFirstName,MinVal,MinVal_Var,MinDuration,MinDuration_Var,mode,chatId,message) {
    let val_speed = Math.floor(Math.random()*MinVal_Var) + MinVal;
    let duration = Math.floor(Math.random()*MinDuration_Var) + MinDuration;

    userSelectList.push(`${userFirstName} 选择了`+mode_list[mode]+`，速度 `+val_speed.toString()+ `，时长 `+Math.round(duration/1000).toString()+`秒`);
    speed_list.push(val_speed);
    duration_list.push(duration);
    if(speed_init){
        send_machine(speed_list[0]);
        speed_init = false;
    }

    function timeout_exec(chatId,message){

        userSelectList.shift();
        speed_list.shift();
        duration_list.shift();
        if(speed_list.length>0){
            send_machine(speed_list[0]);
        } else {
            send_machine(0);
        }

        if(duration_list.length>0){
            // Execute a function after a delay of 2 seconds
            setTimeout(timeout_exec,duration_list[0],chatId,message);
            handleControlMessage(chatId,message,1);
        } else {
            handleControlMessage(chatId,message,1);
            handleControlMessage(chatId,message,0);
        }
    }

    if(duration_list.length==1){
        // Execute a function after a delay of 2 seconds
        setTimeout(timeout_exec,duration_list[0],chatId,message);
    }
}

function handleControlMessage(chatId,message,modify) {
    let options = [
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
                ];

    let concatenatedString = "";
    if (userSelectList.length < 1){
        concatenatedString = "待机中...";
    } else {
        concatenatedString = userSelectList.slice(1).join('\n');
        concatenatedString = userSelectList[0]+" 执行中..."+"\n"+concatenatedString;
    }

    if (modify){
        bot.editMessageText('当前难度：中等\n当前状态: \n\n'+concatenatedString, {
            chat_id: message.chat.id,
            message_id: message.message_id,
            reply_markup: {
                inline_keyboard: options
            }
        });
    }else{
        bot.sendMessage(chatId, '当前难度：中等\n当前状态: \n\n'+concatenatedString, {
            reply_markup: {
                inline_keyboard: options
            }
        });
    }
    
    
}

console.log('Bot is running...');