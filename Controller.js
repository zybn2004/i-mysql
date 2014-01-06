/**
 * Created by zybn2004 on 13-12-25.
 */


'use strict';

var _debug = false;



var mysql = require('mysql');
var Table = require('./Table');
var Transaction = require('./Transaction');




module.exports.controller = function(){
    return new Controller();
}

function Controller(){
    this._classType = "Controller";
    this._dbIndex = null;
    this._db = {};

    this.cacheTable = {};
    this.cacheTransaction = {};
    this.queueForSql = [];
    this.queueForTable = {};
    this.queueForTransaction = {};

    this.intervalQueueForTransaction_Timeout = null;
    this.intervalQueueForTable_Timeout = null;
    this.intervalQueueForSql_Timeout = null;

}

Controller.prototype.config = function(config){
    var self = this;
    self._db = mysql.createPool(config);
    self.intervalQueueForTransaction();
    self.intervalQueueForTable();
    self.intervalQueueForSql();
    return self;
}

Controller.prototype.setDbIndex=function(dbIndex){
    var self = this;
    self._dbIndex = dbIndex;
    return self;
}


Controller.prototype.debugLog=function(err){
    var self = this;
    if(_debug&&err){
        if(self._dbIndex!=null&&self._dbIndex!=undefined){
            console.log(self._dbIndex+"_"+err);
        }else{
            console.log(err);
        }
    }
}
Controller.prototype._logErr=function(err){
    if(err){
        console.log(err);
    }
}

