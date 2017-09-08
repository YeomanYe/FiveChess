//获取鼠标点击canvas2的相对鼠标坐标
var mouse;
//行数和列数,棋子的行数和列数
var rowNum, colNum;
//绘制环境1和2,2在上
var ctx1, ctx2;
//绘制宽高
var canWidth, canHeight;
//棋子大小
var piecesSize = 20;
//代表棋盘上每个点的状态,0:无棋子,1:白棋,-1:黑棋
var envirStatus;
//当前玩家,1:白方,-1:黑方
var player;
//准备完成标志位
var isReady = false;
//记录每一步落棋的位置
var pStack;
//游戏结束标志位
var isOver;
//AI玩家
var aiPlayer = 1;
//模式,0:双人,1:单人
var mode = 1;
//每一个格子各方向的连子状态,1:白棋,0:黑棋
var chessStatus;
//屏幕宽高;
var screenWidth, screenHeight;
// 步数,开始时间
var stepCount, startTime;

window.onload = function() {
    var canvas1 = document.getElementById("canvas1"),
        canvas2 = document.getElementById("canvas2");

    ctx1 = canvas1.getContext("2d");
    ctx2 = canvas2.getContext("2d");

    screenWidth = window.innerWidth;
    screenHeight = window.innerHeight;

    var $wrap = $("#wrap"),
        minSize = 0,
        maxSize = 0;
    var $control = $("#control");
    if (screenWidth > screenHeight) {
        minSize = screenHeight;
        maxSize = screenWidth;
        var diffValue = maxSize - minSize;
        $wrap.css("margin-left", diffValue / 2 + "px");
        $control.css("left", diffValue / 2 + minSize + "px");
        $control.css("height", Number.parseInt((minSize) / piecesSize) * piecesSize + "px");
    } else {
        piecesSize = 35;
        minSize = screenWidth;
        maxSize = screenHeight;
        var diffValue = maxSize - minSize;
        $wrap.css("margin-top", diffValue / 2 + "px");
        // 设置状态栏样式
        var $status = $("#status");
        $status.css("height", diffValue / 2 + "px");
        $status.css("width", minSize + "px");
        var $spans = $("#status p span");
        $spans.css("font-size", diffValue / 8 + "px");
        $spans.css("padding", diffValue / 6 + "px");
        $spans.eq(0).css("padding-left", "20px");
        // 设置移动版控制面板样式
        $control.css("top", diffValue / 2 + minSize + "px");
        $control.css("height", diffValue / 2 + "px");
        $control.css("width", minSize + "px");

        var $lis = $("#control li");
        $lis.css("width", minSize / 4 + "px");
        $lis.css("font-size", diffValue / 20 + "px");
        $lis.css("margin", "2% 0");
        $lis.css("float", "left");
    }
    canWidth = canHeight = Number.parseInt((minSize) / piecesSize) * piecesSize;
    canvas1.width = canWidth;
    canvas1.height = canWidth;
    canvas2.width = canWidth;
    canvas2.height = canWidth;


    mouse = captureMouse($wrap.get(0));

    rowNum = canHeight / piecesSize;
    colNum = canWidth / piecesSize;

    //获取并设置各个按钮的效果
    var singleBtn = document.getElementById("single"),
        doubleBtn = document.getElementById("double"),
        backBtn = document.getElementById("back"),
        resetBtn = document.getElementById("reset");
    singleBtn.addEvent("click", function() {
        aiPlayer = 0;
    });
    doubleBtn.addEvent("click", function() {
        aiPlayer = 1;
    });
    backBtn.addEvent("click", function() {
        var obj = {};
        if (!pStack.length) return;
        //ai存在退两步
        if (aiPlayer) {
            obj = pStack.pop();
            envirStatus[obj.x][obj.y] = 0;
        }
        obj = pStack.pop();
        envirStatus[obj.x][obj.y] = 0;
        //如果退到了最后一步棋
        if (!pStack.length) {
            //必须加，设置了false就退出绘制了
            ctx2.clearRect(0, 0, canWidth, canHeight);
            isReady = false;
        } else {
            //擦除倒数第三颗并重新绘制
            obj = pStack.pop();
            envirStatus[obj.x][obj.y] = 0;
            player = aiPlayer ? -player : player;
            mouse.x = obj.x * piecesSize + piecesSize / 2;
            mouse.y = obj.y * piecesSize + piecesSize / 2;
        }
        // 返回步数
        if(aiPlayer){
            stepCount -= 2;
        }else{
            stepCount --;
        }
        stepCount == stepCount > 0 ? stepCount : 0;
    });
    resetBtn.addEvent("click", function(e) {
        ctx2.clearRect(0, 0, canWidth, canHeight);
        stepCount = 0;
        startTime = null;
        $("#gameTime").html("时间");
        $("#stepCount").html("步数");
        game();
    });
    //黑棋先下
    player = -1;
    
    canvas2.addEvent("click", function() {
        isReady = true;
    });
    game();
};

