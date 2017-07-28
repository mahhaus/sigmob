'use strict';
var loopback = require('loopback');
var app = loopback();
var ResponseModel = {"Sucesso": "boolean", "Mensagem": "string", "Objeto": "object"};

module.exports = function (Usuario) {
    clearRemoteMethods(Usuario);

    criarMetodoBuscarPerfil(Usuario);
    criarMetodoBuscarListaAmigos(Usuario);

    criarMetodoAdicionarAmigo(Usuario);
    criarMetodoRemoverAmigo(Usuario);
    criarMetodoBloquearUsuario(Usuario);

    criarMetodoLoginUsuario(Usuario);
    criarMetodoRegistrarUsuario(Usuario);
    criarMetodoVerificarCpf(Usuario);
    criarMetodoAlterarSenha(Usuario);
    criarMetodoAtualizarUsuario(Usuario);

    criarMetodoCheckInUsuario(Usuario);
};
function buscarPerfilPorToken(obj, cb) {
    obj = copiarObjeto(obj);
    delete obj["TokenFirebase"];
    var model = {};
    model.Sucesso = true;
    model.Mensagem = null;

    model.Objeto = obj;

    var AmigoUsuario = loopback.findModel("AmigoUsuario");
    app.model(AmigoUsuario);
    var ConquistaUsuario = loopback.findModel("ConquistaUsuario");
    app.model(ConquistaUsuario);
    var Score = loopback.findModel("Score");
    app.model(Score);
    var Conquista = loopback.findModel("Conquista");
    app.model(Conquista);

    AmigoUsuario.find({
        where: {
            or: [
                {
                    and: [
                        {IdUsuario: obj.Id}, {Status: 2}
                    ]
                },
                {
                    and: [
                        {IdAmigo: obj.Id}, {Status: 2}
                    ]
                }
            ]
        }
    }, function (err, obj) {
        model.Objeto.NumeroAmigos = obj.length;
        ConquistaUsuario.find({
            where: {
                IdUsuario: obj.Id
            }
        }, function (err, conquistasObj) {
            model.Objeto.NumeroConquistasObtidas = conquistasObj.length;
            Conquista.find(function (err, todasConquistasObj) {
                model.Objeto.NumeroConquistas = todasConquistasObj.length;
                Score.find({
                    where: {
                        IdUsuario: obj.Id
                    }
                }, function (err, scoreObj) {
                    if (scoreObj.length) {
                        model.Objeto.Score = scoreObj[0];
                        delete model["Objeto"]["TokenFirebase"];
                        cb(null, model);
                    } else {
                        var score = {};
                        score.PontuacaoAtual = 0;
                        score.PontuacaoGeral = 0;
                        score.Distancia = 0;
                        score.IdUsuario = obj.Id;
                        Score.create(score, function (scoreObj) {
                            model.Objeto.Score = scoreObj[0];
                            cb(null, model);
                        });
                    }
                });
            });
        });
        // cb(null, model);
    });
}
function buscarPerfilPorNome(Usuario, arg, cb) {
    Usuario.find({where: {Nome: {like: "%" + arg.Nome + "%"}}}, function (err, obj) {
        if (obj) {
            var model = {};
            model.Sucesso = true;
            model.Mensagem = null;
            model.Objeto = obj;
            cb(null, model);
        } else {
            cb(err, null);
        }
    });
}
function buscarPerfilPorId(Usuario, arg, cb) {
    Usuario.findById(arg.SearchId, {include: ['Conquistas', 'Score']}, function (err, obj) {
        if (obj) {
            delete obj["TokenFirebase"];
            var model = {};
            model.Sucesso = true;
            model.Mensagem = null;
            model.Objeto = obj;

            var AmigoUsuario = loopback.findModel("AmigoUsuario");
            app.model(AmigoUsuario);
            var Conquista = loopback.findModel("Conquista");
            app.model(Conquista);
            var ConquistaUsuario = loopback.findModel("ConquistaUsuario");
            app.model(ConquistaUsuario);
            var Score = loopback.findModel("Score");
            app.model(Score);


            AmigoUsuario.find({
                where: {
                    or: [
                        {
                            and: [
                                {IdUsuario: obj.Id}, {Status: 2}
                            ]
                        },
                        {
                            and: [
                                {IdAmigo: obj.Id}, {Status: 2}
                            ]
                        }
                    ]
                }
            }, function (err, amigosObj) {
                model.Objeto.NumeroAmigos = amigosObj.length;
                model.Objeto = copiarObjeto(model.Objeto);

                ConquistaUsuario.find({
                    where: {
                        IdUsuario: obj.Id
                    }
                }, function (err, conquistasObj) {
                    model.Objeto.NumeroConquistasObtidas = conquistasObj.length;
                    Conquista.find(function (err, todasConquistasObj) {
                        model.Objeto.NumeroConquistas = todasConquistasObj.length;
                        Score.find({
                            where: {
                                IdUsuario: obj.Id
                            }
                        }, function (err, scoreObj) {
                            if (scoreObj.length) {
                                model.Objeto.Score = scoreObj[0];
                                delete model["Objeto"]["TokenFirebase"];
                                cb(null, model);
                            } else {
                                var score = {};
                                score.PontuacaoAtual = 0;
                                score.PontuacaoGeral = 0;
                                score.Distancia = 0;
                                score.IdUsuario = obj.Id;
                                Score.create(score, function (scoreObj) {
                                    model.Objeto.Score = scoreObj[0];
                                    cb(null, model);
                                });
                            }
                        });
                    });
                });

            });
        } else {
            cb(err, null);
        }
    });
}
var criarMetodoBuscarPerfil = function (Usuario) {
    Usuario.BuscarPerfil = function (arg, cb) {
        verificaTokenEUsuario(arg, cb, function (obj) {
            if (arg.SearchId) {
                buscarPerfilPorId(Usuario, arg, cb);
            } else if (arg.Nome) {
                buscarPerfilPorNome(Usuario, arg, cb);
            } else {
                buscarPerfilPorToken(obj, cb);
            }

        });
    };

    Usuario.remoteMethod(
        'BuscarPerfil', {
            http: {
                path: '/BuscarPerfil'
            },
            accepts: {
                arg: 'Request',
                description: 'Requisição de Busca',
                type: 'BuscarPerfilRequest',
                http: {source: 'body', verb: 'post'}
            },
            returns: {root: true, type: {}, default: ResponseModel}
        });
};

