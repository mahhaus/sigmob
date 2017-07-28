'use strict';
var _ = require('lodash');
var ResponseModel = {"Sucesso": "boolean", "Mensagem": "string", "Objeto": "object"};

module.exports = function (Apontamento_Alter) {
    clearRemoteMethods(Apontamento_Alter);

    createBuscarUltimoApontamentoMethod(Apontamento_Alter);
    createBuscarApontamentoPaginadoMethod(Apontamento_Alter);
    //createBuscarApontamentoByDataMethod(Apontamento_Alter);
    createCadastrarApontamentoAlterMethod(Apontamento_Alter);
    createAlterarApontamentoAlterMethod(Apontamento_Alter);
    createExcluirApontamentoAlterMethod(Apontamento_Alter);
    createSearchApontByIdMethod(Apontamento_Alter);
};

var createSearchApontByIdMethod = function (Apontamento_Alter) {
    Apontamento_Alter.searchApontById = function (arg, cb) {
        padrao.metodoPadrao(arg);
        if (arg.Token && arg.Token === tok) {
            var filter = {where: {Id: arg.Id}};
            Apontamento_Alter.findOne(filter, function (err, obj) {
                if (obj) {
                    filter = {where: {Id: arg.SearchId}};
                    Apontamento_Alter.findOne(filter, function (err, obj) {
                        if (obj) {
                            cb(null, {
                                'Sucesso': true,
                                'Mensagem': null,
                                'Objeto': obj
                            });
                        }
                        cb(null, {
                            'Sucesso': false,
                            'Mensagem': 'Apontamento não encontrado.',
                            'Objeto': null
                        });
                    });
                }
                cb(null, {
                    'Sucesso': false,
                    'Mensagem': 'Token Invalido.',
                    'Objeto': null
                });
            });
        } else {
            cb(null,
                {
                    "Sucesso": false,
                    "Mensagem": "Token Invalido.",
                    "Objeto": null
                }
            );
        }

        Apontamento_Alter.remoteMethod(
            'apontamentoById', {
                http: {
                    path: '/apontamentoById'
                },
                accepts: {
                    arg: 'Request',
                    description: 'Requisição de Busca',
                    type: 'SearchApontByIdRequest',
                    http: {source: 'body', verb: 'get'}
                },
                returns: {root: true, type: ResponseModel, default: ResponseModel}
            });
    }
};

var createExcluirApontamentoAlterMethod = function (Apontamento_Alter) {
    Apontamento_Alter.excluirApontamento = function (arg, cb) {
        console.log("Apontamento_Alter.excluirApontamento");
        verificaToken(arg, cb, function (obj) {
            var responseModel = {};
            responseModel.Sucesso = false;
            responseModel.Objeto = null;

            var JornadaAlter = getModelObject("Jornada_Alter");
            var Evento = getModelObject("Evento");

            if (!arg.IdHorario) {
                console.log("Não foi possível excluir este apontamento. Horário do usuário não informado.");
                responseModel.Mensagem = "Não foi possível excluir este apontamento. Horário do usuário não informado.";
                cb(null, responseModel);
            } else {
                Apontamento_Alter.findById(arg.Id, function (err, obj) {
                    if (!err) {
                        if (obj) {
                            // verifica e há um apontamento anterior e alterar a datafim para nulo
                            arg.IdUsuario = obj.IdUsuario;
                            var filterEvento = {
                                "Token": arg.Token,
                                "TokenFirebase": arg.TokenFirebase,
                                "SearchId": obj.IdEvento
                            };

                            Evento.buscarEvento(filterEvento, function (err, evento) {
                                if (!err) {
                                    if (evento.Sucesso && evento.Objeto) {
                                        var novaDataFim = null;
                                        if (obj.DataHoraFim !== null) {
                                            novaDataFim = obj.DataHoraFim;
                                        }

                                        console.log("Data para excluir: " + novaDataFim);

                                        if ((evento.Objeto.Eventos[0].toJSON().TipoEvento.Codigo === TipoEventoEnum.FIM_DE_JORNADA ||
                                            evento.Objeto.Eventos[0].toJSON().TipoEvento.Codigo === TipoEventoEnum.INICIO_DE_JORNADA)
                                            && !arg.Mobile) {

                                            responseModel.Mensagem = "Não é possível excluir o apontamento inicial e final da jornada";
                                            cb(null, responseModel);
                                        } else {
                                            Apontamento_Alter.updateAll(
                                                {and: [{DataHoraFim: obj.DataHoraInicio}, {IdJornada: obj.IdJornada}, {IdUsuario: obj.IdUsuario}]},
                                                {DataHoraFim: novaDataFim},
                                                function (err, retObj) {
                                                    if (!err) {
                                                        // Se não encontrou apontamentos anteriores, exclui a jornada
                                                        if (retObj.count <= 0) {
                                                            arg.Id = obj.IdJornada;
                                                            console.log("Alterou o apontamento excluirJornadaAlter: " + novaDataFim);
                                                            JornadaAlter.excluirJornadaAlter(arg, function (err, response) {
                                                                if (!err) {
                                                                    // Se obteve sucesso, indica que os apontamentos vinculados tbm foram excluidos
                                                                    if (response.Sucesso) {
                                                                        responseModel.Sucesso = true;
                                                                        responseModel.Mensagem = "Apontamento excluido.";
                                                                    } else {
                                                                        responseModel.Mensagem = response.Mensagem;
                                                                    }
                                                                    cb(null, responseModel);
                                                                } else {
                                                                    console.log(err.stack);
                                                                    responseModel.Mensagem = "Não foi possível excluir este apontamento.\nErro ao excluir a jornada";
                                                                    cb(null, responseModel);
                                                                }
                                                            });
                                                        } else {
                                                            console.log("Alterou o apontamento: " + novaDataFim);
                                                            Apontamento_Alter.destroyById(arg.Id, function (err, objDeleted) {
                                                                if (!err) {

                                                                    delete arg['Id'];

                                                                    var filter = {
                                                                        'Token': arg.Token,
                                                                        'SearchId': obj.IdJornada,
                                                                        'IdUsuario': arg.IdUsuario,
                                                                        'IdHorario': arg.IdHorario
                                                                    };

                                                                    JornadaAlter.buscarJornada(filter, function (err, response) {
                                                                        responseModel.Sucesso = true;
                                                                        if (!err && response.Sucesso) {
                                                                            responseModel.Objeto = response.Objeto;
                                                                            responseModel.Mensagem = "Apontamento excluido.";
                                                                            cb(null, responseModel);
                                                                        } else {
                                                                            responseModel.Mensagem = "Apontamento excluido.\nNão foi possível retornar a jornada.";
                                                                            cb(null, responseModel);
                                                                        }
                                                                    });
                                                                } else {
                                                                    console.log(err.stack);
                                                                    console.log(err.message);
                                                                    responseModel.Mensagem = "Não foi possível excluir este apontamento.";
                                                                    cb(null, responseModel);
                                                                }
                                                            });
                                                        }
                                                    } else {
                                                        console.log(err.stack);
                                                        responseModel.Mensagem = "Não foi possível excluir este apontamento.";
                                                        cb(null, responseModel);
                                                    }
                                                });
                                        }
                                    } else {
                                        console.log("Evento : " + evento.Mensagem);
                                        responseModel.Mensagem = evento.Mensagem;
                                        cb(null, responseModel);
                                    }
                                } else {
                                    console.log(err.stack);
                                    responseModel.Mensagem = "Não foi possível buscar o evento deste apontamento.";
                                    cb(null, responseModel);
                                }
                            });
                        } else {
                            responseModel.Mensagem = "Apontamento inexistente.";
                            cb(null, responseModel);
                        }
                    } else {
                        console.log(err.stack);
                        responseModel.Mensagem = "Não foi possível excluir este apontamento.";
                        cb(null, responseModel);
                    }
                });
            }
        });
    };

    Apontamento_Alter.remoteMethod(
        'excluirApontamento', {
            http: {
                path: '/excluirApontamento'
            },
            accepts: {
                arg: 'Apontamento_Alter',
                description: 'Exclusão de apontamento',
                type: 'ExcluirApontamentoRequest',
                http: {source: 'body', verb: 'post'}
            },
            returns: {root: true, type: ResponseModel, default: ResponseModel}
        });
};

