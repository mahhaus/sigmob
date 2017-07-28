/**
 * Created by josias on 05/07/17.
 */
var loopback = require('loopback');
var _ = require('lodash');

//process.env.TZ = 'America/Sao_Paulo';

var ResponseModel = {"Sucesso": "boolean", "Mensagem": "string", "Objeto": "object"};

global.TipoEventoEnum = {
    INICIO_DE_JORNADA: 1,
    DIRECAO: 2,
    ESPERA: 3,
    INTERVALO: 4,
    FIM_DE_JORNADA: 5,
    DESCANSO: 6
};

global.validaLimitesDeEventos = function (arg, cb) {

    var response = {};
    response.Sucesso = false;
    response.Objeto = null;

    var Evento = getModelObject("Evento");
    var ApontamentoAlter = getModelObject("Apontamento_Alter");

    var filter = {
        where: {and: [{IdUsuario: arg.IdUsuario}, {IdJornada: arg.IdJornada}, {DataHoraFim: arg.DataHoraInicio}]},
        limit: 1
    };

    ApontamentoAlter.find(filter, function (err, apotamentoAnt){
      if (!err) {
          if (apotamentoAnt.length){
              Evento.findById(apotamentoAnt.IdEvento, function (err, evento) {
                  if (!err) {
                      if (evento){
                          var horasTotaisAnterior = somaTotais("00:00:00", new Date(apotamentoAnt.DataHoraFim), new Date(arg.DataHoraInicio));
                          var HoraMaxEvento = evento.LimiteMaximo;
                          var HoraMinEvento = evento.LimiteMinimo;

                          var ultrapassouLimiteMax = maiorQue(horasTotaisAnterior, HoraMaxEvento);
                          var atingiulimiteMin = maiorQue(horasTotaisAnterior, HoraMinEvento);

                          if (ultrapassouLimiteMax === "gt"){
                              response.Mensagem = "O apontamento anterior ultrapassa o limite máximo de horas do evento '"+evento.Descricao+"'."
                              cb(null, response);
                          } else if (atingiulimiteMin === "lt"){
                              response.Mensagem = "O apontamento anterior não atingiu o limite mínimo de horas do evento '"+evento.Descricao+"'."
                              cb(null, response);
                          } else {
                              response.Sucesso = true;
                              cb(null, response);
                          }
                      } else {
                          response.Mensagem = "Erro ao verificar o evento deste apontamento."
                          cb(null, response);
                      }
                  } else{
                      response.Mensagem = "Erro ao verificar o evento deste apontamento."
                      cb(null, response);
                  }
              });
          } else {
              response.Sucesso = true;
              response.Mensagem = "Nenhum apontamento anterior para validar."
              cb(null, response);
          }
      }  else {
          response.Mensagem = "Erro ao verificar os limites do apontamento anterior."
          cb(null, response);
      }
    });
};

global.compareValues = function(key, order) {
    return function(a, b) {
        //order='asc'

        if(!a.hasOwnProperty(key) || !b.hasOwnProperty(key)) {
            // property doesn't exist on either object
            return 0;
        }

        const varA = (typeof a[key] === 'string') ?
            a[key].toUpperCase() : a[key];
        const varB = (typeof b[key] === 'string') ?
            b[key].toUpperCase() : b[key];

        let comparison = 0;
        if (varA > varB) {
            comparison = 1;
        } else if (varA < varB) {
            comparison = -1;
        }
        return (
            (order === 'desc') ? (comparison * -1) : comparison
        );
    };
};