Controller.prototype.intervalQueueForTransaction=function(){
    var self = this;
    self.debugLog('*****intervalQueueForTransaction');

    clearTimeout(self.intervalQueueForTransaction_Timeout);
    var i=0;
    for(var transId in self.cacheTransaction){
        i++;
        var trans = self.cacheTransaction[transId];
        var queue = self.queueForTransaction[transId];
        self.debugLog(transId+':'+'*****inner intervalQueueForTransaction');
        if(queue){
            self.debugLog(transId+':'+'*****queueForTransaction has '+queue.length+' elements');
        }else{
            self.debugLog(transId+':'+'*****queueForTransaction is empty!');
        }


        if(!trans){
            self.debugLog(transId+':'+'*****transaction may be null!');
            continue;
        }

        if(trans.autoCommit()){
            self._logErr(transId+':'+'*****long transaction happend!');
            if(trans._connection){
                self._logErr(transId+':'+'*****long transaction autocommit! please check your program!');
                trans._connection.commit(function(err){
                    self._logErr(err);
                    if(err){
                        self.debugLog(this._id+':'+'*****long transaction autocommit failed!');
                    }else{
                        self.debugLog(this._id+':'+'*****long transaction autocommit succeed!');
                    }
                }.bind(trans));
                trans._connection.release();
                trans._connection = null;
                trans._doing = false;
                trans._autoCommit = true;
                continue;
            }
        }



        if((!queue||queue.length==0)&&!trans._doing&&trans.destroy()){
            self.debugLog(transId+':'+'*****unused transaction! system auto destroy it!');
            /*
            process.nextTick(function(transId){
                if(this.cacheTransaction[transId]){
                    this.debugLog(transId+':'+'*****unused transaction is destroying!');
                    this.cacheTransaction[transId]._controller = null;
                    this.cacheTransaction[transId] = null;
                    delete this.cacheTransaction[transId];
                    this.queueForTransaction[transId]= null;
                    delete this.queueForTransaction[transId];
                }
            }.bind(self,transId));
            */
            self.debugLog(transId+':'+'*****unused transaction is destroying!');
            self.cacheTransaction[transId]._controller = null;
            self.cacheTransaction[transId] = null;
            delete self.cacheTransaction[transId];
            self.queueForTransaction[transId]= null;
            delete self.queueForTransaction[transId];
            continue;
        }

        if(trans._doing||!queue||queue.length==0){
            self.debugLog(transId+':'+'*****transaction may be doing something or nothing need to do!');
            continue;
        }

        var theOne = queue[0];
        var theOneConfig = theOne();

        if(theOneConfig&&theOneConfig['command']){
            self.debugLog(transId+':'+'*****transaction get the '+theOneConfig['command']+' command!');
        }else{
            self.debugLog(transId+':'+'*****transaction get no command!');
        }

        if(theOneConfig=="wait"){
            self.debugLog(transId+':'+'*****transaction wait for table struct!');
            continue;
        }

        if(theOneConfig&&theOneConfig['err']){
            self.debugLog(transId+':'+'*****transaction got an err!');
            trans._dequeueAll(theOneConfig['err']);
            continue;
        }


        if(!trans._connection){
            self.debugLog(transId+':'+'*****transaction has no connection! system will get a connection!');
            trans._doing = true;
            self.getConnection(function(conErr, connection){
                if(conErr){
                    self.debugLog(this._id+':'+'*****transaction has an error when got a connection!');
                }else{
                    self.debugLog(this._id+':'+'*****transaction got a connection successfully!');
                }

                if(conErr){
                    this._dequeueAll(conErr,function(){
                        this._doing = false;
                        //this._connection = connection;
                    }.bind(this));
                    return false;
                }

                this._doing = false;
                this._connection = connection;
            }.bind(trans));
            continue;
        }

        if(trans._autoCommit){
            if(queue&&queue.length>0){
                self.debugLog(transId+':'+'*****transaction will begin a transaction after autocommit!');
                trans._doing = true;
                trans._connection.beginTransaction(function(conErr){
                    if(conErr){
                        self.debugLog(this._id+':'+'*****transaction begin a transaction after autocommit! but got an error!');
                    }else{
                        self.debugLog(this._id+':'+'*****transaction begin a transaction after autocommit successfully!');
                    }


                    if(conErr){
                        this._dequeueAll(conErr,function(){
                            this._doing = false;

                            this._autoCommit = false;
                        }.bind(this));
                        return false;
                    }
                    this._doing = false;

                    this._autoCommit = false;

                }.bind(trans));
            }
            continue;
        }

        if(theOneConfig['command']=='begin'){
            self.debugLog(transId+':'+'*****transaction will handle begin command!');
            var _cb = theOneConfig['cb']||function(){};
            trans._doing = true;
            trans._connection.beginTransaction(function(cb){return function(conErr){
                if(conErr){
                    self.debugLog(this._id+':'+'*****transaction handle begin command! but got an error!');
                }else{
                    self.debugLog(this._id+':'+'*****transaction handle begin command successfully!');
                }


                if(conErr){
                    this._dequeueAll(conErr,function(){
                        this._doing = false;

                        this._resetBeginTime();
                    }.bind(this));
                    return false;
                }

                this._dequeue();

                this._doing = false;
                this._resetBeginTime();

                this._callbacking = true;
                var returnVal = cb.apply(this,arguments);
                this._callbacking = false;
                return returnVal;
            }.bind(this)}.bind(trans)(_cb));
            continue;
        }

        if(theOneConfig['command']=='commit'){
            self.debugLog(transId+':'+'*****transaction will handle commit command!');
            var _cb = theOneConfig['cb']||function(){};
            trans._doing = true;
            trans._connection.commit(function(cb){return function(conErr){
                if(conErr){
                    self.debugLog(this._id+':'+'*****transaction handle commit command! but got an error!');
                }else{
                    self.debugLog(this._id+':'+'*****transaction handle commit command successfully!');
                }


                if(conErr){
                    this._dequeueAll(conErr,function(){
                        this._doing = false;
                        this._autoCommit = false;
                        this._resetBeginTime();
                        this._connection.release();
                        this._connection = null;
                    }.bind(this));
                    return false;
                }

                this._dequeue();
                this._doing = false;
                this._autoCommit = false;
                this._resetBeginTime();
                this._connection.release();
                this._connection = null;

                this._callbacking = true;
                var returnVal = cb.apply(this,arguments);
                this._callbacking = false;
                return returnVal;
            }.bind(this)}.bind(trans)(_cb));
            continue;
        }

        if(theOneConfig['command']=='rollback'){
            self.debugLog(transId+':'+'*****transaction will handle rollback command!');
            var _cb = theOneConfig['cb']||function(){};
            trans._doing = true;
            trans._connection.rollback(function(cb){return function(conErr){
                if(conErr){
                    self.debugLog(this._id+':'+'*****transaction handle rollback command! but got an error!');
                }else{
                    self.debugLog(this._id+':'+'*****transaction handle rollback command successfully!');
                }


                if(conErr){
                    this._dequeueAll(conErr,function(){
                        this._doing = false;
                        this._autoCommit = false;
                        this._resetBeginTime();
                        this._connection.release();
                        this._connection = null;
                    }.bind(this));
                    return false;
                }

                this._dequeue();
                this._doing = false;
                this._autoCommit = false;
                this._resetBeginTime();
                this._connection.release();
                this._connection = null;

                this._callbacking = true;
                var returnVal = cb.apply(this,arguments);
                this._callbacking = false;
                return returnVal;
            }.bind(this)}.bind(trans)(_cb));
            continue;
        }

        if(theOneConfig['command']=='sql'){
            self.debugLog(transId+':'+'*****transaction will handle sql command!');
            var _sql = theOneConfig['sql'];
            if(typeof _sql == "function"){
                _sql = _sql();
            }
            var _options = theOneConfig['options']||{};
            var _cb = theOneConfig['cb']||function(){};
            trans._doing = true;
            trans._connection.query(_sql,_options,function(cb,sql){return function(conErr){
                self.debugLog(this._id+':'+'*****transaction execute sql ======= '+sql);

                if(conErr){
                    self.debugLog(this._id+':'+'*****transaction handle sql command! but got an error!');
                }else{
                    self.debugLog(this._id+':'+'*****transaction handle sql command successfully!');
                }


                if(conErr){
                    this._dequeueAll(conErr,function(){
                        this._doing = false;
                    }.bind(this));
                    return false;
                }
                this._dequeue();
                this._doing = false;

                this._callbacking = true;
                var returnVal = cb.apply(this,arguments);
                this._callbacking = false;
                return returnVal;
            }.bind(this)}.bind(trans)(_cb,_sql));
            continue;
        }
    }
    if(i==0){
        self.debugLog('*****intervalQueueForTransaction have no transaction need to handle!');
    }
    self.intervalQueueForTransaction_Timeout = setTimeout(self.intervalQueueForTransaction.bind(self),10);
}

