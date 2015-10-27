/**
 * Created by Qiao on 4/12/15.
 */
var Class = require('../mongoModel').Class;
var globalVars = require('./globalVars.js');
var RoomManager = globalVars.RoomManager;
var fs = require("fs");
exports.getChatPage = function(req, res){
    res.render('chat');
};
exports.getStuPage = function(req, res){
    res.render('student');
};
exports.getTeaPage = function(req, res){
    res.render('teacher');
};
exports.getClasses = function (req, res) {
    Class
        .find({})
        .sort('status')
        .select('byWho byWhoID className status')
        .exec(function (err, classes) {
            if(err){
                console.log("find class error")
            }else{
                res.send({
                    status: "success",
                    classes: classes
                });
            }
        });
};
exports.getMyClasses = function (req, res) {
    //console.log(req.query.teaID);
    Class
        .find({byWhoID: req.query.teaID})
        .sort('status')
        .select('byWho byWhoID className status')
        .exec(function (err, classes) {
            if(err){
                console.log("find class error")
            }else{
                res.send({
                    status: "success",
                    classes: classes
                });
            }
        });
};

exports.submitClass = function(req, res){
    //老师一旦创建一门课，数据库里就有
    Class.findOne({
        className: req.body.className,
        byWho: req.body.byWho}, function (err, _class) {
        if(err){
            console.log("err in find class");
        }else{
            if(_class){
                //reset
                _class.status = 0 ;
                _class.operations = [];
                _class.save(function (err) {
                    if(err){
                        console.log("save err in class");
                    }else{

                        res.send({
                            status:"resetSuccess"
                        });
                    }
                })
            }else{
                var studyClass = new Class({
                    className: req.body.className,
                    byWhoID: req.body.byWhoID,
                    byWho: req.body.byWho
                });
                studyClass.save(function (err) {
                    if(err){
                        console.log("class save error");
                    }else{
                        res.send({
                            status: "createSuccess"
                        });
                    }
                });
            }
        }
    });
};
exports.startClass = function (req, res) {
    var studyClass = req.body;
    Class.findOne({
        className: studyClass.className,
        byWho: studyClass.byWho}, function (err, _class) {
        if(err){
            console.log("find class error")
        }else{
            _class.status = 1;
            _class.save(function (err) {
                if(err){
                    console.log("status save err");
                }else{
                    res.send({
                        status: "success"
                    });
                }
            });
        }
    });
};
exports.endClass = function (req, res) {
    var studyClass = req.body;
    Class.findOne({
        className: studyClass.className,
        byWho: studyClass.byWho}, function (err, _class) {
        if(err){
            console.log("find class error")
        }else{
            _class.status = 2;
            _class.save(function (err) {
                if(err){
                    console.log("status save err");
                }else{
                    res.send({
                        status: "success"
                    });
                }
            });
        }
    });
};

//exports.stuRequest = function (req, res) {
//}


//后面是服务器端socket那边发来的请求，
exports.findRoomTeacher = function (studyClass, callback) {
    var className = studyClass.split("::")[0];
    var byWho = studyClass.split("::")[1];
    Class.findOne({
        className: className,
        byWho: byWho}, function (err, _class) {
        if(err){
            console.log("find class error")
        }else{
            callback(_class.byWhoID);
        }
    });
};
exports.saveOperation = function (studyClass, OpSeq, OpMsg, callback) {
    var className = studyClass.split("::")[0];
    var byWho = studyClass.split("::")[1];
    Class.findOne({
        className: className,
        byWho: byWho}, function (err, _class) {
        if(err){
            console.log("find class error")
        }else{
            var Op = {
                sequenceNum: OpSeq,
                operation: OpMsg
            };
            _class.operations.push(Op);
            _class.save(function (err) {
                if(err){
//                    console.log("status save err");
                }else{
                    console.log(Op.sequenceNum+"save ok");
                    callback(Op);
                }
            });
        }
    });
};
exports.getOpsNum = function (studyClass, callback) {
    var className = studyClass.split("::")[0];
    var byWho = studyClass.split("::")[1];
    Class.findOne({
        className: className,
        byWho: byWho}, function (err, _class) {
            if(err){
                console.log("find class error")
            }else{
                callback(_class.operations.length);
            }
    });
};
exports.getOperations = function (rangeInfo, callback) {
    var className = rangeInfo.studyClass.split("::")[0];
    var byWho = rangeInfo.studyClass.split("::")[1];
    Class.findOne({
        className: className,
        byWho: byWho}, function (err, _class) {
        if(err){
            console.log("find class error")
        }else{
            if(rangeInfo.end < 0){
                rangeInfo.end = _class.operations.length;
            }
            var tmp = [];
            for(var i = rangeInfo.from ; i < rangeInfo.end ; i++){
                tmp.push(_class.operations[i]);
            }
            callback(tmp);
        }
    });
};

/*
    为了把数据库导出到文件，做的操作
 */
exports.getClassesPage = function (req, res) {
    res.render("class");
};
exports.getOneClassFile = function (req, res) {
    var className = req.query.className;
    var byWho = req.query.byWho;
//    console.log(req.query);
    Class.findOne({
        className: className,
        byWho: byWho}, function (err, _class) {
        if(err){
            console.log("find class error")
        }else{
            var tmp = [];
            for(var i = 0 ; i < _class.operations.length ; i++){
                tmp.push(_class.operations[i].operation);
            }
            res.send({
                status: "success",
                result: JSON.stringify(tmp)
            });
        }
    });
};