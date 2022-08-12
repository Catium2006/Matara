
// 这一部分是前端页面
var isCtrl = 0;
var isEnter = 0;

function createElementWithClass(type, classname) {
    let e = document.createElement(type);
    e.className = classname;
    return e;
}

function closeStatus() {
    document.getElementById("status-div").style.display = "none";
}

function showStatus() {
    document.getElementById("status-div").style.display = "block";
}

function getHeadimgSrc(qq, width) {
    let src = "http://q.qlogo.cn/g?b=qq&nk=" + qq + "&s=" + width;
    return src;
}

function getGroupHeadimgSrc(g, width) {
    // https://p.qlogo.cn/gh/(删掉括号内内容替换为qq群号)/(删掉括号内内容替换为qq群号)/640/
    let src = "https://p.qlogo.cn/gh/" + g + "/" + g + "/" + width;
    return src;
}

var botId;
//返回Promise
function getQQ() {
    let promise = fetch("/api/getQQ").then(function (data) {
        botId = data;
        return data;
    });
    return promise;
}

function clearChatroom() {
    document.getElementById("chat-content").replaceChildren();
}

function addMessage(msg, qq) {
    // msg是数组
    let row = document.createElement("div");
    let headimg = createElementWithClass("img", "headimg-left");
    headimg.src = getHeadimgSrc(qq, 100);
    // console.log(headimg);
    row.appendChild(headimg);

    let div = createElementWithClass("div", "message-row");

    for (let i = 0; i < msg.length; i++) {
        if (msg[i].type == "Plain") {
            let t = msg[i].text;
            while (t.search("\r\n") != -1) {
                t = t.replace("\r\n", "<br>");
            }
            let text = createElementWithClass("div", "message-row-text");
            text.innerHTML = t;
            div.appendChild(text);
        }
        if (msg[i].type == "Image") {
            let img = createElementWithClass("img", "chatimg");
            img.src = msg[i].url;
            div.appendChild(img);
        }
        if (msg[i].type == "File") {
            let text = createElementWithClass("div", "message-row-text");
            text.innerHTML = "*上传了一个 [文件] : " + msg[i].name;
            div.appendChild(text);
        }
        if (msg[i].type == "Face") {
            let text = createElementWithClass("div", "message-row-text");
            text.innerHTML = "/" + msg[i].name;
            div.appendChild(text);
        }
        if (msg[i].type == "Quote") {
            let origintext = ' *回复 => "' + msg[i].origin[0].text + '" ';
            let text = createElementWithClass("div", "message-row-text");
            let quote = createElementWithClass("div", "quote");
            quote.innerHTML = origintext;
            text.appendChild(quote);
            div.appendChild(text);
        }
    }
    row.appendChild(div);
    let content = document.getElementById("chat-content");
    content.appendChild(row);
    content.appendChild(document.createElement("br"));
}

var isgroup;
var isfriend;
var curfriend;
var curgroup;

function keyDown(evn) {
    let code = evn.keyCode || evn.which || evn.charCode;
    let input = document.getElementById("input-buffer");
    if (code == 13) {
        isEnter = 1;
    } else if (code == 17) {
        isCtrl = 1;
    } else {
        isCtrl = 0;
        isEnter = 0;
    }
    if (isCtrl == 1 && isEnter == 1) {
        console.log("Ctrl+Enter");
        isCtrl = 0;
        isEnter = 0;
        //然后这时候是发送
        if (input.innerHTML != "") {
            let str = input.innerHTML;
            while (str.search("<div>") != -1) {
                str = str.replace("<div>", "\r\n");
            }
            while (str.search("<br>") != -1) {
                str = str.replace("<br>", "\r\n");
            }
            while (str.search("</div>") != -1) {
                str = str.replace("</div>", "");
            }
            console.log(str);
            // addMyMessage([{ type: "Plain", text: str }]);
            input.innerHTML = "";
            if (isfriend) {
                sendFriendMessage(curfriend, str);
            }
            if (isgroup) {
                sendGroupMessage(curgroup, str);
            }
            update();
        }
    } else if (isCtrl == 1 && isEnter == 0) {
        console.log("Ctrl");
    } else if (isCtrl == 0 && isEnter == 1) {
        console.log("Enter");
    }
}