var criarMetodoBuscarListaAmigos = function (Usuario) {
    Usuario.BuscarListaAmigos = function (arg, cb) {
        verificaTokenEUsuario(arg, cb, function () {
            Usuario.findById(arg.SearchId, {include: {Amigos: "Amigo"}}, function (err, obj) {
                if (obj && obj.length !== 0) {
                    obj = copiarObjeto(obj);
                    var amigos = [];
                    for (var i = 0; i < obj.Amigos.length; i++) {
                        amigos.push(obj.Amigos[i].Amigo);
                    }
                    var model = {};
                    model.Sucesso = true;
                    model.Mensagem = null;
                    model.Objeto = amigos;
                    cb(null, model);
                } else {
                    cb(err, null);
                }
            })
        });
    };
    Usuario.remoteMethod(
        'BuscarListaAmigos', {
            http: {
                path: '/BuscarListaAmigos'
            },
            accepts: {
                arg: 'Request',
                description: 'Requisição de Busca',
                type: 'BuscarPerfilRequest',
                http: {source: 'body', verb: 'post'}
            },
            returns: {root: true, type: {}, default: ResponseModel}
        });
};

var criarMetodoAdicionarAmigo = function (Usuario) {
    Usuario.AdicionarAmigo = function (arg, cb) {
        verificaTokenEUsuario(arg, cb, function () {
            var AmigoUsuario = loopback.findModel("AmigoUsuario");
            app.model(AmigoUsuario);
            Usuario.find({where: {TokenFirebase: arg.TokenFirebase}}, function (err, obj) {
                var usuario = obj[0];
                var model = {};
                if (usuario.Id === arg.IdAmigo) {
                    model.Sucesso = false;
                    model.Mensagem = "Você não pode se adicionar-se a si mesmo.";
                    model.Objeto = null;
                    cb(null, model)
                } else {
                    AmigoUsuario.find({
                        where: {
                            or: [
                                {
                                    and: [
                                        {IdUsuario: usuario.Id}, {IdAmigo: arg.IdAmigo}
                                    ]
                                },
                                {
                                    and: [
                                        {IdAmigo: usuario.Id}, {IdUsuario: arg.IdAmigo}
                                    ]
                                }
                            ]
                        }
                    }, function (err, obj) {
                        if (obj.length) {
                            var relacao = obj[0];
                            switch (relacao.Status) {
                                case 1:
                                    if (relacao.IdUsuario === usuario.Id) {
                                        model.Sucesso = false;
                                        model.ErrorId = 2;
                                        model.Mensagem = "Esperando resposta da solicitação";
                                        model.Objeto = null;
                                        cb(null, model);
                                    } else {
                                        relacao.updateAttribute("Status", 2, function (err, obj) {
                                            model.Sucesso = true;
                                            model.Mensagem = "Amigo Aceito";
                                            model.Objeto = null;
                                            cb(null, model)
                                        });
                                    }
                                    break;
                                case 2:
                                    model.Sucesso = false;
                                    model.ErrorId = 1;
                                    model.Mensagem = "Já são amigos";
                                    model.Objeto = null;
                                    cb(null, model);
                                    break;
                                case 3:
                                    relacao.updateAttribute("Status", 1, function (err, obj) {
                                        model.Sucesso = true;
                                        model.Mensagem = null;
                                        model.Objeto = relacao;
                                        cb(null, model)
                                    });
                                    break;
                                case 4:
                                    if (relacao.IdUsuario === usuario.Id) {
                                        model.Sucesso = false;
                                        model.ErrorId = 3;
                                        model.Mensagem = "Usuário lhe bloqueou.";
                                        model.Objeto = null;
                                        cb(null, model);
                                    } else {
                                        relacao.updateAttribute("Status", 1, function (err, obj) {
                                            model.Sucesso = true;
                                            model.Mensagem = null;
                                            model.Objeto = relacao;
                                            cb(null, model)
                                        });
                                    }
                                    break;
                            }
                        } else {
                            AmigoUsuario.create({
                                IdUsuario: usuario.Id,
                                IdAmigo: arg.IdAmigo,
                                Status: 1
                            }, function (err, obj) {
                                var model = {};
                                if (obj) {
                                    // TODO: Push de aviso pro usuario
                                    model.Sucesso = true;
                                    model.Mensagem = null;
                                    model.Objeto = obj;
                                    cb(null, model)
                                } else {
                                    model.Sucesso = false;
                                    model.Mensagem = "Ocorreu um erro ao tentar adicionar o usuário.";
                                    model.Objeto = null;
                                    cb(null, model)
                                }
                            });
                        }
                    });
                }
            });


        });
    };
    Usuario.remoteMethod(
        'AdicionarAmigo', {
            http: {
                path: '/Adicionar'
            },
            accepts: {
                arg: 'Request',
                description: 'Requisição de adição de amigo.',
                type: 'AcaoAmigoRequest',
                http: {source: 'body', verb: 'post'}
            },
            returns: {root: true, type: {}, default: ResponseModel}
        });
};


