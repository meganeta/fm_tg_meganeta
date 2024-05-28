const TelegramBot = require('node-telegram-bot-api');
const WebSocket = require('ws');
const https = require('https');

// Replace with your bot token
const token = '6887731995:AAHKvyKOOVh8O0fu3xO5g4bxckNEIhXRrKc';

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
        //FMClient.send(jsonMessage);
        socket.send(jsonMessage);
    } else {
        console.log("Cyber FM");
    }
}

// Define the WebSocket endpoint
const socket = new WebSocket('ws://192.168.99.157:8080');

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
//Replace with your ssl token
const privateKey = `
-----BEGIN PRIVATE KEY-----
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
Lx1lDEMZcgwFxoM9E7wfw5EEkEcxKw==
-----END PRIVATE KEY-----
`;

const certificate = `
-----BEGIN CERTIFICATE-----
MIIFOTCCAyGgAwIBAgIUCK3WLffz8cXB2HOEkmm04FiMpQcwDQYJKoZIhvcNAQEL
BQAwFTETMBEGA1UEAwwKc2VydmVyLmNvbTAeFw0yMzA0MTQwMDMwMzZaFw0zMzA0
MTEwMDMwMzZaMBUxEzARBgNVBAMMCnNlcnZlci5jb20wggIiMA0GCSqGSIb3DQEB
AQUAA4ICDwAwggIKAoICAQCUnczE3Hxgwb2t6+AUEttE+XLbJjAuX+lh9+jmaZqo
W9G/rr6imx9b6KcV4TuIOoZmD53/GT7/ekelGT/nJUqfW2oERKuRyaD2UCbG0Pr+
hev5eQ2qCBoYGXLwAIbTvgLu1okdfvlyMYZM0D6RRcJHfL/zQBMMbJMPGU9q4knP
pbIqlr5YlZ2cK0Nsxva05FL1EcpN880GHNoKGzH5uiVlmmt+3M5wlFztGjK1Q0FD
oQC1Y+U4jDCW6Po2WSBUhk9c3KK9iL4VqlZllt89a9PDdZxaYSRK4j04qp7PTNN2
We00Tn43QEPSvBvxBjS2Iy93ZDm8ox71eUJxjSvwIT6b3FjofrTIldA0FLc4ufiM
03b44Oa2fx9fzgToQk3AXH7RJXlUOpB09uVzZMhcqTRDoFcFtepZ18VmV4PI+rP3
g7LB3AOhacf9XJ24++/zRGioQ4NIdug/HB8aHT31Q4VFJ7pm1VW7mMLB8BV3XpgZ
297WTo0zI2J6ngw8DuewxzpXFHC47+F1z0L74B6f0MGicaco/TQXesYmHUE1SMyF
pNUNXokMAwEOfME+S9vWA7AcJjpG0weKarm9DC5bTTBy7vdFKhkRW+UzQyc86eFQ
1sgo4MTR8F0AsaO/cK108lDLs4ge3htNHqbr77FfTaGjdEqZmSrEBBhuFUD2bXH6
zwIDAQABo4GAMH4wHQYDVR0OBBYEFNY4iHHBuyJPFHziA/+gQp3iVdUqMB8GA1Ud
IwQYMBaAFNY4iHHBuyJPFHziA/+gQp3iVdUqMA8GA1UdEwEB/wQFMAMBAf8wKwYD
VR0RBCQwIoIKc2VydmVyLmNvbYIOd3d3LnNlcnZlci5uZXSHBAoRNTEwDQYJKoZI
hvcNAQELBQADggIBADGpOWXwEaldpQPJ2VgI7w9eS6kva6/jv4KJOH4eX4pPYVqj
2b9pDViGIoLEE1tFBNjuKxjS2kmu7ia823ZpvgE4YnoGhBHwV04Ga9EfnOf6wk9v
iBLVRWE4llQp6NUWJ+PSZWs7TmlrG+zllwe/Q49sC+1t7GXefEgvx8cCHExZNdz1
2F2KJBUbWBTu6nmm6oRriU3xvgOepOyTNMe4JjwIf+6A1cUjzF0mncpYRvYdfPbO
YrvJJJrGgqcIjTk3zLvu3UdSfnDX1buGtkyHk1rJ4oJ26WnsSBsg999xYqpksNwi
lrPNnDrtUOrK7yEs0wBTd/uomz911X0OuPpFlZ08uCG/YIsm5lte6GzG4oc4ErNU
6fDHOFDgPFSHKrEzf2c4JSDNg8E9rK/j/7nMQpjvX6bLpW9OjNmFcwoSR01AQi0u
TNRdY/l+AGSNbCzsV7sFMG9hhS/NfaFOPX6vmRe1iVDS8z5xS8ND4awWOGuZUI+7
J5arQ6n6EwB43N6rGunGCjxXM/gR8i5X9kOhjYqr15ABf93jVOSzHLn14mjmLrXa
OU2PntzNAb/NsyI9soAgn8SYSwODlxBMr7m/lpY73EoNSRttDfpKgseR9kO+2+My
bpGZwHfd6CiUxwq55mi3TX2c9K6VXC9cvhdivLbXr/fKGs1yP0pC5NOdPMtK
-----END CERTIFICATE-----
`;

//Websocket server
// Create an HTTPS server
const server = https.createServer({
    key: privateKey,
    cert: certificate
  });

const wss = new WebSocket.Server({ server });
const clients = new Map();

let ws_con_stat = false;

wss.on('connection', (ws) => {

    const clientId = uuidv4();
    clients.set(clientId, ws);
    console.log(`Client connected: ${clientId}`);
  
    // Handle incoming messages from clients
    ws.on('message', (message) => {
        console.log(`Received message from ${clientId}: ${message}`);
        const parsedMessage = JSON.parse(message);

        // Example: Sending a message to a specific client
        if (parsedMessage.type === 'FM_CON') {
            const FMClientId = parsedMessage.targetClientId;
            const FMClient = clients.get(FMClientId);
            ws_con_stat = true;
        }
    });

    // Handle client disconnections
    ws.on('close', () => {
        clients.delete(clientId);
        console.log(`Client disconnected: ${clientId}`);
        if (clientId == targetClientId) {
            ws_con_stat = false;
        }
    });
});
  
// Start the HTTPS server
server.listen(8080, () => {
console.log('HTTPS server listening on port 8080');
});
*/

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