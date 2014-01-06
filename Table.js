/**
 * Created by zybn2004 on 13-12-27.
 */

var EventEmitter     = require('events').EventEmitter;
var Util             = require('util');
var FieldType = require('./FieldType');
var Validator = require('./Validator');
module.exports = Table;

//var _structed = false;
var default_destroyTimeout = 600000;

function _logErr(err){
    console.log(err);
}


Util.inherits(Table, EventEmitter);
function Table(tableName,controller){
    EventEmitter.call(this);
    //console.log(controller);
    this._classType='Table';
    this._controller = controller;
    this._tableName = tableName;
    this._structed = false;
    this._no_such_table = false;
    this._no_such_table_error = null;
    this._fields = {};
    this._destroyed = false;
    this._destroyTimeout = default_destroyTimeout;
    this._createTime = (new Date()).getTime();
    this._commandTime = this._createTime;
    this._doing = 0;
}

Table.prototype.struct = function(conn,cb){
    var self = this;
    _getStruct.call(self,conn,function(err,result){
        if(self.isDestroyed()){
            self._dequeueAll.call(self,new Error('the table '+self._tableName+' has been destroyed!'));
            self.emit('destroyed');
        }else{
            if(err&&err.code=="ER_NO_SUCH_TABLE"){
                self._no_such_table = true;
                self._no_such_table_error = err;
                self._dequeueAll.call(self,err);
                self._destroyed = true;
                self.emit('no_such_table');
            }
            if(!err){
                _structColumns.call(self,arguments[1]);
                self._no_such_table = false;
                self._no_such_table_error = null;
                self._structed = true;
                self.emit('structed');
            }
        }
        return cb.apply(self,arguments);
    });
    return this;
}

Table.prototype.isStructed=function(){
    return this._structed;
}

Table.prototype.isDestroyed=function(){
    if(((new Date()).getTime()-this._commandTime)>this._destroyTimeout){
        this._destroyed = true;
    }
    return this._destroyed;
}

//inner function
Table.prototype._resetCommandTime = function(){
    this._commandTime = (new Date()).getTime();
}

Table.prototype._interface = function(){//wrap use
    return {'insert':this.insert,'select':this.select,'update':this.update,'delete':this.delete};
}

Table.prototype.insert = function(__options,__cb){
    var options = null;
    var cb = null;
    var index = 2;
    if(__options&&__options._classType=="Table"&&__cb&&__cb._agent==true){
        index--;
        index--;
    }else if(typeof __options == "function"){
        cb = __options;
        index--;
    }else{
        options = __options;
        if(__cb&&__cb._classType=="Table"){
            index--;
        }else{
            cb = __cb;
        }
    }
    options = options||{};
    options = this._controller._cloneObject(options);
    if(typeof cb != "function"){
        cb = function(err){
            //_logErr(err);
        };
    }
    var _table = this;
    var table = arguments[index++];//wrap use
    var agent = arguments[index];//wrap use
    if(table&&agent){
        if(table._classType=='Table'&&agent._agent==true){
            var _cb = function(err){
                //this._doing = false;
                return cb.apply(this,arguments);
            }.bind(agent);
            _table = table;
            if(_table.isDestroyed()){
                throw new Error('the table '+ this._tableName +' has been destroyed in cache!');
                return this;
            }
            agent._enqueue.call(agent,'sql',function(err){return _sql.call(this,err,'insert',options,_cb);}.bind(_table));
        }else{
            /*
             process.nextTick(function(){
             cb.call(this,new Error('wrong arguments for Table.prototype.insert by agent'));
             }.bind(agent));
             */
            throw new Error('wrong arguments for Table.prototype.insert by agent');
        }

        return agent;
    }else{
        if(_table.isDestroyed()){
            throw new Error('the table '+ this._tableName +' has been destroyed in cache!');
            return this;
        }
        var _cb = function(err){
            //this._doing = false;
            return cb.apply(this,arguments);
        }.bind(_table);
        _table._enqueue.call(_table,function(err){return _sql.call(this,err,'insert',options,_cb);}.bind(_table));

        return _table;
    }
}