var criarMetodoRemoverAmigo = function (Usuario) {
    Usuario.RemoverAmigo = function (arg, cb) {
        verificaTokenEUsuario(arg, cb, function () {
            var AmigoUsuario = loopback.findModel("AmigoUsuario");
            app.model(AmigoUsuario);
            Usuario.find({where: {TokenFirebase: arg.TokenFirebase}}, function (err, obj) {
                    var usuario = obj[0];
                    var model = {};
                    if (usuario.Id === arg.IdAmigo) {
                        model.Sucesso = false;
                        model.Mensagem = "Você não pode se remover.";
                        model.Objeto = null;
                        cb(null, model)
                    } else {
                        AmigoUsuario.find({
                                where: {
                                    or: [
                                        {
                                            and: [
                                                {IdUsuario: usuario.Id}, {IdAmigo: arg.IdAmigo}
                                            ]
                                        },
                                        {
                                            and: [
                                                {IdAmigo: usuario.Id}, {IdUsuario: arg.IdAmigo}
                                            ]
                                        }
                                    ]
                                }
                            }, function (err, obj) {
                                if (obj.length) {
                                    var relacao = obj[0];
                                    if (relacao.Status === 1 || relacao.Status === 2) {
                                        relacao.updateAttribute("Status", 3, function (err, obj) {
                                            relacao.status = 3;
                                            model.Sucesso = true;
                                            model.Mensagem = null;
                                            model.Objeto = relacao;
                                            cb(null, model)
                                        });
                                    } else {
                                        model.Sucesso = false;
                                        model.Mensagem = "Não é amigo para poder remover";
                                        model.Objeto = null;
                                        cb(null, model)
                                    }
                                }
                                else {
                                    model.Sucesso = false;
                                    model.Mensagem = "Não é amigo para poder remover";
                                    model.Objeto = null;
                                    cb(null, model)
                                }
                            }
                        );
                    }
                }
            );
        });
    };
    Usuario.remoteMethod(
        'RemoverAmigo', {
            http: {
                path: '/Remover'
            },
            accepts: {
                arg: 'Request',
                description: 'Requisição de Busca',
                type: 'AcaoAmigoRequest',
                http: {source: 'body', verb: 'post'}
            },
            returns: {root: true, type: {}, default: ResponseModel}
        });
};

