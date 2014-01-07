/**
 * Created by zybn2004 on 14-1-1.
 */

var Controller = require('./Controller');
var util = require('util');
var npmPackageName = 'i-Mysql';

var isConfiged = false;
var currentControllerGlobal = null;
var currentDbIndexGlobal = null;

var controllerPool = [];

function checkDBIndex(dbIndex){
    if(!isConfiged){
        console.log(npmPackageName+' must config first!');
        return null;
    }
    if(typeof dbIndex == "function"){
        dbIndex = dbIndex();
    }
    if(isNaN(dbIndex)){
        console.log(npmPackageName+' switchDB error! because the dbIndex param is not number!');
        return null;
    }
    if(!controllerPool[Number(dbIndex)]){
        console.log(npmPackageName+' switchDB error! because the dbIndex param is not in the array!');
        return null;
    }
    return Number(dbIndex);
}

module.exports.config = function(configs){
    if(isConfiged){
        console.log(npmPackageName+' has configed! Not allow to config again!');
        throw new Error(npmPackageName+' has configed! Not allow to config again!');
        return null;
    }
    if(typeof configs == "function"){
        configs = configs();

    }
    if(util.isArray(configs)&&configs.length>1){
        var i=0;
        configs.forEach(function(config){
            //controllerPool.push(Controller.config(config));
            //controllerPool.push(require('./Controller').config(config));

            controllerPool.push(Controller.controller().setDbIndex(i).config(config));
            i++;
        });
    }else if((util.isArray(configs)&&configs.length==1)||(!util.isArray(configs)&&typeof configs == "object")){
        var _config = configs;
        if(util.isArray(configs)){
            _config = configs[0];
        }
        controllerPool.push(Controller.controller().setDbIndex(0).config(_config));
        //controllerPool.push(require('./Controller').config(_config));
    }
    if(controllerPool.length>0){
        isConfiged = true;
        currentControllerGlobal = controllerPool[0];
        currentDbIndexGlobal = 0;
        return this;
    }else{
        console.log(npmPackageName+' config wrong!');
        throw new Error(npmPackageName+' config wrong!');
        return null;
    }
}

module.exports.defaultDb = function(dbIndex){
    if(!isConfiged){
        console.log(npmPackageName+' must config first!');
        throw new Error(npmPackageName+' must config first!');
        return null;
    }

    if(dbIndex!=null&&dbIndex!=undefined){
        dbIndex = checkDBIndex(dbIndex);
        if(dbIndex===null){
            console.log(npmPackageName+':the table try to call the defaultDb function! but the param is invalid!');
            throw new Error(npmPackageName+':the table try to call the defaultDb function! but the param is invalid!');
            return null;
        }
        currentControllerGlobal = controllerPool[dbIndex];
        currentDbIndexGlobal = dbIndex;
    }else{
        currentDbIndexGlobal;
    }
}

module.exports.db = function(dbIndex){
    if(!isConfiged){
        console.log(npmPackageName+' must config first!');
        throw new Error(npmPackageName+' must config first!');
        return null;
    }

    var theDbIndex = currentDbIndexGlobal;

    if(dbIndex!=null&&dbIndex!=undefined){
        dbIndex = checkDBIndex(dbIndex);
        if(dbIndex===null){
            console.log(npmPackageName+':the table try to call the db function! but the param is invalid!');
            throw new Error(npmPackageName+':the table try to call the db function! but the param is invalid!');
            return null;
        }
        theDbIndex = Number(dbIndex);
    }

    return new db(theDbIndex);
}

function db(dbIndex){
    this._flag = "db";
    this._activeDbIndex = dbIndex;
}
db.prototype.getDbIndex = function(){
    return this._activeDbIndex;
}
db.prototype.switch=function(dbIndex){

    dbIndex = checkDBIndex(dbIndex);
    if(dbIndex===null){
        console.log(npmPackageName+':the db try to call the switch function! but the param is invalid!');
        throw new Error(npmPackageName+':the db try to call the switch function! but the param is invalid!');
        return null;
    }

    this._activeDbIndex = dbIndex;

    return this;
}
db.prototype.sql = function(sql,options,cb){
    var dbIndex = checkDBIndex(this._activeDbIndex);
    if(dbIndex===null){
        console.log(npmPackageName+':the db try to call the sql function! but the activeDbIndex is invalid!');
        throw new Error(npmPackageName+':the db try to call the sql function! but the activeDbIndex is invalid!');
        return null;
    }
    var ct = controllerPool[dbIndex];
    ct.sql(sql,options,cb);
    return this;
}