Table.prototype.select = function(__options,__cb){
    var options = null;
    var cb = null;
    var index = 2;
    if(__options&&__options._classType=="Table"&&__cb&&__cb._agent==true){
        index--;
        index--;
    }else if(typeof __options == "function"){
        cb = __options;
        index--;
    }else{
        options = __options;
        if(__cb&&__cb._classType=="Table"){
            index--;
        }else{
            cb = __cb;
        }
    }
    options = options||{};
    options = this._controller._cloneObject(options);
    if(typeof cb != "function"){
        cb = function(err){
            //_logErr(err);
        };
    }
    var _table = this;
    var table = arguments[index++];//wrap use
    var agent = arguments[index];//wrap use
    if(table&&agent){
        if(table._classType=='Table'&&agent._agent==true){
            var _cb = function(err){
                //this._doing = false;
                return cb.apply(this,arguments);
            }.bind(agent);
            _table = table;
            if(_table.isDestroyed()){
                throw new Error('the table '+ this._tableName +' has been destroyed in cache!');
                return this;
            }
            agent._enqueue.call(agent,'sql',function(err){return _sql.call(this,err,'select',options,_cb);}.bind(_table));
        }else{
            /*
             process.nextTick(function(){
             cb.call(this,new Error('wrong arguments for Table.prototype.select by agent'));
             }.bind(agent));
             */
            throw new Error('wrong arguments for Table.prototype.select by agent');
        }

        return agent;
    }else{
        if(_table.isDestroyed()){
            throw new Error('the table '+ this._tableName +' has been destroyed in cache!');
            return this;
        }
        var _cb = function(err){
            //this._doing = false;
            return cb.apply(this,arguments);
        }.bind(_table);
        _table._enqueue.call(_table,function(err){return _sql.call(this,err,'select',options,_cb);}.bind(_table));

        return _table;
    }
}

Table.prototype.update = function(__options,__cb){
    var options = null;
    var cb = null;
    var index = 2;
    if(__options&&__options._classType=="Table"&&__cb&&__cb._agent==true){
        index--;
        index--;
    }else if(typeof __options == "function"){
        cb = __options;
        index--;
    }else{
        options = __options;
        if(__cb&&__cb._classType=="Table"){
            index--;
        }else{
            cb = __cb;
        }
    }
    options = options||{};
    options = this._controller._cloneObject(options);
    if(typeof cb != "function"){
        cb = function(err){
            //_logErr(err);
        };
    }
    var _table = this;
    var table = arguments[index++];//wrap use
    var agent = arguments[index];//wrap use
    if(table&&agent){
        if(table._classType=='Table'&&agent._agent==true){
            var _cb = function(err){
                //this._doing = false;
                return cb.apply(this,arguments);
            }.bind(agent);
            _table = table;
            if(_table.isDestroyed()){
                throw new Error('the table '+ this._tableName +' has been destroyed in cache!');
                return this;
            }
            agent._enqueue.call(agent,'sql',function(err){return _sql.call(this,err,'update',options,_cb);}.bind(_table));
        }else{
            /*
             process.nextTick(function(){
             cb.call(this,new Error('wrong arguments for Table.prototype.update by agent'));
             }.bind(agent));
             */
            throw new Error('wrong arguments for Table.prototype.update by agent');
        }

        return agent;
    }else{
        if(_table.isDestroyed()){
            throw new Error('the table '+ this._tableName +' has been destroyed in cache!');
            return this;
        }
        var _cb = function(err){
            //this._doing = false;
            return cb.apply(this,arguments);
        }.bind(_table);
        _table._enqueue.call(_table,function(err){return _sql.call(this,err,'update',options,_cb);}.bind(_table));

        return _table;
    }
}