var createAlterarApontamentoAlterMethod = function (Apontamento_Alter) {
    Apontamento_Alter.alterarApontamento = function (apontamento, cb) {
        console.log("Apontamento_Alter.alterarApontamento ");
        verificaToken(apontamento, cb, function (obj) {
            var response = {};
            response.Sucesso = false;
            response.Objeto = null;
            var JornadaAlter = getModelObject("Jornada_Alter");
            var TipoEvento = getModelObject("TipoEvento");
            var Evento = getModelObject("Evento");

            response.Sucesso = false;
            response.Objeto = null;


            if (!apontamento.IdHorario) {
                console.log("Não foi possível alterar este apontamento. Horário não informado.");
                response.Mensagem = "Não foi possível alterar este apontamento. Horário não informado.";
                cb(null, response);
            } else if (!apontamento.MotivoAlteracao || (apontamento.MotivoAlteracao && apontamento.MotivoAlteracao === "")) {
                console.log("Informe o motivo desta alteração.");
                response.Mensagem = "Informe o motivo da alteração.";
                cb(null, response);
            } else {
                var filter = {
                    where: {
                        and: [
                            {IdUsuario: apontamento.IdUsuario},
                            {
                                or: [{DataInicioJornada: apontamento.DataHoraInicio},
                                    {and: [{DataFimJornada: {gt: apontamento.DataHoraInicio}}, {DataInicioJornada: {lt: apontamento.DataHoraInicio}}]}]
                            }
                        ]
                    }
                };

                // Verifica se ja existe um apontamento de inicio de jornada com a mesma data
                JornadaAlter.find(filter, function (err, jornadaAnt) {
                    if (err) {
                        console.log("ERRO: " + err.stack);
                        response.Mensagem = "Erro ao verificar inserção entre jornadas já fechada..";
                        cb(null, response);
                    } else {
                        if (jornadaAnt.length) {
                            response.Mensagem = "Não é possível alterar um apontamento entre o intervalo de uma jornada já fechada.";
                            cb(null, response);
                        } else {
                            var filterEvento = {
                                'Token': apontamento.Token,
                                'SearchId': apontamento.IdEvento
                            };

                            Evento.buscarEvento(filterEvento, function (err, evento) {
                                if (!err) {
                                    if (evento){
                                        // Buscando os dados do apontamentos antes da alteração
                                        Apontamento_Alter.findById(apontamento.Id, function (err, obj) {
                                            if (!err && obj) {
                                                if (evento.Objeto.Eventos[0].toJSON().TipoEvento.Codigo === TipoEventoEnum.FIM_DE_JORNADA
                                                    && (obj.IdEvento !== evento.Objeto.Eventos[0].toJSON().Id)){
                                                    response.Sucesso = false;
                                                    response.Mensagem = "Não é possivel mudar o evento de um apontamento para um evento 'Fim de jornada'.";
                                                    response.Objeto = null;
                                                    cb(null, response);
                                                } else if (evento.Objeto.Eventos[0].toJSON().TipoEvento.Codigo === TipoEventoEnum.INICIO_DE_JORNADA
                                                    && (obj.IdEvento !== evento.Objeto.Eventos[0].toJSON().Id)){
                                                    response.Sucesso = false;
                                                    response.Mensagem = "Não é possivel mudar o evento de um apontamento para um evento 'Início de jornada'.";
                                                    response.Objeto = null;
                                                    cb(null, response);
                                                }  else {
                                                    var filterEventoAnt = {
                                                        'Token': apontamento.Token,
                                                        'SearchId': obj.IdEvento
                                                    };

                                                    Evento.buscarEvento(filterEventoAnt, function (err, eventoAnt) {
                                                        if (err) {
                                                            console.log("ERRO: " + err.stack);
                                                            response.Mensagem = "Erro ao verificar o evento anterior.";
                                                            cb(null, response);
                                                        } else {
                                                            if (evento.Objeto.Eventos[0].toJSON().TipoEvento.Codigo !== eventoAnt.Objeto.Eventos[0].toJSON().TipoEvento.Codigo
                                                                && eventoAnt.Objeto.Eventos[0].toJSON().TipoEvento.Codigo === TipoEventoEnum.INICIO_DE_JORNADA) {

                                                                response.Mensagem = "Não é possível alterar o evento de um apontamento de 'Início de jornada'.";
                                                                cb(null, response);
                                                            } else if (evento.Objeto.Eventos[0].toJSON().TipoEvento.Codigo !== eventoAnt.Objeto.Eventos[0].toJSON().TipoEvento.Codigo
                                                                && eventoAnt.Objeto.Eventos[0].toJSON().TipoEvento.Codigo === TipoEventoEnum.FIM_DE_JORNADA) {

                                                                response.Mensagem = "Não é possível alterar o evento de um apontamento de 'Fim de jornada'.";
                                                                cb(null, response);
                                                            } else {
                                                                if (obj.DataHoraFim &&
                                                                    new Date(apontamento.DataHoraInicio) > obj.DataHoraFim &&
                                                                    evento.Objeto.Eventos[0].toJSON().TipoEvento.Codigo !== TipoEventoEnum.FIM_DE_JORNADA) {
                                                                    response.Sucesso = false;
                                                                    response.Mensagem = "A data hora início deve ser menor que a data hora fim do apontamento.";
                                                                    response.Objeto = null;
                                                                    cb(null, response);
                                                                } else if (evento.Objeto.Eventos[0].toJSON().TipoEvento.Codigo !== TipoEventoEnum.INICIO_DE_JORNADA) {
                                                                    var filter;
                                                                    filter = {
                                                                        where: {and: [{DataHoraFim: obj.DataHoraInicio}, {IdJornada: obj.IdJornada}]},
                                                                        order: "DataHoraInicio ASC"
                                                                    };
                                                                    Apontamento_Alter.find(filter, function (err, retApont) {
                                                                        if (!err) {
                                                                            if (retApont.length) {
                                                                                if (new Date(retApont[0].DataHoraInicio) <= new Date(apontamento.DataHoraInicio)) {
                                                                                    // Alterando a datafinal do apontamento anteiror
                                                                                    Apontamento_Alter.updateAll(
                                                                                        {and: [{DataHoraFim: obj.DataHoraInicio}, {IdJornada: obj.IdJornada}]},
                                                                                        {DataHoraFim: apontamento.DataHoraInicio},
                                                                                        function (err, retObj) {
                                                                                            if (!err) {
                                                                                                apontamento.Alterado = true;
                                                                                                // Alterando o apontamento atual
                                                                                                Apontamento_Alter.upsert(apontamento, function (err, apontAlterado) {
                                                                                                    if (!err) {
                                                                                                        response.Sucesso = true;
                                                                                                        response.Mensagem = "Apontamento alterado.";

                                                                                                        var filter = {
                                                                                                            'Token': apontamento.Token,
                                                                                                            'SearchId': apontamento.IdJornada,
                                                                                                            'IdUsuario': apontamento.IdUsuario,
                                                                                                            'IdHorario': apontamento.IdHorario
                                                                                                        };

                                                                                                        // BUSCANDO A JORNADA
                                                                                                        JornadaAlter.buscarJornada(filter, function (err, objJor) {
                                                                                                            if (!err) {
                                                                                                                response.Sucesso = true;
                                                                                                                response.Mensagem = "Apontamento alterado com sucesso!";
                                                                                                                response.Objeto = objJor.Objeto;
                                                                                                            } else {
                                                                                                                response.Mensagem = "Apontamento alterado.\nPorém não foi possível recuperar dados da jornada.";
                                                                                                                console.log("ERRO: " + err.stack);
                                                                                                            }

                                                                                                            cb(null, response);
                                                                                                        });
                                                                                                    } else {
                                                                                                        console.log("ERRO: " + err.stack);
                                                                                                        response.Mensagem = "Erro ao alterar o apontamento.";
                                                                                                        cb(null, response);
                                                                                                    }
                                                                                                });
                                                                                            } else {
                                                                                                console.log("ERRO: " + err.stack);
                                                                                                response.Mensagem = "Erro ao alterar o apontamento.";
                                                                                                cb(null, response);
                                                                                            }
                                                                                        });
                                                                                } else {
                                                                                    response.Mensagem = "A hora informada é menor que a hora de início do apontamento anterior.";
                                                                                    cb(null, response);
                                                                                }
                                                                            } else {

                                                                                response.Mensagem = "Erro ao alterar o apontamento anterior.";
                                                                                cb(null, response);
                                                                            }
                                                                        } else {
                                                                            console.log("ERRO: " + err.stack);
                                                                            response.Mensagem = "Erro ao buscar o apontamento anterior.";
                                                                            cb(null, response);
                                                                        }
                                                                    });
                                                                } else {
                                                                    // Alterando o apontamento atual
                                                                    Apontamento_Alter.upsert(apontamento, function (err, apontAlterado) {
                                                                        if (!err) {
                                                                            if (evento.Objeto.Eventos[0].toJSON().TipoEvento.Codigo !== TipoEventoEnum.INICIO_DE_JORNADA) {
                                                                                response.Sucesso = true;
                                                                                response.Mensagem = "Apontamento alterado.";
                                                                                Apontamento_Alter.find({
                                                                                    where: {
                                                                                        and: [{
                                                                                            DataHoraFim: obj.DataHoraInicio,
                                                                                            IdJornada: obj.IdJornada
                                                                                        }], order: "DataHoraInicio ASC"
                                                                                    }
                                                                                }, function (err, objeto) {
                                                                                    if (objeto[0]) {
                                                                                        objeto[0].updateAttributes({DataHoraFim: apontamento.DataHoraInicio}, function (err, objeto) {
                                                                                            JornadaAlter.updateAll(
                                                                                                {Id: apontamento.IdJornada},
                                                                                                {DataInicioJornada: apontamento.DataHoraInicio},
                                                                                                function (err, retObj) {
                                                                                                    if (!err && retObj) {
                                                                                                        var filter = {
                                                                                                            'Token': apontamento.Token,
                                                                                                            'SearchId': apontamento.IdJornada,
                                                                                                            'IdUsuario': apontamento.IdUsuario,
                                                                                                            'IdHorario': apontamento.IdHorario
                                                                                                        };

                                                                                                        // BUSCANDO A JORNADA
                                                                                                        JornadaAlter.buscarJornada(filter, function (err, objJor) {
                                                                                                            if (!err) {
                                                                                                                response.Sucesso = true;
                                                                                                                response.Mensagem = "Apontamento alterado com sucesso!";
                                                                                                                response.Objeto = objJor.Objeto;
                                                                                                            } else {
                                                                                                                response.Mensagem = "Apontamento alterado.\nPorém não foi possível recuperar dados da jornada.";
                                                                                                                console.log("ERRO: " + err.stack);
                                                                                                            }

                                                                                                            cb(null, response);
                                                                                                        });
                                                                                                    } else {
                                                                                                        if (err) console.log("ERRO: " + err.stack);
                                                                                                        response.Mensagem = "Erro ao atualizar a jornada.";
                                                                                                        cb(null, response);
                                                                                                    }
                                                                                                });
                                                                                        });
                                                                                    } else {
                                                                                        response.Sucesso = false;
                                                                                        response.Mensagem = "Não foi possível alterar o apontamento anterior";
                                                                                        response.Objeto = null;
                                                                                        cb(null, response);

                                                                                    }
                                                                                });
                                                                            } else {
                                                                                JornadaAlter.updateAll(
                                                                                    {Id: apontamento.IdJornada},
                                                                                    {DataInicioJornada: apontamento.DataHoraInicio},
                                                                                    function (err, retObj) {
                                                                                        if (!err && retObj) {
                                                                                            var filter = {
                                                                                                'Token': apontamento.Token,
                                                                                                'SearchId': apontamento.IdJornada,
                                                                                                'IdUsuario': apontamento.IdUsuario,
                                                                                                'IdHorario': apontamento.IdHorario
                                                                                            };

                                                                                            // BUSCANDO A JORNADA
                                                                                            JornadaAlter.buscarJornada(filter, function (err, objJor) {
                                                                                                if (!err) {
                                                                                                    response.Sucesso = true;
                                                                                                    response.Mensagem = "Apontamento alterado com sucesso!";
                                                                                                    response.Objeto = objJor.Objeto;
                                                                                                } else {
                                                                                                    response.Mensagem = "Apontamento alterado.\nPorém não foi possivel recuperar dados da jornada.";
                                                                                                    console.log("ERRO: " + err.stack);
                                                                                                }

                                                                                                cb(null, response);
                                                                                            });
                                                                                        } else {
                                                                                            if (err) console.log("ERRO: " + err.stack);
                                                                                            response.Mensagem = "Erro ao atualizar a jornada.";
                                                                                            cb(null, response);
                                                                                        }
                                                                                    });
                                                                            }

                                                                        } else {
                                                                            console.log("ERRO: " + err.stack);
                                                                            response.Mensagem = "Erro ao alterar o apontamento.";
                                                                            cb(null, response);
                                                                        }
                                                                    });
                                                                }
                                                            }
                                                        }
                                                    });
                                                }
                                            } else {
                                                if (err) {
                                                    console.log("ERRO: " + err.stack);
                                                }
                                                response.Mensagem = "Erro ao alterar o apontamento";
                                                cb(null, response);
                                            }
                                        });

                                    } else {
                                        response.Sucesso = false;
                                        response.Mensagem = "O evento informado neste apontamento não foi encontrado.";
                                        response.Objeto = null;
                                        cb(null, response);
                                    }

                                } else {
                                    console.log("ERRO: " + err.stack);
                                    response.Sucesso = false;
                                    response.Mensagem = "Não foi possível validar o evento deste apontamento.";
                                    response.Objeto = null;
                                    cb(null, response);
                                }
                            });
                        }
                    }
                });
            }
        });
    };

    Apontamento_Alter.remoteMethod(
        'alterarApontamento', {
            http: {
                path: '/alterarApontamento'
            },
            accepts: {
                arg: 'Apontamento_Alter',
                description: 'Alterar apontamento',
                type: 'AlterarApontamentoRequest',
                http: {source: 'body', verb: 'post'}
            },
            returns: {root: true, type: ResponseModel, default: ResponseModel}
        });
};

