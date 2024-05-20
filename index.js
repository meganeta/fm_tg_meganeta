const TelegramBot = require('node-telegram-bot-api');
const WebSocket = require('ws');

// Replace with your bot token
const token = '6887731995:AAHxY5A2p7Adstq6a0Jmk18_9p0MDQyl4rg';

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true });

// Global variables
let userSelectList = []; // To store user selections
let speed_list = [];
let duration_list = [];
let mode_list = ['轻柔 🥱','挑逗 🥰','常规 😥','激烈 😵‍💫','魔鬼 😈'];
let init_flg = 1;
let new_msg_flg = 0;

//New message refreshing
let message_id;
let chat_id;
let TimeThreshold = 60000*3;

//test mode
let test_text = "";

// Handle /tease_start command
bot.onText(/\/tease_start/, (msg) => {
    const chatId = msg.chat.id;

    if(init_flg){
        bot.sendMessage(chatId, '欢迎来调教メガネタ捏！请按下方按钮来进入炮机/郊狼群控模式！（测试中...）\n Changelog v0.2a\n添加了选择冷却机制（5秒）。\n添加了防止新消息刷屏的机制（冷却3分钟）。\n优化了界面减小消息占用面积。\n出bug敲 https://t.me/meganeta', {
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
    }else{
        handleControlMessage(chatId,0);
    }
});

let last_user = "";
let last_user_count = 0;
let last_user_cooldown;
// Handle callback queries
bot.on('callback_query', (callbackQuery) => {
    const message = callbackQuery.message;
    const chatId = message.chat.id;
    const userFirstName = callbackQuery.from.first_name;
    const data = callbackQuery.data;

    if (userFirstName != last_user) {
        last_user = userFirstName;
        last_user_cooldown = new Date();
        last_user_count = 0;
    } else if (last_user_count == 3) {
        cooldown = new Date();
        if (cooldown-last_user_cooldown > 5000) {
            last_user_cooldown = new Date();
            last_user_count = 0;
        }
        return;
    } else {
        last_user_count++;
    }
    

    if(init_flg){
        if(data != 'button_start'){
            bot.sendMessage(chatId,`您好 ${userFirstName} 请使用 /tease_start 开始。`);
        } else {
            if(ws_con_stat){
                init_flg = 0;
                //bot.sendMessage(chatId,`${userFirstName} 开始了捏!`);
                handleControlMessage(chatId,0);
            } else {
                bot.sendMessage(chatId,`炮机未连接，请稍后再试捏~`);
            }
        }
    }else{
        if(ws_con_stat){
            switch (data) {
                case 'button_start':
                    if(init_flg == 0){
                        //bot.sendMessage(chatId,`已经开始了哦，请在下方信息选择!`);
                        handleControlMessage(chatId,0);
                    }
                    break;
                case 'mode_1':
                    handlecase(chatId,userFirstName,0,21,5000,3001,0);
                    break;
                case 'mode_2':
                    handlecase(chatId,userFirstName,20,21,5000,3001,1);
                    break;
                case 'mode_3':
                    handlecase(chatId,userFirstName,40,21,5000,3001,2);
                    break;
                case 'mode_4':
                    handlecase(chatId,userFirstName,60,21,5000,3001,3);
                    break;
                case 'mode_5':
                    handlecase(chatId,userFirstName,80,21,5000,3001,4);
                    break;
                default:
                    responseText = `Unknown option selected by ${userFirstName}.`;
                    bot.sendMessage(chatId, responseText);
            }
        } else {
            bot.sendMessage(chatId,`炮机已断开，请使用 /tease_start 重新连接捏~`);
        }
        
    }
});

function handlecase(chatId,userFirstName,MinVal,MinVal_Var,MinDuration,MinDuration_Var,mode){
    if (userSelectList.length < 1) {
        handleGeneration(userFirstName,MinVal,MinVal_Var,MinDuration,MinDuration_Var,mode,chatId);
        if(new_msg_flg){
            handleControlMessage(chatId,0);
        } else {
            handleControlMessage(chatId,1);
        }
    } else if (userSelectList.length < 6) {
        handleGeneration(userFirstName,MinVal,MinVal_Var,MinDuration,MinDuration_Var,mode,chatId);
        handleControlMessage(chatId,1);
    }
}

function handleGeneration(userFirstName,MinVal,MinVal_Var,MinDuration,MinDuration_Var,mode,chatId) {
    let val_speed = Math.floor(Math.random()*MinVal_Var) + MinVal;
    let duration = Math.floor(Math.random()*MinDuration_Var) + MinDuration;

    userSelectList.push(`${userFirstName} 选择了`+mode_list[mode]+`，速度 `+val_speed.toString()+ `，时长 `+Math.round(duration/1000).toString()+`秒`);
    speed_list.push(val_speed);
    duration_list.push(duration);
    if(speed_init){
        send_machine(speed_list[0]);
        speed_init = false;
    }

    function timeout_exec(chatId){

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
            setTimeout(timeout_exec,duration_list[0],chatId);
            handleControlMessage(chatId,1);
        } else {
            speed_init = true;
            handleControlMessage(chatId,1);
        }
    }

    if(duration_list.length==1){
        // Execute a function after a delay of 2 seconds
        setTimeout(timeout_exec,duration_list[0],chatId);
    }
}

let currentTime = 0;

function handleControlMessage(chatId,modify) {

    if(currentTime) {
        msgTime = new Date();
        Timepassed = msgTime - currentTime;

        console.log("Time passed: "+Timepassed.toString());

        if (msgTime - currentTime > TimeThreshold){
            if(modify != 2) {
                modify = 0;
                currentTime = new Date();
            }
        }
    }else{
        currentTime = new Date();
    }


    let options = [
                    [
                        {
                            text: mode_list[0], //0-20
                            callback_data: 'mode_1'
                        },
                        {
                            text: mode_list[1], //20-40
                            callback_data: 'mode_2'
                        }
                    ],
                    [
                        {
                            text: mode_list[2], //40-60
                            callback_data: 'mode_3'
                        },
                        {
                            text: mode_list[2], //40-60
                            callback_data: 'mode_3'
                        }
                    ],
                    [
                        {
                            text: mode_list[3], //60-80
                            callback_data: 'mode_4'
                        },
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
        concatenatedString = "正在执行...\n"+userSelectList[0]+"\n\n执行队列：\n"+concatenatedString;
    }

    if (modify){
        bot.editMessageText('当前难度：中等\n当前状态: \n\n'+concatenatedString, {
            chat_id: chat_id,
            message_id: message_id,
            reply_markup: {
                inline_keyboard: options
            }
        /*}).then(() => {
            if (modify == 2) {
                bot.deleteMessage(chat_id, message_id).then(() => {
                    console.log(`Message with ID: ${message_id} deleted.`);
                })
                .catch((error) => {
                    console.error('Error deleting message:', error);
                });
            }*/
        });
        
    }else{        
        bot.sendMessage(chatId, '当前难度：中等\n当前状态: \n\n'+concatenatedString, {
            reply_markup: {
                inline_keyboard: options
            }
        }).then((sentMessage) => {
            chat_id = sentMessage.chat.id;
            message_id = sentMessage.message_id;
        });
    }
    
    
}

//Websocket
// Define the WebSocket endpoint
const socket = new WebSocket('ws://192.168.99.157:8080');

let speed_init = true;

function send_machine(val_speed){
    console.log("Send speed: "+val_speed.toString());

    // Create a JSON message
    const message = {
        speed: val_speed
    };
    
    // Convert the JSON message to a string
    const jsonMessage = JSON.stringify(message);

    // Send the JSON message to the server
    socket.send(jsonMessage);
}

let ws_con_stat = false;

// Event listener for when the WebSocket connection is opened
socket.onopen = function(event) {
    ws_con_stat = true;
    console.log('WebSocket connection opened.');
};
  
// Event listener for when a message is received from the server
socket.onmessage = function(event) {
    console.log('Message received from server:', event.data);
};

// Event listener for when an error occurs with the WebSocket connection
socket.onerror = function(error) {
    ws_con_stat = false;
    console.error('WebSocket error:', error);
};

// Event listener for when the WebSocket connection is closed
socket.onclose = function(event) {
    ws_con_stat = false;
    console.log('WebSocket connection closed.');
};

console.log('Bot is running...');