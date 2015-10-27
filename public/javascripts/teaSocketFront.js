/**
 * Created by Qiao on 4/12/15.
 */

$(document).ready(function () {

    var socket = io();

    test = new replayControl(socket);

    socket.on('someOneConnect', function (msg) {
        $('#messages').append($('<li>').text(msg));
    });
    socket.on('someOneDisconnect', function (msg) {
        $('#messages').append($('<li>').text(msg));
    });



//
//    $('#m').on('input' , function (e){
//        socket.emit('write message');
//    });
    $('#aa').click(function(){
        socket.emit('chat message', $('#m').val());
        $('#messages').append($('<li>').text($('#m').val()));
        $('#m').val('');
        return false;
    });

    $('#submit').click(function () {
        //done
        jQuery.ajax({
            url:'/submitClass',
            type:'post',
            data:{
                className: $('#className').val(),
                byWho: "孙艳春老师"
            },
            success:function(response){
                //console.log(response);
                if(response.status == "success"){
                    socket.emit('createClass', {
                        userID: "1000012728",
                        name: "孙艳春老师",
                        room: $('#className').val()+"::"+"孙艳春老师",
                        role: 1
                    });
                    $('#messages').append($('<li>').text("准备开始，点击\"上课\"开始上课！"));
                }
                else{
                    console.log("somewhere error!")
                }
            },
            error:function(response){
                console.log(response);
            }
        });
    });
    $('#start').click(function () {
        //done
        jQuery.ajax({
            url:'/startClass',
            type:'post',
            data:{
                className: $('#className').val(),
                byWho: "孙艳春老师"
            },
            success:function(response){
                //console.log(response);
                if(response.status == "success"){
                    $('#messages').append($('<li>').text("上课！起立！老师好！"));
                }
                else{
                    console.log("somewhere error!")
                }
            },
            error:function(response){
                console.log(response);
            }
        });
    });
    $('#shutDown').click(function () {
        //done
        jQuery.ajax({
            url:'/endClass',
            type:'post',
            data:{
                className: $('#className').val(),
                byWho: "孙艳春老师"
            },
            success:function(response){
                //console.log(response);
                if(response.status == "success"){
                    $('#messages').append($('<li>').text("下课！"));
                }
                else{
                    console.log("somewhere error!")
                }
            },
            error:function(response){
                console.log(response);
            }
        });
    });
});