global.somaTotaisJornada = function (arg, cb) {
    var Jornada = arg;
    var responseSum = {};
    responseSum.Sucesso = false;
    responseSum.Objeto = Jornada;

    if (arg) {
        if (arg.Apontamentos) {

            var TipoEvento = getModelObject("TipoEvento");
            var Horario = getModelObject("Horario");
            var JornadaAtualiza;
            if (arg.TipoJornada === 1) {
                JornadaAtualiza = getModelObject("Jornada_Alter");
            } else {
                JornadaAtualiza = getModelObject("Jornada_Real");
            }

            var Apontamentos = JSON.parse(JSON.stringify(Jornada.Apontamentos));
            // var Usuario = JSON.parse(JSON.stringify(Jornada.Usuario));
            var TotalJornada = Jornada.TotalHorasJornada;
            var Descanso, Espera, Inicio, Final, Intervalo, Direcao;

            if (Apontamentos && Apontamentos.length > 0) {

                TipoEvento.find(null, function (err, tipoEventos) {
                    if (!err) {

                        if (tipoEventos.length > 0) {
                            // Recupero os Ids do eventos padrao
                            for (var i = 0; i < tipoEventos.length; i++) {
                                switch (tipoEventos[i].Codigo) {
                                    case 1:
                                        Inicio = tipoEventos[i].Id;
                                        break;
                                    case 2:
                                        Direcao = tipoEventos[i].Id;
                                        break;
                                    case 3:
                                        Espera = tipoEventos[i].Id;
                                        break;
                                    case 4:
                                        Intervalo = tipoEventos[i].Id;
                                        break;
                                    case 5:
                                        Final = tipoEventos[i].Id;
                                        break;
                                    case 6:
                                        Descanso = tipoEventos[i].Id;
                                        break;
                                }
                            }


                            // Busco o Horario
                            Horario.findById(arg.IdHorario, function (err, horario) {
                                if (!err) {
                                    if (horario) {

                                        // Efetua Soma dos Totis
                                        var HorarioJornadaDiaria = (horario.JornadaDiaria + ":00");
                                        var HorarioIntervaloMin = (horario.HorasIntervalo + ":00");
                                        var TotalDescanso = "00:00:00";
                                        var TotalEspera = "00:00:00";
                                        var TotalHorasDeJornada = "00:00:00";
                                        var TotalFinal = "00:00:00";
                                        var TotalIntervalo = "00:00:00";
                                        var TotalDirecao = "00:00:00";
                                        var TotalHorasNoturnas = "00:00:00";
                                        var TotalHorasDiurnas = "00:00:00";
                                        var TotalHorasRepouso = "00:00:00";
                                        var TotalHorasExtras = "00:00:00";

                                        var dateInicioJornada;
                                        var dateFimJornada = null;

                                        for (var i = 0; i < Apontamentos.length; i++) {
                                            var idTipoEvento = Apontamentos[i].Evento.IdTipoEvento;
                                            var dateFim = new Date(Apontamentos[i].DataHoraFim);
                                            var dateIni = new Date(Apontamentos[i].DataHoraInicio);

                                            // if (Apontamentos[i].DataHoraFim === null) {
                                            //     dateFim = new Date();
                                            // } else {
                                            //     dateFim = new Date(Apontamentos[i].DataHoraFim);
                                            // }

                                            if (Apontamentos[i].DataHoraFim !== null) {
                                                switch (idTipoEvento) {
                                                    case Inicio:
                                                        dateInicioJornada = dateIni;
                                                        // TotalInicio = somaTotais(TotalInicio, dateIni, dateFim);
                                                        break;
                                                    case Direcao:
                                                        TotalDirecao = somaTotais(TotalDirecao, dateIni, dateFim);
                                                        break;
                                                    case Espera:
                                                        TotalEspera = somaTotais(TotalEspera, dateIni, dateFim);
                                                        break;
                                                    case Intervalo:
                                                        TotalIntervalo = somaTotais(TotalIntervalo, dateIni, dateFim);
                                                        break;
                                                    case Final:
                                                        TotalFinal = somaTotais(TotalFinal, dateIni, dateFim);
                                                        dateFimJornada = dateFim;
                                                        break;
                                                    case Descanso:
                                                        TotalDescanso = somaTotais(TotalDescanso, dateIni, dateFim);
                                                        break;
                                                }
                                            }
//i === Apontamentos.length-1 &&
                                            if (dateFimJornada !== null && dateInicioJornada !== null) {
                                                TotalHorasNoturnas = sumHora(TotalHorasNoturnas, getHorasNoturnas(new Date(dateInicioJornada), new Date(dateFimJornada)));
                                                TotalHorasDeJornada = somaTotais(TotalHorasDeJornada, new Date(dateInicioJornada), new Date(dateFimJornada));
                                                TotalHorasDiurnas = subHora(TotalHorasDeJornada, TotalHorasNoturnas);

                                                console.log("HoraInicio: "+new Date(dateInicioJornada));
                                                console.log("HoraFim: "+new Date(dateFimJornada));
                                                console.log("TotalHorasDeJornada: " + TotalHorasDeJornada);
                                                console.log("TotalIntervalo: " + TotalIntervalo);
                                                console.log("horas valida: " + subHora(TotalHorasDeJornada, TotalIntervalo));
                                                console.log("horario: " + HorarioJornadaDiaria);

                                                var horasFaltandoInt = subHora(HorarioIntervaloMin, TotalIntervalo);
                                                TotalHorasExtras = subHora(subHora(TotalHorasDeJornada, TotalIntervalo), horario.JornadaDiaria);
                                                TotalHorasExtras = sumHora(TotalHorasExtras, horasFaltandoInt);

                                                console.log("TotalHorasExtras: " + subHora(TotalHorasDeJornada, TotalIntervalo));
                                            }
                                        }

                                        Jornada.HorasExtras = TotalHorasExtras;
                                        Jornada.HorasEmDescDirecao = TotalDescanso;

                                        Jornada.HorasEmEspera = TotalEspera;
                                        Jornada.HorasEmDirecao = TotalDirecao;
                                        Jornada.HorasEmIntervalo = TotalIntervalo;
                                        Jornada.TotalHorasJornada = TotalHorasDeJornada;

                                        Jornada.HorasNoturnas = TotalHorasNoturnas;
                                        Jornada.HorasDiurnas = TotalHorasDiurnas;
                                        Jornada.DataFimJornada = dateFimJornada;

                                        //delete Jornada["Usuario"];
                                        delete Jornada["Apontamentos"];

                                        var filter = {
                                            where: {and: [{IdUsuario: Jornada.IdUsuario}, {DataInicioJornada: {"lt": Jornada.DataInicioJornada}}]},
                                            limit: 1,
                                            order: "Id DESC"
                                        };
                                        JornadaAtualiza.findOne(filter, function (err, jornadaAnt) {
                                            if (!err) {
                                                console.log("Jornada ant: " + jornadaAnt);
                                                if (jornadaAnt) {
                                                    TotalHorasRepouso = somaTotais(TotalHorasRepouso, new Date(jornadaAnt.DataFimJornada), new Date(Jornada.DataInicioJornada));
                                                    Jornada.TotalHorasRepouso = TotalHorasRepouso;

                                                    // Atualizo a jornada
                                                    JornadaAtualiza.upsert(Jornada, function (err, jornadaRet) {
                                                        if (!err) {
                                                            Jornada = JSON.parse(JSON.stringify(jornadaRet));
                                                            responseSum.Sucesso = true;
                                                            responseSum.Mensagem = "Totais retornados";
                                                            //Jornada["Usuario"] = Usuario;
                                                            Jornada["Apontamentos"] = Apontamentos;
                                                            Jornada["Horario"] = horario;
                                                            responseSum.Objeto = Jornada;
                                                            cb(null, responseSum)
                                                        } else {
                                                            responseSum.Sucesso = false;
                                                            responseSum.Mensagem = "Erro ao atualizar totais da jornada";
                                                            responseSum.Objeto = null;
                                                            cb(null, responseSum)
                                                            // Erro ao atualizar totais  da jornada
                                                        }
                                                    });
                                                } else {
                                                    Jornada.TotalHorasRepouso = "11:00:00";

                                                    // Atualizo a jornada
                                                    JornadaAtualiza.upsert(Jornada, function (err, jornadaRet) {
                                                        if (!err) {
                                                            Jornada = JSON.parse(JSON.stringify(jornadaRet));
                                                            responseSum.Sucesso = true;
                                                            responseSum.Mensagem = "Totais retornados";

                                                            //Jornada["Usuario"] = Usuario;
                                                            Jornada["Apontamentos"] = Apontamentos;
                                                            Jornada["Horario"] = horario;

                                                            responseSum.Objeto = Jornada;
                                                            cb(null, responseSum)
                                                        } else {
                                                            responseSum.Sucesso = false;
                                                            responseSum.Mensagem = "Erro ao atualizar totais da jornada";
                                                            responseSum.Objeto = null;
                                                            cb(null, responseSum)
                                                            // Erro ao atualizar totais  da jornada
                                                        }
                                                    });
                                                }
                                            } else {
                                                console.log("Erro ao atualizar as horas de repouso: " + err.stack)
                                                responseSum.Sucesso = false;
                                                responseSum.Mensagem = "Erro ao atualizar as horas de repouso";
                                                responseSum.Objeto = null;
                                                cb(null, responseSum)
                                            }
                                        });
                                    } else {
                                        responseSum.Mensagem = "Horário não localizado";
                                        responseSum.Objeto = null;
                                        cb(null, responseSum)
                                        //nao achou o horario
                                    }
                                } else {
                                    if (!arg.idHorario) {
                                        responseSum.Mensagem = "Horário não pode ser nulo";
                                    } else {
                                        responseSum.Mensagem = "Erro ao buscar o horário";
                                    }
                                    responseSum.Objeto = null;
                                    cb(err, responseSum)
                                    // erro ao buscar horarios
                                }
                            });
                        } else {
                            responseSum.Mensagem = "Erro ao buscar tipo de eventos";
                            responseSum.Objeto = null;
                            cb(null, responseSum)
                            // tipo evento sem resultados
                        }
                    } else {
                        responseSum.Mensagem = "Erro ao buscar tipo de eventos";
                        responseSum.Objeto = null;
                        cb(null, responseSum)
                        //erro ao buscar tipoevento
                    }
                });
            } else {
                responseSum.Sucesso = true;
                responseSum.Mensagem = "Totais não calculados";
                cb(null, responseSum);
            }
        } else {
            responseSum.Mensagem = "Não há apontamentos ou usuários vinculados a esta jornada"
            responseSum.Sucesso = false;
            responseSum.Objeto = arg;
            cb(null, responseSum);
        }
    } else {
        responseSum.Sucesso = false;
        responseSum.Mensagem = "Totais não calculados";
        cb(null, responseSum);
    }
};

