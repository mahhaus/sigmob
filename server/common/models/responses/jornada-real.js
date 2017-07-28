'use strict';
var _ = require('lodash');
var ResponseModel = {"Sucesso": "boolean","Mensagem": "string","Objeto": "object"};


module.exports = function (Jornada_Real) {
    clearRemoteMethods(Jornada_Real);

    //createCadastrarAlterarJornadaRealMethod(Jornada_Real);
    createExcluirJornadaRealMethod(Jornada_Real);
    createBuscarJornadaRealMethod(Jornada_Real);
    createBuscarJornadaAlterPaginadoMethod(Jornada_Real);
    createFinalizarJornadaRealMethod(Jornada_Real);
};

var createExcluirJornadaRealMethod = function (Jornada_Real) {
    Jornada_Real.excluirJornadaReal = function (arg, cb) {
        verificaToken(arg, cb, function (obj) {
            var model = {};
            model.Sucesso = false;
            model.Objeto = null;
            var filter = {where: {Id: arg.Id}};
            Jornada_Real.findOne(filter, function (err, obj) {
                if (!obj) {
                    responseModel.Mensagem = "Esta jornada não existe.";
                    cb(null,responseModel);
                } else {
                    var objRemove = obj;
                    Jornada_Real.find({where: {Id : obj.Id}}, function(err, jornada) {
                        if (!err) {
                            objRemove = jornada;
                        }
                    });

                    Jornada_Real.deleteById(arg.Id, function (err, obj) {
                        Jornada_Real.find(null, function(err, jornadas) {
                            console.log("Restante: "+jornadas);
                            if (!err && jornadas.length>0){

                                var Jornada = jornadas[0].toJSON();
                                // Jornada["Usuario"] = getUsuario(usuario);
                                model.Mensagem = "Jornada excluida.";
                                model.Sucesso = true;
                                model.Objeto = {"Jornada": Jornada};
                                cb(null, model);
                            } else {
                                console.log(err.stack);
                                model.Sucesso = false;
                                model.Mensagem = "Não foi possível excluir esta Jornada.";
                                model.Objeto = null;
                            }
                            cb(null, model);
                        });
                    });
                }
            });

        });
    };

    Jornada_Real.remoteMethod(
        'excluirJornadaReal', {
            http: {
                path: '/excluirJornadaReal'
            },
            accepts: {
                arg: 'Jornada_Real',
                description: 'Exclusão de jornada',
                type: 'ExcluirJornadaRequest',
                http: {source: 'body', verb: 'post'}
            },
            returns: {root: true, type: ResponseModel, default: ResponseModel}
        });
};

var createCadastrarJornadaRealMethod = function (Jornada_Real) {
    Jornada_Real.cadastrarJornada = function (arg, cb) {
        verificaToken(arg, cb, function (obj) {
            var model = {};
            model.Sucesso = false;
            model.Objeto = null;
            Jornada_Real.upsert(arg, function (err, obj) {
                if (!err){
                    model.Mensagem = "Jornada "+(arg.Id !== null? "alterada.":"inserida.");
                    Jornada_Real.find(null, function (err, jornadas) {
                        if (!err && jornadas.length>0){

                            var Jornada = jornadas[0].toJSON();
                            // Jornada["Usuario"] = getUsuario(usuario);

                            model.Mensagem = "Jornada cadastrada.";
                            model.Sucesso = true;
                            model.Objeto = {"Jornada": Jornada};
                            cb(null, responseModel);
                        } else {
                            console.log(err.stack);
                            model.Sucesso = true;
                            model.Objeto = null;
                        }
                    });
                }else {
                    console.log(err.stack);
                    model.Mensagem = "Não foi possível cadastrar a jornada.";
                    cb(null, model);
                }
            });
        });
    };

    Jornada_Real.remoteMethod(
        'cadastrarJornada', {
            http: {
                path: '/cadastrarJornada'
            },
            accepts: {
                arg: 'Jornada_Real',
                description: 'Registro de  Jornada',
                type: 'CadastrarAlterarJornadaRequest',
                http: {
                    source: 'body',
                    verb: 'post'
                }
            },
            returns: {
                root: true,
                type: ResponseModel,
                default: ResponseModel}
        });
};