module.exports.table = function(dbIndex,tableName){
    if(!isConfiged){
        console.log(npmPackageName+' must config first!');
        throw new Error(npmPackageName+' must config first!');
        return null;
    }
    if(tableName===null||tableName===undefined){
        tableName = dbIndex;
        dbIndex = null;
    }

    if(tableName===null||tableName===undefined){
        tableName = "";
    }
    if(typeof tableName == "function"){
        tableName = tableName();
    }
    tableName = String(tableName).trim();

    var theController = currentControllerGlobal;
    var theDbIndex = currentDbIndexGlobal;
    var theTable = null;

    if(tableName==""){
        console.log(npmPackageName+':try to call the table function! but the param is invalid!');
        throw new Error(npmPackageName+':try to call the table function! but the param is invalid!');
        return null;
    }

    if(dbIndex!=null&&dbIndex!=undefined){
        dbIndex = checkDBIndex(dbIndex);
        if(dbIndex===null){
            console.log(npmPackageName+':the table try to call the table function! but the param is invalid!');
            throw new Error(npmPackageName+':the table try to call the table function! but the param is invalid!');
            return null;
        }
        theController = controllerPool[Number(dbIndex)];
        theDbIndex = Number(dbIndex);
    }
    if(!theController){
        console.log(npmPackageName+':try to call the table function! but the param is invalid!');
        throw new Error(npmPackageName+':try to call the table function! but the param is invalid!');
        return null;
    }
    theTable = theController.table(tableName);



    if(theTable&&!theTable._destroyed){
        return new table(theDbIndex,theTable._tableName);
    }else{
        console.log(npmPackageName+':try to call the table function from a destroyed table! check your program!');
        //throw new Error(npmPackageName+':try to call the table function from a destroyed table! check your program!');
        return null;
    }
}

function table(dbIndex,tableName){
    this._flag = "table";
    this._activeDbIndex = dbIndex;
    this._activeTableName = tableName;
}
table.prototype.getTableName = function(){
    return this._activeTableName;
}
table.prototype.getDbIndex = function(){
    return this._activeDbIndex;
}
table.prototype.switch=function(dbIndex){

    dbIndex = checkDBIndex(dbIndex);
    if(dbIndex===null){
        console.log(npmPackageName+':the table try to call the switch function! but the param is invalid!');
        throw new Error(npmPackageName+':the table try to call the switch function! but the param is invalid!');
        return null;
    }

    this._activeDbIndex = dbIndex;

    return this;
}
table.prototype.insert = function(options,cb){
    var dbIndex = checkDBIndex(this._activeDbIndex);
    if(dbIndex===null){
        console.log(npmPackageName+':the table try to call the insert function! but the dbIndex is invalid!');
        throw new Error(npmPackageName+':the table try to call the insert function! but the dbIndex is invalid!');
        return null;
    }
    var _table = controllerPool[dbIndex].table(this._activeTableName);
    if(!_table){
        console.log(npmPackageName+':the table try to call the insert function! but the table may be destroyed!');
        throw new Error(npmPackageName+':the table try to call the insert function! but the table may be destroyed!');
        return null;
    }
    _table.insert(options,cb);
    return this;
}