var criarMetodoBloquearUsuario = function (Usuario) {
    Usuario.BloquearUsuario = function (arg, cb) {
        verificaTokenEUsuario(arg, cb, function () {
            var AmigoUsuario = loopback.findModel("AmigoUsuario");
            app.model(AmigoUsuario);
            Usuario.find({where: {TokenFirebase: arg.TokenFirebase}}, function (err, obj) {
                    var usuario = obj[0];
                    var model = {};
                    if (usuario.Id === arg.IdAmigo) {
                        model.Sucesso = false;
                        model.Mensagem = "Você não pode se adicionar-se a si mesmo.";
                        model.Objeto = null;
                        cb(null, model)
                    } else {
                        AmigoUsuario.find({
                                where: {
                                    or: [
                                        {
                                            and: [
                                                {IdUsuario: usuario.Id}, {IdAmigo: arg.IdAmigo}
                                            ]
                                        },
                                        {
                                            and: [
                                                {IdAmigo: usuario.Id}, {IdUsuario: arg.IdAmigo}
                                            ]
                                        }
                                    ]
                                }
                            }, function (err, obj) {
                                if (obj.length) {
                                    var relacao = obj[0];
                                    relacao.updateAttribute("Status", 4, function (err, obj) {
                                        model.Sucesso = true;
                                        model.Mensagem = null;
                                        model.Objeto = relacao;
                                        cb(null, model)
                                    });
                                }
                                else {
                                    AmigoUsuario.create({
                                        IdUsuario: usuario.Id,
                                        IdAmigo: arg.IdAmigo,
                                        Status: 4
                                    }, function (err, obj) {
                                        var model = {};
                                        if (obj) {
                                            // TODO: Push de aviso pro usuario
                                            model.Sucesso = true;
                                            model.Mensagem = null;
                                            model.Objeto = obj;
                                            cb(null, model)
                                        } else {
                                            model.Sucesso = false;
                                            model.Mensagem = "Ocorreu um erro ao tentar bloquear o usuário.";
                                            model.Objeto = null;
                                            cb(null, model)
                                        }
                                    });
                                }
                            }
                        );
                    }
                }
            );
        });
    };
    Usuario.remoteMethod(
        'BloquearUsuario', {
            http: {
                path: '/Bloquear'
            },
            accepts: {
                arg: 'Request',
                description: 'Requisição de Busca',
                type: 'AcaoAmigoRequest',
                http: {source: 'body', verb: 'post'}
            },
            returns: {root: true, type: {}, default: ResponseModel}
        });
};

var criarMetodoLoginUsuario = function (Usuario) {
    Usuario.LoginUserRest = function (arg, cb) {
        verificaToken(arg, cb, function () {
            if (arg.TokenFirebase) {
                Usuario.find({where: {TokenFirebase: arg.TokenFirebase}}, function (err, obj) {
                    if (obj.length) {
                        loginAts(arg, cb, obj[0]);
                    } else {
                        arg.Token = "x807f9uEkgXH5BVU5LMr9YBtFzlv055l";
                        if (arg.Cpf) {
                            arg.CPFCNPJ = arg.Cpf;
                            delete arg["Cpf"];
                        }
                        loginAts(arg, cb, null);
                    }
                });
            } else {
                loginAts(arg, cb, null);
            }
        });
    };

    Usuario.remoteMethod(
        'LoginUserRest', {
            http: {
                path: '/Login'
            },
            accepts: {
                arg: 'Request',
                description: 'Requisição de Login',
                type: 'LoginRequest',
                http: {source: 'body', verb: 'post'}
            },
            returns: {root: true, type: {}, default: ResponseModel}
        });
};

