'use strict';
var _ = require('lodash');
var ResponseModel = {"Sucesso": "boolean","Mensagem": "string","Objeto": "object"};

module.exports = function (Apontamento_Real) {
    clearRemoteMethods(Apontamento_Real);

    createBuscarUltimoApontamentoMethod(Apontamento_Real);
    createBuscarApontamentoPaginadoMethod(Apontamento_Real);
    createCadastrarApontamentoRealMethod(Apontamento_Real);
    //createAlterarApontamentoRealMethod(Apontamento_Real);
    //createExcluirApontamentoRealMethod(Apontamento_Real);
};

var createExcluirApontamentoRealMethod = function (Apontamento_Real) {
    var response  = ResponseModel;

    Apontamento_Real.excluirApontamento = function (arg, cb) {

        if (arg.Token && arg.Token === tok) {
            var responseModel = {};
            responseModel.Sucesso = false;
            responseModel.Objeto = null;
            var filter = {where: {Id: arg.Id}};
            Apontamento_Real.findOne(filter, function (err, obj) {
                    if (!obj) {

                        cb(null,
                            {
                                "Sucesso": false,
                                "Mensagem": "Este apontamento não existe.",
                                "Objeto": null
                            }
                        );
                    } else {
                        var objRemove = obj;
                        Apontamento_Real.find({where: {Id: obj.Id}}, function (err, apontamento) {
                            if (!err) {
                                objRemove = apontamento;
                            }
                        });

                        Apontamento_Real.destroyById(arg.Id, function (err, obj) {
                            Apontamento_Real.find({where: {AgrupaJornada: objRemove.AgrupaJornada}}, function (err, apontamentos) {
                                console.log("Restante: " + apontamentos);
                                if (!err) {
                                    responseModel.Sucesso = true;
                                    responseModel.Mensagem = "Apontamento excluido.";
                                    responseModel.Objeto = apontamentos;
                                } else {
                                    console.log(err.stack);
                                    responseModel.Sucesso = false;
                                    responseModel.Mensagem = "Não foi possível excluir este apontamento.";
                                    responseModel.Objeto = null;
                                }
                                cb(null, responseModel);
                            });
                        });
                    }
                }
            );

        } else {
            cb(null,
                {
                    "Sucesso": false,
                    "Mensagem": "Token Inválido" + " : " + tok,
                    "Objeto": null
                }
            );
        }
    }
    ;
    Apontamento_Real.remoteMethod(
        'excluirApontamento', {
            http: {
                path: '/excluirApontamento'
            },
            accepts: {
                arg: 'Apontamento_Real',
                description: 'Exclusão de apontamento',
                type: 'ExcluirApontamentoRequest',
                http: {source: 'body', verb: 'post'}
            },
            returns: {root: true, type: ResponseModel, default: ResponseModel}
        });
};

var createAlterarApontamentoRealMethod = function (Apontamento_Real) {

    Apontamento_Real.alterarApontamento = function (apontamento, cb) {
        verificaToken(apontamento, cb, function (obj) {
            var response = {};
            response.Sucesso = false;
            response.Objeto = null;
            var JornadaReal = getModelObject("Jornada_Alter");
            var Evento = getModelObject("Evento");
            var TipoEvento = getModelObject("TipoEvento");

            console.log("Alterando o pontamento... ");

            response.Objeto = null ;


            var filterEvento = { 'Token': apontamento.Token,
                'TokenFirebase': apontamento.TokenFirebase,
                'SearchId': apontamento.IdEvento};

            Evento.buscarEvento(filterEvento, function(err, evento) {
                if (!err){
                    if (evento.Objeto.Eventos[0].toJSON().TipoEvento.Codigo !== TipoEventoEnum.INICIO_DE_JORNADA){


                        // ALTERANDO O APONTAMENTO
                        Apontamento_Real.upsert(apontamento, function (err, apontAlterado) {
                            if (!err) {
                                response.Sucesso = true;
                                response.Mensagem = "Apontamento alterado.";

                                var filter = { 'Token': apontamento.Token
                                    ,'SearchId': apontamento.IdJornada
                                    ,'IdUsuario': apontamento.IdUsuario
                                    ,'IdHorario': apontamento.IdHorario
                                };

                                // BUSCANDO A JORNADA
                                JornadaReal.buscarJornada(filter, function (err, objJor) {
                                    if (!err) {
                                        response.Sucesso = true;
                                        response.Mensagem = "Apontamento alterado com sucesso!";
                                        response.Objeto = objJor.Objeto;
                                    } else{
                                        response.Sucesso = false;
                                        response.Mensagem = "Apontamento alterado.\nPorém não foi possível recuperar dados da jornada.";
                                        console.log("ERRO: " + err.stack);
                                        response.Objeto = null;
                                    }

                                    cb(null, response);
                                });
                            } else {
                                console.log("ERRO: " + err.stack);
                                response.Sucesso = false;
                                response.Mensagem = "Erro ao alterar o apontamento";
                                response.Objeto = null;
                                cb(null, response);
                            }
                        });

                    } else {
                        response.Sucesso = false;
                        response.Mensagem = "Não é permitido alterar um apontamento de início de jornada.\nExclua este apontamento e incie uma nova jornada";
                        response.Objeto = null;
                        cb(null, response);
                    }
                } else {
                    console.log("ERRO: " + err.stack);
                    response.Sucesso = false;
                    response.Mensagem = "Erro ao alterar o apontamento"
                    response.Objeto = null;
                    cb(null, response);
                }

            });

        });
    };

    Apontamento_Real.remoteMethod(
        'alterarApontamento', {
            http: {
                path: '/alterarApontamento'
            },
            accepts: {
                arg: 'Apontamento_Real',
                description: 'Alterar apontamento',
                type: 'AlterarApontamentoRequest',
                http: {source: 'body', verb: 'post'}
            },
            returns: {root: true, type: ResponseModel, default: ResponseModel}
        });
};

