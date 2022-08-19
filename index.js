
const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

// 读取你的 `setting.yml` 并解析为 JSON
const setting = yaml.load(
    fs.readFileSync(
        path.resolve(
            __dirname,
            "./setting.yml"
        ),
        "utf8"
    )
);

function debug(str) {
    if (setting.localServer.debug != null) {
        if (setting.localServer.debug) {
            console.debug("[debug] " + str);
        }
    }
}

//存储消息记录的数据结构
var fmsg = new Map();
var gmsg = new Map();
//存储消息增量的数据结构
var fmsgn = new Map();
var gmsgn = new Map();

class MessageNode {
    sender;
    messageChain;
}

var flist;
var glist;

var isBotOnline = true;

const { Bot, Message } = require('mirai-js');
const bot = new Bot();
async function login() {
    let url = "http://" + setting.host + ":" + setting.port
    debug("mirai-api-http目标 : " + url);
    await bot.open({
        baseUrl: url,
        verifyKey: setting.verifyKey,
        // 要绑定的 qq，须确保该用户已在 mirai-console 登录
        qq: setting.qq,
    });
    const profile = await bot.getUserProfile({ qq: bot.getQQ() });
    debug("登录信息 : " + JSON.stringify(profile));
    bot.on('GroupMessage', async data => {
        _msg++;
        debug(data.sender.group.name + " : " + JSON.stringify(data.messageChain));
        let sender = data.sender;
        let gid = sender.group.id;
        let msgn = new MessageNode();
        msgn.sender = sender;
        msgn.messageChain = data.messageChain;
        let array = new Array();
        if (gmsg.has(gid)) {
            array = gmsg.get(gid);
        }
        array.push(msgn);
        while (array.length > Number(setting.localServer.cacheSize).valueOf()) {
            array.shift();
        }
        gmsg.set(gid, array);

        array = new Array();
        if (gmsgn.has(gid)) {
            array = gmsgn.get(gid);
        }
        array.push(msgn);
        while (array.length > Number(setting.localServer.cacheSize).valueOf()) {
            array.shift();
        }
        gmsgn.set(gid, array);
    });

    bot.on('FriendMessage', async data => {
        _msg++;
        debug(data.sender.remark + " : " + JSON.stringify(data.messageChain));
        let sender = data.sender;
        let uid = sender.id;
        let msgn = new MessageNode();
        msgn.sender = sender;
        msgn.messageChain = data.messageChain;
        let array = new Array();
        if (fmsg.has(uid)) {
            array = fmsg.get(uid);
        }
        array.push(msgn);
        while (array.length > Number(setting.localServer.cacheSize).valueOf()) {
            array.shift();
        }
        fmsg.set(uid, array);
        array = new Array();
        if (fmsgn.has(uid)) {
            array = fmsgn.get(uid);
        }
        array.push(msgn);
        while (array.length > Number(setting.localServer.cacheSize).valueOf()) {
            array.shift();
        }
        fmsgn.set(uid, array);
    });
    bot.getFriendList().then(function (data) {
        flist = data;
    });
    bot.getGroupList().then(function (data) {
        glist = data;
    });
    bot.on('BotOnlineEvent', async data => {
        console.log("已上线");
        isBotOnline = true;
    });
    bot.on(['BotOfflineEventForce', 'BotOfflineEventDropped', "BotOfflineEventActive"], async data => {
        console.log("已掉线");
        isBotOnline = false;
    });

    bot.on("FriendRecallEvent", async data => {
        let msgn = new MessageNode();
        let uid = data.operator;
        msgn.sender = {
            id: uid
        };
        let msg = new Message().addText("[撤回了一条消息]").getMessageChain();
        msgn.messageChain = [msg];
        let array = new Array();
        if (fmsg.has(uid)) {
            array = fmsg.get(uid);
        }
        array.push(msgn);
        while (array.length > Number(setting.localServer.cacheSize).valueOf()) {
            array.shift();
        }
        fmsg.set(uid, array);
        array = new Array();
        if (fmsgn.has(uid)) {
            array = fmsgn.get(uid);
        }
        array.push(msgn);
        while (array.length > Number(setting.localServer.cacheSize).valueOf()) {
            array.shift();
        }
        fmsgn.set(uid, array);
    });

    bot.on("GroupRecallEvent", async data => {
        let sender = data.operator;
        let gid = data.group.id;
        let msgn = new MessageNode();
        msgn.sender = sender;
        let msg = new Message().addText("[撤回了一条消息]").getMessageChain();
        msgn.messageChain = [msg];
        let array = new Array();
        if (gmsg.has(gid)) {
            array = gmsg.get(gid);
        }
        array.push(msgn);
        while (array.length > Number(setting.localServer.cacheSize).valueOf()) {
            array.shift();
        }
        gmsg.set(gid, array);
        array = new Array();
        if (gmsgn.has(gid)) {
            array = gmsgn.get(gid);
        }
        array.push(msgn);
        while (array.length > Number(setting.localServer.cacheSize).valueOf()) {
            array.shift();
        }
        gmsgn.set(gid, array);
    });

    console.log("登录成功");
}

