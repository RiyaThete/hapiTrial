/**
 * Created by riya on 29/4/17.
 */
'use strict';

const Hapi = require('hapi');
const Good = require('good');
const Path = require('path');
const Joi = require('joi');

const server = new Hapi.Server();
server.connection(
    {
        labels: ['api'],
        port: 3000,
        host: 'localhost',
        routes: {
            files: {
                relativeTo: Path.join(__dirname, 'public')
            }
        }
    }
);

server.route({
    path: '/hapi/{ttl?}',
    method: 'GET',
    handler: function (request, reply) {

        const response = reply({be: 'hapi'}).state('data', 'test', {encoding: 'none'});
        if (request.params.ttl) {
            response.ttl(request.params.ttl);
        }
        response.header('Last-Modified', new Date().toUTCString())
            .etag('xxxxxxxxx');
    },
    config: {
        cache: {
            expiresIn: 30 * 1000,
            privacy: 'private'
        }
    }
});

server.state('data', {
    ttl: null,
    isSecure: true,
    isHttpOnly: true,
    encoding: 'base64json',
    clearInvalid: false, // remove invalid cookies
    strictHeader: true // don't allow violations of RFC 6265
});

const goodOptions = {
    reporters: {
        console: [
            {
                module: 'good-squeeze',
                name: 'Squeeze',
                args: [{
                    response: '*',
                    log: '*'
                }]
            },
            {
                module: 'good-console'
            },
            'stdout'
        ]
    }
};

server.register(
    {register: require('./myPlugin')},
    {
        routes: {
            prefix: '/plugins'
        }
    }, (err) => {

        if (err) {
            throw err;
        }
    });


server.register([require('vision'), require('inert'), require('lout'),
    {
        register: Good,
        options: goodOptions
    },

], (err) => {

    if (err) {
        throw err;
    }

    server.route({
        method: 'GET',
        path: '/hello/static',
        handler: function (request, reply) {
            reply.file('hello.html');
        }
    });

    server.route({
        method: 'GET',
        path: '/',
        handler: function (request, reply) {
            reply('Hello, world!');
        }
    });

    server.route({
        method: 'POST',
        path: '/hello/{user?}',
        handler: function (request, reply) {
            console.log(request.payload);
            const user = request.payload.full_name ? encodeURIComponent(request.payload.full_name) : 'stranger';
            reply('Hello ' + user + '!');
        },
        config: {
            description: 'Say hello!',
            notes: 'The user parameter defaults to \'stranger\' if unspecified',
            tags: ['api', 'greeting'],
            validate: {
                payload: schema
            }
        }
    });

    server.start((err) => {

        if (err) {
            throw err;
        }
        server.log('info', 'Server running at: ' + server.info.uri);
    });

});

const a = Joi.string().required();
const b = Joi.string();

const schema = Joi.object().keys({
    first_name: a,
    last_name: Joi.string(),
    surname: Joi.string(),
    type: Joi.string().required().valid(1, 2),
    age: Joi.number().required().min(18),
    username: Joi.string().alphanum().min(3).max(30),
    password: Joi.string().alphanum().min(3).max(10),
    subjects: Joi.array().required().items(Joi.string().valid("English", "Maths", "Science")),
    level: Joi.number().required().when('type', {is: 1, then: Joi.number().required().max(10), otherwise: Joi.number().min(10).max(20)}),
}).with('username', 'password').without('last_name', 'surname');