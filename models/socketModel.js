/**
 * Created by Qiao on 4/12/15.
 */
var Class = require('../mongoModel').Class;
var globalVars = require('./globalVars.js');
var RoomManager = globalVars.RoomManager;
var Room = globalVars.Room;
var User = globalVars.User;
/*
  实时传操作消息的时候是一个 OPmsg
  OPmsg的结构是
  {
    sequenceNum: Number,    //序号编码从0开始
    operation: String
  }

 而回应学生请求的消息时，传的时OPmsgArray， 注意是一个array
 传了几条消息由array.length可以得到，每个OPmsg跟上面是一样的
*/
var serveModel = require('./serveModel.js');

module.exports = function (io){
    io.on('connection', function(socket){
        //console.log(socket.id + "on");
        //老师创建课程
        socket.on('createClass' , function(msg){
            var newRoom = new Room(msg.room, msg.userID, msg.userID, msg.userID);
            //课程一旦创建，就开始循环推送
//            newRoom.pushUsersStatus();
            RoomManager[msg.room] = newRoom;
            //创建room的时候就把老师加进这个room
            var newUser = new User(socket.id, msg.userID, msg.name, msg.role, msg.room);
            RoomManager[msg.room].addUser(newUser);
            //给这个socket起个别名
            socket.userID = msg.userID;
            socket.room = msg.room;
            socket.join(msg.room);
            //console.log(RoomManager);
        });

        //老师进入课程界面
        socket.on('enterClass' , function(msg){
            var newUser = new User(socket.id, msg.userID, msg.name, msg.role, msg.room);
            if(RoomManager[msg.room]) {
                //有这个room的话
                //如果没有这个用户
                if (!RoomManager[msg.room].hasUser(newUser.userID)) {
                    RoomManager[msg.room].addUser(newUser);
                }
            }else{
                //没这个room就要建room，这个情况只要服务器不重启，应该不会发生
                var newRoom = new Room(msg.room, msg.userID, msg.userID, msg.userID);
                RoomManager[msg.room] = newRoom;
                RoomManager[msg.room].addUser(newUser);
            }
            RoomManager[msg.room].pushUsersStatus(io);
            //无论如何都join一下，并且给这个socket起个别名
            socket.userID = msg.userID;
            socket.room = msg.room;
            serveModel.getOpsNum(socket.room , function (num) {
                RoomManager[socket.room].setOpNums(num);
                socket.join(msg.room, function () {
                    socket.emit('usersList',RoomManager[msg.room]);
                    socket.broadcast.to(msg.room).emit('someOneCome', newUser);
                });
            });
//          console.log(RoomManager);
        });
        //老师开始授课
        socket.on('startClass', function () {
            socket.broadcast.to(socket.room).emit('classStart');
        });
        //老师结束授课
        socket.on('endClass', function () {
            socket.broadcast.to(socket.room).emit('classEnd');
        });
        //老师重建课程
        socket.on('resetClass' , function(msg){
            //更新之前的room，完全reset
            var newRoom = new Room(msg.room, msg.userID, msg.userID, msg.userID);
            RoomManager[msg.room] = newRoom;

            //给这个socket起个别名
            //teacher 有可能不在了，房子没有了怎么办
            socket.userID = msg.userID;
            socket.room = msg.room;
            socket.join(msg.room);
          //  console.log(RoomManager);
        });

        //学生加入某门课
        socket.on('joinClass' , function(msg){
            var newUser = new User(socket.id, msg.userID, msg.name, msg.role, msg.room);
            //teacher 有可能不在了，内存中的room有可能没有了，但只要创建过的数据库里都有,读出来
            if(RoomManager[msg.room]){
                RoomManager[msg.room].addUser(newUser);
                //给这个socket起个别名
                socket.userID = msg.userID;
                socket.room = msg.room;
                socket.join(msg.room, function () {
                    //这里可以利用已经有的OpNums做迟到者
                    socket.emit('usersList',RoomManager[msg.room]);
                    socket.broadcast.to(msg.room).emit('someOneCome', newUser);
                    console.log(RoomManager[msg.room]);
                });
            }else{
                serveModel.findRoomTeacher(msg.room , function (teacherID) {
                    var newRoom = new Room(msg.room, teacherID, teacherID, teacherID);
                    RoomManager[msg.room] = newRoom;
                    RoomManager[msg.room].addUser(newUser);
                    //给这个socket起个别名
                    socket.userID = msg.userID;
                    socket.room = msg.room;
                    socket.join(msg.room, function () {
                        //这里可以利用已经有的OpNums做迟到者
                        socket.emit('usersList',RoomManager[msg.room]);
                        socket.broadcast.to(msg.room).emit('someOneCome', newUser);
                    });
                });
            }
//            console.log(RoomManager);
        });

        //change控制权
        socket.on('changeOperator' , function (newOperator) {
            //room newOperator
            RoomManager[socket.room].changeOperator(newOperator, socket);
        });
        socket.on('changeSpeaker' , function (newSpeaker) {
            //room newSpeaker
            RoomManager[socket.room].changeSpeaker(newSpeaker, socket);
        });

        //申请控制权
        socket.on('applyOperator', function (stuID) {
//            console.log('applyOperator'+stuID);
            socket.broadcast.to(RoomManager[socket.room]
                .findUserSocket(RoomManager[socket.room].teacher)).emit('stuApplyOperator', stuID);
        });
        socket.on('applySpeaker', function (stuID) {
            socket.broadcast.to(RoomManager[socket.room]
                .findUserSocket(RoomManager[socket.room].teacher)).emit('stuApplySpeaker', stuID);
        });
        //归还控制权，与change控制权类似，change给老师而已
        socket.on('returnOperator' , function () {
            RoomManager[socket.room].changeOperator(RoomManager[socket.room].teacher, socket);
        });
        socket.on('returnSpeaker' , function () {
            RoomManager[socket.room].changeSpeaker(RoomManager[socket.room].teacher, socket);
        });

        //离开某门课程
        socket.on('leaveClass' , function(){
            RoomManager[socket.room].deleteUser(socket.userID);
            socket.leave(socket.room, function () {
                socket.broadcast.to(socket.room).emit('someOneLeave', socket.userID);
            });
//            console.log(RoomManager);
        });
        //离开整个系统
        socket.on('disconnect', function () {
            if(socket.room){
                //进过某个课程，断开时才有离开课程的概念
                if(RoomManager[socket.room].teacher == socket.userID){
                    //如果是老师的话
                    //老师离开的话有什么不一样的吗？

                }else{//如果是学生的话
                    // 如果是operator或者是speaker要归还一下
                    if(RoomManager[socket.room].operator == socket.userID){
                        RoomManager[socket.room].changeOperator(RoomManager[socket.room].teacher, socket);
                    }
                    if(RoomManager[socket.room].speaker == socket.userID){
                        RoomManager[socket.room].changeOperator(RoomManager[socket.room].teacher, socket);
                    }
                }
                socket.leave(socket.room, function () {
                    RoomManager[socket.room].deleteUser(socket.userID);
                    socket.broadcast.to(socket.room).emit('someOneLeave', socket.userID);
                });
            }
        });

        //学生or播放者的反馈
        socket.on('have played', function (ack) {
            console.log(ack);
            //哪个房间的谁谁谁(userID)，播到第几条了(played)。因为socket自带room，所以ack不需要房间了
            RoomManager[socket.room].users["_"+ack.userID].played = ack.played;
        });
        //存储并发给所有人
        socket.on('operator dos', function (operation) {
            //console.log(operation);
            //存进数据库，emit 实时event 发给同一room的所有小伙伴
            serveModel.saveOperation(socket.room, RoomManager[socket.room].opNums++, operation, function (Op) {
                //TODO:不一定存储能保证有序
                io.in(socket.room).emit('real back', Op);
            });
        });

        socket.on('student request', function (rangeInfo) {
            //console.log("request here");
            serveModel.getOperations(rangeInfo, function (Ops) {
                socket.emit('request back', Ops);
                console.log('send back');
            });
        });


    });
};