var verificaPredecessores = function (arg, call) {
    console.log("verificaPredecessores ");
    var response = {};
    response.Sucesso = false;
    response.Objeto = null;

    var Evento = getModelObject("Evento");
    var ApontamentoAlter = getModelObject("Apontamento_Alter");

    var filterEvento = {
        "Token": arg.Token,
        "TokenFirebase": arg.TokenFirebase,
        "SearchId": arg.IdEvento
    };

    Evento.buscarEvento(filterEvento, function (err, evento) {
        if (!err) {
            if (evento.Sucesso) {
                if (evento.Objeto.Eventos.length > 0) {

                    var filterApontAnt = {
                        where:  {and: [{IdUsuario: arg.IdUsuario}, {DataHoraFim: null}]},
                        include: {Evento: ['TipoEvento', 'Predecessores'], include: {TipoEvento: [{TipoEvento: 'TipoEvento'}]}}
                        , order: "DataHoraInicio ASC"
                    };

                    ApontamentoAlter.find(filterApontAnt, function (err, responseApont) {
                        if (!err) {
                            if (responseApont && responseApont.length) {

                                response.Sucesso = false;
                                response.Mensagem = "O tipo de evento do apontamento anterior não faz parte dos predecessores deste apontamento.";
                                response.Objeto = null;

                                var filterEventoAnt = {
                                    "Token": arg.Token,
                                    "SearchId": responseApont[0].IdEvento
                                };

                                Evento.buscarEvento(filterEventoAnt, function (err, eventoAnt) {
                                    if (err){
                                        console.log("ERRO: " + err.stack);
                                        response.Mensagem = "Erro ao verificar o evento do apontamento anterior.";
                                        call(null, response);
                                    } else if (eventoAnt.Sucesso) {
                                        if (evento.Objeto.Eventos.length > 0) {
                                            if (evento.Objeto.Eventos[0].IdTipoEvento === eventoAnt.Objeto.Eventos[0].IdTipoEvento){
                                                response.Mensagem = "Já existe um apontamento com o mesmo 'Tipo de evento.";
                                                call(null, response);
                                            } else {
                                                var PredecessoresAtual = evento.Objeto.Eventos[0].toJSON().Predecessores;
                                                // Se não tem predecessor retorna true

                                                if (typeof (PredecessoresAtual) === "undefined" || PredecessoresAtual.length <= 0) {
                                                    response.Sucesso = true;
                                                    response.Objeto = evento.Objeto.Eventos[0];
                                                    call(null, response);
                                                } else {
                                                    var TipoEventoAnt = eventoAnt.Objeto.Eventos[0].IdTipoEvento;

                                                    response.Sucesso = false;

                                                    for (var i = 0; i < PredecessoresAtual.length; i++) {
                                                        // Se o tipo de evento do anterior esteja na lista de predecessores do atual(Inserindo)
                                                        if (PredecessoresAtual[i].IdTipoEvento === TipoEventoAnt) {
                                                            response.Sucesso = true;
                                                            response.Mensagem = "Predecessores ok.";
                                                            response.Objeto = evento.Objeto.Eventos[0];
                                                        }
                                                    }

                                                    call(null, response);
                                                }
                                            }
                                        } else {
                                            response.Mensagem = "Erro ao verificar o evento do apontamento anterior.";
                                            call(null, response);
                                        }
                                    } else {
                                        response.Mensagem = eventoAnt.Mensagem;
                                        call(null, response);
                                    }
                                });
                            } else {
                                response.Sucesso = true;
                                response.Objeto = evento.Objeto.Eventos[0];
                                response.Mensagem = "Sem apontamento anterior";
                                call(null, response);
                            }
                        } else {
                            console.log("ERRO: " + err.stack);
                            response.Mensagem = "Erro ao buscar o ultimo apontamento.";
                            call(null, response);
                        }
                    });
                } else {
                    response.Sucesso = false;
                    response.Objeto = null;
                    response.Mensagem = "O evento informado não existe.";
                    call(null, response);
                }

            } else {
                console.log("ERRO: " + evento.Mensagem);
                response.Mensagem = "Erro ao verificar o evento do apontamento: " + evento.Mensagem;
                call(null, response);
            }

        } else {
            console.log("ERRO: " + err.stack);
            response.Mensagem = "Erro ao verificar o evento do apontamento.";
            call(null, response);
        }
    });
};