function sendFriendMessage(id, str) {
    return fetch('/api/sendFriendMessage', {
        method: 'post',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            id: id,
            str: str
        })
    });
}

function sendGroupMessage(id, str) {
    return fetch('/api/sendGroupMessage', {
        method: 'post',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            id: id,
            str: str
        })
    });
}

function getFriendMessageList(qq) {
    return fetch("/api/getFriendMessageList/" + qq).then(function (res) {
        return res.text();
    });
}

function getGroupMessageList(gid) {
    return fetch("/api/getGroupMessageList/" + gid).then(function (res) {
        return res.text();
    });
}

function getFriendMessageListNew(qq) {
    return fetch("/api/getFriendMessageListNew/" + qq).then(function (res) {
        return res.text();
    });
}

function getGroupMessageListNew(gid) {
    return fetch("/api/getGroupMessageListNew/" + gid).then(function (res) {
        return res.text();
    });
}

var friendList;
var groupList;

function switchFriend(id) {
    isfriend = true;
    isgroup = false;
    curfriend = id;
    curgroup = 0;
    clearChatroom();
    for (let i = 0; i < friendList.length; i++) {
        if (friendList[i].id == id) {
            document.getElementById("title").innerHTML = friendList[i].remark;
        }
    }
    getFriendMessageList(id).then(function (data) {
        // console.log(data);
        if (data != "bad") {
            let list = JSON.parse(data);
            for (let i = 0; i < list.length; i++) {
                let remark = list[i].sender.remark;
                let uid = list[i].sender.id;
                let messageChain = list[i].messageChain;
                addMessage(messageChain, uid);
            }
        }
    });
}

function switchGroup(id) {
    isfriend = false;
    isgroup = true;
    curfriend = 0;
    curgroup = id;
    clearChatroom();
    for (let i = 0; i < groupList.length; i++) {
        if (groupList[i].id == id) {
            document.getElementById("title").innerHTML = groupList[i].name;
        }
    }
    getGroupMessageList(id).then(function (data) {
        if (data != "bad") {
            let list = JSON.parse(data);
            for (let i = 0; i < list.length; i++) {
                let uid = list[i].sender.id;
                let messageChain = list[i].messageChain;
                addMessage(messageChain, uid);
            }
        }
    });

}

function getStatus() {
    return fetch("/api/status").then(function (res) {
        return res.text();
    });
}

function update() {
    //先更新消息
    let div = document.getElementById("chat-content");
    let f = (div.scrollTop >= div.scrollHeight - 1000);
    if (isfriend) {
        getFriendMessageListNew(curfriend).then(function (data) {
            // console.log(data);
            if (data != "bad") {
                let list = JSON.parse(data);
                for (let i = 0; i < list.length; i++) {
                    let uid = list[i].sender.id;
                    let messageChain = list[i].messageChain;
                    addMessage(messageChain, uid);
                }
            }
        });
    }
    if (isgroup) {
        getGroupMessageListNew(curgroup).then(function (data) {
            if (data != "bad") {
                let list = JSON.parse(data);
                // console.log(list);
                for (let i = 0; i < list.length; i++) {
                    let uid = list[i].sender.id;
                    let messageChain = list[i].messageChain;
                    addMessage(messageChain, uid);
                }
            }
        });
    }
    if (f) {
        window.setTimeout(
            function () {
                div.scrollTop = div.scrollHeight;
            }, 300
        );
    }
    //然后更新Status
    getStatus().then(function (data) {
        data = JSON.parse(data);
        // console.log(data);
        div = document.getElementById("status-content");
        div.replaceChildren();
        let meminfo = createElementWithClass("div", "status-row");
        meminfo.innerText = "堆内存使用: " + ((data.memory.heapUsed / 1024 / 1024).toFixed(2)) + " / " + ((data.memory.heapTotal / 1024 / 1024).toFixed(2)) + "MB";
        div.appendChild(meminfo);
        let platform = createElementWithClass("div", "status-row");
        platform.innerText = "平台: " + data.platform + " " + data.arch;
        div.appendChild(platform);
        let bot = createElementWithClass("div", "status-row");
        bot.innerText = "Bot: " + data.bot.qq + " " + (data.bot.online == true ? "Online" : "Offline");
        div.appendChild(bot);
    });
}