var createCadastrarApontamentoRealMethod = function (Apontamento_Real) {

    Apontamento_Real.cadastrarApontamento = function (arg, cb) {
        verificaToken(arg, cb, function (obj) {
            var response = {};
            response.Sucesso = false;
            response.Objeto = null;
            var JornadaReal = getModelObject("Jornada_Real");
            var Evento = getModelObject("Evento");
            var TipoEvento = getModelObject("TipoEvento");

            response.objeto = null;
            response.Sucesso = false;

            Apontamento_Real.updateAll(
                {and: [{DataHoraInicio: {lt: new Date(arg.DataHoraInicio)}},{DataHoraFim: null}, {IdJornada: arg.IdJornada}]}, {DataHoraFim: arg.DataHoraInicio},
                function (err, retObj) {
                    if (!err) {
                        delete arg["Id"];
                        Apontamento_Real.create(arg, function (err, objCreate) {
                            console.log("Apontamento_Real.create");
                            if (!err) {
                                response.Sucesso = true;
                                response.Mensagem = "Apontamento registrado.";

                                var filterEvento = { 'Token': arg.Token,
                                    'TokenFirebase': arg.TokenFirebase,
                                    'SearchId': arg.IdEvento};

                                Evento.buscarEvento(filterEvento, function(err, evento) {
                                    if (!err){
                                        if (evento.Objeto.Eventos[0].toJSON().TipoEvento.Codigo === TipoEventoEnum.FIM_DE_JORNADA){

                                            var filterFinalizar = { 'Token': arg.Token,
                                                'TokenFirebase': arg.TokenFirebase,
                                                'SearchId': arg.IdJornada,
                                                'DataFimJornada' : arg.DataHoraInicio
                                                ,'IdUsuario': arg.IdUsuario
                                                ,'IdHorario': arg.IdHorario
                                            };

                                            // FECHANDO A JORNADA
                                            JornadaReal.finalizarJornada(filterFinalizar, function (err, responseObj) {
                                                if (!err){
                                                    if (responseObj && responseObj.Sucesso){
                                                        response.Sucesso = true;
                                                        response.Mensagem = "Jornada finalizada com o apontamento efetuado com sucesso!";
                                                        response.Objeto = objCreate;
                                                        console.log("=> RESPONSE: " + JSON.stringify(response));
                                                        cb(null, response);
                                                    }else {
                                                        response.Sucesso = false;
                                                        response.Objeto = null;
                                                        response.Mensagem = responseObj.Mensagem;
                                                        cb(null, response);
                                                    }
                                                } else {
                                                    response.Sucesso = false;
                                                    response.Objeto = null;
                                                    response.Mensagem = "O apontamento foi registrado, mas a jornada não foi fechada.";
                                                    cb(null, response);
                                                }
                                            });
                                        } else {

                                            var filter = {
                                                'Token': arg.Token
                                                ,'IdUsuario': arg.IdUsuario
                                                ,'IdHorario': arg.IdHorario,
                                                'SearchId': objCreate.IdJornada
                                            };

                                            // BUSCANDO A JORNADA
                                            JornadaReal.buscarJornada(filter, function (err, objJor) {
                                                if (!err) {
                                                    if (objJor && objJor.Sucesso && objJor.Objeto) {
                                                        response.Sucesso = true;
                                                        response.Mensagem = "Jornada retornada com o apontamento efetuado com sucesso!";
                                                        response.Objeto = objCreate;
                                                        console.log("=> RESPONSE: " + JSON.stringify(response));
                                                        cb(null, response);

                                                    } else {
                                                        console.log("ERRO: " + objJor.Mensagem);
                                                        response.Mensagem = objJor.Mensagem;
                                                        response.Objeto = null;
                                                        console.log("=> RESPONSE: " + response.Objeto);
                                                        cb(null, response);
                                                    }
                                                } else {
                                                    console.log("ERRO: " + err.stack);
                                                    cb(null, response);
                                                }
                                            });
                                        }
                                    } else {
                                        console.log("ERRO: " + err.stack);
                                        response.Sucesso = false;
                                        response.Mensagem = "Erro ao fazer o apontamento";
                                        response.Objeto = null;
                                        cb(null, response);
                                    }

                                });

                            } else {
                                console.log("ERRO: " + err.stack);
                                response.Sucesso = false;
                                response.Mensagem = "Erro ao fazer o apontamento";
                                response.Objeto = null;
                                cb(null, response);
                            }
                        });

                    } else {
                        console.log("ERRO: " + err.stack);
                        response.Mensagem = "Erro ao fechar apontamento anterior";
                        cb(null, response);
                    }
                });
        });
    };

    Apontamento_Real.remoteMethod(
        'cadastrarApontamento', {
            http: {
                path: '/cadastrarApontamento'
            },
            accepts: {
                arg: 'Apontamento_Real',
                description: 'Registro de apontamento',
                type: 'CadastrarApontamentoRequest',
                http: {source: 'body', verb: 'post'}
            },
            returns: {root: true, type: ResponseModel, default: ResponseModel}
        });
};