function loginAts(arg, cb, user_qra) {
    var Usuario_Ats = loopback.findModel("Usuario_Ats");
    app.model(Usuario_Ats);
    arg.Token = "x807f9uEkgXH5BVU5LMr9YBtFzlv055l";
    if (arg.Cpf) {
        arg.CPFCNPJ = arg.Cpf;
        delete arg["Cpf"];
    }
    Usuario_Ats.LoginUsuario(arg, function (error, obj) {
            arg.Token = "ee46a057-6153-4c7c-aa0c-6bb23d62f257";
            if (obj.Sucesso) {
                //console.log(obj);
                var usuario = {};
                var user_ats = obj.Objeto;
                var response = obj.Objeto;
                usuario.IdAts = response.IdUsuario;
                usuario.Nome = response.Nome;
                usuario.Email = response.Email;

                obj.Objeto = usuario;
                if (user_qra) {
                    var updates = {};
                    updates.CPF = response.CPFCNPJ;
                    if (response.IdUsuario) {
                        updates.IdAts = response.IdUsuario;
                    }
                    if (response.IdHorario) {
                        updates.IdHorario = response.IdHorario;
                    }

                    if (response.Empresa) {
                        updates.Empresa = response.Empresa.NomeFantasia;
                    }

                    if (response.IdEmpresa) {
                        updates.IdEmpresa = response.IdEmpresa;
                    }
                    if (response.Marca) {
                        updates.Marca = response.Marca;
                    }
                    if (response.Placa) {
                        updates.Placa = response.Placa;
                    }
                    if (response.Modelo) {
                        updates.Modelo = response.Modelo;
                    }
                    user_qra.updateAttributes(updates, function (err, objeto) {
                        obj.Objeto = objeto;
                        cb(null, obj);
                    });
                } else {
                    var Usuario = loopback.findModel("Usuario");
                    app.model(Usuario);
                    usuario.IdAts = user_ats.IdUsuario;
                    usuario.Nome = user_ats.Nome;
                    usuario.Email = user_ats.Email;
                    usuario.CPF = user_ats.CPFCNPJ;
                    if (user_ats.Foto) {
                        usuario.Foto = user_ats.Foto;
                    }
                    if (user_ats.IdEmpresa) {
                        usuario.IdEmpresa = user_ats.IdEmpresa;
                    }
                    if (user_ats.IdHorario) {
                        usuario.IdHorario = user_ats.IdHorario;
                    }
                    if (user_ats.Empresa) {
                        usuario.Empresa = user_ats.Empresa.NomeFantasia;
                    }
                    if (user_ats.Marca) {
                        usuario.Marca = user_ats.Marca;
                    }
                    if (user_ats.Placa) {
                        usuario.Placa = user_ats.Placa;
                    }
                    if (user_ats.Modelo) {
                        usuario.Modelo = user_ats.Modelo;
                    }
                    usuario.TokenFirebase = arg.TokenFirebase;
                    Usuario.create(usuario, function (err, usr) {
                        obj.Objeto = usr;

                        cb(null, obj);
                    });

                }
            } else {
                if (user_qra) {
                    var model = {};
                    model.Sucesso = true;
                    model.Mensagem = null;
                    model.Objeto = user_qra;
                } else {
                    cb(null, obj);
                }
            }

        }
    )
    ;
}

