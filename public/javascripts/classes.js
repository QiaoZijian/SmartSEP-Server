/**
 * Created by Qiao on 6/19/15.
 */
$(document).ready(function () {
    //要课程列表
    jQuery.ajax({
        url:'/getClasses',
        type:'get',
        success:function(response){
            //console.log(response);
            if(response.status == "success"){
                var classes = response.classes;
                for(var i = 0 ; i < classes.length ; i++){
                    var classInfo = classes[i].className+"::"+classes[i].byWho;
                    var $li = $('<li>').text(classInfo).data(classes[i]);
                    $li.append($('<button class="list">').text("want its json"));
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
    $(document).on("click", "button.list", function () {
        jQuery.ajax({
            url:'/getOneClassFile',
            type:'get',
            data:{
                className: $(this).parent().data().className,
                byWho: $(this).parent().data().byWho
            },
            success:function(response){
                //console.log(response);
                if(response.status == "success"){
                    $("#json").html(response.result);
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