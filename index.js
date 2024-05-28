const TelegramBot = require('node-telegram-bot-api');
const WebSocket = require('ws');
const https = require('https');

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

//channel id to forward all messages
let channel_id = '@meganeta_bot';

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
let cd_msg = "";
let cd_msg_saved = "冷却中...";
// Handle callback queries
bot.on('callback_query', (callbackQuery) => {
    const message = callbackQuery.message;
    const chatId = message.chat.id;
    const userFirstName = callbackQuery.from.first_name;
    const data = callbackQuery.data;

    if (userFirstName != last_user) {
        last_user = userFirstName;
        last_user_count = 0;
    } else if (last_user_count == 3) {
        cd_msg = "即将冷却...";
        last_user_cooldown = new Date();
        last_user_count++;
    } else if (last_user_count > 3) {        
        cd_msg = cd_msg_saved;
        cd_msg_saved = cd_msg_saved + ".";
        handleControlMessage(chatId,1);
        cooldown = new Date();
        if (cooldown-last_user_cooldown > 5000) {
            last_user_cooldown = new Date();
            last_user_count = 0;

            cd_msg_saved = "冷却中...";
        }
        return;
    } else {
        last_user_count++;
    }
    

    if(init_flg){
        if(data != 'button_start'){
            bot.sendMessage(chatId,`您好 ${userFirstName} 请使用 /tease_start 开始。`);
        } else {
            init_flg = 0;
            
            if(ws_con_stat){
                //bot.sendMessage(chatId,`${userFirstName} 开始了捏!`);
            } else {
                bot.sendMessage(chatId,`炮机未连接，玩赛博炮机捏~`);
            }
            handleControlMessage(chatId,0);
        }
    }else{
        // if(ws_con_stat){
            switch (data) {
                case 'button_start':
                    if(init_flg == 0){
                        //bot.sendMessage(chatId,`已经开始了哦，请在下方信息选择!`);
                        handleControlMessage(chatId,0);
                    }
                    break;
                case 'mode_1':
                    handlecase(chatId,userFirstName,0,31,2000,8001,0);
                    break;
                case 'mode_2':
                    handlecase(chatId,userFirstName,20,31,2000,8001,1);
                    break;
                case 'mode_3':
                    handlecase(chatId,userFirstName,40,31,2000,8001,2);
                    break;
                case 'mode_4':
                    handlecase(chatId,userFirstName,60,31,2000,8001,3);
                    break;
                case 'mode_5':
                    handlecase(chatId,userFirstName,80,21,2000,8001,4);
                    break;
                default:
                    responseText = `Unknown option selected by ${userFirstName}.`;
                    bot.sendMessage(chatId, responseText);
            }
        // } else {
        //     bot.sendMessage(chatId,`炮机已断开，请使用 /tease_start 重新连接捏~`);
        // }
        
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
    } else if (userSelectList.length < 8) {
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
                        }
                    ],
                    [
                        {
                            text: mode_list[1], //20-40
                            callback_data: 'mode_2'
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
        concatenatedString = userSelectList.slice(1).join('\n')+" "+cd_msg;
        cd_msg = "";
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

    if(ws_con_stat){
        // Create a JSON message
        const message = {
            speed: val_speed
        };
    
        // Convert the JSON message to a string
        const jsonMessage = JSON.stringify(message);

        // Send the JSON message to the server
        socket.send(jsonMessage);
    } else {
        console.log("Cyber FM");
    }
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

/*
// Handle /electrify_start command
bot.onText(/\/electrify_start/, (msg) => {
    const chatId = msg.chat.id;

    bot.sendMessage(chatId, '欢迎开始发电竞技游戏捏，请参阅下列游戏规则（转载自 @luerjia2077）：');
    
    bot.sendMessage(chatId, '游戏GAME（一）人数随意\n \
    确认好撸的人数后，大家投骰子，确认好射精的先后顺序，然后开始撸，期间大家要互相监督，不能停太久，\
    大家依次射精，如果有人在自己顺序之前射了，就要接受惩罚~消息占用面积 。'
    );

    bot.sendMessage(chatId, '游戏GAME（二）人数随意\n \
    确认好人数后，大家开始撸动，规定视角；视角内必须看到牛牛，在大家的射精下，最后视角必须记录好精液射在了哪里\
    （墙，地板，身上......）不能用手接。最好有一人观察是否全部执行。'
    );

    bot.sendMessage(chatId, '游戏GAME（三）3~6人\n （建议玩过几轮，熟悉玩家后进行）\n \
    开赛前选出一位‘追击员’，其余‘选手’比‘追击员’先开始撸动10秒，随后‘追击员’开始撸动，‘选手’要抢先在‘追击员’之前射精，\
    不然视为失败，失败者要把射出的精液抹回牛牛上，自己龟头责1分钟。'
    );

    bot.sendMessage(chatId, '游戏GAME（四）2~8人上下\n （可由一位管理员发起游戏）\n \
    开始撸动，管理倒计时20分钟，并在15，10，5分钟时设置‘检查点’记录下选手大致的速度，要是超过20分钟，那么没射精的选手会被冠以‘牛牛王’的称号 \
    （除非卫冕，否则一天后删除），超过倒计时可以选择不射精哦~'
    );

    bot.sendMessage(chatId, '游戏GAME（五）3~7人上下\n \
    撸到快射后忍住，寸止一次（热身），正式开始游戏\n （建议多人游玩）\n 由不参与的管理/群友，用随机轮盘之类的方式在热身结束 \
    正式撸动8分钟后开始知名选手,被指到的选手需要1分内射精，没射出来视为失败；要是没有指名的时候射精也视为失败。\
    失败惩罚：游戏结束后，在大家的注视下，用最快速度撸射。'
    );

    bot.sendMessage(chatId, '游戏GAME（六）3~5人上下\n （有些地狱，建议养好身体）\n \
    每人在游戏中必须射精一次，游戏开始后，选手们都有一次‘转嫁权’。\n \
    选择你想转嫁的选手，两人暂时停下撸动，投骰子，或者可以将一次射精转嫁对方，失败反之。\n \
    直到每位选手射完目标为止结束（可能不用射，可能三次？）。（坏笑）\n \
    (拥有最高次数的选手可以获得一次‘平均权’，强制所有人投骰子，当获得中位数以上点数的时候，可以将次数报复给任意先前转嫁次数给自己的选手）。'
    );

    bot.sendMessage(chatId, '游戏GAME（七）2~7人上下\n （撸啊撸啊撸啊）\n \
    这是一场冲刺局，选手在开始前请用大量润滑剂润滑，然后随意撸动，游戏开始后，请快速激烈地射出来吧~\n \
    最后一名今晚寸止一次不准射精~'
    );

    bot.sendMessage(chatId, '游戏GAME（八）1~4人上下\n \
    选手准备好后，请一位不参与的管理/群友，来随机指定一个数字（1~100），数字就是选手要撸动的次数（上下以来回算一次）。\
    选手要在2分钟内撸完指定次数，可以让管理/群友倒计时，结束未完成者，下一回合的数字+10。\
    谁能坚持到最后呢~'
    );

    bot.sendMessage(chatId, '游戏GAME（九）2~8人上下\n （建议所有选手有充足时间再进行）\n \
    休闲局~ 选手可以用任何姿势、速度、手法、道具来辅助自己撸动，选手可以在群里投骰子，进行撸动相关的真心话大冒险，最大的一方决定问题/指令，其余回答。\n\
    大冒险例：寸止一次，拍蛋蛋几次，不允许命令射精相关。\n\
    真心话例：内裤的颜色，上次撸射是什么时候...等（禁政，禁盒，禁冒犯...）\n 可以不射精，纯撸着玩也可以哦~'
    );

    bot.sendMessage(chatId, '游戏GAME（十）3~6人上下\n （来看看运气吧~）\n \
    所有选手撸动150下可以投一枚骰子，只要大于等于5点，就可以计1分，当达到4点时即可获胜，与此同时其余选手需要2分钟内射出来，未完成即败北。\
    需要为肉棒粥贡献本场游戏射精后的牛牛图片。'
    );
});
*/