table.prototype.select = function(options,cb){
    var dbIndex = checkDBIndex(this._activeDbIndex);
    if(dbIndex===null){
        console.log(npmPackageName+':the table try to call the select function! but the dbIndex is invalid!');
        throw new Error(npmPackageName+':the table try to call the select function! but the dbIndex is invalid!');
        return null;
    }
    var _table = controllerPool[dbIndex].table(this._activeTableName);
    if(!_table){
        console.log(npmPackageName+':the table try to call the select function! but the table may be destroyed!');
        throw new Error(npmPackageName+':the table try to call the select function! but the table may be destroyed!');
        return null;
    }
    _table.select(options,cb);
    return this;
}
table.prototype.update = function(options,cb){
    var dbIndex = checkDBIndex(this._activeDbIndex);
    if(dbIndex===null){
        console.log(npmPackageName+':the table try to call the update function! but the dbIndex is invalid!');
        throw new Error(npmPackageName+':the table try to call the update function! but the dbIndex is invalid!');
        return null;
    }
    var _table = controllerPool[dbIndex].table(this._activeTableName);
    if(!_table){
        console.log(npmPackageName+':the table try to call the select function! but the table may be destroyed!');
        throw new Error(npmPackageName+':the table try to call the select function! but the table may be destroyed!');
        return null;
    }
    _table.update(options,cb);
    return this;
}
table.prototype.delete = function(options,cb){
    var dbIndex = checkDBIndex(this._activeDbIndex);
    if(dbIndex===null){
        console.log(npmPackageName+':the table try to call the delete function! but the dbIndex is invalid!');
        throw new Error(npmPackageName+':the table try to call the delete function! but the dbIndex is invalid!');
        return null;
    }
    var _table = controllerPool[dbIndex].table(this._activeTableName);
    if(!_table){
        console.log(npmPackageName+':the table try to call the delete function! but the table may be destroyed!');
        throw new Error(npmPackageName+':the table try to call the delete function! but the table may be destroyed!');
        return null;
    }
    _table.delete(options,cb);
    return this;
}


module.exports.transaction = function(dbIndex,transactionId){
    if(!isConfiged){
        console.log(npmPackageName+' must config first!');
        throw new Error(npmPackageName+' must config first!');
        return null;
    }

    if(transactionId===null||transactionId===undefined){
        transactionId = dbIndex;
        dbIndex = null;
    }
    if(typeof transactionId == "function"){
        transactionId = transactionId();
    }
    var theController = currentControllerGlobal;
    var theDbIndex = currentDbIndexGlobal;
    var theTrans = null;

    if(transactionId!=null&&transactionId!=undefined){
        if(isNaN(transactionId)){
            console.log(npmPackageName+':try to call the transaction function! but the param is invalid!');
            throw new Error(npmPackageName+':try to call the transaction function! but the param is invalid!');
            return null;
        }

        if(dbIndex!=null&&dbIndex!=undefined){
            dbIndex = checkDBIndex(dbIndex);
            if(dbIndex===null){
                console.log(npmPackageName+':the table try to call the transaction function! but the param is invalid!');
                throw new Error(npmPackageName+':the table try to call the transaction function! but the param is invalid!');
                return null;
            }
            theController = controllerPool[Number(dbIndex)];
            theDbIndex = Number(dbIndex);
        }
        if(!theController){
            console.log(npmPackageName+':try to call the transaction function! but the param is invalid!');
            throw new Error(npmPackageName+':try to call the transaction function! but the param is invalid!');
            return null;
        }
        if(Number(transactionId)<0){
            theTrans = theController.transaction();
        }else{
            theTrans = theController.transaction(Number(transactionId));
        }

    }else{
        theTrans = theController.transaction();
    }

    if(theTrans&&!theTrans._destroyed){
        return new transaction(theDbIndex,theTrans.getId());
    }else{
        console.log(npmPackageName+':try to call the transaction function from a destroyed or not exists transaction! check your program!');
        //throw new Error(npmPackageName+':try to call the transaction function from a destroyed or not exists transaction! check your program!');
        return null;
    }

}


function isDBIndexInHisTrans(trans,dbIndex){
    var found = false;
    var foundTransId = null;
    for(var i=0;i<trans._historyTransactions.length;i++){
        var hisTrans = trans._historyTransactions[i];
        if(typeof hisTrans !="string"||(hisTrans.split("_")).length!=2){
            continue;
        }

        var _hisTrans = hisTrans.split("_");
        var _dbIndex = Number(_hisTrans[0]);
        if(_dbIndex == dbIndex){
            var foundTransId = Number(_hisTrans[1]);
            found = true;
            break;
        }
    };
    return {found:found,foundTransId:foundTransId};
}