var createCadastrarApontamentoAlterMethod = function (Apontamento_Alter) {
    Apontamento_Alter.cadastrarApontamento = function (arg, cb) {
        console.log("Apontamento_Alter.cadastrarApontamento");

        // validaLimitesDeEventos(arg, function (err, validou) {
        //     var response = {};
        //     response.Sucesso = false;
        //     response.Objeto = null;
        //     if (!err){
        //         if (validou.Sucesso || arg.AceitaForaLimite){
        //
        //         } else {
        //             response.Mensagem = validou.Mensagem;
        //             cb(null, response);
        //         }
        //     } else {
        //         console.log("Erro: "+err.message);
        //         response.Mensagem = "Não foi possivel verificar os limites de horas do apontamento anterior.";
        //         cb(null, response);
        //     }
        // });

        console.log("=> REQUEST: " + JSON.stringify(arg));
        verificaToken(arg, cb, function (obj) {
            var response = {};
            response.Sucesso = false;
            response.Objeto = null;

            var JornadaAlter = getModelObject("Jornada_Alter");
            var Evento = getModelObject("Evento");
            var TipoEvento = getModelObject("TipoEvento");
            var ApontamentoReal = getModelObject("Apontamento_Real");

            response.Sucesso = false;
            response.Mensagem = "Erro ao fazer o apontamento: ";
            response.Objeto = null;

            if (!arg.IdHorario) {
                response.Mensagem = "Usuário sem horário vinculado.";
                cb(null, response);
            } else {
                verificaPredecessores(arg, function (err, responseVerif) {
                    if (!err) {
                        if (responseVerif.Sucesso) {

                            var EventoRet = responseVerif.Objeto.toJSON();

                            if (typeof (arg.IdJornada) === "undefined" || arg.IdJornada === null || arg.IdJornada === 0) {
                                var horaZero = "00:00:00";
                                var jornada = {
                                    "Token": arg.Token,//"ee46a057-6153-4c7c-aa0c-6bb23d62f257",
                                    "TokenFirebase": arg.TokenFirebase,
                                    "IdUsuario": arg.IdUsuario,
                                    "DataInicioJornada": arg.DataHoraInicio,
                                    "HorasEmDirecao": horaZero, "HorasEmEspera": horaZero,
                                    "TotalHorasJornada": horaZero, "HorasExtras": horaZero,
                                    "HorasEmIntervalo": horaZero, "HorasDiurnas": horaZero,
                                    "HorasEmDescDirecao": horaZero, "HorasNoturnas": horaZero,
                                    "TotalHorasRepouso": horaZero,
                                    "DataFimJornada": null
                                };

                                // verifico se o primeiro evento da jornada é um "Inicio de jornada"
                                if (EventoRet.TipoEvento.Codigo === TipoEventoEnum.INICIO_DE_JORNADA) {
                                    JornadaAlter.find({where: {and: [{DataFimJornada: null}, {IdUsuario: arg.IdUsuario}]}}, function (err, jornadasRet) {
                                        response.Mensagem = "Não há jornada aberta para este usuário.";
                                        response.Objeto = null;
                                        response.Sucesso = false;

                                        if (!err) {
                                            if (jornadasRet.length > 0) {
                                                var Jornada = jornadasRet[0].toJSON();
                                                //Jornada["Usuario"] = getUsuario(usuario);
                                                response.Objeto = {"Jornada": Jornada};
                                                response.Mensagem = "Já existe uma jornada aberta para este usuário.";
                                                cb(null, response);
                                            } else {
                                                var filter = {
                                                    where: {
                                                        and: [
                                                            {IdUsuario: arg.IdUsuario},
                                                            {
                                                                or: [{DataInicioJornada: arg.DataHoraInicio},
                                                                    {and: [{DataFimJornada: {gt: arg.DataHoraInicio}}, {DataInicioJornada: {lt: arg.DataHoraInicio}}]}]
                                                            }
                                                        ]
                                                    }
                                                };

                                                // Verifica se ja existe um apontamento de inicio de jornada com a mesma data
                                                JornadaAlter.find(filter, function (err, jornadaAnt) {
                                                    if (err) {
                                                        console.log("ERRO: " + err.stack);
                                                        response.Mensagem = "Erro ao verificar duplicidade de início de jornada.";
                                                        cb(null, response);
                                                    } else {
                                                        if (jornadaAnt.length) {
                                                            response.Mensagem = "Não é possível iniciar uma jornada entre o intervalo de uma já fechada.";
                                                            cb(null, response);
                                                        } else {
                                                            JornadaAlter.cadastrarJornada(jornada, function (err, objJornada) {
                                                                if (!err) {
                                                                    if (objJornada.Sucesso) {
                                                                        if (objJornada.Objeto) {
                                                                            arg.IdJornada = objJornada.Objeto["Jornada"].Id;

                                                                            var mIdJornadaReal = objJornada.Objeto["Jornada"].IdJornadaReal;
                                                                            var ApontamentoReal = getModelObject("Apontamento_Real");
                                                                            var idJornadaAlter = arg.IdJornada;

                                                                            arg["IdJornada"] = mIdJornadaReal;

                                                                            ApontamentoReal.cadastrarApontamento(arg, function (err, apontRealRet) {
                                                                                if (!err) {
                                                                                    if (apontRealRet && apontRealRet.Sucesso) {
                                                                                        arg["IdApontamentoReal"] = apontRealRet.Objeto.Id;
                                                                                        arg["IdJornada"] = idJornadaAlter;

                                                                                        Apontamento_Alter.create(arg, function (err, objCreate) {
                                                                                            if (!err) {
                                                                                                response.Sucesso = true;
                                                                                                response.Mensagem = "Apontamento registrado.";

                                                                                                var filter = {
                                                                                                    'Token': arg.Token,
                                                                                                    'IdUsuario': arg.IdUsuario,
                                                                                                    'IdHorario': arg.IdHorario,
                                                                                                    'SearchId': objCreate.IdJornada,
                                                                                                    'DataInicioJornada': arg.DataHoraInicio
                                                                                                };

                                                                                                // BUSCANDO A JORNADA FECHADA
                                                                                                JornadaAlter.buscarJornada(filter, function (err, objJor) {
                                                                                                    if (!err && objJor.Sucesso) {
                                                                                                        response.Mensagem = "Jornada criada e o apontamento efetuado com sucesso!";
                                                                                                        response.Objeto = objJor.Objeto;
                                                                                                    } else {
                                                                                                        if (err) {
                                                                                                            response.Mensagem = "Não foi possível buscar a jornada criada.";
                                                                                                            console.log("ERRO: " + err.stack);
                                                                                                        } else {
                                                                                                            response.Mensagem = objJor.Mensagem;
                                                                                                        }
                                                                                                    }

                                                                                                    cb(null, response);
                                                                                                });
                                                                                            } else {
                                                                                                console.log("ERRO: " + err.stack);
                                                                                                response.Mensagem = response.Mensagem + err.message;
                                                                                                cb(null, response);
                                                                                            }
                                                                                        });
                                                                                    } else {
                                                                                        console.log("ERRO: " + apontRealRet.Mensagem);
                                                                                        response.Sucesso = false;
                                                                                        response.Mensagem = apontRealRet.Mensagem;
                                                                                        cb(null, response);
                                                                                    }

                                                                                } else {
                                                                                    console.log("ERRO: " + err.stack);
                                                                                    response.Mensagem = "Erro ao cadastrar o apontamento real.";
                                                                                    cb(null, response);
                                                                                }
                                                                            });
                                                                        } else {
                                                                            console.log("ERRO: " + objJornada.Mensagem);
                                                                            response.Objeto = null;
                                                                            response.Mensagem = "Erro ao retornar a jornada cadastrada: " + objJornada.Mensagem;
                                                                            cb(null, response);
                                                                        }
                                                                    } else {
                                                                        console.log("ERRO: " + objJornada.Mensagem);
                                                                        response.Mensagem = "Erro ao cadastrar a jornada: " + objJornada.Mensagem;
                                                                        cb(null, response);
                                                                    }
                                                                } else {
                                                                    console.log("ERRO: " + err.stack);
                                                                    response.Mensagem = "Erro ao cadastrar a jornada.";
                                                                    cb(null, response);
                                                                }
                                                            });
                                                        }
                                                    }
                                                });
                                            }
                                        } else {
                                            console.log(err.stack);
                                            response.Mensagem = "Erro ao verificar jornada aberta para este usuário.";
                                            cb(null, response);
                                        }
                                    });
                                } else {
                                    response.Mensagem = "A jornada deve ser iniciada com o apontamento do tipo 'Início de Jornada', informe a jornada aberta para este usuário.";
                                    response.Objeto = null;
                                    cb(null, response);
                                }
                            } else {

                                var filterEntreJornada = {
                                    where: {
                                        and: [
                                            {IdUsuario: arg.IdUsuario},
                                            {Id: {neq: arg.IdJornada}},
                                            {
                                                or: [{DataInicioJornada: arg.DataHoraInicio},
                                                    {and: [{DataFimJornada: {gt: arg.DataHoraInicio}}, {DataInicioJornada: {lt: arg.DataHoraInicio}}]}]
                                            }
                                        ]
                                    }
                                };
                                // Verifica se ja existe um apontamento de inicio de jornada com a mesma data
                                JornadaAlter.find(filterEntreJornada, function (err, outrasJornadas) {
                                    if (!err && outrasJornadas.length === 0) {
                                        // Se a jornada ja estiver aberta
                                        var filter = {
                                            where: {and: [{Id: arg.IdJornada}, {or: [{DataFimJornada: null}, {DataFimJornada: {gte: arg.DataHoraInicio}}]}]}
                                        };
                                        JornadaAlter.findOne(filter, function (err, objJornada) {
                                            if (!err) {
                                                if (objJornada) {
                                                    // Se ja iniciou uma jornada não pode casdastrar novamente o evento de INICIO_DE_JORNADA
                                                    if (EventoRet.TipoEvento.Codigo === TipoEventoEnum.INICIO_DE_JORNADA) {
                                                        response.Mensagem = "Você já possui um apontamento de início de jornada.";
                                                        cb(null, response);
                                                    }
                                                    // Nao pode incluir apontamentos com mesma data de fim de jornada
                                                    else if (objJornada.DataFimJornada === new Date(arg.DataHoraInicio)) {
                                                        response.Mensagem = "Não é possível incluir um apontamento com a mesma hora de fim da jornada.";
                                                        cb(null, response);
                                                    } else if (new Date(arg.DataHoraInicio) < objJornada.DataInicioJornada) {
                                                        response.Mensagem = "Não é possível incluir um apontamento antes do início da jornada.";
                                                        cb(null, response);
                                                    } else {
                                                        var mIdJornadaReal = objJornada.IdJornadaReal;
                                                        var idJornadaAlter = arg.IdJornada;
                                                        arg["IdJornada"] = mIdJornadaReal;

                                                        // var finalizaJornada = (EventoRet.TipoEvento.Codigo === TipoEventoEnum.FIM_DE_JORNADA);
                                                        //
                                                        // if (finalizaJornada) {
                                                        //     arg.DataHoraFim = arg.DataHoraInicio;
                                                        // }
                                                        delete arg["Id"];
                                                        ApontamentoReal.cadastrarApontamento(arg, function (err, apontRealRet) {
                                                            if (!err) {
                                                                if (apontRealRet.Sucesso) {
                                                                    Apontamento_Alter.updateAll(
                                                                        {and: [{DataHoraInicio: {lte: new Date(arg.DataHoraInicio)}}, {DataHoraFim: null}, {IdJornada: idJornadaAlter}]},
                                                                        {DataHoraFim: arg.DataHoraInicio},
                                                                        function (err, retObj) {
                                                                            if (!err) {
                                                                                var filter = {
                                                                                    where: {IdJornada: idJornadaAlter},
                                                                                    order: "DataHoraInicio ASC"
                                                                                };
                                                                                filter["include"] = {
                                                                                    Evento: ['TipoEvento', 'Predecessores'],
                                                                                    include: {TipoEvento: [{TipoEvento: 'TipoEvento'}]}
                                                                                };

                                                                                Apontamento_Alter.find(filter, function (err, obj) {
                                                                                    if (!err) {
                                                                                        /*
                                                                                         * Se não encontrou apontamento aberto com dataInicio menor que o que esta sendo inserido
                                                                                         * e possui mais de um evento na jornada
                                                                                         */
                                                                                        if (!retObj.count && obj.length > 1) {
                                                                                            /*
                                                                                             * Se o apontamento a ser inserido for do tipo fim de jornada
                                                                                             * não deve permitir inserção no meio
                                                                                             */
                                                                                            if (EventoRet.TipoEvento.Codigo === TipoEventoEnum.FIM_DE_JORNADA) {
                                                                                                cb(null, {
                                                                                                    Sucesso: false,
                                                                                                    Mensagem: "O apontamento do tipo fim de jornada deve ser o último a ser lançado.",
                                                                                                    Objeto: null
                                                                                                });
                                                                                            } else {
                                                                                                arg["IdJornada"] = idJornadaAlter;
                                                                                                arg["IdApontamentoReal"] = apontRealRet.Objeto.Id;

                                                                                                cadastraApontamentoEntreApontamentos(arg, function (err, obj) {
                                                                                                    if (obj && !obj.Mensagem) {
                                                                                                        ApontamentoReal.findById(obj.IdApontamentoReal, function (err, real) {
                                                                                                            if (!err) {
                                                                                                                real.updateAttributes({DataHoraFim: obj.DataHoraFim}, function (err, final) {
                                                                                                                    if (!err) {
                                                                                                                        var filter = {
                                                                                                                            'Token': arg.Token,
                                                                                                                            'SearchId': arg.IdJornada,
                                                                                                                            'IdUsuario': arg.IdUsuario,
                                                                                                                            'IdHorario': arg.IdHorario
                                                                                                                        };

                                                                                                                        // BUSCANDO A JORNADA
                                                                                                                        JornadaAlter.buscarJornada(filter, function (err, objJor) {
                                                                                                                            if (!err) {
                                                                                                                                if (objJor.Sucesso && objJor.Objeto.Jornada !== null) {
                                                                                                                                    response.Sucesso = true;
                                                                                                                                    response.Mensagem = "Jornada retornada com o apontamento efetuado com sucesso!";
                                                                                                                                    response.Objeto = {"Jornada": objJor.Objeto.Jornada};
                                                                                                                                    console.log("=> RESPONSE: " + JSON.stringify(response));
                                                                                                                                    cb(null, response);
                                                                                                                                } else {
                                                                                                                                    console.log("ERRO: " + objJor.Mensagem);
                                                                                                                                    response.Mensagem = objJor.Mensagem;
                                                                                                                                    response.Objeto = objJor.Objeto;
                                                                                                                                    console.log("=> RESPONSE: " + response.Objeto);
                                                                                                                                    cb(null, response);
                                                                                                                                }
                                                                                                                            } else {
                                                                                                                                console.log("ERRO: " + err.stack);
                                                                                                                                cb(null, response);
                                                                                                                            }
                                                                                                                        });
                                                                                                                    } else {
                                                                                                                        cb(null, {
                                                                                                                            Sucesso: false,
                                                                                                                            Mensagem: "Erro ao atualizar o Real",
                                                                                                                            Objeto: null
                                                                                                                        })
                                                                                                                    }
                                                                                                                });
                                                                                                            } else {
                                                                                                                cb(null, {
                                                                                                                    Sucesso: false,
                                                                                                                    Mensagem: err.message,
                                                                                                                    Objeto: null
                                                                                                                })
                                                                                                            }
                                                                                                        });
                                                                                                    } else {
                                                                                                        cb(null, obj);
                                                                                                    }
                                                                                                });
                                                                                            }

                                                                                        } else {
                                                                                            var finalizaJornada = (EventoRet.TipoEvento.Codigo === TipoEventoEnum.FIM_DE_JORNADA);

                                                                                            if (finalizaJornada) {
                                                                                                arg.DataHoraFim = arg.DataHoraInicio;
                                                                                            }

                                                                                            arg["IdJornada"] = idJornadaAlter;
                                                                                            arg["IdApontamentoReal"] = apontRealRet.Objeto.Id;

                                                                                            // EFETUANDO O APONTAMENTO
                                                                                            Apontamento_Alter.create(arg, function (err, objCreate) {
                                                                                                if (!err) {
                                                                                                    response.Sucesso = true;
                                                                                                    response.Mensagem = "Apontamento registrado.";

                                                                                                    var filterEvento = {
                                                                                                        'Token': arg.Token,
                                                                                                        'TokenFirebase': arg.TokenFirebase,
                                                                                                        'SearchId': arg.IdEvento
                                                                                                    };

                                                                                                    if (finalizaJornada) {
                                                                                                        var filterFinalizar = {
                                                                                                            'Token': arg.Token,
                                                                                                            'TokenFirebase': arg.TokenFirebase,
                                                                                                            'SearchId': arg.IdJornada,
                                                                                                            'DataFimJornada': arg.DataHoraInicio
                                                                                                            ,
                                                                                                            'IdUsuario': arg.IdUsuario
                                                                                                            ,
                                                                                                            'IdHorario': arg.IdHorario
                                                                                                        };


                                                                                                        // FECHANDO A JORNADA
                                                                                                        JornadaAlter.finalizarJornada(filterFinalizar, function (errFim, objJorFim) {
                                                                                                            if (!err) {
                                                                                                                response.Sucesso = true;
                                                                                                                response.Mensagem = "Jornada finalizada com o apontamento efetuado com sucesso!";
                                                                                                                response.Objeto = {"Jornada": objJorFim.Objeto.Jornada};
                                                                                                                console.log("=> RESPONSE: " + JSON.stringify(response));
                                                                                                                cb(null, response);

                                                                                                                // var Jornada = objJorFim.Objeto.Jornada;
                                                                                                                // Jornada.IdHorario = arg.IdHorario;
                                                                                                                //
                                                                                                                // Jornada.TipoJornada = 1;
                                                                                                                //
                                                                                                                // somaTotaisJornada(Jornada, function (err, jornadaRet) {
                                                                                                                //     if (!err) {
                                                                                                                //
                                                                                                                //         if (jornadaRet && jornadaRet.Sucesso){
                                                                                                                //             response.Mensagem = "Jornada retornada com o apontamento efetuado com sucesso!";
                                                                                                                //             response.Objeto = {"Jornada": jornadaRet.Objeto};
                                                                                                                //             console.log("=> RESPONSE: " + JSON.stringify(response));
                                                                                                                //             cb(null, response);
                                                                                                                //         } else {
                                                                                                                //             response.Mensagem = jornadaRet.Mensagem;
                                                                                                                //             response.Objeto = null;
                                                                                                                //             console.log("=> RESPONSE: " + response.Objeto);
                                                                                                                //             cb(null, response);
                                                                                                                //         }
                                                                                                                //
                                                                                                                //     } else {
                                                                                                                //         console.log("ERRO: " + err.stack);
                                                                                                                //         response.Objeto = Jornada;
                                                                                                                //         response.Mensagem = "Erro ao atualizar os totais da jornada.";
                                                                                                                //         console.log("=> RESPONSE: " + response.Objeto);
                                                                                                                //         cb(null, response);
                                                                                                                //     }
                                                                                                                // });
                                                                                                            } else {
                                                                                                                response.objeto = null;
                                                                                                                response.Sucesso = false;
                                                                                                                response.Mensagem = "O apontamento foi registrado, mas a jornada não foi fechada.";
                                                                                                                cb(null, response);
                                                                                                            }
                                                                                                        });
                                                                                                    } else {
                                                                                                        var filter = {
                                                                                                            'Token': arg.Token,
                                                                                                            'IdUsuario': arg.IdUsuario,
                                                                                                            'IdHorario': arg.IdHorario
                                                                                                        };

                                                                                                        // BUSCANDO A JORNADA
                                                                                                        JornadaAlter.buscarJornada(filter, function (err, objJor) {
                                                                                                            if (!err) {
                                                                                                                if (objJor.Sucesso && objJor.Objeto.Jornada !== null) {
                                                                                                                    response.Sucesso = true;
                                                                                                                    response.Mensagem = "Jornada retornada com o apontamento efetuado com sucesso!";
                                                                                                                    response.Objeto = {"Jornada": objJor.Objeto.Jornada};
                                                                                                                    console.log("=> RESPONSE: " + JSON.stringify(response));
                                                                                                                    cb(null, response);

                                                                                                                    // var Jornada = objJor.Objeto.Jornada;
                                                                                                                    // Jornada.IdHorario = usuario.IdHorario;
                                                                                                                    //
                                                                                                                    // Jornada.TipoJornada = 1;
                                                                                                                    // somaTotaisJornada(Jornada, function (err, jornadaRet) {
                                                                                                                    //     if (!err) {
                                                                                                                    //         if (jornadaRet && jornadaRet.Sucesso){
                                                                                                                    //             response.Mensagem = "Jornada retornada com o apontamento efetuado com sucesso!";
                                                                                                                    //             response.Objeto = {"Jornada": jornadaRet.Objeto};
                                                                                                                    //             console.log("=> RESPONSE: " + JSON.stringify(response));
                                                                                                                    //             cb(null, response);
                                                                                                                    //         } else {
                                                                                                                    //             response.Mensagem =jornadaRet.Mensagem;
                                                                                                                    //             response.Objeto = null;
                                                                                                                    //             console.log("=> RESPONSE: " + response.Objeto);
                                                                                                                    //             cb(null, response);
                                                                                                                    //         }
                                                                                                                    //
                                                                                                                    //     } else {
                                                                                                                    //         console.log("ERRO: " + err.stack);
                                                                                                                    //         response.Objeto = Jornada;
                                                                                                                    //         response.Mensagem = "Erro ao atualizar os totais da jornada.";
                                                                                                                    //         console.log("=> RESPONSE: " + response.Objeto);
                                                                                                                    //         cb(null, response);
                                                                                                                    //     }
                                                                                                                    // });
                                                                                                                } else {
                                                                                                                    console.log("ERRO: " + objJor.Mensagem);
                                                                                                                    response.Mensagem = objJor.Mensagem;
                                                                                                                    response.Objeto = objJor.Objeto;
                                                                                                                    console.log("=> RESPONSE: " + response.Objeto);
                                                                                                                    cb(null, response);
                                                                                                                }
                                                                                                            } else {
                                                                                                                console.log("ERRO: " + err.stack);
                                                                                                                cb(null, response);
                                                                                                            }
                                                                                                        })
                                                                                                    }
                                                                                                } else {
                                                                                                    console.log("ERRO: " + err.stack);
                                                                                                    response.Mensagem = "Erro ao fazer o apontamento.";
                                                                                                    cb(null, response);
                                                                                                }
                                                                                            })
                                                                                        }
                                                                                    } else {
                                                                                        console.log("ERRO: " + err.stack);
                                                                                        response.Mensagem = "Erro ao buscar apontamentos anteriores.";
                                                                                        cb(null, response);
                                                                                    }
                                                                                });
                                                                            } else {
                                                                                console.log("ERRO: " + err.stack);
                                                                                response.Mensagem = "Erro ao fechar apontamento anterior.";
                                                                                cb(null, response);
                                                                            }
                                                                        });
                                                                } else {
                                                                    response.Mensagem = "Erro ao cadastrar o apontamento real: " + apontRealRet.Mensagem;
                                                                    cb(null, response);
                                                                }
                                                            } else {
                                                                console.log("ERRO: " + err.stack);
                                                                response.Mensagem = "Erro ao cadastrar o apontamento real.";
                                                                cb(null, response);
                                                            }
                                                        });
                                                    }
                                                } else {
                                                    response.Mensagem = "Não há jornada aberta para este usuário.";
                                                    cb(null, response);
                                                }
                                            } else {
                                                response.Mensagem = "Erro ao buscar a jornada aberta para este usuário.";
                                                console.log("ERRO: " + err.stack);
                                            }
                                        });
                                    } else {
                                        if (err) {
                                            response.Mensagem = "Erro ao verificar as jornadas fechadas para este usuário.";
                                            console.log("ERRO: " + err.stack);
                                            cb(null, response);
                                        } else {
                                            response.Mensagem = "O horário deste apontamento ultrapassa o início de outra jornada fechada.";
                                            cb(null, response);
                                        }
                                    }
                                });
                            }
                        } else {
                            console.log("ERRO: " + responseVerif.Mensagem);
                            response.Mensagem = responseVerif.Mensagem;
                            cb(null, response);
                        }
                    } else {
                        console.log("ERRO: " + err.stack);
                        response.Mensagem = "Não foi possível verificar os predecessores.";
                        cb(null, response);
                    }
                });
            }
        });
    };

    Apontamento_Alter.remoteMethod(
        'cadastrarApontamento', {
            http: {
                path: '/cadastrarApontamento'
            },
            accepts: {
                arg: 'Apontamento_Alter',
                description: 'Registro de apontamento',
                type: 'CadastrarApontamentoRequest',
                http: {source: 'body', verb: 'post'}
            },
            returns: {root: true, type: ResponseModel, default: ResponseModel}
        });
};

