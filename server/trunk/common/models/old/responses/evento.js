'use strict';
var _ = require('lodash');
var ResponseModel = {"Sucesso": "boolean", "Mensagem": "string", "Objeto": "object"};

module.exports = function (Evento) {
    clearRemoteMethods(Evento);

    createCadastrarEventoMethod(Evento);
    createAlterarEventoMethod(Evento);
    createExcluirEventoMethod(Evento);
    createBuscarEventoMethod(Evento);
    createBuscarEventosPagMethod(Evento);
};

var createExcluirEventoMethod = function (Evento) {
    Evento.excluirEvento = function (arg, cb) {
        verificaToken(arg, cb, function (obj) {
            var responseModel = {};
            responseModel.Sucesso = false;
            responseModel.Objeto = null;
            responseModel.Sucesso = false;
            responseModel.Objeto = null;

            var filter = {where: {Id: arg.Id}};
            Evento.findOne(filter, function (err, obj) {
                if (!obj) {
                    responseModel.Mensagem = "Este Evento não existe.";
                    cb(null, responseModel);
                } else {
                    var Predecessor = getModelObject("Predecessor");

                    Predecessor.destroyAll({IdEvento: obj.Id}, function (err, countObj) {
                        if (!err) {
                            Evento.destroyById(arg.Id, function (err, obj) {
                                if (!err) {
                                    Evento.find(null, function (err, eventos) {
                                        console.log("Restante: " + eventos);
                                        if (!err) {
                                            responseModel.Sucesso = true;
                                            responseModel.Mensagem = "Evento excluido.";
                                            responseModel.Objeto = eventos;
                                        } else {
                                            console.log(err.stack);
                                            responseModel.Mensagem = "Não foi possível excluir este evento.";
                                            responseModel.Objeto = null;
                                        }
                                        cb(null, responseModel);
                                    });
                                } else {
                                    console.log(err.stack);
                                    if (err.code === 'EREQUEST' && err.message.includes("dbo.Apontamento_Alter")) {
                                        responseModel.Mensagem = "Este evento está vinculado a um apontamento.";
                                    } else {
                                        responseModel.Mensagem = "Não foi possível excluir este evento.";
                                    }
                                    cb(null, responseModel);
                                }

                            });
                        } else {
                            console.log(err.stack);
                            responseModel.Sucesso = false;
                            responseModel.Mensagem = "Não foi possível excluir os predecessores deste evento.";
                            responseModel.Objeto = null;
                            cb(null, responseModel);
                        }
                    });
                }
            });

        });
    };

    Evento.remoteMethod(
        'excluirEvento', {
            http: {
                path: '/excluirEvento'
            },
            accepts: {
                arg: 'Evento',
                description: 'Exclusão de um evento',
                type: 'ExcluirEventoRequest',
                http: {source: 'body', verb: 'post'}
            },
            returns: {root: true, type: ResponseModel, default: ResponseModel}
        });
};