/** * Soma duas horas.
 * * Exemplo: 12:35 + 07:20 = 19:55.
 * */
function sumHora(horaInicio, horaSomada) {
    var horaIni = horaInicio.split(':');
    var horaSom = horaSomada.split(':');

    var horasTotal = parseInt(horaIni[0], 10) + parseInt(horaSom[0], 10);
    var minutosTotal = parseInt(horaIni[1], 10) + parseInt(horaSom[1], 10);

    var segTot, segSub;
    if (horaIni.length === 3) {
        segTot = parseInt(horaIni[2], 10);
    } else {
        segTot = 0;
    }
    if (horaSom.length === 3) {
        segSub = parseInt(horaSom[2], 10);
    } else {
        segSub = 0;
    }

    var segundosTotal = segTot + segSub;


    if (segundosTotal >= 60) {
        segundosTotal -= 60;
        minutosTotal += 1;
    }

    if (minutosTotal >= 60) {
        minutosTotal -= 60;
        horasTotal += 1;
    }

    return (zeroEsquerda(horasTotal) + ":" + zeroEsquerda(minutosTotal) + ":" + zeroEsquerda(segundosTotal));
}

function subHora(horaTotal, horaSubt) {

    var horaTot = horaTotal.split(':');
    var horaSub = horaSubt.split(':');
    if (parseInt(horaSub[0], 10) > parseInt(horaTot[0], 10)) {
        return "00:00:00";
    }

    var horasTot = parseInt(horaTot[0], 10);
    var horasSub = parseInt(horaSub[0], 10);
    var minutosTot = parseInt(horaTot[1], 10);
    var minutosSub = parseInt(horaSub[1], 10);
    var segTot, segSub;

    if (horaSub.length === 3) {
        segSub = parseInt(horaSub[2], 10);
    } else {
        segSub = 0;
    }

    if (horaTot.length === 3) {
        segTot = parseInt(horaTot[2], 10);

        if ((segTot <= 0 && segSub > 0) || (segTot < segSub)) {
            segTot = 60;
            if (minutosTot === 0) {
                minutosTot = 59;
                if (horasTot > 0) {
                    horasTot -= 1;
                } else {
                    horasTot = 0;
                }
            } else {
                minutosTot -= 1;
            }
        }
    } else {
        segTot = 0;
    }


    if (minutosTot < minutosSub) {
        minutosTot += 60;
        if (horasTot > 0) {
            horasTot -= 1;
        } else {
            horasTot = 0;
        }
    }

    return (zeroEsquerda(horasTot - horasSub) + ":" + zeroEsquerda(minutosTot - minutosSub) + ":" + zeroEsquerda(segTot - segSub));
}

