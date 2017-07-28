'use strict';
var _ = require('lodash');
var ResponseModel = {"Sucesso": "boolean", "Mensagem": "string", "Objeto": "object"};

module.exports = function (Jornada_Alter) {
    clearRemoteMethods(Jornada_Alter);

    createCadastrarJornadaAlterMethod(Jornada_Alter);
    createAlterarJornadaAlterMethod(Jornada_Alter);
    createExcluirJornadaAlterMethod(Jornada_Alter);
    createBuscarJornadaAlterMethod(Jornada_Alter);
    createBuscarJornadaAlterPaginadoMethod(Jornada_Alter);
    createFinalizarJornadaAlterMethod(Jornada_Alter);
};

var createExcluirJornadaAlterMethod = function (Jornada_Alter) {
    Jornada_Alter.excluirJornadaAlter = function (arg, cb) {
        console.log("Jornada_Alter.excluirJornadaAlter");
        console.log("=> REQUEST: " + JSON.stringify(arg));
        verificaToken(arg, cb, function (obj) {
            var responseModel = {};
            responseModel.Sucesso = false;
            responseModel.Objeto = null;
            var ApontamentoAlter = getModelObject("Apontamento_Alter");

            ApontamentoAlter.destroyAll({IdJornada: arg.Id}, function (err, countObj) {
                if (!err){
                    Jornada_Alter.deleteById(arg.Id, function (err, obj) {
                        if (!err){
                            responseModel.Mensagem = "Jornada excluida.";
                            responseModel.Sucesso = true;
                            responseModel.Objeto = null;
                            cb(null, responseModel);
                        } else {
                            console.log(err.stack);
                            if (err.code === 'EREQUEST' && err.message.includes("dbo.Apontamento_Alter")){
                                responseModel.Mensagem = "Esta jornada está vinculada a um apontamento.";
                            } else{
                                responseModel.Mensagem = "Não foi possível excluir esta Jornada.";
                            }
                            cb(null, responseModel);
                        }
                    });
                } else {
                    console.log(err.stack);
                    responseModel.Mensagem = "Não foi possível excluir esta Jornada.\nErro ao excluir os apontamentos vinculados";
                    cb(null, responseModel);
                }
            });

        });
    };

    Jornada_Alter.remoteMethod(
        'excluirJornadaAlter', {
            http: {
                path: '/excluirJornadaAlter'
            },
            accepts: {
                arg: 'Jornada_Alter',
                description: 'Exclusão de jornada',
                type: 'ExcluirJornadaRequest',
                http: {source: 'body', verb: 'post'}
            },
            returns: {root: true, type: ResponseModel, default: ResponseModel}
        });
};

