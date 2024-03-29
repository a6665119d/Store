// 这里写数据库相关
// 生成数据库
function initDataBase() {
    fgDB = new sqliteDB(dbName, 1024 * 1024 * 2);
    initFGdb();
}
// 数据库表的内容
function initFGdb() {
	fgDB.transaction(function(tx) {
        // 用户表
		tx.executeSql('CREATE TABLE IF NOT EXISTS [user] (id VARCHAR2(32) PRIMARY KEY NOT NULL, username VARCHAR2(32), password VARCHAR2(32), [remark] VARCHAR2(32), [define] VARCHAR2(32))');
	}, function() {
        console.log('创建数据库成功!');
    }, function(err) {
		console.log('创建数据库失败!');
		console.log(err);
	});
}
/**
1、数据库名（mydb）
2、版本号（1.0）
3、描述（Test DB）
4、数据库大小（2*1024*1024）
*/
var sqliteDB = function( db_name, size ) {
    var _db = openDatabase(db_name, '1.0.0', '', size );
    var currSql=null;
    return {
        /**
        * 执行sql，回调返回影响条数
        */
        execute:function( sql, param, callback ) {
            currSql=sql;
            //参数处理
            if( !param ){
                param = [];
            }else if(typeof param == 'function' ){
                callback = param;
                param = [];
            }

            this.query( sql, param, function(result){
                if( typeof callback == 'function' ){
                    callback(result.rowsAffected);
                }
            });
        },

        /**
        * 执行sql，回调返回sql查询对象
        * 查询时，有数据返回数组，无数据返回0
        * 增删改时：返回int，影响条数
        * void query( string[, function])
        * void query( string[, array[, function]])
        */
        query:function(sql, param, callback){
            currSql=sql;
            //参数处理
            if( !param ){
                param = [];
            }else if(typeof param == 'function' ){
                callback = param;
                param = [];
            }

            var self=this;
            //只有一个参数
            _db.transaction(function (tx) {
                //4个参数：sql，替换sql中问号的数组，成功回调，出错回调
                tx.executeSql(sql,param,function(tx,result){
                    if (typeof callback == 'function' ){
                        callback(result);
                    }
                },self.onfail) ;
            }, self.onTransactionFail);
        },

        executeSql:function(sql, param, callback){
            currSql=sql;
            // _db.transaction(fn, success, error);
            //参数处理
            if( !param ){
                param = [];
            }else if(typeof param == 'function' ){
                callback = param;
                param = [];
            }

            var self=this;
            //只有一个参数
            _db.transaction(function (tx) {
                //4个参数：sql，替换sql中问号的数组，成功回调，出错回调
                tx.executeSql(sql,param,function(tx,result){
                    if (typeof callback == 'function' ){
                        callback(result);
                    }
                },self.onfail) ;
            }, self.onTransactionFail);
            //console.log(sql);
        },
        /**
        * 插入，回调返回last id
        * void insert( string, object[, function])
        */
        insert:function( table, data, callback ){
            if( typeof data != 'object' && typeof callback == 'function' ){
                callback(0);
            }
            var k=[];
            var v=[];
            var param=[];
            for(var i in data ){
                k.push(i);
                v.push('?');
                param.push(data[i]);
            }
            var sql="INSERT INTO "+table+"("+k.join(',')+") VALUES("+v.join(',')+")";
            currSql=sql;
            this.query(sql, param, function(result){
                if ( typeof callback == 'function' ){
                    callback(result.insertId);
                }
            });
        },
        /**
        * 修改，回调返回影响条数
        * void update( string, object[, string[, function]])
        * void update( string, object[, string[, array[, function]]])
        */
        update:function( table, data, where, param, callback ){
            //参数处理
            if( !param ){
                param = [];
            }else if(typeof param == 'function' ){
                callback = param;
                param = [];
            }

            var set_info = this.mkWhere(data);
            for(var i=set_info.param.length-1;i>=0; i--){
                param.unshift(set_info.param[i]);
            }
            var sql = "UPDATE "+table+" SET "+set_info.sql;
            if( where ){
                sql += " WHERE "+where;
            }
            currSql=sql;
            this.query(sql, param, function(result){
                if( typeof callback == 'function' ){
                    callback(result.rowsAffected);
                }
            });
        },

        /**
        * 删除
        * void toDelete( string, string[, function]])
        * void toDelete( string, string[, array[, function]])
        */
        del:function( table, where, param, callback ){
            //参数处理
            if( !param ){
                param = [];
            }else if(typeof param == 'function' ){
                callback = param;
                param = [];
            }

            var sql = "DELETE FROM "+table+" WHERE "+where;
            currSql=sql;
            this.query(sql, param, function(result){
                if( typeof callback == 'function' ){
                    callback(result.rowsAffected);
                }
            });
        },
        /***
        * 事务
        */
        transaction:function(fn, success, error) {
            var hookError = function(tx, e) {
                console.log(tx.message);
                showSqliteError(tx);
                if(error) error(tx, e);
            };
            _db.transaction(fn, hookError,success);
            //_db.transaction(fn, error,success);
        },
        /**
        * 查询，回调返回结果集数组
        * void fetch_all( string[, function] )
        * void fetch_all( string[, param[, function]] )
        */
        fetchAll:function( sql, param, callback ){
            currSql=sql;
            //参数处理
            if( !param ){
                param = [];
            }else if(typeof param == 'function' ){
                callback = param;
                param = [];
            }

            this.query( sql, param, function(result){
                if (typeof callback == 'function' ){
                    var out=[];
                    if (result.rows.length){
                        for (var i=0;i<result.rows.length;i++){
                            out.push(result.rows.item(i));
                        }
                    }
                    callback(out);
                }
            });
        },

        /**
        * 查询表的信息
        * table_name: 表名称，支持 % *，
        */
        showTables:function(table_name, callback){
            this.fetchAll("select * from sqlite_master where type='table' and name like ?", [table_name], callback);
        },
        /**
        * 组装查询条件
        */
        mkWhere:function(data){
            var arr=[];
            var param=[];
            if( typeof data === 'object' ){
                for (var i in data){
                    arr.push(i+"=?");
                    param.push(data[i]);
                    //console.log('data.i:'+i);
                }
            }
            return {sql:arr.join(' , '),param:param};
        },
        onTransactionFail : function(tx, e) {
            showSqliteError(tx);
        },
        /**
        * 错误处理
        */
        onfail:function(tx,e){
            console.log('sql error: '+e.message);
            console.log('执行sql:'+currSql);
        }
    };
};

/*
//使用示例：
//1.获取db对象,连接数据库 test，分配2M大小
var db = new DB('test',1024*1024*2);

//2.创建表
d.query("CREATE TABLE ids (id integer primary key autoincrement , ctime integer)");

//3.查看已经创建的表，支持表名通配符搜索。如："%"查询所有表，"user_%"查询"user_"开头的表
db.showTables("%",function(ret){console.log(ret)})

//4.查询表里数据
db.fetchAll('select * from ids',function(ret){console.log(ret)});

//5.修改
db.update('ids',{ctime:123},"id=?",[1],function(ret){console.log(ret)});

//6.删除
db.toDelete('ids',"id=?",[1],function(ret){console.log(ret)});

//7.其它，如删表
db.query('drop table ids');
*/
