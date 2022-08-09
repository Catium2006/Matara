
// 这一部分是前端页面
var isCtrl = 0;
var isEnter = 0;

function createElementWithClass(type, classname) {
    let e = document.createElement(type);
    e.className = classname;
    return e;
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
            // text.appendChild(img);
            div.appendChild(img);
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

function switchFriend(id) {
    isfriend = true;
    isgroup = false;
    curfriend = id;
    curgroup = 0;
    clearChatroom();
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
    getGroupMessageList(id).then(function (data) {
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

function refresh() {
    if (isgroup) {
        switchGroup(curgroup);
    }
    if (isfriend) {
        switchFriend(curfriend);
    }
}

function app() {
    window.onkeydown = keyDown;

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
            let friendList = document.getElementById("friend-list");
            let friendListB = document.getElementById("friend-list-b");
            friendListB.onclick = function (e) {
                if (friendList.style.display == "none") {
                    friendList.style.display = "block";
                } else {
                    friendList.style.display = "none";
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
                friendList.appendChild(row);
            }
        });
    });

    fetch("/api/getGroupList").then(function (res) {
        res.text().then(function (data) {
            // console.log(data);
            let array = JSON.parse(data).data;
            let groupList = document.getElementById("group-list");
            let groupListB = document.getElementById("group-list-b");
            groupListB.onclick = function (e) {
                if (groupList.style.display == "none") {
                    groupList.style.display = "block";
                } else {
                    groupList.style.display = "none";
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
                groupList.appendChild(row);
            }
        });
    });

}

app();
