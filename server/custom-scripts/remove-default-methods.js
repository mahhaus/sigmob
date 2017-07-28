'use strict';

//noinspection ThisExpressionReferencesGlobalObjectJS
global.removerMetodosPadroes = function (Model, Relations) {
    Model.disableRemoteMethodByName('create');
    Model.disableRemoteMethodByName('replaceOrCreate');
    Model.disableRemoteMethodByName('patchOrCreate');
    Model.disableRemoteMethodByName('exists');
    Model.disableRemoteMethodByName('findById');
    Model.disableRemoteMethodByName('find');
    Model.disableRemoteMethodByName('findOne');
    Model.disableRemoteMethodByName('deleteById');
    Model.disableRemoteMethodByName('count');
    Model.disableRemoteMethodByName('replaceById');
    Model.disableRemoteMethodByName('prototype.patchAttributes');
    Model.disableRemoteMethodByName('createChangeStream');
    Model.disableRemoteMethodByName('updateAll');
    Model.disableRemoteMethodByName('upsertWithWhere');

    if (Relations) {
        Relations.forEach(function (currentValue) {
            Model.disableRemoteMethodByName('prototype.__get__' + currentValue);
            Model.disableRemoteMethodByName('prototype.__create__' + currentValue);
            Model.disableRemoteMethodByName('prototype.__delete__' + currentValue);
            Model.disableRemoteMethodByName('prototype.__update__' + currentValue);
            Model.disableRemoteMethodByName('prototype.__destroy__' + currentValue);
            Model.disableRemoteMethodByName('prototype.__destroyById__' + currentValue);
            Model.disableRemoteMethodByName('prototype.__updateById__' + currentValue);
            Model.disableRemoteMethodByName('prototype.__findById__' + currentValue);
            Model.disableRemoteMethodByName('prototype.__count__' + currentValue);
            Model.disableRemoteMethodByName('prototype.__link__' + currentValue);
            Model.disableRemoteMethodByName('prototype.__unlink__' + currentValue);
            Model.disableRemoteMethodByName('prototype.__exists__' + currentValue);
        });
    }
};