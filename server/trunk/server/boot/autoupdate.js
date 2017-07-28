/*var async = require('async');

var TIPO_EVENTOS = [
    {"Descricao":"Inicio de Jornada", "LimiteMaximo" : "00:00", "LimiteMinimo" : "00:00", "Icone" : "ic_inicio.png"},
    {"Descricao":"Direção", "LimiteMaximo" : "00:01", "LimiteMinimo" : "04:00", "Icone" : "ic_direcao.png"},
    {"Descricao":"Espera", "LimiteMaximo" : "00:01", "LimiteMinimo" : "02:00", "Icone" : "ic_direcao.png"},
    {"Descricao":"Intervalo", "LimiteMaximo" : "01:00", "LimiteMinimo" : "02:00", "Icone" : "ic_direcao.png"},
    {"Descricao":"Descanso", "LimiteMaximo" : "00:01", "LimiteMinimo" : "00:00", "Icone" : "ic_direcao.png"},
    {"Descricao":"Fim de Jornada", "LimiteMaximo" : "00:00", "LimiteMinimo" : "00:00", "Icone" : "ic_direcao.png"}
];

module.exports = function(app) {
    var path = require('path');
    var models = require(path.resolve(__dirname, '../model-config.json'));
    var datasources = require(path.resolve(__dirname, '../datasources.json'));
    var modelUpdates = [];

    function buildModelListForOperation(){
        Object.keys(models).forEach(function(key) {
            if (typeof models[key].dataSource !== 'undefined') {
                if (typeof datasources[models[key].dataSource] !== 'undefined') {
                    modelUpdates.push({operation: app.dataSources[models[key].dataSource], key: key});
                }
            }
        });
    }
    function createStaticData() {
        app.models.TipoEvento.create(TIPO_EVENTOS, function(err, created) {
            if (err)
                throw err;
            else {
                console.log('Os dados padrão para tabela TIPOEVENTOS foram inseridos: ');
            }
        });

        var ds = app.models.TipoEvento.dataSource;
        var fileName = "../sqlPadrao.sql";
        ds.connector.execute( processSQLFile(fileName), null, function (err, obj) {
            if (err) console.error(err);
        });

    }

    function processModelsAndData(operationType) {
        buildModelListForOperation();

        // Criando todos os models
        async.each(modelUpdates, function(item, callback) {
            item.operation[operationType](item.key, function (err) {
                if (err) throw err;
                console.log('Model ' + item.key + ' migrado');
                callback();
            });
        }, function (err) {
            if (err) throw err;
            //createStaticData();
        });
    }

    //TODO: Mudar para 'autoupdate' ou 'automigrate'(apenas em desenv)
    processModelsAndData('autoupdate');
    //
};*/