function zeroEsquerda(lHora) {
    var ret = "0" + lHora;

    if (ret.length >= 3) ret = ret.substring(1, 3);
    return ret;
}

function diferencaEntreData(dateIni, dateFim) {
    // Set the unit values in milliseconds.
    var msecPerMinute = 1000 * 60;
    var msecPerHour = msecPerMinute * 60;
    var msecPerDay = msecPerHour * 24;

    // Set a date and get the milliseconds
    var dateMsec = dateIni.getTime();

    // Get the difference in milliseconds.
    var interval = dateFim.getTime() - dateMsec;

    // Calculate how many days the interval contains. Subtract that
    // many days from the interval to determine the remainder.
    var days = Math.floor(interval / msecPerDay);
    interval = interval - (days * msecPerDay );

    // Calculate the hours, minutes, and seconds.
    var hours = Math.floor(interval / msecPerHour);
    interval = interval - (hours * msecPerHour );

    var minutes = Math.floor(interval / msecPerMinute);
    interval = interval - (minutes * msecPerMinute );

    var seconds = Math.floor(interval / 1000);

    // Display the result.
    var ret = [];
    ret[0] = days * 1;
    ret[1] = hours * 1;
    ret[2] = minutes * 1;
    ret[3] = seconds * 1;

    return (ret)
}

