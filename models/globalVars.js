/**
 * Created by Qiao on 4/13/15.
 */
/**
 * 维护一个大家都能访问的在线用户socketid与其name及所在room的映射关系
 * 还有room类和user类
 */
exports.RoomManager = [];
exports.Room = Room;
exports.User = User;
var schedule = require("node-schedule");    //有一个定时执行的操作，推送状态
//制定推送规则
var rule = new schedule.RecurrenceRule();   //新建一个规则
var times = [];
for(var i=1; i<60; i=i+2){    //每2秒推送一次
    times.push(i);
}
rule.second = times;    //制定好规则

//创建一个Room类，便于处理房间操作（房间就是一个课程，课程会有自己的状态）
function Room(roomName, teacher, operator, speaker) {
    this.roomName = roomName;
    this.teacher = teacher;
    this.operator = operator;
    this.speaker = speaker;
    this.users = new Object();
    //下划线+userID作为users[]的index，即this.users[_12345]就是某个用户
    this.status = 0; //0:Coming soon, 1:ING, 2:Already finished
    this.opNums = 0; //记现在这个room有几个操作了
}
Room.prototype = {
    addUser: function (newUser, socket) {
        this.users["_"+newUser.userID] = newUser;
    },
    hasUser: function (UserID) {
        return this.users.hasOwnProperty("_"+UserID);
    },
    deleteUser: function (delUserID, socket) {
        delete(this.users["_"+delUserID]);
    },
    findUserSocket: function (UserID) {
        if(this.hasUser(UserID)){
            return this.users["_"+UserID].socketID;
        }else{
            console.log("no this user");
        }
    },
    setOpNums: function (num) {
        this.opNums = num;
    },
    changeStatus: function (newStatus, socket) {
        this.status = newStatus;
        if(newStatus == 1){
            //开课
        }else if(newStatus == 2){
            //结课
        }else{
            //reset 一门课之后可能会这样
        }
    },
    changeOperator: function (newOperatorID, socket) {
        //操作者
//        console.log("operator"+ newOperatorID);
        if(typeof newOperatorID === "string" && this.hasUser(newOperatorID)){
            //如果是string的话，传来的就是userID了
            var tmpUser = this.users["_"+newOperatorID];
            var newOperator = {};
            newOperator.userID = tmpUser.userID;
            newOperator.info = tmpUser.nickname+"("+tmpUser.userID+")";
        }else{
            console.log("something wrong in change operator/speaker");
        }
        this.operator = newOperator.userID;
        socket.broadcast.to(this.roomName).emit('changeOperator', newOperator);
    },
    changeSpeaker: function (newSpeakerID, socket) {
        //说话者
        if(typeof newSpeakerID === "string" && this.hasUser(newSpeakerID)){
            //如果是string的话，传来的就是userID了
            var tmpUser = this.users["_"+newSpeaker];
            var newSpeaker = {};
            newSpeaker.userID = tmpUser.userID;
            newSpeaker.info = tmpUser.nickname+"("+tmpUser.userID+")";
        }else{
            console.log("something wrong in change operator/speaker");
        }
        this.speaker = newSpeaker.userID;
        socket.broadcast.to(this.roomName).emit('changeSpeaker', newSpeaker);
    },
    pushUsersStatus: function (io) { //老师进房子带来的socket
        var _this=this;
        //定时推送所有用户的当前的状态
        var pushStatus = schedule.scheduleJob(rule, function () {
            usersStatus = {};
            for (userID in _this.users){
                //played 是序列，从0开始。  opNums是个数，从1开始。
                usersStatus[userID] = _this.users[userID].played == _this.opNums-1 ? 1 : 0; //0是没追上，1是同步了
            }
            if(usersStatus){
                //非空的usersstatus再发，可能是因为异步有问题
                io.in(_this.roomName).emit('usersStatus', usersStatus);
            }
        });
    }
};
//创建一个User类，便于处理用户操作，学生或者老师新进一个课的时候都会生成相应的新user
function User(socketID, userID, nickname, role, room, head) {
    this.socketID = socketID;   //自己的socket
    this.userID = userID;
    this.nickname = nickname;
    this.role = role;
    this.head = null;
    this.room = room;
    this.played = -1;   //这个user在这个房间里播到第几条了
}