var createCadastrarEventoMethod = function (Evento) {


    Evento.cadastrarEvento = function (arg, cb) {
        verificaToken(arg, cb, function (obj) {
            var responseModel = {};
            responseModel.Sucesso = false;
            responseModel.Objeto = null;

            getModelObject("TipoEvento").findById(arg.IdTipoEvento, function (err, tpEvento) {
                console.log(tpEvento);
                if (tpEvento) {
                    if (tpEvento.Codigo === TipoEventoEnum.INICIO_DE_JORNADA
                        && arg.Predecessores
                        && arg.Predecessores.length > 0) {
                        responseModel.Sucesso = false;
                        responseModel.Mensagem = "O evento do tipo 'Início de Jornada' não pode ter predecessores.";
                        cb(null, responseModel);
                    } else {
                        var filterFilial = {
                            where: {and: [{Descricao: arg.Descricao}, {IdEmpresa: arg.IdEmpresa}, {IdFilial: arg.IdFilial}]}
                            , include: ['TipoEvento', {
                                Predecessores: 'TipoEvento'
                            }]
                        };
                        var filterEmpresa = {
                            where: {and: [{Descricao: arg.Descricao}, {IdEmpresa: arg.IdEmpresa}]}
                            , include: ['TipoEvento', {
                                Predecessores: 'TipoEvento'
                            }]
                        };

                        Evento.find((arg.IdFilial > 0 ? filterFilial : filterEmpresa), function (err, evento) {
                            console.log(evento);
                            if (evento.length > 0) {
                                responseModel.Mensagem = "Já existe um evento com este nome.";
                                responseModel.Objeto = evento;
                                cb(null, responseModel);
                            } else {
                                var Predecessor = getModelObject("Predecessor");
                                var Predecessores = arg.Predecessores;
                                arg.Predecessores = null;
                                Evento.create(arg, function (err, obj) {
                                    if (!err) {
                                        responseModel.Sucesso = true;
                                        responseModel.Mensagem = "Evento inserido";

                                        if (Predecessores.length > 0) {

                                            for (var i = 0; i < Predecessores.length; i++) {
                                                Predecessores[i]["IdEvento"] = obj.Id;
                                            }

                                            Predecessor.create(Predecessores, function (err, obj) {
                                                if (!err) {
                                                    console.log("Predecessores inseridos: " + obj);

                                                    Evento.find(null, function (err, eventos) {
                                                        if (!err) {
                                                            responseModel.Objeto = eventos;
                                                            cb(null, responseModel);
                                                        } else {
                                                            console.log(err.stack);
                                                            responseModel.Mensagem += " - Não foi possível buscar o evento.";
                                                            cb(null, responseModel);
                                                        }
                                                    });
                                                } else {
                                                    console.log(err.stack);
                                                    responseModel.Mensagem = "Não foi possível cadastrar os Predecessores.";
                                                    cb(null, responseModel);
                                                }
                                            });
                                        } else {
                                            Evento.find(null, function (err, eventos) {
                                                if (!err) {
                                                    responseModel.Objeto = eventos;
                                                    cb(null, responseModel);
                                                } else {
                                                    console.log(err.stack);
                                                    responseModel.Mensagem += " - Não foi possível buscar o evento.";
                                                    cb(null, responseModel);
                                                }
                                            });
                                        }

                                    } else {
                                        console.log(err.stack);
                                        responseModel.Sucesso = false;
                                        responseModel.Mensagem = "Não foi possível cadastrar o evento.";
                                        cb(null, responseModel);
                                    }
                                });

                            }
                        });
                    }
                } else {
                    console.log(err.stack);
                    responseModel.Sucesso = false;
                    responseModel.Mensagem = "Não foi possível verificar o  tipo do evento.";
                    cb(null, responseModel);
                }
            });


        });
    };

    Evento.remoteMethod(
        'cadastrarEvento', {
            http: {
                path: '/cadastrarEvento'
            },
            accepts: {
                arg: 'Evento',
                description: 'Registro de eventos',
                type: 'CadastrarEventoRequest',
                http: {
                    source: 'body',
                    verb: 'post'
                }
            },
            returns: {
                root: true,
                type: ResponseModel,
                default: ResponseModel
            }
        });
};

var createBuscarEventoMethod = function (Evento) {

    Evento.buscarEvento = function (arg, cb) {
        verificaToken(arg, cb, function (obj) {
            var responseModel = {};
            responseModel.Sucesso = false;
            responseModel.Objeto = null;
            // var filter = {
            //     where: {
            //         or: [w
            //             {and: [{IdEmpresa: usuario.IdEmpresa}, {IdFilial: usuario.IdFilial}]},
            //             {and: [{IdEmpresa: usuario.IdEmpresa}, {or: [{IdFilial: 0}, {IdFilial: null}]}]},
            //             {and: [{or: [{IdEmpresa: 0}, {IdEmpresa: null}]}, {or: [{IdFilial: 0}, {IdFilial: null}]}]},
            //             {and: [{or: [{IdEmpresa: 0}, {IdEmpresa: null}]}]}
            //         ]
            //     }, include: ['TipoEvento', {Predecessores: 'TipoEvento', scope: {fields: ['']}}]
            // };

            var filter = {};

            if (arg.SearchId) {
                filter = {
                    where: {
                        Id: arg.SearchId
                    },
                    include: ['TipoEvento', {
                        Predecessores: 'TipoEvento'
                    }]
                };

            } else if (arg.IdEmpresa) {
                filter = {
                    where: {
                        IdEmpresa: arg.IdEmpresa
                    },
                    include: ['TipoEvento', {
                        Predecessores: 'TipoEvento'
                    }]
                };
            } else {
                filter = {
                    where: {
                        IdEmpresa: null
                    },
                    include: ['TipoEvento', {
                        Predecessores: 'TipoEvento'
                    }]
                };
            }


            Evento.find(filter, function (err, evento) {
                console.log("Evento.buscarEvento");
                if (!err) {
                    responseModel.Sucesso = true;
                    responseModel.Mensagem = "Eventos retornados.";
                    responseModel.Objeto = {"Eventos": evento};
                    console.log(JSON.stringify(responseModel.Objeto));
                    cb(null, responseModel);
                }
                else {
                    console.log(err.stack);
                    responseModel.Mensagem = "Não foi possível buscar o evento.";
                    cb(null, responseModel);
                }
            });
        });
    };

    Evento.remoteMethod(
        'buscarEvento', {
            http: {
                path: '/buscarEvento'
            },
            accepts: {
                arg: 'Evento',
                description: 'Buscar eventos',
                type: 'BuscarEventoRequest',
                http: {
                    source: 'body',
                    verb: 'post'
                }
            },
            returns: {
                root: true,
                type: ResponseModel,
                default: ResponseModel
            }
        });
};