Controller.prototype.intervalQueueForTable=function(){
    var self = this;
    self.debugLog('*****intervalQueueForTable');
    clearTimeout(self.intervalQueueForTable_Timeout);
    var i=0;
    for(var tableName in self.cacheTable){
        i++;
        var table = self.cacheTable[tableName];
        var queue = self.queueForTable[tableName];
        self.debugLog(tableName+':'+'*****inner intervalQueueForTable');
        if(queue){
            self.debugLog(tableName+':'+'*****queueForTable has '+queue.length+' elements');
        }else{
            self.debugLog(tableName+':'+'*****queueForTable is empty!');
        }


        if(!table){
            self.debugLog(tableName+':'+'*****table may be null!');
            continue;
        }
        if((!queue||queue.length==0)&&table._doing===0&&table.isDestroyed()){
            self.debugLog(tableName+':'+'*****unused table! system auto destroy it!');

            self.debugLog(tableName+':'+'*****unused table is destroying!');
            self.cacheTable[tableName]._controller = null;
            self.cacheTable[tableName] = null;
            delete self.cacheTable[tableName];
            self.queueForTable[tableName]= null;
            delete self.queueForTable[tableName];
            continue;
        }

        if(!queue||queue.length==0){
            self.debugLog(tableName+':'+'*****table have nothing need to do!');
            continue;
        }

        var theOne = queue[0];
        var theOneConfig = theOne();

        if(theOneConfig&&theOneConfig['command']){
            self.debugLog(tableName+':'+'*****table get the '+theOneConfig['command']+' command!');
        }else{
            self.debugLog(tableName+':'+'*****table get no command!');
        }

        if(theOneConfig=="wait"){
            self.debugLog(tableName+':'+'*****table wait for table struct!');
            continue;
        }

        if(theOneConfig&&theOneConfig['err']){
            self.debugLog(tableName+':'+'*****table got an err!');
            table._dequeue(theOneConfig['err']);
            continue;
        }
        if(theOneConfig['command']=='sql'){
            self.debugLog(tableName+':'+'*****table will handle sql command!');
            var _sql = theOneConfig['sql'];
            if(typeof _sql == "function"){
                _sql = _sql();
            }
            var _options = theOneConfig['options']||{};
            var _cb = theOneConfig['cb']||function(){};
            table._dequeue();
            table._doing++;
            self.getConnection(function(cbb,sql){return function(conErr, connection){
                if(conErr){
                    self.debugLog(this._tableName+':'+'*****table has an error when got a connection!');
                }else{
                    self.debugLog(this._tableName+':'+'*****table got a connection successfully!');
                }

                this._resetCommandTime();
                if(conErr){
                    if(connection){
                        connection.release();
                    }
                    this._doing--;
                    cbb.call(this,conErr);
                    return false;
                }

                connection.query(sql,_options,function(cb){return function(conErr){
                    self.debugLog(this._tableName+':'+'*****table execute sql ======= '+sql);

                    if(conErr){
                        self.debugLog(this._tableName+':'+'*****table handle sql command! but got an error!');
                    }else{
                        self.debugLog(this._tableName+':'+'*****table handle sql command successfully!');
                    }
                    if(connection){
                        connection.release();
                    }
                    this._resetCommandTime();
                    if(conErr){
                        this._doing--;
                        cb.call(this,conErr);
                        return false;
                    }
                    this._doing--;

                    var returnVal = cb.apply(this,arguments);
                    return returnVal;
                }.bind(this)}.bind(this)(cbb));
            }.bind(this)}.bind(table)(_cb,_sql));

            continue;
        }
    }
    if(i==0){
        self.debugLog('*****intervalQueueForTable have no table need to handle!');
    }
    self.intervalQueueForTable_Timeout = setTimeout(self.intervalQueueForTable.bind(self),10);
}