var createBuscarApontamentoByDataMethod = function (Apontamento_Alter) {

    Apontamento_Alter.buscarApontamentoPeriodo = function (arg, cb) {
        verificaToken(arg, cb, function (obj) {
            var response = {};
            response.Objeto = null;
            // {DataHoraInicio : {between: [arg.DataDe, arg.DataAte]}}

            // {DataHoraInicio : {between: [arg.DataDe, arg.DataAte]}}
            response.Sucesso = false;

            var filter;
            if ((typeof(arg.IdUsuario) !== "undefined")) {
                filter = {
                    where: {
                        and: [
                            {IdUsuario: arg.IdUsuario},
                            {DataHoraInicio: {gte: arg.DataDe}},
                            {DataHoraInicio: {lte: arg.DataAte}}
                        ]
                    },
                    include: {
                        Evento: ['TipoEvento', 'Predecessor'],
                        include: {TipoEvento: [{TipoEvento: 'TipoEvento'}]}
                    }, order: "DataHoraInicio ASC"
                };
            }

            Apontamento_Alter.find(filter, function (err, apontamento) {
                if (!err) {
                    response.Sucesso = true;
                    if (apontamento !== null) {
                        response.Mensagem = "Apontamentos retornados.";
                        response.Objeto = apontamento;
                    } else {
                        response.Mensagem = "Nenhum apontamento retornado.";
                        response.Objeto = [];
                    }
                    cb(null, response);
                } else {
                    console.log("ERRO: " + err.stack);
                    response.Mensagem = "Não foi possível buscar os apontamentos.";
                    cb(null, response);
                }

            });
        });
    };

    Apontamento_Alter.remoteMethod(
        'buscarApontamentoPeriodo', {
            http: {
                path: '/buscarApontamentoPeriodo'
            },
            accepts: {
                arg: 'Apontamento_Alter',
                description: 'Buscar apontamento entre datas',
                type: 'BuscarApontamentoPeriodoRequest',
                http: {source: 'body', verb: 'post'}
            },
            returns: {root: true, type: ResponseModel, default: ResponseModel}
        });
};

