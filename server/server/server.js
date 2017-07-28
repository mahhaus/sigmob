'use strict';

var loopback = require('loopback');
var boot = require('loopback-boot');

process.env.TZ = 'America/Sao_Paulo';
console.log(new Date().toString());

var app = module.exports = loopback();

var path = require('path');
var config = require(path.resolve(__dirname, '../server/config.json'));

// Rollbar
var Rollbar = require('rollbar');
var rollbar = new Rollbar('b908efe449af4dd1957673750828b959');

app.use(rollbar.errorHandler('b908efe449af4dd1957673750828b959'));

require("../custom-scripts/metodos-padroes");
require("../custom-scripts/apontamentosUtils");
require("../custom-scripts/remove-default-methods");

// app.get('http://0.0.0.0:4000/explorer/swagger.json', function (req, res, next) {
//     var _send = res.send;
//     res.send = function (data) {
//         if (data && data.definitions) {
//             _.forOwn(data.definitions, function (model) {
//                 _.forOwn(model.properties, function (prop) {
//                     if (prop.default === null) {
//                         delete prop.default;
//                     }
//                 });
//             });
//         }
//         _send.apply(res, arguments);
//     };
//     next();
// });


app.start = function (server) {
    server = server || app.listen(function () {
            app.emit('started');
            var baseUrl = app.get('url').replace(/\/$/, '');
            console.log('Web server listening at: %s', baseUrl);
            if (app.get('loopback-component-explorer')) {
                var explorerPath = app.get('loopback-component-explorer').mountPath;
                console.log('Browse your REST API at %s%s', baseUrl, explorerPath);


                var
                    // Local ip address that we're trying to calculate
                    address
                    // Provides a few basic operating-system related utility functions (built-in)
                    ,os = require('os')
                    // Network interfaces
                    ,ifaces = os.networkInterfaces();


                // Iterate over interfaces ...
                for (var dev in ifaces) {

                    // ... and find the one that matches the criteria
                    var iface = ifaces[dev].filter(function(details) {
                        return details.family === 'IPv4' && details.internal === false;
                    });

                    if(iface.length > 0) address = iface[0].address;
                }


                // rollbar.log('Server started at '+address +'     in '+(new Date()) );

            }
        });
  // start the web server
  return server;
};

boot(app, __dirname, function(err) {
  if (err) throw err;

  // start the server if `$ node server.js`
  if (require.main === module)
    app.start();
});

// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.

// app.get('remoting').errorHandler = {
//     handler: function(error, req, res, next) {
//         if (error instanceof Error && error.status >= 400) {
//             console.log(error.status);
//             rollbar.handleError(error);
//
//         }
//         next(); /* let the default error handler (RestAdapter.errorHandler) run next */
//     },
//     disableStackTrace: true
// };

