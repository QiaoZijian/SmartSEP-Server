/**
 * Created by Qiao on 4/14/15.
 */
//客户端用来维护接收回放的类
function replayControl(socket){
    this.studyClass = null; //课程名字，
    this.socket = socket;
    this.status = "realtime" ; //offline, pause, late, chasing，一共5个状态！但offline在status里的意义不大
    this.B_offline = false; //记录是否是离线观看的
    this.fromZeroTo = -1 ; //已经收到的从零开始的连续的
    this.realToWhere = -1; //实时接收的那部分消息收到哪个了
    this.whichToPlay = 0; //该播哪一个了
    this.receivedOPs = []; //已经接收到的数组
    this.timeout = 1000; //追赶进度回放时的间隔
    this.setTimeOutID = null; //记录最近一次setTimeOut这个函数返回的id
}
replayControl.prototype = {
    setStudyClass: function (studyClass) {
        this.studyClass = studyClass;
    },
    getStudyClass: function () {
        return this.studyClass;
    },
    IamLate: function () {
        this.status = "late";
    },
    IamOffline: function () {
        this.status = "offline";
        this.B_offline = true;
        //请求全部数据
        this.request(0,-1);
    },
    realTimeReceive: function (OPmsg) {//接收实时的消息，单个
        //记下该记的，这个是无论哪一种情况都需要记的
        this.realToWhere = OPmsg.sequenceNum ;
        this.receivedOPs[this.realToWhere] = OPmsg.operation ;

        if(this.status == "realtime"){
            //先检查是否真的处于realtime状态
            if((this.fromZeroTo+1) < this.realToWhere){
                this.IamLate();
            }else{
                //是处于realtime状态，
                this.fromZeroTo = OPmsg.sequenceNum;
                this.whichToPlay = this.fromZeroTo; //如果一直是real他意义不大，因为++完应该也会一样的；但从别的状态跳到real可能有用。。。
                this.replay(this.whichToPlay);
                this.whichToPlay ++; //为了暂停之后的开始可以不重复播，播完应该++的，而且++后应该与下一次的fromZeroTo一样
            }
        }else if(this.status == "pause"){
            //收完，更新有的数量，不更新该播哪一个
            //只有realtime下才会有可能pause，所以这个还可以这么写
            this.fromZeroTo = OPmsg.sequenceNum;

        }else if(this.status == "late"){
            //发请求要前面的
            this.status = "chasing";
            this.request(0, this.realToWhere);
        }else if(this.status == "chasing"){
            //追赶实时状态中。。这个时候不允许暂停
            //该收收，不影响已经收到的播放，如果播放是在其他地方控制，这里好像什么也不用做

        }else{
            //offline没有一点实时的接收，不会在这里出现
            console.log("something is wrong with status");
        }
    },
    requestReceive: function (OPmsgArray) {
        //先记下来，只有迟到和离线会用到这个，那么数组的第一个应该就是操作0
        for(var i = 0 ; i < OPmsgArray.length; i++){
            this.receivedOPs[OPmsgArray[i].sequenceNum] = OPmsgArray[i].operation;
        }
        this.whichToPlay = 0 ;
        this.fromZeroTo = OPmsgArray.length-1; //这个不一定要到已有的最后面，充分条件即可
        this.chasingReplay(this.timeout);
    },
    request: function (from, end) {
        //这里可以用ajax问服务器要，而不是问socket要，
        //from,end(不包括end) 或者from,-1是从头到尾
        this.socket.emit('student request', {
            studyClass: this.studyClass,
            from: from,
            end: end
        });
    },
    replay: function (whichToPlay) {//回放whichToPlay操作
        //播放的那个
        $('#messages').append($('<li>').text(this.receivedOPs[whichToPlay]));
    },
    chasingReplay: function (timeout) {//收到信息以后才会调用的，追赶进度的播放,手动控制间隔时间
        if(this.fromZeroTo < this.realToWhere){
            //理论上来说，这里应该已经接上了，所以fromZeroTo应该可以去等于realToWhere了
            this.fromZeroTo = this.realToWhere;
        }
        this.replay(this.whichToPlay);
        this.whichToPlay ++ ;
        if(this.whichToPlay <= this.fromZeroTo){
            if(this.status == "pause"){
                //有东西播，但是被突然叫停就不播了。
                return;
            }else{
                this.setTimeOutID = setTimeout(function (_this) {
                    _this.chasingReplay(timeout);
                }, timeout, this);
            }
        }else{
            //没存款可以播了
            if(this.B_offline){
                this.status = "offline";
                //播放结束，谢谢观看
            }else{
                this.status = "realtime";
                //恭喜赶上进度，继续认真听课吧~
            }
        }
    },
    pause: function (whenWhich) {//暂停回放，只收消息
        //处于realtime状态的才能点击暂停
        this.status = "pause";
        if(this.setTimeOutID){
            clearTimeout(this.setTimeOutID);
        }
    },
    restart: function () {
        this.status = "chasing";
        this.chasingReplay(this.timeout);
    }
};
