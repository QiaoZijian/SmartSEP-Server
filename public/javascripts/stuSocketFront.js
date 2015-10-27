/**
 * Created by Qiao on 4/12/15.
 */

$(document).ready(function () {

    var classStatus = ["IN A MOMENT","ING","ALREADY FINISHED"];
    //打开这个页面就自动执行这段代码
    jQuery.ajax({
        url:'/getClasses',
        type:'get',
        success:function(response){
            //console.log(response);
            if(response.status == "success"){
                var classes = response.classes;
                for(var i = 0 ; i < classes.length ; i++){
                    var classInfo = classes[i].className+"::"+classes[i].byWho+"::";
                    classInfo += classStatus[classes[i].status];
                    var $li = $('<li>').text(classInfo).data(classes[i]);
                    $li.append($('<button class="list">').text("choose"));
                    $('#classes').append($li);
                }
            }
            else{
                console.log("somewhere error!")
            }
        },
        error:function(response){
            console.log(response);
        }
    });

    var socket = io();

    test = new replayControl(socket);

    socket.on('someOneConnect', function (msg) {
        $('#messages').append($('<li>').text(msg));
    });
    socket.on('someOneDisconnect', function (msg) {
        $('#messages').append($('<li>').text(msg));
    });
//
//    socket.on('someOneTyping', function (msg) {
//        $('#messages').append($('<li>').text(msg));
//    });
    socket.on('back', function (msg) {
        test.realTimeReceive(msg);
    });
    socket.on('request back', function (msg) {
        test.requestReceive(msg);
    });

    $('#late').click(function () {
        test.IamLate();
    });
    $('#offline').click(function () {
        test.IamOffline();
    });
    $('#pause').click(function () {
        test.pause();
    });
    $('#restart').click(function () {
        test.restart();
    });
    //以上已经有了

    $("#classes").on("click","button.list", function () {
        //console.log("here");
        var studyClass = $(this).parent().data();
        socket.emit('joinClass', {
            userID: "1401214301",
            name: "乔子健",
            room: studyClass.className+"::"+studyClass.byWho,
            role: 0
        });
        test.setStudyClass(studyClass.className+"::"+studyClass.byWho);
        $("#classes").hide();
        $("body").prepend($('<div id="classInfo">').text("You are in "+studyClass.className + " taught by "+studyClass.byWho));
    });


});