var createBuscarJornadaRealMethod = function (Jornada_Real) {
    Jornada_Real.buscarJornada = function (arg, cb) {
        verificaToken(arg, cb, function (obj) {
            var model = {};
            model.Sucesso = false;
            model.Objeto = null;

            var filter;
            if (arg.SearchId){
                filter = {where: {Id: arg.SearchId}};
            } else if (arg.DataInicioJornada ){

                filter = {where: {and: [{DataInicioJornada: arg.DataInicioJornada},{IdUsuario: arg.IdUsuario}]}};
            } else {
                filter = {where: {and: [{DataFimJornada: null},{IdUsuario: arg.IdUsuario}] }};
            }

            filter["include"] = JSON.parse('{"Apontamentos": [{"Evento": ["TipoEvento","Predecessores"], "include": {"TipoEvento": [{"TipoEvento": "TipoEvento"}]}}]}');

            model.Mensagem = "Não há jornada aberta para este usuário.";
            model.Sucesso = false;

            Jornada_Real.find(filter, function (err, jornadasRet) {
                if (!err){
                    if (jornadasRet.length>0){
                        model.Mensagem = "Jornada retornada.";
                        var Jornada = jornadasRet[0].toJSON();
                        // Jornada["Usuario"] = getUsuario(usuario);
                        model.Objeto = {"Jornada": Jornada};
                    } else{
                        model.Objeto = {"Jornada": null};
                    }

                    model.Sucesso = true;
                    cb(null, model);
                }else {
                    console.log(err.stack);
                    model.Sucesso = false;
                    cb(null, model);
                }
            });
        });
    };

    Jornada_Real.remoteMethod(
        'buscarJornada', {
            http: {
                path: '/buscarJornada'
            },
            accepts: {
                arg: 'Jornada_Real',
                description: 'Registro de  Jornada',
                type: 'BuscarJornadaRequest',
                http: {
                    source: 'body',
                    verb: 'post'
                }
            },
            returns: {
                root: true,
                type: ResponseModel,
                default: ResponseModel}
        });
};

var createBuscarJornadaAlterPaginadoMethod = function (Jornada_Real) {

    Jornada_Real.buscarJornadaPag = function (arg, cb) {
        console.log("=> REQUEST: " + JSON.stringify(arg));
        verificaToken(arg, cb, function (obj) {
            var model = {};
            model.Sucesso = false;
            model.Objeto = null;
            var filter = getFilterPagination(arg);

            filter["include"] = JSON.parse('{"Apontamentos": [{"Evento": ["TipoEvento","Predecessores"], "include": {"TipoEvento": [{"TipoEvento": "TipoEvento"}]}}]}');

            Jornada_Real.find(filter, function (err, jornada) {
                if (!err) {
                    var take = arg.Take;
                    var page = arg.Page;
                    var skipNum = (page>0)? ((page-1)*take):0;

                    var itemsSel = _.slice(jornada, skipNum, skipNum + take);

                    model.Sucesso = true;
                    model.Mensagem = "Jornada retornada.";
                    model.Objeto = {
                        "totalItems": jornada.length,
                        "items" : itemsSel};
                    console.log("=> RESPONSE: " + JSON.stringify(model.Objeto));
                    cb(null, model);
                } else {
                    console.log(err.stack);
                    model.Objeto = {
                        "totalItems": 0,
                        "items" : []};
                    model.Mensagem = "Não foi possível buscar a jornada.\n "+
                        "\n=> REQUEST: " + JSON.stringify(arg)+
                        "\n=> RESPONSE: " + JSON.stringify(model.Objeto) +
                        "\n=> ERROR: "+err.stack;
                    console.log("=> RESPONSE: " + JSON.stringify(model.Objeto));
                    cb(null, model);
                }
            });
        });
    };

    Jornada_Real.remoteMethod(
        'buscarJornadaPag', {
            http: {
                path: '/buscarJornadaPag'
            },
            accepts: {
                arg: 'Jornada_Real',
                description: 'Buscar jornadas paginados',
                type: 'BuscarPaginadoRequest',
                http: {
                    source: 'body',
                    verb: 'post'
                }
            },
            returns: {
                root: true,
                type: ResponseModel,
                default: ResponseModel}
        });
};