var createBuscarUltimoApontamentoMethod = function (Apontamento_Alter) {
    Apontamento_Alter.buscarUltimoApontamento = function (arg, cb) {
        console.log("Apontamento_Alter.buscarUltimoApontamento");
        console.log("=> REQUEST: " + JSON.stringify(arg));
        verificaTokenEUsuario(arg, cb, function (usuario) {
            var response = {};
            response.Sucesso = false;
            response.Objeto = null;
            arg.IdUsuario = usuario.IdAts;

            response.Objeto = null;
            response.Sucesso = false;

            var filter = {
                where: {and: [{TokenFirebase: arg.TokenFirebase}, {IdUsuario: arg.IdUsuario}]},
                include: {Evento: ['TipoEvento', 'Predecessores'], include: {TipoEvento: [{TipoEvento: 'TipoEvento'}]}}
                , order: "DataHoraInicio DESC"
            };

            Apontamento_Alter.find(filter, function (err, apontamento) {
                if (!err) {
                    response.Sucesso = true;
                    if (apontamento.length) {
                        response.Mensagem = "Último apontamento retornado.";
                        response.Objeto = {};
                        response.Objeto.Apontamento = apontamento[0];
                    } else {
                        response.Mensagem = "Não há apontamento registrado para este usuário.";
                        response.Objeto = null;
                    }
                    console.log("=> RESPONSE 1: " + response.Objeto);
                    cb(null, response);
                } else {
                    console.log("ERRO: " + err.stack);
                    response.Mensagem = "Não foi possível buscar o último apontamento retornado.";
                    cb(null, response);
                }

            });
        });
    };

    Apontamento_Alter.remoteMethod(
        'buscarUltimoApontamento', {
            http: {
                path: '/buscarUltimoApontamento'
            },
            accepts: {
                arg: 'Apontamento_Alter',
                description: 'Buscar Último apontamento',
                type: 'BuscarUltimoApontamentoRequest',
                http: {source: 'body', verb: 'post'}
            },
            returns: {root: true, type: ResponseModel, default: ResponseModel}
        });
};