Controller.prototype.intervalQueueForSql=function(){
    var self = this;
    self.debugLog('*****intervalQueueForSql');
    clearTimeout(self.intervalQueueForSql_Timeout);
    var flag = true;

    var queue = self.queueForSql;

    if(!queue||queue.length==0){
        self.debugLog('*****SQL have nothing need to do!');
        flag = false;
    }

    if(flag){
        var theOne = queue[0];
        var theOneConfig = theOne();

        if(theOneConfig&&theOneConfig['command']){
            self.debugLog('*****SQL get the '+theOneConfig['command']+' command!');
        }else{
            self.debugLog('*****SQL get no command!');
        }

        if(theOneConfig&&theOneConfig['err']){
            self.debugLog('*****SQL got an err!');
            self._dequeue(theOneConfig['err']);
            flag = false;
        }

        if(flag){
            if(theOneConfig['command']=='sql'){
                self.debugLog('*****SQL will handle sql command!');
                var _sql = theOneConfig['sql'];
                if(typeof _sql == "function"){
                    _sql = _sql();
                }
                var _options = theOneConfig['options']||{};
                var _cb = theOneConfig['cb']||function(){};
                self._dequeue();
                self.getConnection(function(cbb,sql){return function(conErr, connection){
                    if(conErr){
                        self.debugLog('*****SQL has an error when got a connection!');
                    }else{
                        self.debugLog('*****SQL got a connection successfully!');
                    }

                    if(conErr){
                        if(connection){
                            connection.release();
                        }
                        cbb.call(this,conErr);
                        return false;
                    }

                    connection.query(sql,_options,function(cb){return function(conErr){
                        self.debugLog('*****SQL execute sql ======= '+sql);

                        if(conErr){
                            self.debugLog('*****SQL handle sql command! but got an error!');
                        }else{
                            self.debugLog('*****SQL handle sql command successfully!');
                        }
                        if(connection){
                            connection.release();
                        }
                        if(conErr){
                            cb.call(this,conErr);
                            return false;
                        }

                        var returnVal = cb.apply(this,arguments);
                        return returnVal;
                    }.bind(this)}.bind(this)(cbb));
                }.bind(this)}.bind(self)(_cb,_sql));

            }
        }

    }


    self.intervalQueueForSql_Timeout = setTimeout(self.intervalQueueForSql.bind(self),10);
}


