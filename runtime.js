/**
 * start the runtime
 * @param home  the home path of your application, usually pass __dirname in your app root
 * @param architectConfig architect config path, could be a requirable folder/js/json
 * @param printUsage  [option] function to print your application usage
 */
function start(home, architectConfig, printUsage) {
  global.home = home;

  var path = require('path');
  var architect = require('architect');

  /* inject application arguments */
  var argv = require('minimist')(process.argv.slice(2));
  if (argv.h) {
    if (printUsage) {
      printUsage();
    }
    console.log();
    console.log('runtime options:');
    console.log('-c config, the architect config file path');
    console.log('-d debug, enable debug');
    console.log('-h help, print usage');
    console.log();
    return;
  }

  var config = require(argv.c || architectConfig);
  var tree = architect.resolveConfig(config, home);
  for (var i = 0; i < tree.length; i++) {
    tree[i].argv = argv;
  }

  /* run application */
  var architectApp = architect.createApp(tree, function (err, app) {
    if (err) {
      console.log(err);
    }
  }).on('error', function (err) {
    console.error(err.stack);
  });
  global.runtime = architectApp;

  /* analyse plugin dependency for dev tool */
  if (argv.d) {
    // _serviceToPlugin and _plugins global variable only available when debug mode is enabled
    global._serviceToPlugin = {};
    global._plugins = {};

    var servicesBuf = [];
    architectApp
      .on('plugin', function (plugin) {
        console.info('registering plugin', plugin.packagePath);

        var pluginName = path.basename(plugin.packagePath);
        // update service to plugin map
        for (var i = 0; i < servicesBuf.length; i++) {
          global._serviceToPlugin[servicesBuf[i]] = pluginName;
        }

        // update plugins
        global._plugins[pluginName] = plugin;

        servicesBuf = [];
      }).on('service', function (name, service) {
        servicesBuf.push(name);
        console.info('registering service', name);
      });
  }
}


module.exports = {
  start: start
}