/*var server = require('./server');
var ds = server.dataSources.sqlserver;
var lbTables = ['Projeto'];
lbTables.forEach(function(entry) {
    server.
  ds.automigrate(entry, function(er) {
    ds.discoverModelProperties(entry, function (err, props) {
      console.log(props);
    });
  });
});
*/

var loopback = require('loopback');
var app = loopback();
var Projeto = loopback.Model.extend('Projeto');
Projeto.find({include:'Cliente'},function(){
    console.log(Projeto);
});