function game() {
    gameInit();
    gameLoop();
}
//游戏初始化
function gameInit() {
    drawChessboard(ctx1);
    //初始化环境数组
    envirStatus = new Array(rowNum);
    var i, j;
    for (i = 0; i < rowNum; i++) {
        envirStatus[i] = new Array(colNum);
        for (j = 0; j < colNum; j++) {
            envirStatus[i][j] = 0;
        }
    }
    //初始化格子状态数组
    var l;
    chessStatus = new Array(rowNum);
    for (i = 0; i < rowNum; i++) {
        chessStatus[i] = new Array(colNum);
        for (j = 0; j < colNum; j++) {
            chessStatus[i][j] = new Array(2);
            for (l = 0; l < 2; l++) {
                chessStatus[i][j][l] = 0;
            }
        }
    }

    //初始化玩家
    player = -1;
    //初始化棋栈
    pStack = [];
    //ai下一步棋
    aiNextStep = [];
    //ai的最大连子数
    aiMaxCont = 0;
    //ai的优先级
    aiPriority = 0;
    //游戏结束标志
    isOver = false;
    isReady = false;

    $("#canvas2").one("click",function(){
        startTime = new Date().getTime();
        stepCount = 0;
        isReady = true;
    })
}

var animFrame;
//游戏主循环
function gameLoop() {
    cancelAnimationFrame(animFrame);
    if (isOver) return;
    animFrame = requestAnimationFrame(gameLoop);
    if (!isReady) return;
    // 步数，时间
    $("#stepCount").html("步数 " + stepCount);
    $("#gameTime").html("时间 " + calTime())
    var x = Math.round(mouse.x / piecesSize - 0.5),
        y = Math.round(mouse.y / piecesSize - 0.5);
    if (!envirStatus[x][y]) {
        envirStatus[x][y] = player;
        var obj = { x: x, y: y };
        pStack.push(obj);
        player = player === 1 ? -1 : 1;
        if (player === -1) {
            stepCount++;
        }
    }
    drawPieces(ctx2, function() {
        if (checkOver()) {
            gameOver();
        }
        if (player === aiPlayer && mode) {
            AIPlay();
            recursiveCont = 0;
        }
    });
}
// 计算用时
function calTime() {
    var curTime = new Date().getTime(),
        useTime = (curTime - startTime) / 1000,
        second = Number.parseInt(useTime % 60),
        minute = Number.parseInt(useTime / 60 % 60),
        secondStr = "",
        minuteStr = "";
    if (second < 10) secondStr = "0";
    if (minute < 10) minuteStr = "0";
    secondStr += second;
    minuteStr += minute;
    return minuteStr + ":" + secondStr;
}
//绘制棋盘
function drawChessboard(ctx) {
    //绘制开始点，结束点
    var xStart = piecesSize / 2,
        xEnd = canWidth - piecesSize / 2,
        yStart = piecesSize / 2,
        yEnd = canHeight - piecesSize / 2;
    var i = 0,
        len;
    ctx.beginPath();
    for (i = 0, len = (xEnd - xStart) / piecesSize; i <= len; i++) {
        ctx.moveTo(xStart + i * piecesSize, yStart);
        ctx.lineTo(xStart + i * piecesSize, yEnd);
    }
    for (i = 0, len = (yEnd - yStart) / piecesSize; i <= len; i++) {
        ctx.moveTo(xStart, yStart + i * piecesSize);
        ctx.lineTo(xEnd, yStart + i * piecesSize);
    }
    //绘制背景
    ctx.fillStyle = "#EA991C";
    ctx.closePath();
    ctx.fillRect(0, 0, canWidth, canHeight);
    ctx.stroke();
}
/**
 * 根据棋盘状态绘制棋子
 * @param  {contect}   ctx      绘制的上下文
 * @param  {function} callback 回调函数
 * @return {void}            无返回值
 */
function drawPieces(ctx, callback) {
    ctx.beginPath();
    //清空之前的绘制便于悔棋
    ctx.clearRect(0, 0, canWidth, canHeight);
    ctx.closePath();
    var i, j;
    for (i = 0; i < rowNum; i++) {
        for (j = 0; j < colNum; j++) {
            if (envirStatus[i][j] === 1) {
                ctx.beginPath();
                ctx.fillStyle = "white";
                ctx.arc(piecesSize / 2 + i * piecesSize, piecesSize / 2 + j * piecesSize, piecesSize / 2, 0, 2 * Math.PI);
                ctx.closePath();
                ctx.fill();
            } else if (envirStatus[i][j] === -1) {
                ctx.beginPath();
                ctx.fillStyle = "black";
                ctx.arc(piecesSize / 2 + i * piecesSize, piecesSize / 2 + j * piecesSize, piecesSize / 2, 0, 2 * Math.PI);
                ctx.closePath();
                ctx.fill();
            }
        }
    }
    if (typeof callback === "function") {
        callback();
    }
}

var aiPrefabArr = [],
    maxContX, maxContY;
var recursiveCont = 0;