var criarMetodoRegistrarUsuario = function (Usuario) {
    Usuario.RegisterUser = function (arg, cb) {
        verificaToken(arg, cb, function () {
            var Usuario_Ats = loopback.findModel("Usuario_Ats");
            app.model(Usuario_Ats);
            arg.Token = "x807f9uEkgXH5BVU5LMr9YBtFzlv055l";
            arg.CPFCNPJ = arg.Cpf;
            Usuario.find({where: {TokenFirebase: arg.TokenFirebase}}, function (err, obj) {
                if (obj.length) {
                    model.Sucesso = false;
                    model.Mensagem = "Usuario já existe";
                    model.Objeto = null;
                    cb(null, model);
                } else {
                    Usuario_Ats.IntegrarUsuario(arg, function (err, obj) {
                        if (obj.Sucesso) {
                            var user = {
                                TokenFirebase: arg.TokenFirebase,
                                Cpf: arg.Cpf,
                                Nome: arg.Nome,
                                Email: arg.Email,
                                Foto: arg.FotoUrl,
                                Apelido: arg.Apelido,
                                IdAts: obj.Objeto
                            };
                            Usuario.create(user, function (err, obj) {
                                var model = {};
                                if (!err) {
                                    model.Sucesso = true;
                                    model.Mensagem = "";
                                    model.Objeto = obj;
                                    cb(null, model);
                                } else {
                                    model.Sucesso = false;
                                    model.Mensagem = "Ocorreu um erro ao registrar o usuario.";
                                    model.Objeto = null;
                                    cb(null, model);
                                }
                            });
                        } else {
                            cb(null, obj);
                        }
                    });
                }
            });

        });
    };

    Usuario.remoteMethod(
        'RegisterUser', {
            http: {
                path: '/Registro'
            },
            accepts: {
                arg: 'Request',
                description: 'Requisição de Login',
                type: 'RegistroRequest',
                http: {source: 'body', verb: 'post'}
            },
            returns: {root: true, type: {}, default: ResponseModel}
        });
};

var criarMetodoVerificarCpf = function (Usuario) {
    Usuario.VerificaCpfRest = function (arg, cb) {
        verificaToken(arg, cb, function () {
            var Usuario_Ats = loopback.findModel("Usuario_Ats");
            app.model(Usuario_Ats);

            arg.Token = "x807f9uEkgXH5BVU5LMr9YBtFzlv055l";
            arg.CPFCNPJ = arg.Cpf;
            delete arg["Cpf"];
            Usuario_Ats.VerificarUsuario(arg, function (eee, err) {
                err.Objeto = err.Objeto.Usuario;
                if (err.Objeto) {
                    var usuario = {};
                    usuario.Id = err.Objeto.IdUsuario;
                    usuario.Nome = err.Objeto.Nome;

                    err.Objeto = usuario;
                }
                cb(null, err);
            });
        });
    };

    Usuario.remoteMethod(
        'VerificaCpfRest', {
            http: {
                path: '/VerificaCpf'
            },
            accepts: {
                arg: 'Request',
                description: 'Requisição de Login',
                type: 'VerificaCpfRequest',
                http: {source: 'body', verb: 'post'}
            },
            returns: {root: true, type: {}, default: ResponseModel}
        });
};

var criarMetodoAlterarSenha = function (Usuario) {
    Usuario.AlterarSenha = function (arg, cb) {
        verificaToken(arg, cb, function () {
            var Usuario_Ats = loopback.findModel("Usuario_Ats");
            app.model(Usuario_Ats);
            arg.Token = "x807f9uEkgXH5BVU5LMr9YBtFzlv055l";
            arg.CPFCNPJ = arg.Cpf;
            delete arg["Cpf"];
            Usuario_Ats.AlterarSenhaMethod(arg, function (eee, err) {
                cb(null, err);
            });
        });
    };

    Usuario.remoteMethod(
        'AlterarSenha', {
            http: {
                path: '/AlterarSenha'
            },
            accepts: {
                arg: 'Request',
                description: 'Requisição de Login',
                type: 'AlterarSenhaRequest',
                http: {source: 'body', verb: 'post'}
            },
            returns: {root: true, type: {}, default: ResponseModel}
        });
};