var createBuscarEventosPagMethod = function (Evento) {
    Evento.buscarEventoPag = function (arg, cb) {
        console.log("=> REQUEST: " + JSON.stringify(arg));
        verificaToken(arg, cb, function (obj) {
            var responseModel = {};
            responseModel.Sucesso = false;
            responseModel.Objeto = null;

            var filter = getFilterPagination(arg);

            filter["include"] = JSON.parse('["TipoEvento", { "Predecessores": "TipoEvento" }]');
            Evento.find(filter, function (err, evento) {
                console.log(evento);

                if (!err) {
                    var take = arg.Take;
                    var page = arg.Page;
                    var skipNum = (page > 0) ? ((page - 1) * take) : 0;

                    var itemsSel = _.slice(evento, skipNum, skipNum + take);

                    responseModel.Sucesso = true;
                    responseModel.Mensagem = "Eventos retornados.";
                    responseModel.Objeto = {
                        "totalItems": evento.length,
                        "items": itemsSel
                    };
                    console.log("=> RESPONSE: " + JSON.stringify(responseModel.Objeto));
                    cb(null, responseModel);
                }
                else {
                    console.log(err.stack);
                    responseModel.Objeto = {
                        "totalItems": 0,
                        "items": []
                    };
                    responseModel.Mensagem = "Não foi possível buscar o evento.\n " +
                        "\n=> REQUEST: " + JSON.stringify(arg) +
                        "\n=> RESPONSE: " + JSON.stringify(responseModel.Objeto);
                    "\n=> ERROR: " + err.stack;
                    console.log("=> RESPONSE: " + JSON.stringify(responseModel.Objeto));
                    cb(null, responseModel);
                }
            });
        });
    };

    Evento.remoteMethod(
        'buscarEventoPag', {
            http: {
                path: '/buscarEventoPag'
            },
            accepts: {
                arg: 'Evento',
                description: 'Buscar eventos',
                type: 'BuscarPaginadoRequest',
                http: {
                    source: 'body',
                    verb: 'post'
                }
            },
            returns: {
                root: true,
                type: ResponseModel,
                default: ResponseModel
            }
        });
};

var createAlterarEventoMethod = function (Evento) {

    Evento.alterarEvento = function (arg, cb) {
        verificaToken(arg, cb, function (obj) {
            var responseModel = {};
            responseModel.Sucesso = false;
            responseModel.Objeto = null;
            Evento.upsert(arg, function (err, evento) {
                if (err) {
                    console.log(err.stack);
                    responseModel.Objeto = null;
                    responseModel.Mensagem = "Não foi possível alterar o evento.\n " + err.stack;
                    cb(null, responseModel);
                } else {
                    responseModel.Objeto = null;
                    var predecessores = arg.Predecessores;

                    var Predecessor = getModelObject("Predecessor");

                    Predecessor.deleteAll({IdEvento: evento.Id}, function (err, objRet) {
                        if (!err) {

                            if (predecessores) {
                                for (var i = 0; i < predecessores.length; i++) {
                                    if (predecessores[i].Id) {
                                        delete predecessores[i]['TipoEvento'];
                                    } else {
                                        predecessores[i]["IdEvento"] = evento.Id;
                                    }

                                    Predecessor.upsert(predecessores[i], function (err, predecessoresRet) {
                                    });
                                }
                            }

                            var filterId = {
                                where: {
                                    Id: evento.Id
                                },
                                include: ['TipoEvento', {
                                    Predecessores: 'TipoEvento'
                                }]
                            };

                            Evento.find(filterId, function (err, evento) {
                                console.log(evento);
                                var predecess = [];
                                if (!err) {
                                    responseModel.Sucesso = true;
                                    responseModel.Mensagem = "Evento alterado";
                                    responseModel.Objeto = evento;
                                    cb(null, responseModel);
                                }
                                else {
                                    console.log(err.stack);
                                    responseModel.Mensagem = "Não foi possível buscar o evento.";
                                    cb(null, responseModel);
                                }
                            });
                        } else {
                            console.log(err.stack);
                            responseModel.Mensagem = "Não foi possível alterar os predecessores";
                            cb(null, responseModel);
                        }
                    });
                }
            });
        });
    };

    Evento.remoteMethod(
        'alterarEvento', {
            http: {
                path: '/alterarEvento'
            },
            accepts: {
                arg: 'Evento',
                description: 'Alterar evento',
                type: 'AlterarEventoRequest',
                http: {
                    source: 'body',
                    verb: 'post'
                }
            },
            returns: {
                root: true,
                type: ResponseModel,
                default: ResponseModel
            }
        });
};

var clearRemoteMethods = function (Evento) {
    removerMetodosPadroes(Evento, ["TipoEvento", "Apontamento_Real", "Apontamento_Alter", "Predecessores"]);
};