Table.prototype.delete = function(__options,__cb){
    var options = null;
    var cb = null;
    var index = 2;
    if(__options&&__options._classType=="Table"&&__cb&&__cb._agent==true){
        index--;
        index--;
    }else if(typeof __options == "function"){
        cb = __options;
        index--;
    }else{
        options = __options;
        if(__cb&&__cb._classType=="Table"){
            index--;
        }else{
            cb = __cb;
        }
    }
    options = options||{};
    options = this._controller._cloneObject(options);
    if(typeof cb != "function"){
        //_logErr(err);
        cb = function(err){
        };
    }

    var _table = this;
    var table = arguments[index++];//wrap use
    var agent = arguments[index];//wrap use
    if(table&&agent){
        if(table._classType=='Table'&&agent._agent==true){
            var _cb = function(err){
                //this._doing = false;
                return cb.apply(this,arguments);
            }.bind(agent);
            _table = table;
            if(_table.isDestroyed()){
                throw new Error('the table '+ this._tableName +' has been destroyed in cache!');
                return this;
            }
            agent._enqueue.call(agent,'sql',function(err){return _sql.call(this,err,'delete',options,_cb);}.bind(_table));
        }else{
            /*
             process.nextTick(function(){
             cb.call(this,new Error('wrong arguments for Table.prototype.delete by agent'));
             }.bind(agent));
             */
            throw new Error('wrong arguments for Table.prototype.delete by agent');
        }

        return agent;
    }else{
        if(_table.isDestroyed()){
            throw new Error('the table '+ this._tableName +' has been destroyed in cache!');
            return this;
        }
        var _cb = function(err){
            //this._doing = false;
            return cb.apply(this,arguments);
        }.bind(_table);
        _table._enqueue.call(_table,function(err){return _sql.call(this,err,'delete',options,_cb);}.bind(_table));

        return _table;
    }
}

//inner function
Table.prototype._enqueue = function(cb){
    this._controller.table._enqueue.call(this,cb);
}

//inner function
Table.prototype._dequeueAll = function(err){
    this._controller.table._dequeueAll.call(this,err);
}

//inner function
Table.prototype._dequeue = function(err){
    this._controller.table._dequeue.call(this,err);
}


//inner function
Table.prototype._escapeId = function(){
    return this._controller._escapeId.apply(this,arguments);
}

//inner function
Table.prototype._trimEscapeId = function(value){
    return this._controller._trimEscapeId(value);
}

//inner function
Table.prototype._escape = function(){
    return this._controller._escape.apply(this,arguments);
}

function _sql(err,opType,options,cb){
    if(err){
        _logErr(err);
        cb(err);
        return false;
    }

    if(!this.isStructed()){
        return 'wait';
    }

    if(this.isDestroyed()){
        return {err:new Error('the table '+ this._tableName +' has been destroyed in cache!')};
    }

    if(this._no_such_table){
        return {err:this._no_such_table_error};
    }

    if(typeof options != "object" || Util.isArray(options)){
        return {err:new Error('the table '+ this._tableName +' got a invalid options param!')};
    }

    if(opType=='insert'){
        return _joinInsertSql.call(this,options,cb);
    }else if(opType=='select'){
        return _joinSelectSql.call(this,options,cb);
    }else if(opType=='update'){
        return _joinUpdateSql.call(this,options,cb);
    }else if(opType=='delete'){
        return _joinDeleteSql.call(this,options,cb);
    }else{
        return {err:new Error('can not recognize the opType:'+opType)};
    }
}

function _getStruct (conn,cb){
    var sql = 'SHOW COLUMNS FROM '+this._tableName;
    conn.query(sql, null, cb);
}

function _structColumns(struct){
    //console.log(this._tableName + ' will structColumns');
    //console.log(struct);
    for(var i=0;i<struct.length;i++){
        var fieldInfo = struct[i];
        var type_struct = FieldType.struct(fieldInfo['Type']);
        fieldInfo['Field'] = this._escapeId(this._trimEscapeId(fieldInfo['Field']));
        fieldInfo['Type_Struct'] = type_struct;
        fieldInfo['Table_Name'] = this._tableName;
        this._fields[fieldInfo['Field']] = fieldInfo;
    }
    //console.log(JSON.stringify(this._fields));
}