var criarMetodoAtualizarUsuario = function (Usuario) {
        Usuario.ModificarUsuario = function (arg, cb) {
            verificaToken(arg, cb, function () {
                    console.log(arg);

                    if (arg.Cpf){
                        Usuario.find({
                            where: {
                                or: [
                                    {TokenFirebase: arg.TokenFirebase},
                                    {CPF: arg.Cpf}
                                ]
                            }
                        }, function (err, obj) {
                            if (obj.length && arg.Cpf) {
                                var model = {};
                                model.Sucesso = false;
                                model.Mensagem = "Usuário já cadastrado no QRA.";
                                model.Objeto = null;
                                cb(null, model);
                            } else {
                                var Usuario_Ats = loopback.findModel("Usuario_Ats");
                                app.model(Usuario_Ats);
                                var FirebaseToken = arg.TokenFirebase;
                                arg.Token = "x807f9uEkgXH5BVU5LMr9YBtFzlv055l";
                                arg.CPFCNPJ = arg.Cpf;

                                delete arg["Cpf"];
                                delete arg["TokenFirebase"];
                                Usuario_Ats.LoginUsuario(arg, function (eee, err) {
                                    if (err.Sucesso) {
                                        err = err.Objeto;
                                        err.TokenFirebase = FirebaseToken;
                                        err.Token = arg.Token;
                                        err.Email = arg.Email;
                                        //console.log(err);
                                        Usuario_Ats.AtualizarUsuario(err, function (eee, obj) {
                                            if (obj.Sucesso) {
                                                cb(null, obj);
                                            } else {
                                                cb(null, obj);
                                            }
                                        });
                                    } else {
                                        cb(null, err);
                                    }

                                });
                            }
                        });
                    } else {
                        var Usuario_Ats = loopback.findModel("Usuario_Ats");
                        app.model(Usuario_Ats);
                        var FirebaseToken = arg.TokenFirebase;
                        arg.Token = "x807f9uEkgXH5BVU5LMr9YBtFzlv055l";
                        Usuario_Ats.LoginUsuario(arg, function (eee, err) {
                            if (err.Sucesso) {
                                err = err.Objeto;
                                err.TokenFirebase = FirebaseToken;
                                err.Token = arg.Token;
                                err.Email = arg.Email;
                                err.IdHorario = arg.IdHorario;
                                console.log(JSON.stringify(err));
                                //console.log(err);
                                Usuario_Ats.AtualizarUsuario(err, function (eee, obj) {
                                    if (obj.Sucesso) {
                                        cb(null, obj);
                                    } else {
                                        cb(null, obj);
                                    }
                                });
                            } else {
                                cb(null, err);
                            }

                        });
                    }


                }
            );
        }
        ;

        Usuario.remoteMethod(
            'ModificarUsuario', {
                http: {
                    path: '/Modificar'
                },
                accepts: {
                    arg: 'Request',
                    description: 'Requisição de Atualização',
                    type: 'AtualizaRequest',
                    http: {source: 'body', verb: 'post'}
                },
                returns: {root: true, type: {}, default: ResponseModel}
            }
        );
    }
;

var criarMetodoCheckInUsuario = function (Usuario) {

    Usuario.CheckIn = function (arg, cb) {
        verificaTokenEUsuario(arg, cb, function (obj) {
            var Usuario_Ats = loopback.findModel("Usuario_Ats");
            app.model(Usuario_Ats);
            arg.Token = "x807f9uEkgXH5BVU5LMr9YBtFzlv055l";
            arg.CPFCNPJUsuario = obj.CPF;
            Usuario_Ats.CheckInUsuario(arg, function (err, obj) {
                if(arg.imei) {
                    var hardwareRequest = {
                        "Version": "3.5",
                        "imei": arg.imei,
                        "longitude": arg.Longitude,
                        "latitude": arg.Latitude,
                        "alarms": 0,
                        "date": arg.DataHora
                    };
                    Usuario_Ats.CheckInHardware(hardwareRequest, function (err, obj1) {
                        cb(null, obj);
                    });
                }else{
                    cb(null, obj);
                }
            });
        });
    };

    Usuario.remoteMethod(
        'CheckIn', {
            http: {
                path: '/CheckIn'
            },
            accepts: {
                arg: 'Request',
                description: 'Requisição de CheckIn',
                type: 'CheckInRequest',
                http: {source: 'body', verb: 'post'}
            },
            returns: {root: true, type: {}, default: ResponseModel}
        }
    );
};

var clearRemoteMethods = function (Usuario) {
    removerMetodosPadroes(Usuario, ["Familia", "Amigos", "Conquistas", "Score", "Timeline", "Apontamentos"]);
};