function getActiveTransaction(trans){
    var dbIndex = checkDBIndex(trans._activeDbIndex);
    if(dbIndex===null){
        console.log(npmPackageName+':the transaction try to call getActiveTransaction function! but the activeDbIndex is invalid! check your program!');
        return null;
    }
    var hisTrans = isDBIndexInHisTrans(trans,dbIndex);
    if(!hisTrans.found){
        console.log(npmPackageName+':the transaction try to call getActiveTransaction function! but the history transaction of db index is wrong! check your program!');
        return null;
    }
    if(hisTrans.foundTransId!=trans._activeTransactionId){
        console.log(npmPackageName+':the transaction try to call getActiveTransaction function! but the history transaction of db index is not equal with the activeTransactionId! check your program!');
        return null;
    }
    var ctTrans = controllerPool[dbIndex].transaction(hisTrans.foundTransId);
    if(!ctTrans||ctTrans._destroyed){
        console.log(npmPackageName+':the transaction try to call some function from a destroyed or not exists transaction! check your program!');
        return null;
    }
    return ctTrans;
}

function transaction(dbIndex,transId){
    this._flag = "transaction";
    this._activeDbIndex = dbIndex;
    this._activeTransactionId = transId;
    this._activeTableName = null;
    this._historyTransactions = [this._activeDbIndex+"_"+this._activeTransactionId];
    this._switched = false;
}
transaction.prototype.getId = function(){
    return this._activeTransactionId;
}
transaction.prototype.getDbIndex = function(){
    return this._activeDbIndex;
}
transaction.prototype.switch=function(dbIndex){
    dbIndex = checkDBIndex(dbIndex);

    if(this._switched&&this._activeDbIndex!=dbIndex){
        console.log(npmPackageName+':the transaction try to call the switch function! but it has been switched! you can call commit or rollback function then you can call the switch function again!');
        throw new Error(npmPackageName+':the transaction try to call the switch function! but it has been switched! you can call commit or rollback function then you can call the switch function again!!');
        return null;
    }

    if(this._switched&&this._activeDbIndex==dbIndex){
        return this;
    }


    if(dbIndex===null){
        console.log(npmPackageName+':the transaction try to call the switch function! but the param is invalid!');
        throw new Error(npmPackageName+':the transaction try to call the switch function! but the param is invalid!');
        return null;
    }

    var hisTrans = isDBIndexInHisTrans(this,dbIndex);
    var ctTrans = null;
    if(hisTrans.found){
        ctTrans = controllerPool[dbIndex].transaction(hisTrans.foundTransId);

    }else{
        ctTrans = controllerPool[dbIndex].transaction();
    }
    if(!ctTrans||ctTrans._destroyed){
        console.log(npmPackageName+':the transaction try to switch a destroyed or not exists transaction! check your program!');
        throw new Error(npmPackageName+':the transaction is not active!');
        return null;
    }
    this._activeDbIndex = dbIndex;
    this._activeTransactionId = ctTrans.getId();
    this._switched = true;
    if(!hisTrans.found){
        this._historyTransactions.push(this._activeDbIndex+"_"+this._activeTransactionId);
    }
    return this;
}
transaction.prototype.autoCommit = function(_autoCommitTimeout){
    var ctTrans = getActiveTransaction(this);
    if(!ctTrans){
        throw new Error(npmPackageName+':the transaction is not active!');
        return null;
    }

    return ctTrans.autoCommit(_autoCommitTimeout);

}
transaction.prototype.destroy = function(_destroyTimeout){
    var ctTrans = getActiveTransaction(this);
    if(!ctTrans){
        throw new Error(npmPackageName+':the transaction is not active!');
        return null;
    }

    return ctTrans.destroy(_destroyTimeout);

}
transaction.prototype.sql = function(sql,options,cb){
    this._activeTableName = null;
    var ctTrans = getActiveTransaction(this);
    if(!ctTrans){
        throw new Error(npmPackageName+':the transaction is not active!');
        return null;
    }
    ctTrans.sql(sql,options,cb);
    return this;
}
transaction.prototype.commit = function(cb){
    this._activeTableName = null;
    var ctTrans = getActiveTransaction(this);
    if(!ctTrans){
        throw new Error(npmPackageName+':the transaction is not active!');
        return null;
    }
    this._switched = false;
    ctTrans.commit(cb);
    return this;
}
transaction.prototype.rollback = function(cb){
    this._activeTableName = null;
    var ctTrans = getActiveTransaction(this);
    if(!ctTrans){
        throw new Error(npmPackageName+':the transaction is not active!');
        return null;
    }
    this._switched = false;
    ctTrans.rollback(cb);
    return this;
}
transaction.prototype.table = function(tableObj_or_tableName){

    var ctTrans = getActiveTransaction(this);
    if(!ctTrans){
        throw new Error(npmPackageName+':the transaction is not active!');
        return null;
    }

    var tableName = null;
    if(typeof tableObj_or_tableName == "object"&&tableObj_or_tableName._flag=="table"&&tableObj_or_tableName._activeTableName&&tableObj_or_tableName._activeDbIndex==this._activeDbIndex){
        tableName = tableObj_or_tableName._activeTableName;
    }else if(typeof tableObj_or_tableName == "string"||typeof tableObj_or_tableName == "function"){
        if(typeof tableObj_or_tableName == "function"){
            tableObj_or_tableName = tableObj_or_tableName();
        }
        tableName = controllerPool[this._activeDbIndex].table._escapeTableName(tableObj_or_tableName);
    }else{
        console.log(npmPackageName+':the transaction try to call the table function! but the param is invalid!');
        this._activeTableName = null;
        throw new Error(npmPackageName+':the transaction try to call the table function! but the param is invalid!');
        return null;
    }
    this._activeTableName = tableName;
    return this;
}
transaction.prototype.insert = function(options,cb){
    var ctTrans = getActiveTransaction(this);
    if(!ctTrans){
        throw new Error(npmPackageName+':the transaction is not active!');
        return null;
    }
    if(!this._activeTableName){
        console.log(npmPackageName+':the transaction want to call insert function must between call table function and call sql function!');
        throw new Error(npmPackageName+':the transaction want to call insert function must between call table function and call sql function!');
        return null;
    }
    var _table = ctTrans.table(this._activeTableName);
    _table.insert(options,cb);
    return this;
}