/*
 fields和values:              可在insert、update时配套使用，其中fields表示字段(可支持如['字段1']的数组或者以逗号间隔的字符串)，values表示对应的值(可支持如['字段值','字段值']的数组或者[['字段值','字段值1'],['字段值','字段值2']]这样的二维数组从而进行批量插入)
 fields:                      可在select中单独使用，表示需要查询的字段，且可以为空（表示所有字段都需查询）
 data:                        可在insert、update时使用，且优先与field和values，为如{'字段':字段值}的json对象


 where:                       可在select、update、delete中使用，且支持如{'字段1':字段值,'字段2':字段值}的json对象或者字符串，where为json对象时只支持and的拼接
 fieldset、groupBy、orderBy和limit:      只可在select中使用，其中fieldset可以为字符串，groupBy可以为数组对象如['字段1','字段2']，orderBy可以为json对象如{'字段1':'desc','字段2':''}，而limit可以为json对象如{start:10,total:20}也可以为[10,20]，它们都支持字符串，limit还支持数字（此时表示的即是total的值）


 insert: data(json)/fields(array(string)/string(,)),values(array/array(array))
 select: fieldset(string),fields(array(string)/string(,)),where(json/string),groupBy(array(string)/string),orderBy(json/string),limit(json/string)
 update: data(json),where(json/string)/fields(array(string)/string(,)),values(array),where(json/string)
 delete: where(json/string)
 */

function _isObjectAndIsNotEmpty(obj){
    if(!obj){
        return false;
    }
    if(typeof obj != "object"){
        return false;
    }

    if(Util.isArray(obj)){
        if(obj.length>0){
            return true;
        }else{
            return false;
        }

    }
    var flag = false;
    for(var i in obj){
        if(obj.hasOwnProperty(i)){
            flag = true;
            break;
        }
    }
    return flag;
}

