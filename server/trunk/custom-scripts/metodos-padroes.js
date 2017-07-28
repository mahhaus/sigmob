/**
 * Created by victor.heck on 27/03/17.
 */
var loopback = require('loopback');
var app = loopback();
var token = "ee46a057-6153-4c7c-aa0c-6bb23d62f257";

ResponseModel = {
    "Sucesso": "boolean",
    "Mensagem": "string",
    "Objeto": "object"
};

global.TokenLoopback = token;

global.getModelObject = function (arg) {
    var Model = loopback.findModel(arg);
    app.model(Model);
    return (Model);
};

global.getUsuario = function (usuario) {
    var Usuario = usuario;
    delete Usuario['Autenticacao'];
    delete Usuario['Mensagens'];
    delete Usuario['Senha'];
    delete Usuario['Foto'];
    return Usuario;
};

global.verificaTokenEUsuarioQra = function (arg, defaultCallback, callback) {
    verificaToken(arg, defaultCallback, function () {
        var Usuario = loopback.findModel("Usuario");
        var Usuario_Qra = loopback.findModel("Usuario_Qra");
        app.model(Usuario);
        var req = {
            'Token': "x807f9uEkgXH5BVU5LMr9YBtFzlv055l",
            TokenFirebase: arg.TokenFirebase
        };
        Usuario.LoginUsuario(arg, function (err, obj) {
            if (obj.Sucesso) {
                Usuario_Qra.find({where: {TokenFirebase: arg.TokenFirebase}}, function (err, objQra) {
                    if (objQra.length) {
                        callback(objQra[0]);
                    } else {
                        defaultCallback(null, obj);
                    }
                });
            } else {
                defaultCallback(null, obj);
            }
        });
    });
};

global.verificaTokenEUsuario = function (arg, defaultCallback, callback) {
    verificaToken(arg, defaultCallback, function () {
        var Usuario = loopback.findModel("Usuario");
        app.model(Usuario);
        Usuario.LoginUserRest(arg, function (err, obj) {
            if (obj.Sucesso) {
                callback(obj.Objeto);
            } else {
                defaultCallback(null, obj);
            }
        });
    });
};

global.verificaToken = function (arg, defaultCallback, callback) {
    if (arg && arg.Token && arg.Token === token) {
        callback();
    } else {
        defaultCallback(null, {
            "Sucesso": false,
            "Mensagem": "Token Invalido.",
            "Objeto": null
        })
    }
};

global.processSQLFile = function (fileName) {
    var fs = require("fs");
    return fs.readFileSync(fileName, "utf8");
};

global.copiarObjeto = function (Obj){
    return JSON.parse(JSON.stringify(Obj));
};

global.getFilterPagination  = function (arg){

    var OrderFilter = arg.OrderFilter;
    var Filters = arg.Filters;
    var take = arg.Take;
    var page = arg.Page;
    var skipNum = (page>0)? ((page-1)*take):0;

    var obj="";


    if ((typeof Filters !== 'undefined') && Filters!== null && Filters.length>0){
        for (i = 0; i < Filters.length; i++) {
            var campo = '"'+Filters[i].Campo+'":' ;

            //Date 	 = 0,
            //String = 1
            //Number = 2

            var oper = "";
            var valor;


            switch(Filters[i].Operador) {
                case 8:
                    if(!Filters[i].Valor) {
                        valor = 'null';
                    }else if (Filters[i].CampoTipo === 0) {
                        valor = '"'+ (new Date(Filters[i].Valor)).toJSON() +'"'
                    } else if (Filters[i].CampoTipo === 1) {
                        valor = '"'+Filters[i].Valor+'"';
                    }  else if (Filters[i].CampoTipo === 2){
                        valor = Number(Filters[i].Valor);
                    }

                    oper += valor;
                    break;
                case 16:
                    oper = '{"like":"%'+Filters[i].Valor+'%"}';
                    break;
                case 32:
                    if (Filters[i].CampoTipo === 0) {
                        valor = '"'+ (new Date(Filters[i].Valor)).toJSON() +'"'
                    } else if (Filters[i].CampoTipo === 2) {
                        valor = Number(Filters[i].Valor);
                    }
                    oper += '{"gt":' + valor + '}';
                    break;
                case 64:
                    if (Filters[i].CampoTipo === 0) {
                        valor = '"'+ (new Date(Filters[i].Valor)).toJSON() +'"'
                    } else if (Filters[i].CampoTipo === 2) {
                        valor = Number(Filters[i].Valor);
                    }
                    oper += '{"gte":' + valor + '}';
                    break;
                case 128:
                    if (Filters[i].CampoTipo === 0) {
                        valor = '"'+ (new Date(Filters[i].Valor)).toJSON() +'"'
                    } else if (Filters[i].CampoTipo === 2) {
                        valor = Number(Filters[i].Valor);
                    }
                    oper += '{"lt":' + valor + '}';
                    break;
                case 256:
                    if (Filters[i].CampoTipo === 0) {
                        valor ='"'+ (new Date(Filters[i].Valor)).toJSON() +'"'
                    } else if (Filters[i].CampoTipo === 2){
                        valor = Number(Filters[i].Valor);
                    }
                    oper += '{"lte":'+valor+'}';
                    break;
            }

            if (!(Filters[i].Valor === "" || (typeof Filters[i].Valor === 'undefined')) && (oper)){
                campo = '{'+ campo+oper+'}';

                if (obj !== "") {
                    obj+="," + campo ;
                } else {
                    obj+= campo;
                }
            }

        }
    }

    var query = '';

    if (obj!==""){
        query += '"where": {"and": [ '+obj+' ]}';
    }

    if (OrderFilter) {
        var orderDirection = (OrderFilter.Operador===0?'ASC':'DESC');
        var order = OrderFilter.Campo+' '+orderDirection;

        // query+= '"order":"'+ order +'",';
        query+= (query!==''?',':'')+ '"order":"'+ order +'"';
    }

    //query+='"skip": '+ skipNum + ',"limit": '+ take +'}';
    query= '{'+query+'}';

    var filter = JSON.parse(query);

    console.log("=> FILTRO: "+JSON.stringify(filter));

    return filter;
};