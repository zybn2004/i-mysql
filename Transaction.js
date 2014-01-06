/**
 * Created by zybn2004 on 13-12-29.
 */
var EventEmitter     = require('events').EventEmitter;
var Util             = require('util');
//var Table = require('./Table');
module.exports = Transaction;

var default_destroyTimeout = 600000;
var default_autoCommitTimeout = 10000;
var id = 0;

function _logErr(err){
    console.log(err);
}


Util.inherits(Transaction, EventEmitter);
function Transaction(controller/*,globalCb*/){
    EventEmitter.call(this);
    //console.log(controller);
    this._classType='Transaction';
    this._beginCommand = false;
    this._commitCommand = false;
    this._rollbackCommand = false;
    this._destroyTimeout = default_destroyTimeout;
    this._autoCommitTimeout = default_autoCommitTimeout;
    this._autoCommit = false;
    this._agent = true;
    this._id = id++;
    this._controller = controller;
    this._queueIndexOfRollbackWhenErr = [];
    this._createTime = (new Date()).getTime();
    this._destroyed = false;
    this._beginTime = this._createTime;//for auto commit and destroy
    this._connection = null;
    this._doing = false;
    this._callbacking = false;
    this._rollbackWhenError = true;
    /*if(globalCb&&typeof globalCb == "function"){
     this._globalCallback = globalCb;
     }*/
}

function emitExceptionWhenHasDestroyed(){
    if(this._destroyed){
        //this.emit('has_destroyed');
        throw new Error('transaction instance has destroyed! please check your program!');
        //return true;
    }
    return false;
}

Transaction.prototype.getId=function(){
    if(emitExceptionWhenHasDestroyed()){
        return false;
    }

    return this._id;
}

//inner function
Transaction.prototype._resetBeginTime = function(){
    this._beginTime = (new Date()).getTime();
}


//_autoCommitTimeout is millisecond
Transaction.prototype.autoCommit = function(_autoCommitTimeout){
    if(!isNaN(_autoCommitTimeout)){
        this._autoCommitTimeout = Number(_autoCommitTimeout);
    }
    if(this._beginCommand&&!this._autoCommit){
        return (((new Date()).getTime()-this._beginTime)>this._autoCommitTimeout);
    }else{
        return false;
    }
}

//_destroyTimeout is millisecond
Transaction.prototype.destroy=function(_destroyTimeout){
    if(!isNaN(_destroyTimeout)){
        this._destroyTimeout = Number(_destroyTimeout);
    }
    if(((new Date()).getTime()-this._beginTime)>this._destroyTimeout){
        this._destroyed = true;
    }
    return this._destroyed;
}

Transaction.prototype.table = function(_obj){
    if(emitExceptionWhenHasDestroyed()){
        return false;
    }
    var self = this;
    var obj = null;
    if(typeof _obj == "string"){
        obj = this._controller.table(_obj);
    }else{
        obj = _obj;
    }

    if(obj&&obj._classType=='Table'&&obj._interface){
        var wrapedObj = {};
        var interface = obj._interface();
        for(var i in interface){
            wrapedObj[i] = function(interfaceElem){
                return function(){
                    var arg = Array.prototype.slice.call(arguments, 0);
                    var _arg = [];
                    for(var i=0;i<arg.length;i++){
                        if(arg[i]){
                            _arg.push(arg[i]);
                        }
                    }
                    _arg.push(obj);
                    _arg.push(self);
                    return interfaceElem.apply(self,_arg);
                }
            }(interface[i]);
        }
        wrapedObj['transaction'] = function(){return self;};
        return wrapedObj;
    }else{
        _logErr(new Error('Transaction can not wrap obj:'+_obj));
        return _obj;
    }
}

/*
 function commitCommand(cb){
 if(this._connection&&this._connection.state!="disconnected"){
 this._connection.commit(cb);
 }
 }
 function rollbackCommand(cb){
 if(this._connection&&this._connection.state!="disconnected"){
 this._connection.rollback(cb);
 }
 }

 function beginCommand(cb){
 if(this._connection&&this._connection.state!="disconnected"){
 this._connection.beginTransaction(cb);
 }
 }
 */

Transaction.prototype.sql = function(sql,options,cb){
    var self = this;
    if(typeof options == "function"){
        cb = options;
        options = {};
    }
    options = options||{};
    options = this._controller._cloneObject(options);
    if(typeof cb != "function"){
        cb = function(err){
            //_logErr(err);
        };
    }

    var _cb = function(err){
        //this._doing = false;
        //rollbackCommand.call(this);
        return cb.apply(this,arguments);
        //this._dequeueAll.call(this,err);//rollback
    }.bind(this);

    this._enqueue.call(this,'sql',function(err){
        if(err){
            _logErr(err);
            _cb(err);
            return false;
        }
        return {command:'sql',sql:sql,options:options,cb:_cb};
    }.bind(this));

    return this;
}