function _joinInsertSql(options,cb){
    //data fields values

    var err = null;
    var sql = [];
    var data = options['data'];
    var fields = options['fields'];
    var values = options['values'];

    var table_fields = this._fields;
    var insertFields = [];
    var insertValues = [];
    sql.push('insert into '+this._tableName+' (');
    if(typeof data=="object"&&!Util.isArray(data)&&_isObjectAndIsNotEmpty(data)){

        for(var i in data){
            if(data.hasOwnProperty(i)){
                var _i = String(i).trim();
                var fieldName = this._escapeId(this._trimEscapeId(_i));
                var fieldStruct = table_fields[fieldName];
                if(!fieldStruct){
                    err = new Error(this._tableName+' not exists the field:'+fieldName);
                    break;
                }
                var value = data[i];
                var checkResult = Validator.check(value,fieldStruct);
                if(checkResult){
                    err = checkResult;
                    break;
                }
                insertFields.push(fieldName);
                insertValues.push(this._escape(value));
            }
        }
        if(!err){
            sql.push(insertFields.join(','));
            sql.push(') values (');
            sql.push(insertValues.join(','));
            sql.push(')');
        }
    }else{
        if(fields===undefined||fields===null){
            fields = [];
        }
        if(values===undefined||values===null){
            values = [];
        }
        if(typeof fields == 'string'){
            fields = String(fields).trim();
            fields = fields.split(",");
            for(var i=0;i<fields.length;i++){
                fields[i] = String(fields[i]).trim();
            }
            if(fields.length==1&&String(fields[0]).trim()==''){
                fields = [];
            }
        }
        if(!Util.isArray(fields)||!Util.isArray(values)){
            err = new Error(this._tableName+': fields or values param invalid');
        }
        if(!err){

            for(var i=0;i<fields.length;i++){
                insertFields.push(this._escapeId(this._trimEscapeId(String(fields[i]).trim())));
            }

            var isPlanar = false;
            for(var i=0;i<values.length;i++){
                if(Util.isArray(values[i])){
                    if(i==0){
                        isPlanar = true;
                    }else if(!isPlanar){
                        err = new Error(this._tableName+': values param invalid');
                        break;
                    }
                    if(values[i].length!=fields.length){
                        err = new Error(this._tableName+': values.length is not equal to fields.length');
                        break;
                    }
                }else{
                    if(isPlanar){
                        err = new Error(this._tableName+': values param invalid');
                        break;
                    }
                }
            }

            if(!err){
                if(isPlanar&&values.length==1){
                    values = values[0];
                    isPlanar = false;
                }
                if(!isPlanar&&values.length!=fields.length){
                    err = new Error(this._tableName+': values.length is not equal to fields.length');
                }
            }
            if(!err){
                if(!isPlanar){
                    var t_insertValues = [];
                    for(var i=0;i<values.length;i++){
                        var fieldName = String(insertFields[i]).trim();
                        var fieldStruct = table_fields[fieldName];
                        if(!fieldStruct){
                            err = new Error(this._tableName+' not exists the field:'+fieldName);
                            break;
                        }
                        var value = values[i];
                        var checkResult = Validator.check(value,fieldStruct);
                        if(checkResult){
                            err = checkResult;
                            break;
                        }
                        t_insertValues.push(this._escape(value));
                    }
                    insertValues.push(t_insertValues);
                }else{
                    for(var j=0;j<values.length;j++){
                        var t_insertValues = [];
                        for(var i=0;i<values[j].length;i++){
                            var fieldName = String(insertFields[i]).trim();
                            var fieldStruct = table_fields[fieldName];
                            if(!fieldStruct){
                                err = new Error(this._tableName+' not exists the field:'+fieldName);
                                break;
                            }
                            var value = values[j][i];
                            var checkResult = Validator.check(value,fieldStruct);
                            if(checkResult){
                                err = checkResult;
                                break;
                            }
                            t_insertValues.push(this._escape(value));
                        }
                        insertValues.push(t_insertValues);
                    }
                }
            }

            if(!err){
                sql.push(insertFields.join(','));
                sql.push(') values ');
                if(insertValues.length==0){
                    sql.push('()');
                }else{
                    var isFirst = true;
                    insertValues.forEach(function(arr){
                        if(isFirst){
                            isFirst = false;
                        }else{
                            sql.push(',');
                        }
                        sql.push('(');
                        sql.push(arr.join(','));
                        sql.push(')');
                    });
                }
            }

        }
    }

    if(!err){
        for(var i in table_fields){
            var found = false;
            for(var j=0;j<insertFields.length;j++){
                if(insertFields[j]==i){
                    found = true;
                    break;
                }
            }
            if(!found){
                var fieldName = i;
                var fieldStruct = table_fields[fieldName];

                var value = null;
                var checkResult = Validator.check(value,fieldStruct);
                if(checkResult){
                    err = checkResult;
                    break;
                }
            }
        }
    }

    if(!err){
        sql = sql.join('');
    }else{
        sql = '';
    }

    return {err:err,command:'sql',sql:sql,cb:cb};
}
function _joinSelectSql(options,cb){
    //fieldset fields where groupBy orderBy limit

    var err = null;
    var sql = [];
    var fieldset = options['fieldset'];
    var fields = options['fields'];
    var where = options['where'];
    var groupBy = options['groupBy'];
    var orderBy = options['orderBy'];
    var limit = options['limit'];
    var table_fields = this._fields;

    sql.push('select ');
    if(!fieldset){
        fieldset = '';
    }
    if(!where){
        where = '';
    }
    if(!groupBy){
        groupBy = '';
    }
    if(!orderBy){
        orderBy = '';
    }
    if(!limit){
        limit = '';
    }

    if(typeof fieldset != "string"){
        err = new Error(this._tableName+' not exists the field:'+fieldName);
    }
    if(!err){
        fieldset = String(fieldset).trim();

        if(fieldset!=''){
            sql.push(fieldset);
        }


        if(fields===undefined||fields===null){
            fields = [];
        }
        if(typeof fields == 'string'){
            fields = String(fields).trim();
            fields = fields.split(",");
            for(var i=0;i<fields.length;i++){
                fields[i] = String(fields[i]).trim();
            }
        }
        if(!Util.isArray(fields)){
            err = new Error(this._tableName+': fields param invalid');
        }

        if(!err){

            for(var i=0;i<fields.length;i++){
                var fieldName = this._escapeId(this._trimEscapeId(String(fields[i]).trim()));
                var fieldStruct = table_fields[fieldName];
                if(!fieldStruct){
                    err = new Error(this._tableName+' not exists the field:'+fieldName);
                    break;
                }
                if(!err){
                    if(i==0){
                        if(fieldset!=''){
                            sql.push(',');
                        }
                    }else{
                        sql.push(',');
                    }
                    sql.push(fieldName);
                }
            }

            if(!err&&fields.length==0){
                if(fieldset!=''){
                    sql.push(',');
                }
                var isFirst = true;
                for(var i in table_fields){
                    if(isFirst){
                        isFirst = false;
                    }else{
                        sql.push(',');
                    }
                    sql.push(i);
                }
            }

        }
        if(!err){
            sql.push(' from '+this._tableName);
        }


    }

    if(!err){
        if(typeof where == 'string'){
            where = String(where).trim();
            if(where!=""){
                sql.push(' where ');
                where = where.replace(/(^\s*where\s*)/ig,"");
                sql.push(where);
            }
        }else if(typeof where == "object"&&!Util.isArray(where)){
            var whereFieldset = [];
            var isFirst = true;
            for(var i in where){
                if(where.hasOwnProperty(i)){
                    var _i = String(i).trim();
                    if(isFirst){
                        isFirst = false;
                        sql.push(' where ');
                    }else{
                        sql.push(' and ');
                    }
                    var fieldName = this._escapeId(this._trimEscapeId(_i));
                    var fieldStruct = table_fields[fieldName];
                    if(!fieldStruct){
                        err = new Error(this._tableName+' not exists the field:'+fieldName);
                        break;
                    }
                    var value = where[i];
                    var checkResult = Validator.check(value,fieldStruct);
                    if(checkResult){
                        err = checkResult;
                        break;
                    }
                    whereFieldset.push(fieldName+'='+this._escape(value));
                }
            }
            sql.push(whereFieldset.join(''));
        }else{
            err = new Error(this._tableName+' where param invalid');
        }
    }

    if(!err){
        if(typeof groupBy == 'string'){
            groupBy = String(groupBy).trim();
            if(groupBy!=""){
                sql.push(' group by ');
                groupBy = groupBy.replace(/(^\s*group\s*by\s*)/ig,"");
                sql.push(groupBy);
            }
        }else if(typeof groupBy == "object"&&Util.isArray(groupBy)){
            var isFirst = true;
            for(var i=0;i<groupBy.length;i++){
                if(isFirst){
                    isFirst = false;
                    sql.push(' group by ');
                }else{
                    sql.push(',');
                }
                var fieldName = this._escapeId(this._trimEscapeId(String(groupBy[i]).trim()));
                var fieldStruct = table_fields[fieldName];
                if(!fieldStruct){
                    err = new Error(this._tableName+' not exists the field:'+fieldName);
                    break;
                }
                sql.push(fieldName);
            }
        }else{
            err = new Error(this._tableName+' groupBy param invalid');
        }
    }

    if(!err){
        if(typeof orderBy == 'string'){
            orderBy = String(orderBy).trim();
            if(orderBy!=""){
                sql.push(' order by ');
                orderBy = orderBy.replace(/(^\s*order\s*by\s*)/ig,"");
                sql.push(orderBy);
            }
        }else if(typeof orderBy == "object"&&!Util.isArray(orderBy)){
            var isFirst = true;
            for(var i in orderBy){
                var _i = String(i).trim();
                if(isFirst){
                    isFirst = false;
                    sql.push(' order by ');
                }else{
                    sql.push(',');
                }
                var fieldName = this._escapeId(this._trimEscapeId(_i));
                var fieldStruct = table_fields[fieldName];
                if(!fieldStruct){
                    err = new Error(this._tableName+' not exists the field:'+fieldName);
                    break;
                }

                if(orderBy[i]===undefined||orderBy[i]===null){
                    orderBy[i] = '';
                }
                var asc_desc = String(orderBy[i]).trim();
                if(asc_desc == ''){
                    asc_desc = 'asc';
                }
                if(!/(asc)|(desc)/ig.test(asc_desc)){
                    err = new Error(this._tableName+' orderBy param invalid');
                    break;
                }

                sql.push(fieldName + ' ' + asc_desc);
            }
        }else{
            err = new Error(this._tableName+' orderBy param invalid');
        }
    }

    if(!err){
        if(typeof limit == 'string'||typeof limit == 'number'){
            limit = String(limit).trim();
            if(limit!=""){
                sql.push(' limit ');
                limit = limit.replace(/(^\s*limit\s*)/ig,"");

                var tArr = limit.split(',');
                if(tArr.length>2){
                    err = new Error(this._tableName+' limit param invalid');
                }
                if(!err){
                    for(var i=0;i<tArr.length;i++){
                        tArr[i] = Number(String(tArr[i]).trim());
                        if(isNaN(tArr[i])){
                            err = new Error(this._tableName+' limit param invalid');
                            break;
                        }
                        if(i!=0){
                            sql.push(',');
                        }
                        sql.push(tArr[i]);
                    }
                }
            }
        }else if(typeof limit == "object"&&Util.isArray(limit)&&limit.length<=2){
            var isFirst = true;
            for(var i=0;i<limit.length;i++){
                if(isFirst){
                    isFirst = false;
                    sql.push(' limit ');
                }else{
                    sql.push(',');
                }
                var li = Number(String(limit[i]).trim());
                if(isNaN(li)){
                    err = new Error(this._tableName+' limit param invalid');
                    break;
                }
                sql.push(li);
            }
        }else if(typeof limit == "object"&&!Util.isArray(limit)){
            var newLimit = {};
            for(var i in limit){
                var _i = String(i).trim();
                var li = Number(String(limit[i]).trim());
                if(isNaN(li)){
                    err = new Error(this._tableName+' limit param invalid');
                    break;
                }
                if(/start/ig.test(_i)){
                    newLimit['start'] = li;
                }else if(/total/ig.text(_i)){
                    newLimit['total'] = li;
                }
            }
            if(!err&&_isObjectAndIsNotEmpty(newLimit)){
                err = new Error(this._tableName+' limit param invalid');
            }
            if(!err){
                var start = newLimit['start'];
                var total = newLimit['total'];

                if(total!=undefined&&total!=null){
                    start = start||0;
                    sql.push(' limit '+start);
                    sql.push(','+total);
                }else{
                    err = new Error(this._tableName+' limit param invalid');
                }
            }
        }else{
            err = new Error(this._tableName+' limit param invalid');
        }
    }

    if(!err){
        sql = sql.join('');
    }else{
        sql = '';
    }

    return {err:err,command:'sql',sql:sql,cb:cb};
}
function _joinUpdateSql(options,cb){

    //data fields values where

    var err = null;
    var sql = [];
    var data = options['data'];
    var fields = options['fields'];
    var values = options['values'];
    var where = options['where'];
    if(!where){
        where = '';
    }

    var table_fields = this._fields;
    var updateFieldset = [];

    sql.push('update '+this._tableName+' set ');
    if(typeof data=="object"&&!Util.isArray(data)&&_isObjectAndIsNotEmpty(data)){

        for(var i in data){
            if(data.hasOwnProperty(i)){
                var _i = String(i).trim();
                var fieldName = this._escapeId(this._trimEscapeId(_i));
                var fieldStruct = table_fields[fieldName];
                if(!fieldStruct){
                    err = new Error(this._tableName+' not exists the field:'+fieldName);
                    break;
                }
                var value = data[i];
                var checkResult = Validator.check(value,fieldStruct);
                if(checkResult){
                    err = checkResult;
                    break;
                }

                updateFieldset.push(fieldName+'='+this._escape(value));
            }
        }

    }else{
        if(fields===undefined||fields===null){
            fields = [];
        }
        if(values===undefined||values===null){
            values = [];
        }
        if(typeof fields == 'string'){
            fields = String(fields).trim();
            fields = fields.split(",");
            for(var i=0;i<fields.length;i++){
                fields[i] = String(fields[i]).trim();
            }
        }
        if(!Util.isArray(fields)||!Util.isArray(values)){
            err = new Error(this._tableName+': fields or values param invalid');
        }
        if(!err&&(fields.length==0||values.length==0)){
            err = new Error(this._tableName+': fields or values param can not be empty');
        }
        if(!err&&fields.length!=value.length){
            err = new Error(this._tableName+': values.length is not equal to fields.length');
        }
        if(!err){
            var updateFields = [];
            for(var i=0;i<fields.length;i++){
                updateFields.push(this._escapeId(this._trimEscapeId(String(fields[i]).trim())));
            }

            for(var i=0;i<values.length;i++){
                var fieldName = String(updateFields[i]).trim();
                var fieldStruct = table_fields[fieldName];
                if(!fieldStruct){
                    err = new Error(this._tableName+' not exists the field:'+fieldName);
                    break;
                }
                var value = values[i];
                var checkResult = Validator.check(value,fieldStruct);
                if(checkResult){
                    err = checkResult;
                    break;
                }
                updateFieldset.push(fieldName+'='+this._escape(value));
            }

        }
    }

    if(!err){
        sql.push(updateFieldset.join(','));

        if(typeof where == 'string'){
            where = String(where).trim();
            if(where!=""){
                sql.push(' where ');
                where = where.replace(/(^\s*where\s*)/ig,"");
                sql.push(where);
            }
        }else if(typeof where == "object"&&!Util.isArray(where)){
            var whereFieldset = [];
            var isFirst = true;
            for(var i in where){
                if(where.hasOwnProperty(i)){
                    var _i = String(i).trim();
                    if(isFirst){
                        isFirst = false;
                        sql.push(' where ');
                    }else{
                        sql.push(' and ');
                    }
                    var fieldName = this._escapeId(this._trimEscapeId(_i));
                    var fieldStruct = table_fields[fieldName];
                    if(!fieldStruct){
                        err = new Error(this._tableName+' not exists the field:'+fieldName);
                        break;
                    }
                    var value = where[i];
                    var checkResult = Validator.check(value,fieldStruct);
                    if(checkResult){
                        err = checkResult;
                        break;
                    }
                    whereFieldset.push(fieldName+'='+this._escape(value));
                }
            }
            sql.push(whereFieldset.join(''));
        }else{
            err = new Error(this._tableName+' where param invalid');
        }
    }

    if(!err){
        sql = sql.join('');
    }else{
        sql = '';
    }

    return {err:err,command:'sql',sql:sql,cb:cb};
}
function _joinDeleteSql(options,cb){
    //where

    var err = null;
    var sql = [];
    var where = options['where'];
    if(!where){
        where = '';
    }

    var table_fields = this._fields;

    sql.push('delete from '+this._tableName);

    if(typeof where == 'string'){
        where = String(where).trim();
        if(where!=""){
            sql.push(' where ');
            where = where.replace(/(^\s*where\s*)/ig,"");
            sql.push(where);
        }
    }else if(typeof where == "object"&&!Util.isArray(where)){
        var whereFieldset = [];
        var isFirst = true;
        for(var i in where){
            if(where.hasOwnProperty(i)){
                var _i = String(i).trim();
                if(isFirst){
                    isFirst = false;
                    sql.push(' where ');
                }else{
                    sql.push(' and ');
                }
                var fieldName = this._escapeId(this._trimEscapeId(_i));
                var fieldStruct = table_fields[fieldName];
                if(!fieldStruct){
                    err = new Error(this._tableName+' not exists the field:'+fieldName);
                    break;
                }
                var value = where[i];
                var checkResult = Validator.check(value,fieldStruct);
                if(checkResult){
                    err = checkResult;
                    break;
                }
                whereFieldset.push(fieldName+'='+this._escape(value));
            }
        }
        sql.push(whereFieldset.join(''));
    }else{
        err = new Error(this._tableName+' where param invalid');
    }

    if(!err){
        sql = sql.join('');
    }else{
        sql = '';
    }

    return {err:err,command:'sql',sql:sql,cb:cb};
}