/**
 * Created by Qiao on 4/14/15.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
mongoose.connect('mongodb://localhost/SEPclass' , function(err){
    if(err){
        console.log(err);
    }
    else{
        console.log('connect to SEPclass mongodb succeed!');
    }
});

//每个课堂有自己的数据库，供离线查询等情况
var classSchema = new Schema ({
    className: {type: String},
    byWhoID: {type: String},  //前两个field连接组成唯一key
    byWho: {type: String},  //与第一个field连接也组成唯一key
    status: {type: Number, default: 0}, //0:will, 1:ing, 2:end
    operations: []  //按序存放所有操作，0-*
});
var classModel = mongoose.model("class", classSchema);
exports.Class = classModel;