Controller.prototype.getConnection=function(cb){
    var self = this;
    self._db.getConnection(cb);
}


Controller.prototype.tableStruct=function(_table){
    var self = this;
    self.getConnection(function (conErr, connection) {
        if(!_table||_table.isDestroyed()){
            if(connection){
                connection.release();
            }
            return false;
        }

        if(conErr){
            if(connection){
                connection.release();
            }
            self._logErr(conErr);
            console.log('retry struct table after 1 second!');
            setTimeout(function(){self.tableStruct.call(self,_table)},1000);
            return false;
        }


        _table.struct.call(_table,connection,function(err){
            if(connection){
                connection.release();
            }
            if(err){
                self._logErr(err);
                if(err.code=="ER_NO_SUCH_TABLE"){
                    return false;
                }
                console.log('retry struct table after 1 second!');
                setTimeout(function(){self.tableStruct.call(self,_table)},1000);
            }
        });
    }.bind(self));
}



Controller.prototype.table = function(tableName){
    var self = this;
    tableName = self.table._escapeTableName(tableName);
    if(self.cacheTable[tableName]){
        var t_table = self.cacheTable[tableName];
        if(!t_table||t_table.isDestroyed()){
            return null;
        }
        return t_table;
    }

    var _table = new Table(tableName,self);
    self.cacheTable[tableName] = _table;
    /*
    _table.on('structed',function(){

    });
    _table.on('no_such_table',function(){

    });
    */

    self.tableStruct(_table);

    return _table;


}

//inner function
Controller.prototype._escapeId = function(){
    return mysql.escapeId.apply(this,arguments);
}

//inner function
Controller.prototype._trimEscapeId = function(value){
    return (String(value)).replace(/`/g,"");
}

//inner function
Controller.prototype._escape = function(){
    return mysql.escape.apply(this,arguments);
}

//inner function
Controller.prototype.table._escapeTableName=function(tableName){
    tableName = tableName.replace(/`/g,"");
    return mysql.escapeId(tableName);
}

//inner function
Controller.prototype.table._enqueue=function(cb){
    var self = this;
    //this is the table instance
    var queue = self._controller.queueForTable[self._tableName];
    if(!queue){
        queue = self._controller.queueForTable[self._tableName] = [];
        queue.push(cb);
    }else{
        queue.push(cb);
    }

}

//inner function
Controller.prototype.table._dequeueAll=function(err){
    var self = this;
    //this is the table instance
    process.nextTick(function(){
        var queue = this._controller.queueForTable[this._tableName];
        if(queue){
            while(queue.length>0){
                var _cb = queue.shift();
                process.nextTick(function(cb){
                    return function(){ return cb.call(this,err);}.bind(this);
                }.bind(this)(_cb));
            }
        }
    }.bind(self));
}

//inner function
Controller.prototype.table._dequeue=function(err){
    var self = this;
    //this is the table instance
    var queue = self._controller.queueForTable[self._tableName];
    if(queue&&queue.length>0){
        var _cb = queue.shift();
        if(err){
            _cb.call(self,err);
        }
    }
}



