'use strict';
var _ = require('lodash');
var ResponseModel = {"Sucesso": "boolean", "Mensagem": "string", "Objeto": "object"};

module.exports = function (Horario) {
    clearRemoteMethods(Horario);

    createCadastrarHorarioMethod(Horario);
    createAlterarHorarioMethod(Horario);
    createExcluirHorarioMethod(Horario);
    createBuscarHorarioPagMethod(Horario);
};

var createCadastrarHorarioMethod = function (Horario) {
    Horario.cadastrarHorario = function (arg, cb) {
        verificaToken(arg, cb, function (obj) {
            var responseModel = {};
            responseModel.Sucesso = false;
            responseModel.Objeto = null;
            var filter = {where: {and: [
                {IdEmpresa: arg.IdEmpresa},
                {IdFilial: arg.IdFilial},
                {JornadaDiaria: arg.JornadaDiaria},
                {HorasIntervalo: arg.HorasIntervalo},
                {MaxHorasExtras: arg.MaxHorasExtras}
                ]}};

            Horario.find(filter, function (err, horario) {
                console.log(horario);
                if (err) {
                    console.log(err.stack);
                    responseModel.Objeto = null;
                    responseModel.Sucesso = false;
                        responseModel.Mensagem = "Não foi possível cadastrar o horário.";
                    cb(null, responseModel);
                } else {
                    if (horario.length > 0) {
                        responseModel.Sucesso = false;
                        responseModel.Mensagem = "Já existe um horário com estes valores.";
                        responseModel.Objeto = horario;
                        cb(null, responseModel);
                    } else {

                        Horario.create(arg, function (err, objHorario) {
                            if (!err) {
                                responseModel.Sucesso = true;
                                responseModel.Mensagem = "Horário inserido";
                                responseModel.Objeto = objHorario;
                                cb(null, responseModel);
                            } else {
                                console.log(err.stack);
                                responseModel.Sucesso = false;
                                responseModel.Objeto = null;
                                responseModel.Mensagem = "Não foi possível cadastrar o horário.\n "+err.stack;
                                cb(null, responseModel);
                            }
                        });

                    }
                }
            });
        });
    };

    Horario.remoteMethod(
        'cadastrarHorario', {
            http: {
                path: '/cadastrarHorario'
            },
            accepts: {
                arg: 'Horario',
                description: 'Registro de horarios',
                type: 'CadastrarHorarioRequest',
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

var createAlterarHorarioMethod = function (Horario) {
    Horario.alterarHorario = function (arg, cb) {
        verificaToken(arg, cb, function (obj) {
            var responseModel = {};
            responseModel.Sucesso = false;
            responseModel.Objeto = null;
            Horario.upsert(arg, function (err, horario) {
                console.log(horario);
                if (err) {
                    console.log(err.stack);
                    responseModel.Objeto = null;
                    responseModel.Mensagem = "Não foi possível alterar o horário.\n "+err.stack;
                    cb(null, responseModel);
                } else {
                    responseModel.Sucesso = true;
                    responseModel.Mensagem = "Horário alterado";
                    responseModel.Objeto = horario;
                    cb(null, responseModel);
                }
            });
        });
    };

    Horario.remoteMethod(
        'alterarHorario', {
            http: {
                path: '/alterarHorario'
            },
            accepts: {
                arg: 'Horario',
                description: 'Alterar horario',
                type: 'AlterarHorarioRequest',
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

var createExcluirHorarioMethod = function (Horario) {
    Horario.excluirHorario = function (arg, cb) {
        verificaToken(arg, cb, function (obj) {
            var responseModel = {};
            responseModel.Sucesso = false;
            responseModel.Objeto = null;
            var filter = {where: {Id: arg.Id}};
            Horario.findOne(filter, function (err, obj) {
                if (!obj) {
                    responseModel.Mensagem = "Este horário não existe.";
                    cb(null,responseModel);
                } else {
                    Horario.destroyById(arg.id, function (err, obj) {
                        if (!err) {
                            responseModel.Sucesso = true;
                            responseModel.Objeto = null;
                            responseModel.Mensagem = "Horário excluido.";
                        } else {
                            console.log(err.stack);
                            responseModel.Sucesso = false;
                            responseModel.Objeto = null;
                            if (err.code === 'EREQUEST' && err.message.includes("dbo.Usuario")){
                                responseModel.Mensagem = "Este horário está vinculado a um usuário.";
                            }else {
                                responseModel.Mensagem = "Não foi possível excluir este horário.";
                            }
                        }
                        cb(null, responseModel);

                    });
                }
            });

        });
    };

    Horario.remoteMethod(
        'excluirHorario', {
            http: {
                path: '/excluirHorario'
            },
            accepts: {
                arg: 'Horario',
                description: 'Exclusão de um horario',
                type: 'ExcluirHorarioRequest',
                http: {source: 'body', verb: 'post'}
            },
            returns: {root: true, type: ResponseModel, default: ResponseModel}
        });
};

var createBuscarHorarioPagMethod = function (Horario) {

    Horario.buscarHorario = function (arg, cb) {
        console.log("=> REQUEST: " + JSON.stringify(arg));
        verificaToken(arg, cb, function (obj) {
            var responseModel = {};
            responseModel.Sucesso = false;
            responseModel.Objeto = null;
            var filter = getFilterPagination(arg);

            Horario.find(filter, function (err, horario) {
                console.log(horario);

                if (!err) {

                    var take = arg.Take;
                    var page = arg.Page;
                    var skipNum = (page>0)? ((page-1)*take):0;

                    var itemsSel = _.slice(horario, skipNum, skipNum + take);

                    responseModel.Sucesso = true;
                    responseModel.Mensagem = "Horarios retornados.";
                    responseModel.Objeto = {
                        "totalItems": horario.length,
                        "items" : itemsSel};
                    console.log("=> RESPONSE: " + JSON.stringify(responseModel.Objeto));
                    cb(null, responseModel);
                }
                else {
                    console.log(err.stack);
                    responseModel.Objeto = {
                        "totalItems": 0,
                        "items" : []};
                    responseModel.Mensagem = "Não foi possível buscar o horario.\n "+
                        "\n=> REQUEST: " + JSON.stringify(arg)+
                        "\n=> RESPONSE: " + JSON.stringify(responseModel.Objeto);
                    "\n=> ERROR: "+err.stack;
                    console.log("=> RESPONSE: " + JSON.stringify(responseModel.Objeto));
                    cb(null, responseModel);
                }
            });
        });
    };

    Horario.remoteMethod(
        'buscarHorario', {
            http: {
                path: '/buscarHorario'
            },
            accepts: {
                arg: 'Horario',
                description: 'Buscar horarios',
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

var clearRemoteMethods = function (Horario) {
    removerMetodosPadroes(Horario, ["TipoHorario", "Apontamento_Real", "Apontamento_Alter", "Predecessor"]);
};