function app() {
    window.onkeydown = keyDown;

    document.getElementById("myHeadimg").onclick = function () {
        showStatus();
    };
    document.getElementById("myHeadimg").onmouseenter = function () {
        document.getElementById("myHeadimg").style.filter = "opacity(30%)";
    }
    document.getElementById("myHeadimg").onmouseleave = function () {
        document.getElementById("myHeadimg").style.filter = "";
    }


    fetch("/api/getQQ").then(function (res) {
        res.text().then(function (data) {
            console.log(data);
            document.getElementById("myHeadimg").src = getHeadimgSrc(data, 100);
        });
    });

    fetch("/api/getFriendList").then(function (res) {
        res.text().then(function (data) {
            // console.log(data);
            let array = JSON.parse(data);
            friendList = array;
            let friendListDiv = document.getElementById("friend-list");
            let friendListB = document.getElementById("friend-list-b");
            friendListB.onclick = function (e) {
                if (friendListDiv.style.display == "none") {
                    friendListDiv.style.display = "block";
                } else {
                    friendListDiv.style.display = "none";
                }
            }
            for (let i = 0; i < array.length; i++) {
                // console.log(array[i]);
                let row = createElementWithClass("div", "sidebar-row");
                let img = createElementWithClass("img", "headimg-left");
                img.src = getHeadimgSrc(array[i].id, 100);
                let text = createElementWithClass("div", "sidebar-row-text");
                let remark = array[i].remark;
                // if (remark.length > 10) {
                //     // remark = remark.substring(0, 10) + "...";
                // }
                text.textContent = remark;
                row.appendChild(img);
                row.appendChild(text);
                row.onmouseover = function (e) {
                    row.style.backgroundColor = "#333333";
                }
                row.onmouseout = function (e) {
                    row.style.backgroundColor = "#2a2a2a";
                }
                row.onclick = function (e) {
                    switchFriend(array[i].id);
                    window.setTimeout(function () {
                        let div = document.getElementById("chat-content");
                        div.scrollTop = div.scrollHeight;
                    }, 300);
                }
                friendListDiv.appendChild(row);
            }
        });
    });

    fetch("/api/getGroupList").then(function (res) {
        res.text().then(function (data) {
            // console.log(data);
            let array = JSON.parse(data).data;
            groupList = array;
            let groupListDiv = document.getElementById("group-list");
            let groupListB = document.getElementById("group-list-b");
            groupListB.onclick = function (e) {
                if (groupListDiv.style.display == "none") {
                    groupListDiv.style.display = "block";
                } else {
                    groupListDiv.style.display = "none";
                }
            }
            // console.log(array);
            for (let i = 0; i < array.length; i++) {
                let row = createElementWithClass("div", "sidebar-row");
                let img = createElementWithClass("img", "headimg-left");
                img.src = getGroupHeadimgSrc(array[i].id, 40);
                let text = createElementWithClass("div", "sidebar-row-text");
                let remark = array[i].name;
                text.textContent = remark;
                row.appendChild(img);
                row.appendChild(text);
                row.onmouseover = function (e) {
                    row.style.backgroundColor = "#333333";
                }
                row.onmouseout = function (e) {
                    row.style.backgroundColor = "#2a2a2a";
                }
                row.onclick = function (e) {
                    switchGroup(array[i].id);
                    window.setTimeout(function () {
                        let div = document.getElementById("chat-content");
                        div.scrollTop = div.scrollHeight;
                    }, 300);
                }
                groupListDiv.appendChild(row);
            }
        });
    });

    window.setInterval(update, 1333);

}

app();