function somaTotais(horaASomar, dateIni, dateFim) {
    var ret = diferencaEntreData(dateIni, dateFim);

    if (!dateIni || !dateFim) return horaASomar;
    if (ret[0] > 0) {
        ret[1] += 24 * ret[0];
    }

    return sumHora(horaASomar, (ret[1] + ":" + ret[2] + ":" + ret[3]))
}

function getHorasNoturnas(dataIni, dataFim) {
    var mi, mf, hi, hf, si, sf, hr22, hr05, hr24, secIni, secFim;

    hi = dataIni.getHours();
    hf = dataFim.getHours();

    mi = dataIni.getMinutes();
    mf = dataFim.getMinutes();

    si = dataIni.getSeconds();
    sf = dataFim.getSeconds();

    si += ((hi * 60) * 60) + (mi * 60);
    sf += ((hf * 60) * 60) + (mf * 60);
    secIni = si;
    secFim = sf;

    hr22 = (22 * 60) * 60;
    hr05 = (5 * 60) * 60;
    hr24 = (24 * 60) * 60;

    var dataEntrada = new Date(dataIni);
    var dataSaida = new Date(dataFim);

    dataEntrada.setHours(0);
    dataEntrada.setMinutes(0);
    dataEntrada.setSeconds(0);

    dataSaida.setHours(0);
    dataSaida.setMinutes(0);
    dataSaida.setSeconds(0);

    if (dataSaida > dataEntrada){
        secIni = 0;
        secFim = 0;

        if (sf > hr05){
            secFim = hr05;
        } else {
            secFim = sf;
        }

        if (si <= hr22){
            secIni = hr24 -hr22;
        } else {
            secIni = hr24 - si;
        }

        return secToHor(secIni+secFim);
    } else {
        secIni = 0;
        secFim = 0;
        if (si < hr05){

            if (sf > hr22){
                secFim = sf - hr22;
            } else if (sf <= hr05) {
                secFim = sf-si;
            } else {
                secFim = hr05 - si;
            }

        } else if (si >= hr22){
            secIni = sf - si;
        } else if (si < hr22){
            if (sf > hr22){
                secFim = sf - hr22;
            }
        }

        return secToHor(secIni+secFim);
    }
}

function secToHor(secTotal) {
    console.log("secToHor: " + secTotal);
    var h = 0;
    var m = 0;
    var s = 0;

    if (secTotal === 0)  return "00:00:00"

    h = Math.trunc((Math.trunc(secTotal / 60)) / 60);
    m = Math.round((((Math.trunc(secTotal / 60)) % 60) * 60)/60);
    s = secTotal % 60;


    console.log("HORA NOTURNA: " + zeroEsquerda(h) + ":" + zeroEsquerda(m) + ":" + zeroEsquerda(s));
    return (zeroEsquerda(h) + ":" + zeroEsquerda(m) + ":" + zeroEsquerda(s));
}

function maiorQue(horaTotal, horaSubt){

    var horaTot = horaTotal.split(':');
    var horaSub = horaSubt.split(':');
    if (parseInt(horaSub[0], 10) > parseInt(horaTot[0], 10)) {
        return "gt";
    }

    if (parseInt(horaSub[0], 10) === parseInt(horaTot[0], 10) &&
        parseInt(horaSub[1], 10) > parseInt(horaTot[1], 10)){
        return "gt";
    }

    if (parseInt(horaSub[0], 10) === parseInt(horaTot[0], 10) &&
        parseInt(horaSub[1], 10) === parseInt(horaTot[1], 10)){
        return "eq";
    }

    return "lt";
}