var createBuscarApontamentoPaginadoMethod = function (Apontamento_Alter) {
    Apontamento_Alter.buscarApontamentoPag = function (arg, cb) {
        console.log("Apontamento_Alter.buscarApontamentoPag");
        console.log("=> REQUEST: " + JSON.stringify(arg));
        var responseModel = {};
        responseModel.Sucesso = false;
        responseModel.Objeto = null;
        verificaToken(arg, cb, function (obj) {

            var filter = getFilterPagination(arg);

            filter["include"] = JSON.parse(' {"Evento": ["TipoEvento","Predecessores"], "include": {"TipoEvento": [{"TipoEvento": "TipoEvento"}]}}');

            Apontamento_Alter.find(filter, function (err, apontamento) {
                console.log(apontamento);

                if (!err) {
                    var take = arg.Take;
                    var page = arg.Page;
                    var skipNum = (page > 0) ? ((page - 1) * take) : 0;

                    var itemsSel = _.slice(apontamento, skipNum, skipNum + take);

                    responseModel.Sucesso = true;
                    responseModel.Mensagem = "Apontamentos retornados.";
                    responseModel.Objeto = {
                        "totalItems": apontamento.length,
                        "items": itemsSel
                    };
                    console.log("=> RESPONSE: " + responseModel.Objeto);
                    cb(null, responseModel);
                } else {
                    console.log(err.stack);
                    responseModel.Objeto = {"totalItems": 0, "items": []};
                    responseModel.Mensagem = "Não foi possível buscar o apontamento.";
                    console.log("=> RESPONSE: " + responseModel.Objeto);
                    cb(null, responseModel);
                }
            });
        });
    };

    Apontamento_Alter.remoteMethod(
        'buscarApontamentoPag', {
            http: {
                path: '/buscarApontamentoPag'
            },
            accepts: {
                arg: 'Apontamento_Alter',
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
                default: ResponseModel
            }
        });
};

