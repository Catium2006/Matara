# Matara
`node.js`实现,运行于浏览器的轻量级浏览器QQ前端.  

底层协议为QQ机器人框架 [mirai](https://github.com/mamoe/mirai) , 语言相关API是基于 [mirai-api-http](https://github.com/project-mirai/mirai-api-http) 实现的 [mirai-js](https://github.com/Drincann/Mirai-js)

名字来源于东方Project中的秘神摩多罗

我们是这样工作的:
![](topo.png)

## 许可

使用 `GPL v3` 发布  
查看 [LICENSE](LICENSE)

## 支持的操作
查看 [支持操作列表](FunctionList.md)

## 快速入门
当然, 需要对接 `mirai-api-http` 接口

这里只负责本项目直接相关的配置等操作. 请自行处理 `mirai console` 以及 `mirai-api-http` 的配置.

### 安装

1. 确保安装好了 `node.js` 运行环境  
    如果没有, 请移步 [node.js 下载](https://nodejs.org/)
2. 下载或者克隆仓库, 然后在仓库根目录安装依赖:  
   ```sh
   npm install fs
   npm install http
   npm install js-yaml
   npm install path
   npm install mirai-js
   ```

### 配置

主配置文件为顶级目录下的 `setting.yml` 默认已经配置了模板

给出一个模板:
```yaml
## 注意, 这部分配置文件仅用于连接
## 部分设置与mirai-api-http后端同名配置文件对应项目相同才能连接

## 自行配置好你的 mirai 与 mirai-api-http
## 确保 http://<mirai-api-http所在机器>:<端口>/about 是可访问的

## mirai-api-http的凭据
verifyKey: examplekey

## mirai-api-http的主机
## host字段可以不是ip, 可以使用域名
## host字段可以不与mirai-api-http一致
host: www.example.com

## mirai-api-http的端口
## 非局域网访问需要开启mirai-api-http所在机器对应端口转发
port: 8080

## 要登录的QQ号
qq: 1145141919

localServer:
## 前端开放端口,建议写8000-12000
  port: 8888
## 是否开启调试(控制台输出多)
  debug: false

## 缓存大小(消息条数/会话)
## 建议不超过256
  cacheSize: 64
```

### 使用

1. 在终端运行命令 `node index.js` 启动服务, 控制台将会输出运行信息(或报错)
2. 在浏览器访问 `http://localhost:<你配置的端口>` 

强烈建议**不要**部署在公网上, 本项目将**不会**验证浏览器端使用者的身份.

### UI个性化设置
目前发行版的UI风格类似 `VScode dark theme` .

需要基本的 `html`, `css`, `js` 知识.  
修改 `front/` 目录下对应文件即可.  