var createCadastrarJornadaAlterMethod = function (Jornada_Alter) {
    Jornada_Alter.cadastrarJornada = function (arg, cb) {
        console.log("Jornada_Alter.cadastrarJornada");
        console.log("=> REQUEST: " + JSON.stringify(arg));
        verificaToken(arg, cb, function (obj) {
            var responseModel = {};
            responseModel.Mensagem = "Não foi possível cadastrar a jornada.";
            responseModel.Sucesso = false;
            responseModel.Objeto = null;

            var JornadaReal = getModelObject("Jornada_Real");

            JornadaReal.create(arg, function (err, jornadaReal) {
                responseModel.Mensagem = "Jornada cadastrada.";
                if (!err){
                    // Inserir o id da jornadaReal na JornadaAlter
                    //jornadaAlter.IdJornadaReal = jornadaReal.Id;
                    arg["IdJornadaReal"] = jornadaReal.Id;

                    Jornada_Alter.create(arg, function (err, jornadaAlter) {
                        if (!err){
                            var Jornada = jornadaAlter.toJSON();
                            //Jornada["Usuario"] = getUsuario(usuario);
                            responseModel.Sucesso = true;
                            responseModel.Objeto = {"Jornada": Jornada};
                            cb(null, responseModel);
                        }else {
                            console.log(err.stack);
                            responseModel.Mensagem = "Não foi possível cadastrar a jornada.";
                            responseModel.Sucesso = true;
                            cb(null, responseModel);
                        }
                    });
                }else {
                    responseModel.Mensagem = "Não foi possível cadastrar a jornada real.";
                    console.log(err.stack);
                    cb(null, responseModel);
                }
            });
        });
    };

    Jornada_Alter.remoteMethod(
        'cadastrarJornada', {
            http: {
                path: '/cadastrarJornada'
            },
            accepts: {
                arg: 'Jornada_Alter',
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

var createAlterarJornadaAlterMethod = function (Jornada_Alter) {
    Jornada_Alter.alterarJornadaAlter = function (arg, cb) {
        console.log("Jornada_Alter.alterarJornadaAlter");
        console.log("=> REQUEST: " + JSON.stringify(arg));
        verificaToken(arg, cb, function (obj) {
            var responseModel = {};
            responseModel.Sucesso = false;
            responseModel.Objeto = null;
            responseModel.Mensagem = "Não foi possível cadastrar a jornada.";

            Jornada_Alter.upsert(arg, function (err, jornadaAlter) {
                if (!err){
                    responseModel.Mensagem = "Jornada alterada.";
                    Jornada_Alter.find(null, function (err, jornadas) {
                        if (!err && jornadas.length>0){

                            var Jornada = jornadas[0].toJSON();
                            // Jornada["Usuario"] = getUsuario(usuario);

                            responseModel.Sucesso = true;
                            responseModel.Objeto = {"Jornada": Jornada};
                            cb(null, responseModel);
                        } else {
                            console.log(err.stack);
                            responseModel.Sucesso = true;
                            cb(null, responseModel);
                        }
                    });
                }else {
                    console.log(err.stack);
                    cb(null, responseModel);
                }
            });
        });
    };

    Jornada_Alter.remoteMethod(
        'alterarJornada', {
            http: {
                path: '/alterarJornada'
            },
            accepts: {
                arg: 'Jornada_Alter',
                description: 'Alterar Jornada alter',
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

var createBuscarJornadaAlterMethod = function (Jornada_Alter) {
    Jornada_Alter.buscarJornada = function (arg, cb) {
        console.log("Jornada_Alter.buscarJornada");
        console.log("=> REQUEST Jornada_Alter.buscarJornada: " + JSON.stringify(arg));
        verificaToken(arg, cb, function (obj) {
            var responseModel = {};
            responseModel.Objeto = null;
            responseModel.Sucesso = false;

            var filter;
            if (arg.SearchId){
                filter = {where: {Id: arg.SearchId}};
            } else if (arg.DataInicioJornada){
                filter = {where: {and: [{DataInicioJornada: arg.DataInicioJornada},{IdUsuario: arg.IdUsuario}]}};
            } else {
                filter = {where: {and: [{DataFimJornada: null},{IdUsuario: arg.IdUsuario}] }};
            }
            filter["include"] = JSON.parse('{"Apontamentos": ' +
                '[{"Evento": ["TipoEvento","Predecessores"], ' +
                '"include": {"TipoEvento": [{"TipoEvento": "TipoEvento"}]}}]}');

            responseModel.Mensagem = "Não há jornada aberta para este usuário.";
            responseModel.Sucesso = false;

            console.log(JSON.stringify(filter));

            Jornada_Alter.find(filter, function (err, jornadasRet) {
                if (!err){
                    if (jornadasRet.length>0){

                        var Jornada = jornadasRet[0].toJSON();
                        // Jornada["Usuario"] = usuario;
                        Jornada.IdHorario = arg.IdHorario;
                        // Ordenando os apontamentos que foram  incluidos fora da ordem
                        Jornada.Apontamentos.sort(compareValues('DataHoraInicio', 'asc'));

                        Jornada.TipoJornada = 1;
                        somaTotaisJornada(Jornada, function (err, jornadaRet) {
                            if (!err) {
                                if (jornadaRet && jornadaRet.Sucesso){
                                    responseModel.Mensagem = "Jornada retornada.";
                                    responseModel.Objeto = {"Jornada": jornadaRet.Objeto};
                                    responseModel.Sucesso = true;
                                } else {
                                    responseModel.Mensagem = jornadaRet.Mensagem;
                                    responseModel.Objeto = null;
                                    responseModel.Sucesso = false;
                                }
                                console.log("=> RESPONSE: " + responseModel.Objeto);
                                cb(null,responseModel);
                            } else {
                                console.log("ERRO: " + err.stack);
                                responseModel.Sucesso = false;
                                responseModel.Mensagem = "Erro ao atualizar os totais da jornada.";
                                console.log("=> RESPONSE: " + responseModel.Objeto);
                                cb(null,responseModel);
                            }
                        });
                    } else{
                        responseModel.Sucesso = true;
                        responseModel.Objeto = {"Jornada": null};
                        cb(null, responseModel);
                    }

                    console.log("=> RESPONSE Jornada_Alter.buscarJornada: " + JSON.stringify(responseModel.Objeto));
                }else {
                    console.log(err.stack);
                    cb(null, responseModel);
                }
            });
        });
    };

    Jornada_Alter.remoteMethod(
        'buscarJornada', {
            http: {
                path: '/buscarJornada'
            },
            accepts: {
                arg: 'Jornada_Alter',
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

var createBuscarJornadaAlterPaginadoMethod = function (Jornada_Alter) {
    var responseModel = {};
    responseModel.Sucesso = false;
    Jornada_Alter.buscarJornadaPag = function (arg, cb) {
        console.log("Jornada_Alter.buscarJornadaPag ");
        console.log("=> REQUEST: " + JSON.stringify(arg));
        verificaToken(arg, cb, function (obj) {

            var filter = getFilterPagination(arg);

            filter["include"] = JSON.parse('{"Apontamentos": [{"Evento": ["TipoEvento","Predecessores"], "include": {"TipoEvento": [{"TipoEvento": "TipoEvento"}]}}]}');

            Jornada_Alter.find(filter, function (err, jornada) {
                if (!err) {
                    var take = arg.Take;
                    var page = arg.Page;
                    var skipNum = (page>0)? ((page-1)*take):0;

                    var itemsSel = _.slice(jornada, skipNum, skipNum + take);
                    // Ordenando os apontamentos que foram  incluidos fora da ordem
                    var ApontamentosOrdenados;
                    var jornadasSort=[];

                    if (itemsSel.length > 0) {
                        for (var i = 0; i < itemsSel.length; i++){
                            jornadasSort[i] = itemsSel[i].toJSON();
                            ApontamentosOrdenados = itemsSel[i].toJSON().Apontamentos.sort(compareValues('DataHoraInicio', 'asc'));
                            jornadasSort[i].Apontamentos = ApontamentosOrdenados;
                        }
                    }

                    responseModel.Sucesso = true;
                    responseModel.Mensagem = "Jornada retornada.";
                    responseModel.Objeto = {
                        "totalItems": jornada.length,
                        "items" : jornadasSort};
                    console.log("=> RESPONSE: " + JSON.stringify(responseModel.Objeto));
                    cb(null, responseModel);
                } else {
                    console.log(err.stack);
                    responseModel.Sucesso = false;
                    responseModel.Objeto = {
                        "totalItems": 0,
                        "items" : []};
                    responseModel.Mensagem = "Não foi possível buscar a jornada";
                    console.log("=> RESPONSE: " + JSON.stringify(responseModel.Objeto));
                    cb(null, responseModel);
                }
            });
        });
    };

    Jornada_Alter.remoteMethod(
        'buscarJornadaPag', {
            http: {
                path: '/buscarJornadaPag'
            },
            accepts: {
                arg: 'Jornada_Alter',
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

var createFinalizarJornadaAlterMethod = function (Jornada_Alter) {
    var responseModel = {};
    responseModel.Sucesso = false;
    console.log(" Jornada_Alter.finalizarJornada");
    Jornada_Alter.finalizarJornada = function (arg, cb) {
        verificaToken(arg, cb, function (obj) {
            Jornada_Alter.updateAll({Id : arg.SearchId}, {DataFimJornada : arg.DataFimJornada}, function (err, info) {
                if (!err){
                    var filter = {where: {Id : arg.SearchId}};
                    filter["include"] = JSON.parse('{"Apontamentos": [{"Evento": ["TipoEvento","Predecessores"], "include": {"TipoEvento": [{"TipoEvento": "TipoEvento"}]}}]}');

                    Jornada_Alter.findOne(filter, function (err2, jornadas){
                        responseModel.Sucesso = true;

                        if (!err2){

                            var Jornada = jornadas.toJSON();
                            // Jornada["Usuario"] = usuario;
                            Jornada.IdHorario = arg.IdHorario;

                            // Ordenando os apontamentos que foram  incluidos fora da ordem
                            Jornada.Apontamentos.sort(compareValues('DataHoraInicio', 'asc'));

                            Jornada.TipoJornada = 1;
                            somaTotaisJornada(Jornada, function (err, jornadaRet) {
                                if (!err) {
                                    if (jornadaRet && jornadaRet.Sucesso){
                                        responseModel.Sucesso = true;
                                        responseModel.Mensagem = "Jornada finalizada.";
                                        responseModel.Objeto = {"Jornada" : jornadaRet.Objeto} ;
                                        cb(null, responseModel);
                                    } else {
                                        responseModel.Mensagem = jornadaRet.Mensagem;
                                        responseModel.Objeto = null;
                                        console.log("=> RESPONSE: " + responseModel.Objeto);
                                        cb(null, responseModel);
                                    }

                                } else {
                                    console.log("ERRO: " + err.stack);
                                    responseModel.Objeto = Jornada;
                                    responseModel.Sucesso = false;
                                    responseModel.Mensagem = "Erro ao atualizar os totais da jornada.";

                                    console.log("=> RESPONSE: " + responseModel.Objeto);
                                    cb(null, responseModel);
                                }
                            });
                        } else {
                            console.log(err2.stack);
                            responseModel.Mensagem = "Jornada finalizada - Não foi possível retornar a jornada finalizada.";
                            cb(null, responseModel);
                        }
                    });
                }else {
                    console.log(err.stack);
                    responseModel.Mensagem = "Não foi possível finalizar a jornada.";
                    cb(null, responseModel);
                }
            });
        });
    };

    Jornada_Alter.remoteMethod(
        'finalizarJornada', {
            http: {
                path: '/finalizarJornada'
            },
            accepts: {
                arg: 'Jornada_Alter',
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

var clearRemoteMethods = function (Jornada_Alter) {
    removerMetodosPadroes(Jornada_Alter,["Apontamento_Alter","ApontamentoAlter", "Apontamentos"]);
};