//AI落子
function AIPlay() {
    //检测一行的参数数组
    var argArr = [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: -1, y: 1 }];
    var x, y, k, i, j;
    var maxX, maxY, priority = 0,
        maxCont = 0,
        count = 0;
    var obj = null;

    //ai超前判断
    //计算出每一个点的最大连子数
    for (x = 0; x < rowNum; x++) {
        for (y = 0; y < colNum; y++) {
            for (k = 0; k < 2; k++) {
                for (len = argArr.length, i = 0; i < len; i++) {
                    var pType = k ? 1 : -1;
                    if (envirStatus[x][y] === 0)
                        obj = checkLine(x, y, argArr[i].x, argArr[i].y, pType);
                    if (obj) {
                        //对于当前这步棋进行评分
                        if (obj.count >= 4) obj.count = 1000;
                        else if (obj.count >= 3 && !obj.jam) obj.count = 500;
                        else if (obj.count >= 3 && obj.jam === 1) obj.count = 100;
                        else if (obj.count >= 2 && !obj.jam) obj.count = 10;
                        else if (obj.count >= 2 && obj.jam === 1) obj.count = 2;
                        else if (obj.count === 1 && !obj.jam) obj.count = 1;
                        else obj.count = 0;
                        count += obj.count;
                    }
                    obj = null;
                }
                if (maxCont <= count) {
                    // priority = obj.priority;
                    maxCont = count;
                    maxX = x;
                    maxY = y;
                    chessStatus[x][y][k] = maxCont;
                }
                count = 0;
            }
        }
    }

    mouse.x = (maxX + 0.5) * piecesSize;
    mouse.y = (maxY + 0.5) * piecesSize;
}
//检测一行连接的情况
function checkLine(x, y, argX, argY, pType) {
    var i;
    var obj = {
        count: 0,
        jam: 0
    };
    var space = 0;
    for (i = 1; i < 5; i++) {
        if (x + i * argX <= colNum - 1 && x + i * argX >= 0 && y + i * argY <= rowNum - 1 && envirStatus[x + i * argX][y + i * argY] === pType) {
            obj.count++;
        } else {
            if (x + i * argX <= colNum - 1 && x + i * argX >= 0 && y + i * argY <= rowNum - 1 && envirStatus[x + i * argX][y + i * argY]) {
                obj.jam++;
            }
            //反方向检测
            for (i = 1; i < 5; i++) {
                if (x - i * argX >= 0 && x - i * argX <= colNum - 1 && y - i * argY >= 0 && envirStatus[x - i * argX][y - i * argY] === pType) {
                    obj.count++;
                } else {
                    if (x - i * argX >= 0 && x - i * argX <= colNum - 1 && y - i * argY >= 0 && envirStatus[x - i * argX][y - i * argY]) {
                        obj.jam++;
                    }
                    break;
                }
            }
            break;
        }
    }
    return obj;
}
/*检测游戏是否结束*/
function checkOver() {
    //获取最后一步落棋的位置，类型
    var len = pStack.length,
        x = pStack[len - 1].x,
        y = pStack[len - 1].y,
        pType = envirStatus[x][y],
        //返回值
        ret = false,
        count = 0; //计连子数
    var i, obj = null;
    //检测一行的参数数组
    var argArr = [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: -1, y: 1 }];
    for (len = argArr.length, i = 0; i < len; i++) {
        obj = checkLine(x, y, argArr[i].x, argArr[i].y, pType);
        //当前游戏者是玩家
        if (obj.count >= 4) ret = true;
        if (player !== aiPlayer) {
            if (count <= obj.count) {
                count = obj.count;
                aiMaxCont = obj.count;
            }
        }
    }
    return ret;
}
//游戏结束
function gameOver() {
    var dialog = document.createElement("div"),
        dialogStyle = {
            width: 100 + "px",
            height: 80 + "px",
            border: "1px solid black",
            position: "absolute",
            top: getWindowSize().height / 2 - 25 + "px",
            left: getWindowSize().width / 2 - 50 + "px",
            lineHeight: 40 + "px",
            fontSize: "15px",
            textAlign: "center",
            backgroundColor: "white",
        };
    var okBtn = document.createElement("input");
    okBtn.value = "确定";
    okBtn.type = "button";
    var okBtnStyle = {
        width: 60 + "px",
        height: 30 + "px"
    };
    okBtn.onclick = function(e) {
        var event = e || window.event,
            elem = event.currentTarget,
            parent = elem.parentNode;
        parent.parentNode.removeChild(parent);
        ctx2.clearRect(0, 0, canWidth, canHeight);
        stepCount = 0;
        startTime = null;
        $("#gameTime").html("时间");
        $("#stepCount").html("步数");
        game();
    };
    okBtn.setStyle(okBtnStyle);
    dialog.setStyle(dialogStyle);
    if (player === -1) {
        dialog.innerText = "白方胜";
    } else {
        dialog.innerText = "黑方胜";
    }
    dialog.appendChild(okBtn);
    isOver = true;
    document.body.appendChild(dialog);
}