Controller.prototype.transaction = function(transactionId){
    var self = this;
    if(transactionId!=undefined&&transactionId!=null){
        var t_trans = self.cacheTransaction[Number(transactionId)];
        if(!t_trans||t_trans.destroy()){
            return null;
        }
        return t_trans;
    }
    var _transaction = new Transaction(self);
    self.cacheTransaction[_transaction._id] = _transaction;
    return _transaction;
}

//inner function
Controller.prototype.transaction._enqueue=function(command,cb){
    var self = this;
    self._controller.debugLog(self._id+':'+'*****transaction enqueue a command of '+command);
    //this is the transaction instance
    var queue = self._controller.queueForTransaction[self._id];
    if(!queue){
        queue = self._controller.queueForTransaction[self._id] = [];
        queue.push(cb);
    }else{
        queue.push(cb);
    }
    if(command=='commit'||command=='rollback'){
        self._queueIndexOfRollbackWhenErr.push(queue.length-1);
    }
}

//inner function
Controller.prototype.transaction._dequeueAll=function(err,__cb){
    var self = this;
    if(err){
        self._controller.debugLog(self._id+':'+'*****transaction will dequeueAll because an error happend!');
    }else{
        self._controller.debugLog(self._id+':'+'*****transaction will dequeueAll,but no error happend!');
    }
    __cb = __cb||function(err){};
    //this is the transaction instance
    process.nextTick(function(){
        this._controller.debugLog(this._id+':'+'*****transaction dequeueAll until to the first index of ['+this._queueIndexOfRollbackWhenErr+'] in the queue!');
        var queue = this._controller.queueForTransaction[this._id];
        if(queue){
            if(queue.length==0){
                this._controller.debugLog(this._id+':'+'*****transaction dequeueAll in the queue! but the quene is empty!');
            }
            var needCb = true;
            while(needCb&&queue.length>0){
                var _cb = queue.shift();
                var rollbackWhenErrIndexArr = this._queueIndexOfRollbackWhenErr;

                var tArr = [];
                for(var j=0;j<rollbackWhenErrIndexArr.length;j++){
                    rollbackWhenErrIndexArr[j] = rollbackWhenErrIndexArr[j]-1;
                    if(rollbackWhenErrIndexArr[j]<0){
                        needCb = false;
                    }else{
                        tArr.push(rollbackWhenErrIndexArr[j]);
                    }
                }
                rollbackWhenErrIndexArr = this._queueIndexOfRollbackWhenErr = tArr;
                if(err){//the err is undefined when called by force commit or force rollback and the cb will not be called!
                    process.nextTick(function(cb){
                        return function(){
                            this._callbacking = true;
                            //return function(){cb(err);}
                            var returnVal = cb.call(this,err);
                            this._callbacking = false;
                            return returnVal;
                        }.bind(this);
                    }.bind(this)(_cb));
                }
            }
            __cb.call(this,err);
            this._controller.debugLog(this._id+':'+'*****transaction dequeueAll in the queue! now the quene has '+queue.length+' elements!');

        }else{
            __cb.call(this,err);
            this._controller.debugLog(this._id+':'+'*****transaction dequeueAll in the queue! but the quene is not exists!');
        }
    }.bind(self));
}

