/**
 * Created by riya on 29/4/17.
 */
const myPlugin = {
    register: function (server, options, next) {
        console.log("Plugin reg");
        console.log(options);

        server.route({
            method: 'GET',
            path: '/test',
            handler: function (request, reply) {
                reply('test passed');
            }
        });


        next();
    }
};

myPlugin.register.attributes = {
    name: 'myPlugin',
    version: '1.0.0'
};

module.exports = myPlugin;