Transaction.prototype.begin=function(cb){
    if(this._beginCommand){
        var err = new Error('repeat begin transaction!');
        _logErr(err);
        //not ignore
        process.nextTick(function(){
            cb.call(this,err);
        }.bind(this));
        //return false;
        return this;
    }
    var self = this;
    if(typeof cb != "function"){
        cb = function(err){
            //_logErr(err);
        };
    }
    var _cb = function(err){
        //this._doing = false;
        //rollbackCommand.call(this);
        return cb.apply(this,arguments);
        //this._dequeueAll.call(this,err);
    }.bind(this);
    this._beginCommand = true;
    this._commitCommand = false;
    this._rollbackCommand = false;
    this._enqueue.call(this,'begin',function(err){
        if(err){
            _logErr(err);
            _cb(err);
            return false;
        }
        return {command:'begin',cb:_cb};
    }.bind(this));

    return this;
}

Transaction.prototype.commit=function(cb){
    if(typeof cb != "function"){
        cb = function(err){
            //_logErr(err);
        };
    }

    if(this._callbacking){//must call in callback immediately,it cann't be called when async!!
        if(this._commitCommand||this._rollbackCommand){
            this._forceCommit(cb);
        }else{
            var err = new Error('force commit command must have commit or rollback command in queue!please check your code!');
            _logErr(err);
            //not ignore
            process.nextTick(function(){
                cb.call(this,err);
            }.bind(this));
        }
        return this;
    }

    if(!this._beginCommand){
        var err = new Error('no transaction need to commit!');
        _logErr(err);
        //not ignore
        process.nextTick(function(){
            cb.call(this,err);
        }.bind(this));
        //return false;
        return this;
    }
    var self = this;

    var _cb = function(err){
        //this._doing = false;
        //rollbackCommand.call(this);
        return cb.apply(this,arguments);
        //this._dequeueAll.call(this,err);
    }.bind(this);

    this._enqueue.call(this,'commit',function(err){
        if(err){
            _logErr(err);
            _cb(err);
            return false;
        }
        return {command:'commit',cb:_cb};
    }.bind(this));
    this._beginCommand = false;
    this._commitCommand = true;
    this._rollbackCommand = false;

    return this;
}

Transaction.prototype.rollback=function(cb){
    if(typeof cb != "function"){
        cb = function(err){
            //_logErr(err);
        };
    }
    if(this._callbacking){//must call in callback immediately,it cann't be called when async!!
        if(this._commitCommand||this._rollbackCommand){
            this._forceRollback(cb);
        }else{
            var err = new Error('force rollback command must have commit or rollback command in queue!please check your code!');
            _logErr(err);
            //not ignore
            process.nextTick(function(){
                cb.call(this,err);
            }.bind(this));
        }
        return this;
    }


    if(!this._beginCommand){
        var err = new Error('no transaction need to rollback!');
        _logErr(err);
        //not ignore
        process.nextTick(function(){
            cb.call(this,err);
        }.bind(this));
        //return false;
        return this;
    }
    var self = this;

    var _cb = function(err){
        //this._doing = false;
        //rollbackCommand.call(this);
        return cb.apply(this,arguments);
        //this._dequeueAll.call(this,err);
    }.bind(this);

    this._enqueue.call(this,'rollback',function(err){
        if(err){
            _logErr(err);
            _cb(err);
            return false;
        }
        return {command:'rollback',cb:_cb};
    }.bind(this));
    this._beginCommand = false;
    this._commitCommand = false;
    this._rollbackCommand = true;

    return this;
}


//inner function
Transaction.prototype._enqueue = function(command,cb){
    if(emitExceptionWhenHasDestroyed()){
        return false;
    }
    //console.log(this._id+" "+command+" "+this._beginCommand);
    if(!this._beginCommand){
        this.begin();
    }
    this._controller.transaction._enqueue.call(this,command,cb);
}

//inner function
Transaction.prototype._dequeueAll = function(err){
    this._controller.transaction._dequeueAll.call(this,err);
}

//inner function
Transaction.prototype._dequeue = function(){
    this._controller.transaction._dequeue.call(this);
}

//inner function
Transaction.prototype._forceCommit = function(cb){
    this._controller.transaction._forceCommit.call(this,cb);
}

//inner function
Transaction.prototype._forceRollback = function(cb){
    this._controller.transaction._forceRollback.call(this,cb);
}

//inner function
Transaction.prototype._escapeId = function(){
    return this._controller._escapeId.apply(this,arguments);
}

//inner function
Transaction.prototype._trimEscapeId = function(value){
    return this._controller._trimEscapeId(value);
}

//inner function
Transaction.prototype._escape = function(){
    return this._controller._escape.apply(this,arguments);
}