transaction.prototype.select = function(options,cb){
    var ctTrans = getActiveTransaction(this);
    if(!ctTrans){
        throw new Error(npmPackageName+':the transaction is not active!');
        return null;
    }
    if(!this._activeTableName){
        console.log(npmPackageName+':the transaction want to call select function must between call table function and call sql function!');
        throw new Error(npmPackageName+':the transaction want to call select function must between call table function and call sql function!');
        return null;
    }
    var _table = ctTrans.table(this._activeTableName);
    _table.select(options,cb);
    return this;
}
transaction.prototype.update = function(options,cb){
    var ctTrans = getActiveTransaction(this);
    if(!ctTrans){
        throw new Error(npmPackageName+':the transaction is not active!');
        return null;
    }
    if(!this._activeTableName){
        console.log(npmPackageName+':the transaction want to call update function must between call table function and call sql function!');
        throw new Error(npmPackageName+':the transaction want to call update function must between call table function and call sql function!');
        return null;
    }
    var _table = ctTrans.table(this._activeTableName);
    _table.update(options,cb);
    return this;
}
transaction.prototype.delete = function(options,cb){
    var ctTrans = getActiveTransaction(this);
    if(!ctTrans){
        throw new Error(npmPackageName+':the transaction is not active!');
        return null;
    }
    if(!this._activeTableName){
        console.log(npmPackageName+':the transaction want to call delete function must between call table function and call sql function!');
        throw new Error(npmPackageName+':the transaction want to call delete function must between call table function and call sql function!');
        return null;
    }
    var _table = ctTrans.table(this._activeTableName);
    _table.delete(options,cb);
    return this;
}