var createFinalizarJornadaRealMethod = function (Jornada_Real) {
    Jornada_Real.finalizarJornada = function (arg, cb) {
        verificaToken(arg, cb, function (obj) {
            var model = {};
            model.Sucesso = false;
            model.Objeto = null;
            Jornada_Real.updateAll({where: {Id : arg.SearchId}}, {DataFimJornada : arg.DataFimJornada}, function (err, info) {
                console.log(info);
                if (!err){
                    var filter = {where: {Id : arg.SearchId}};
                    filter["include"] = JSON.parse('{"Apontamentos": [{"Evento": ["TipoEvento","Predecessores"], "include": {"TipoEvento": [{"TipoEvento": "TipoEvento"}]}}]}');

                    Jornada_Real.findOne(filter, function (err2, jornadas){
                        model.Sucesso = true;

                        if (!err2){

                            var Jornada = jornadas.toJSON();
                            // Jornada["Usuario"] = usuario;
                            Jornada.IdHorario = arg.IdHorario;

                            // Ordenando os apontamentos que foram  incluidos fora da ordem
                            Jornada.Apontamentos.sort(compareValues('DataHoraInicio', 'asc'));

                            Jornada.TipoJornada = 2;
                            somaTotaisJornada(Jornada, function (err, jornadaRet) {
                                if (!err) {
                                    if (jornadaRet && jornadaRet.Sucesso){
                                        model.Sucesso = true;
                                        model.Mensagem = "Jornada finalizada.";
                                        model.Objeto = {"Jornada" : jornadaRet.Objeto} ;
                                        cb(null, model);
                                    } else {
                                        model.Mensagem = jornadaRet.Mensagem;
                                        model.Objeto = null;
                                        console.log("=> RESPONSE: " + model.Objeto);
                                        cb(null, model);
                                    }

                                } else {
                                    console.log("ERRO: " + err.stack);
                                    model.Objeto = Jornada;
                                    model.Sucesso = false;
                                    model.Mensagem = "Erro ao atualizar os totais da jornada.";
                                    if(jornadaRet) {
                                        console.log("=> RESPONSE: " + jornadaRet.Objeto);
                                    }
                                    cb(null, model);
                                }
                            });
                        } else {
                            console.log(err2.stack);
                            model.Mensagem = "Jornada finalizada - Não foi retornar a jornada finalizada.";
                            cb(null, model);
                        }
                    });
                }else {
                    console.log(err.stack);
                    model.Mensagem = "Não foi possível finalizar a jornada.";
                    cb(null, model);
                }
            });
        });
    };

    Jornada_Real.remoteMethod(
        'finalizarJornada', {
            http: {
                path: '/finalizarJornada'
            },
            accepts: {
                arg: 'Jornada_Real',
                description: 'Registro de  Jornada',
                type: 'FinalizarJornadaRequest',
                http: {
                    source: 'body',
                    verb: 'post'
                }
            },
            returns: {
                root: true,
                type: ResponseModel,
                default: ResponseModel}
        });
};

var clearRemoteMethods = function (Jornada_Real) {
    removerMetodosPadroes(Jornada_Real,["Apontamento_Real","ApontamentoReal", "Apontamentos"]);
};
