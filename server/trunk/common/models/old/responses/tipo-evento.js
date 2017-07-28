'use strict';
var ResponseModel = {"Sucesso": "boolean","Mensagem": "string","Objeto": "object"};

module.exports = function (TipoEvento) {
    clearRemoteMethods(TipoEvento);

    createCadastrarTipoEventoMethod(TipoEvento);
    createAlterarTipoEventoMethod(TipoEvento);
    createExcluirTipoEventoMethod(TipoEvento);
    createBuscarTipoEventoMethod(TipoEvento);
};

var createCadastrarTipoEventoMethod = function (TipoEvento) {

    TipoEvento.cadastrarTipoEvento = function (arg, cb) {
        verificaToken(arg, cb, function (obj) {
            var responseModel = {};
            responseModel.Sucesso = false;
            responseModel.Objeto = null;
            var filter = {where: {Descricao: arg.Descricao}};
            TipoEvento.find(filter, function (err, tpJornada) {
                console.log(tpJornada);
                if (tpJornada.length > 0) {
                    responseModel.Mensagem = "Este tipo de jornada já existe.";
                    responseModel.Objeto = tpJornada;
                    cb(null, responseModel);
                } else {
                    TipoEvento.create(arg, function (err, obj) {
                        TipoEvento.find(null, function (err, TipoEventos) {
                            if (!err) {
                                responseModel.Sucesso = true;
                                responseModel.Mensagem = "Tipo de jornada inserida.";
                                responseModel.Objeto = TipoEventos;
                            } else {
                                console.log(err.stack);
                                responseModel.Mensagem = "Não foi possível cadastrar o tipo de jornada.";
                            }
                            cb(null, responseModel);
                        });
                    });

                }
            });
        });
    };

    TipoEvento.remoteMethod(
        'cadastrarTipoEvento', {
            http: {
                path: '/cadastrarTipoEvento'
            },
            accepts: {
                arg: 'TipoEvento',
                description: 'Registro de Tipo de Jornada',
                type: 'CadastrarTipoEventoRequest',
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

var createAlterarTipoEventoMethod = function (TipoEvento) {
    TipoEvento.alterarTipoEvento = function (arg, cb) {
        verificaToken(arg, cb, function (obj) {
            var responseModel = {};
            responseModel.Sucesso = false;
            responseModel.Objeto = null;
            TipoEvento.upsert(arg, function (err, tipoEvento) {
                console.log(tipoEvento);
                if (err) {
                    console.log(err.stack);
                    responseModel.Objeto = null;
                    responseModel.Mensagem = "Não foi possível alterar o tipoEvento.\n "+err.stack;
                    cb(null, responseModel);
                } else {
                    responseModel.Sucesso = true;
                    responseModel.Mensagem = "TipoEvento alterado";
                    responseModel.Objeto = tipoEvento;
                    cb(null, responseModel);
                }
            });
        });
    };

    TipoEvento.remoteMethod(
        'alterarTipoEvento', {
            http: {
                path: '/alterarTipoEvento'
            },
            accepts: {
                arg: 'TipoEvento',
                description: 'Alterar tipo de Evento',
                type: 'AlterarTipoEventoRequest',
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

var createExcluirTipoEventoMethod = function (TipoEvento) {
    TipoEvento.excluirTipoEvento = function (arg, cb) {
        verificaToken(arg, cb, function (obj) {
            var responseModel = {};
            responseModel.Sucesso = false;
            responseModel.Objeto = null;
            var filter = {where: {Id: arg.Id}};
            TipoEvento.findOne(filter, function (err, obj) {
                    if (!obj) {
                        responseModel.Mensagem = "Este tipo de evento não existe.";
                        cb(null,responseModel);
                    } else {
                        var objRemove = obj;
                        TipoEvento.find({where: {Id : obj.Id}}, function(err, TipoEvento) {
                            if (!err) {
                                objRemove = TipoEvento;
                            }
                        });

                        TipoEvento.destroyById(arg.Id, function (err, obj) {
                            TipoEvento.find(null, function(err, tipoEventos) {
                                console.log("Restante: "+tipoEventos);
                                if (!err) {
                                    responseModel.Sucesso = true;
                                    responseModel.Mensagem = "Tipo de evento excluido.";
                                    responseModel.Objeto = tipoEventos;
                                } else {
                                    console.log(err.stack);
                                    responseModel.Sucesso = false;
                                    responseModel.Mensagem = "Não foi possível excluir este tipo de evento.";
                                    responseModel.Objeto = null;
                                }
                                cb(null, responseModel);
                            });
                        });
                    }
            });

        });
    };

    TipoEvento.remoteMethod(
        'excluirTipoEvento', {
            http: {
                path: '/excluirTipoEvento'
            },
            accepts: {
                arg: 'TipoEvento',
                description: 'Exclusão de um tipo de jornada',
                type: 'ExcluirTipoEventoRequest',
                http: {source: 'body', verb: 'post'}
            },
            returns: {root: true, type: ResponseModel, default: ResponseModel}
        });
};

var createBuscarTipoEventoMethod = function (TipoEvento) {
    TipoEvento.buscarTipoEvento = function (arg, cb) {
        verificaToken(arg, cb, function (obj) {
            var responseModel = {};
            responseModel.Sucesso = false;
            responseModel.Objeto = null;
            var filterId = {where: {Id: arg.SearchId}};
            // var filterId = {where: {Id:  {gt: 0}}, include: ['TipoTipoEvento', {Predecessor: 'TipoTipoEvento'}]};

            TipoEvento.find((arg.SearchId> 0 ? filterId : null), function (err, tipoEvento) {
                console.log(tipoEvento);
                var predecess = [];
                if (!err) {
                    // for (var i=0; i < tipoEvento.length-1; i++){
                    //     var predecessor = [];
                    //     predecess = tipoEvento[i].toJSON().Predecessor;
                    //     for (var x=0; x < predecess.count-1; x++){
                    //         predecessor.push(predecess[x].TipoTipoEvento)
                    //     }
                    //     evento[i].Predecessor[x] = predecessor;
                    // }

                    responseModel.Sucesso = true;
                    responseModel.Mensagem = "Tipos de eventos retornados.";
                    responseModel.Objeto = {"TipoEventos" : tipoEvento};
                    cb(null, responseModel);
                }
                else {
                    console.log(err.stack);
                    responseModel.Mensagem = "Não foi possível buscar os tipos de eventos.";
                    cb(null, responseModel);
                }
            });
        });
    };

    TipoEvento.remoteMethod(
        'buscarTipoEvento', {
            http: {
                path: '/buscarTipoEvento'
            },
            accepts: {
                arg: 'TipoEvento',
                description: 'Buscar eventos',
                type: 'BuscarTipoEventoRequest',
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

var clearRemoteMethods = function (TipoEvento) {
    removerMetodosPadroes(TipoEvento, ["Evento"]);
};