var _sec = 0;
var _msg = 0;
var _last_msg = 0;

const http = require("http");
function handleHttp(req, res) {
    if (req.method == "GET") {
        debug('[GET] ' + req.url);
        if (req.url.startsWith("/api/")) {
            //处理前端接口请求
            let api = req.url.substring(1).split("/");
            debug("API : " + api);
            if (api[1] == "getUserProfile") {
                if (api.length >= 3) {
                    let id = api[2];
                    if (typeof (id) == "number") {
                        bot.getUserProfile({ qq: id }).then(function (data) {
                            res.setHeader('Content-Type', 'text/plain;charset=utf-8');
                            res.end(JSON.stringify(data));
                        });
                    }
                }
            }
            if (api[1] == "getGroupConfig") {
                if (api.length >= 3) {
                    let id = api[2];
                    if (typeof (id) == "number") {
                        res.setHeader('Content-Type', 'text/plain;charset=utf-8');
                        bot.getGroupConfig({ group: id }).then(function (data) {
                            res.end(JSON.stringify(data));
                        });
                    }
                }
            }
            if (api[1] == "getFriendList") {
                // debug("好友列表")
                res.setHeader('Content-Type', 'text/plain;charset=utf-8');
                res.end(JSON.stringify(flist));
            }
            if (api[1] == "getGroupList") {
                // debug("群列表");
                res.setHeader('Content-Type', 'text/plain;charset=utf-8');
                res.end(JSON.stringify(glist));
            }
            if (api[1] == "getQQ") {
                res.setHeader('Content-Type', 'text/plain;charset=utf-8');
                res.end("" + bot.getQQ());
            }
            if (api[1] == "getFriendMessageList") {
                // debug("好友消息列表");
                if (api.length >= 3) {
                    let id = Number(api[2]);
                    if (fmsg.has(id)) {
                        let array = fmsg.get(id);
                        res.setHeader('Content-Type', 'text/plain;charset=utf-8');
                        res.end(JSON.stringify(array));
                        while (fmsgn.get(id).length > 0) {
                            fmsgn.get(id).shift();
                        }
                    }
                }
            }
            if (api[1] == "getGroupMessageList") {
                // debug("群消息列表");
                if (api.length >= 3) {
                    let id = Number(api[2]);
                    if (gmsg.has(id)) {
                        let array = gmsg.get(id);
                        res.setHeader('Content-Type', 'text/plain;charset=utf-8');
                        res.end(JSON.stringify(array));
                        while (gmsgn.get(id).length > 0) {
                            gmsgn.get(id).shift();
                        }
                    }
                }
            }
            if (api[1] == "getFriendMessageListNew") {
                // debug("好友消息增量列表");
                if (api.length >= 3) {
                    let id = Number(api[2]);
                    if (fmsgn.has(id)) {
                        let array = fmsgn.get(id);
                        res.setHeader('Content-Type', 'text/plain;charset=utf-8');
                        res.end(JSON.stringify(array));
                        while (fmsgn.get(id).length > 0) {
                            fmsgn.get(id).shift();
                        }
                    }
                }
            }
            if (api[1] == "getGroupMessageListNew") {
                // debug("群消息增量列表");
                if (api.length >= 3) {
                    let id = Number(api[2]);
                    if (gmsgn.has(id)) {
                        let array = gmsgn.get(id);
                        res.setHeader('Content-Type', 'text/plain;charset=utf-8');
                        res.end(JSON.stringify(array));
                        while (gmsgn.get(id).length > 0) {
                            gmsgn.get(id).shift();
                        }
                    }
                }
            }
            if (api[1] == "status") {
                let status = {
                    memory: process.memoryUsage(),
                    arch: process.arch,
                    platform: process.platform,
                    bot: {
                        qq: bot.getQQ(),
                        online: isBotOnline,
                        msgPerMinute: _last_msg
                    }
                }
                let str = JSON.stringify(status);
                res.setHeader('Content-Type', 'text/plain;charset=utf-8');
                res.end(str);
            }
            setTimeout(() => {
                if (!res.writableEnded) {
                    res.statusCode = 200;
                    res.end("bad");
                }
            }, 2000);
        } else if (req.url == "/") {
            //发送主页面
            fs.readFile('./front/index.html', function (err, data) {
                if (err) {
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'text/plain;charset=utf-8');
                    res.end('文件系统错误: ' + err.message);
                    debug(err.message);
                } else {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'text/html;charset=utf-8');
                    res.end(data);
                }
            });
        } else {
            //其他资源文件
            let filename = './front' + req.url;
            fs.readFile(filename, function (err, data) {
                if (err) {
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'text/plain;charset=utf-8');
                    res.end('文件系统错误: ' + err.message);
                    debug(err.message);
                } else {
                    res.statusCode = 200;
                    res.end(data);
                }
            })
        }
    }

    if (req.method == "POST") {
        //POST请求
        console.log("[POST] " + req.url);
        if (req.url.startsWith("/api/")) {
            //处理前端接口请求
            let api = req.url.substring(req.url.lastIndexOf("/") + 1);
            debug("API : " + api);

            var post = '';
            // 接受data
            req.on('data', function (chunk) {
                post += chunk;
            });
            // 数据传输结束后
            req.on('end', function () {
                debug("POST data :" + post);
                post = JSON.parse(post);
                if (api == "sendFriendMessage") {
                    _msg++;
                    let uid = new Number(post.id).valueOf();
                    let str = post.str;
                    let msg = new Message().addText(str).getMessageChain();
                    bot.sendMessage({
                        friend: uid,
                        message: msg
                    });
                    let array = new Array();
                    if (fmsg.has(uid)) {
                        array = fmsg.get(uid);
                    }
                    let msgn = new MessageNode();
                    msgn.sender = {
                        id: bot.getQQ()
                    };
                    msgn.messageChain = msg;
                    array.push(msgn);
                    while (array.length > Number(setting.localServer.cacheSize).valueOf()) {
                        array.shift();
                    }
                    fmsg.set(uid, array);
                    array = new Array();
                    if (fmsgn.has(uid)) {
                        array = fmsgn.get(uid);
                    }
                    array.push(msgn);
                    while (array.length > Number(setting.localServer.cacheSize).valueOf()) {
                        array.shift();
                    }
                    fmsgn.set(uid, array);
                    console.log("好友 => " + uid + " : " + str);
                    res.setHeader('Content-Type', 'text/plain;charset=utf-8');
                    res.end("ok");
                }

                if (api == "sendGroupMessage") {
                    _msg++;
                    let gid = new Number(post.id).valueOf();
                    let str = post.str;
                    let msg = new Message().addText(str).getMessageChain();
                    bot.sendMessage({
                        group: gid,
                        message: msg
                    });
                    let array = new Array();
                    if (gmsg.has(gid)) {
                        array = gmsg.get(gid);
                    }
                    let msgn = new MessageNode();
                    msgn.sender = {
                        id: bot.getQQ()
                    };
                    msgn.messageChain = msg;
                    array.push(msgn);
                    while (array.length > Number(setting.localServer.cacheSize).valueOf()) {
                        array.shift();
                    }
                    gmsg.set(gid, array);
                    array = new Array();
                    if (gmsgn.has(gid)) {
                        array = gmsgn.get(gid);
                    }
                    array.push(msgn);
                    while (array.length > Number(setting.localServer.cacheSize).valueOf()) {
                        array.shift();
                    }
                    gmsgn.set(gid, array);
                    console.log("群 => " + gid + " : " + str);
                    res.setHeader('Content-Type', 'text/plain;charset=utf-8');
                    res.end("ok");
                }
            });
        }
        setTimeout(() => {
            if (!res.writableEnded) {
                res.statusCode = 200;
                res.end("bad");
            }
        }, 2000);
    }
}

function startHttpServer() {
    console.log('HTTP 服务运行在 http://localhost:' + setting.localServer.port + "/");
    http.createServer(handleHttp).listen(setting.localServer.port);
}

async function app() {
    console.log("使用配置 setting.yml");

    debug("缓存大小 : " + setting.localServer.cacheSize);

    debug("启动 HTTP");
    startHttpServer();

    console.log("登录 QQ : " + setting.qq);
    login();

    //注册定时器, 维护消息密度
    setInterval(function () {
        _sec++;
        if (_sec >= 60) {
            _sec = 0;
            _last_msg = _msg;
            _msg = 0;
        }
    }, 1000);
}

app();