//inner function
Controller.prototype.transaction._dequeue = function(){
    var self = this;
    self._controller.debugLog(self._id+':'+'*****transaction will dequeue the first index in the queue!');
    //must run the first element of the queue before call dequeue
    //this is the transaction instance
    var queue = self._controller.queueForTransaction[self._id];
    if(queue&&queue.length>0){
        if(queue.length==0){
            self._controller.debugLog(self._id+':'+'*****transaction dequeue the first index in the queue! but the quene is empty!');
        }
        var _cb = queue.shift();
        var rollbackWhenErrIndexArr = self._queueIndexOfRollbackWhenErr;

        var tArr = [];
        for(var j=0;j<rollbackWhenErrIndexArr.length;j++){
            rollbackWhenErrIndexArr[j] = rollbackWhenErrIndexArr[j]-1;
            if(rollbackWhenErrIndexArr[j]<0){
            }else{
                tArr.push(rollbackWhenErrIndexArr[j]);
            }
        }
        rollbackWhenErrIndexArr = self._queueIndexOfRollbackWhenErr = tArr;

        self._controller.debugLog(self._id+':'+'*****transaction dequeue the first index in the queue! now the quene has '+queue.length+' elements!');
    }else{
        self._controller.debugLog(self._id+':'+'*****transaction dequeue the first index in the queue! but the quene is not exists!');
    }
}

//inner function
Controller.prototype.transaction._forceCommit = function(cb){
    var self = this;
    //this is the transaction instance
    if(!self._connection){
        var err = new Error('no connection when force commit command !');
        self._controller._logErr(err);
        self._doing = true;
        //not ignore
        process.nextTick(function(){
            cb.call(this,err);
            this._doing = false;
        }.bind(self));
    }else{
        self._doing = true;
        self._connection.commit(function(_cb){return function(conErr){
            this._dequeueAll(conErr,function(){
                this._doing = false;

                this._resetBeginTime();
                this._connection.release();
                this._connection = null;
            }.bind(this));
        }.bind(this)}.bind(self)(cb));
    }
}

//inner function
Controller.prototype.transaction._forceRollback = function(cb){
    var self = this;
    //this is the transaction instance
    if(!self._connection){
        var err = new Error('no connection when force rollback command !');
        self._controller._logErr(err);
        self._doing = true;
        //not ignore
        process.nextTick(function(){
            cb.call(this,err);
            this._doing = false;
        }.bind(self));
    }else{
        self._doing = true;
        self._connection.rollback(function(_cb){return function(conErr){
            this._dequeueAll(conErr,function(){
                this._doing = false;

                this._resetBeginTime();
                this._connection.release();
                this._connection = null;
            }.bind(this));
        }.bind(this)}.bind(self)(cb));
    }
}

//inner function
Controller.prototype._enqueue=function(sql,options,cb){
    var self = this;
    self.queueForSql.push(function(_sql,_options,_cb){return function(err){
        if(err){
            cb.call(this,err);
            return false;
        }
        return {err:null,command:'sql',sql:_sql,options:_options,cb:_cb};
    }.bind(this)}.bind(self)(sql,options,cb));
}

//inner function
Controller.prototype._dequeueAll=function(err){
    var self = this;
    process.nextTick(function(){
        var queue = this.queueForSql;
        if(queue){
            while(queue.length>0){
                var _cb = queue.shift();
                process.nextTick(function(cb){
                    return function(){return cb.call(this,err);}.bind(this);
                }.bind(this)(_cb));
            }
        }
    }.bind(self));
}

//inner function
Controller.prototype._dequeue=function(err){
    var self = this;
    var queue = self.queueForSql;
    if(queue&&queue.length>0){
        var _cb = queue.shift();
        if(err){
            _cb.call(self,err);
        }
    }
}

Controller.prototype.sql = function(sql,options,cb){
    var self = this;
    if(typeof options == "function"){
        cb = options;
        options = {};
    }

    options = options||{};
    options = this._cloneObject(options);

    if(typeof cb != "function"){
        cb = function(err){
            self._logErr(err);
        };
    }

    self._enqueue(sql,options,cb);
    return self;
}

function _cloneObject(obj){
    if(!obj||(obj.constructor!==Array&&obj.constructor!==Object)){
        return obj;
    }
    var o = obj.constructor === Array ? [] : {};
    for(var i in obj){
        if(obj.hasOwnProperty(i)){
            o[i] = typeof obj[i] === "object" ? _cloneObject(obj[i]) : obj[i];
        }
    }
    return o;
}

Controller.prototype._cloneObject = function(obj) {
    return _cloneObject(obj);
}