var cadastraApontamentoEntreApontamentos = function (arg, cb) {
    console.log("cadastraApontamentoEntreApontamentos ");
    var Apontamento_Alter = getModelObject("Apontamento_Alter");

    if (!arg.IdHorario) {
        cb(err, {
            Sucesso: false,
            Mensagem: "Não foi possível excluir este apontamento. Horário não informado.",
            Objeto: null
        });
    } else {
        var filter = {where: {IdJornada: arg.IdJornada}, order: "DataHoraInicio ASC"};
        filter["include"] = {
            Evento: ['TipoEvento', 'Predecessores'],
            include: {TipoEvento: [{TipoEvento: 'TipoEvento'}]}
        };

        Apontamento_Alter.find(filter, function (err, obj) {
            if (!err) {
                if (obj.length) {
                    var dataInicio = new Date(arg.DataHoraInicio);
                    var jaExiste = false;
                    obj.forEach(function (apontamento) {
                        if (new Date(apontamento.DataHoraInicio).getTime() === dataInicio.getTime()
                            && apontamento.toJSON().Evento.TipoEvento.Codigo !== TipoEventoEnum.INICIO_DE_JORNADA
                            && !jaExiste) {
                            cb(err, {
                                Sucesso: false,
                                Mensagem: "Já existe um apontamento nesse horário",
                                Objeto: null
                            });
                            jaExiste = true;
                        } else if (apontamento.DataHoraFim > dataInicio && !jaExiste) {
                            jaExiste = true;
                            var horaFim = apontamento.DataHoraFim;
                            apontamento.updateAttributes({DataHoraFim: arg.DataHoraInicio}, function (err, obj) {
                                if (!err) {
                                    console.log(".updateAttributes: " + apontamento.Id);
                                    console.log("apontamento.updateAttributes({DataHoraFim: arg.DataHoraInicio}, function (err, obj) {");
                                    if (obj) {
                                        arg.DataHoraFim = horaFim;
                                        Apontamento_Alter.create(arg, function (err, objCreate) {
                                            if (!err) {
                                                cb(null, objCreate);
                                            } else {
                                                var response = {};
                                                response.Sucesso = false;
                                                response.Mensagem = "Erro ao criar apontamento real";
                                                response.Objeto = null;
                                                cb(null, response);
                                            }

                                        });
                                    } else {
                                        cb(err, {
                                            Sucesso: false,
                                            Mensagem: "Não foi possível atualizar o apontamento anterior.",
                                            Objeto: null
                                        });
                                    }
                                } else {
                                    console.log(err.message);
                                    cb(err, {
                                        Sucesso: false,
                                        Mensagem: "Erro ao atualizar o apontamento anterior.",
                                        Objeto: null
                                    });
                                }
                            });
                        }
                    });
                } else {
                    cb(err, {
                        Sucesso: false,
                        Mensagem: "Jornada não encontrada",
                        Objeto: null
                    });
                }
            } else {
                cb(err, {
                    Sucesso: false,
                    Mensagem: "Erro ao buscar apontamento",
                    Objeto: null
                });
            }
        });
    }

};

var clearRemoteMethods = function (Apontamento_Alter) {
    removerMetodosPadroes(Apontamento_Alter, ["Evento", "Jornada", "JornadaRelations"]);
};
