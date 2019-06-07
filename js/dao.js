// 数据库语句
var UserDao = {
    // data 对象{id:'111',name: '名字',password:'123'}
    // 新增或修改用户信息
    replaceUser: function(data, callback){
        var keys = Object.keys(data);
        var values = Object.values(data);
        var sql = "REPLACE INTO user (" + keys.join(",") + ") VALUES (" + values.join(",") + ")";
        getBySql(sql,callback);
    },
    // 根据名字查询用户信息
    loadUserInfoByName: function(name, callback){
        var sql = "select * from user where name= '" + name + "'";
        getBySql(sql,callback);
    }
};