var createBuscarUltimoApontamentoMethod = function (Apontamento_Real) {

    Apontamento_Real.buscarUltimoApontamento = function (arg, cb) {
        verificaToken(arg, cb, function (obj) {
            var response = {};
            response.Sucesso = false;
            response.Objeto = null;

            var filter = {where:
                {and: [{TokenFirebase: arg.TokenFirebase},{IdUsuario: arg.IdUsuario},{ DataHoraFim :null} ]},
                include: {Evento: ['TipoEvento','Predecessor'], include: {TipoEvento: [{TipoEvento: 'TipoEvento'}]}}
            };

            Apontamento_Real.find(filter, function (err, apontamento) {
                if (!err) {
                    response.Sucesso = true;
                    if (apontamento !== null){
                        response.Mensagem = "Último apontamento retornado.";
                        response.Objeto = apontamento ;
                    } else {
                        response.Mensagem = "Não há apontamento registrado para este usuário.";
                        response.Objeto = null ;
                    }
                    cb(null, response);
                } else {
                    console.log("ERRO: " + err.stack);
                    response.Mensagem = "Não foi possível buscar o último apontamento retornado.";
                    cb(null, response);
                }

            });
        });
    };

    Apontamento_Real.remoteMethod(
        'buscarUltimoApontamento', {
            http: {
                path: '/buscarUltimoApontamento'
            },
            accepts: {
                arg: 'Apontamento_Real',
                description: 'Buscar Último apontamento',
                type: 'BuscarUltimoApontamentoRequest',
                http: {source: 'body', verb: 'post'}
            },
            returns: {root: true, type: ResponseModel, default: ResponseModel}
        });
};

var createBuscarApontamentoPaginadoMethod = function (Apontamento_Real) {

    Apontamento_Real.buscarApontamentoPag = function (arg, cb) {
        console.log("=> REQUEST: " + JSON.stringify(arg));
        verificaToken(arg, cb, function (obj) {
            var responseModel = {};
            responseModel.Sucesso = false;
            responseModel.Objeto = null;
            var filter = getFilterPagination(arg);

            filter["include"] = JSON.parse(' {"Evento": ["TipoEvento","Predecessores"], "include": {"TipoEvento": [{"TipoEvento": "TipoEvento"}]}}');

            Apontamento_Real.find(filter, function (err, apontamento) {
                if (!err) {
                    var take = arg.Take;
                    var page = arg.Page;
                    var skipNum = (page>0)? ((page-1)*take):0;

                    var itemsSel = _.slice(apontamento, skipNum, skipNum + take);

                    responseModel.Sucesso = true;
                    responseModel.Mensagem = "Jornada retornada.";
                    responseModel.Objeto = {
                        "totalItems": apontamento.length,
                        "items" : itemsSel};
                    console.log("=> RESPONSE: " + JSON.stringify(responseModel.Objeto));
                    cb(null, responseModel);
                } else {
                    responseModel.Objeto = {
                        "totalItems": 0,
                        "items" : []};
                    responseModel.Mensagem = "Não foi possível buscar o apontamento.\n "+
                        "\n=> REQUEST: " + JSON.stringify(arg)+
                        "\n=> RESPONSE: " + JSON.stringify(responseModel.Objeto);
                    "\n=> ERROR: "+err.stack;
                    console.log("=> RESPONSE: " + JSON.stringify(responseModel.Objeto));
                    cb(null, responseModel);
                }
            });
        });
    };

    Apontamento_Real.remoteMethod(
        'buscarApontamentoPag', {
            http: {
                path: '/buscarApontamentoPag'
            },
            accepts: {
                arg: 'Apontamento_Real',
                description: 'Buscar apontamentos paginados',
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

var clearRemoteMethods = function (Apontamento_Real) {
    removerMetodosPadroes(Apontamento_Real, ["Evento", "Jornada", "JornadaRelations"]);
};
