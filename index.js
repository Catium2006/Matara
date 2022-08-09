
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

class MessageNode {
    sender;
    messageChain;
}

var flist;
var glist;

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
        debug(data.sender.group.name + " : " + JSON.stringify(data.messageChain));
        let sender = data.sender;
        let gid = sender.group.id;
        let array = new Array();
        if (gmsg.has(gid)) {
            array = gmsg.get(gid);
        }
        let msgn = new MessageNode();
        msgn.sender = sender;
        msgn.messageChain = data.messageChain;
        array.push(msgn);
        while (array.length > Number(setting.localServer.cacheSize).valueOf()) {
            array.shift();
        }
        gmsg.set(gid, array);
    });

    bot.on('FriendMessage', async data => {
        debug(data.sender.remark + " : " + JSON.stringify(data.messageChain));
        let sender = data.sender;
        let uid = sender.id;
        let array = new Array();
        if (fmsg.has(uid)) {
            array = fmsg.get(uid);
        }
        let msgn = new MessageNode();
        msgn.sender = sender;
        msgn.messageChain = data.messageChain;
        array.push(msgn);
        while (array.length > Number(setting.localServer.cacheSize).valueOf()) {
            array.shift();
        }
        // debug(typeof (uid) + " " + uid);
        fmsg.set(uid, array);
    });

    bot.getFriendList().then(function (data) {
        flist = data;
    });
    bot.getGroupList().then(function (data) {
        glist = data;
    });


    console.log("登录完了")
}


const http = require("http");
function handleHttp(req, res) {
    if (req.method == "GET") {
        console.log('[GET] ' + req.url);
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
                debug("好友列表")
                res.setHeader('Content-Type', 'text/plain;charset=utf-8');
                res.end(JSON.stringify(flist));
            }

            if (api[1] == "getGroupList") {
                debug("群列表");
                res.setHeader('Content-Type', 'text/plain;charset=utf-8');
                res.end(JSON.stringify(glist));
            }

            if (api[1] == "getQQ") {
                res.setHeader('Content-Type', 'text/plain;charset=utf-8');
                res.end("" + bot.getQQ());
            }

            if (api[1] == "getFriendMessageList") {
                debug("发送好友消息列表");
                if (api.length >= 3) {
                    let id = Number(api[2]);
                    if (fmsg.has(id)) {
                        let array = fmsg.get(id);
                        res.setHeader('Content-Type', 'text/plain;charset=utf-8');
                        res.end(JSON.stringify(array));
                    }
                }
            }

            if (api[1] == "getGroupMessageList") {
                debug("发送群消息列表");
                if (api.length >= 3) {
                    let id = Number(api[2]);
                    if (gmsg.has(id)) {
                        let array = gmsg.get(id);
                        res.setHeader('Content-Type', 'text/plain;charset=utf-8');
                        res.end(JSON.stringify(array));
                    }
                }
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
            })
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

            // 定义了一个post变量，用于暂存请求体的信息
            var post = '';
            // 通过req的data事件监听函数，每当接受到请求体的数据，就累加到post变量中
            req.on('data', function (chunk) {
                post += chunk;
            });
            // 在end事件触发后，通过querystring.parse将post解析为真正的POST请求格式，然后向客户端返回。
            req.on('end', function () {
                post = JSON.parse(post);
                debug(post);


                if (api == "sendFriendMessage") {
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
                    debug("发出消息")
                    res.setHeader('Content-Type', 'text/plain;charset=utf-8');
                    res.end("ok");
                }

                if (api == "sendGroupMessage") {
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
                    // debug(JSON.stringify(gmsg.get(gid)));
                    debug("发出消息")
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

    debug("登录 QQ : " + setting.qq);
    login();

}

app();
