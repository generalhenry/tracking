/**
 * Module dependencies.
 */
var express = require('express');
var stylus = require('stylus');
var io = require('socket.io');
var fs = require('fs');
var geoip = require('geoip');
var http = require('http');

var cityData = geoip.open( __dirname + '/GeoLiteCity.dat');
var City = geoip.City;
var name = City.record_by_addr(cityData, '74.207.253.119');

var trackingPixel = fs.readFileSync( __dirname + '/public/images/tracking_pixel.gif');

var app = module.exports = express.createServer();

/**
*  config
*/

var PORT = 2500;

function compileMethod(str) {
  return stylus(str)
    .set('compress', true);
};

app.configure( function () {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
  app.use( stylus.middleware(__dirname + '/public') );
});
app.configure('development', function () {
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});
app.configure('production', function () {
  app.use(express.errorHandler()); 
});

// Routes
app.get('/', function (req, res, next) {
  res.render('index', {
    title: 'Real Time View'
  });
});

app.get('/trackingPixel.gif', function ( req, res, next ) {
  res.writeHead(200, {'Content-Type': 'image/gif'});
  res.end( trackingPixel );
  broadcastInfo( req.connection.remoteAddress, req.header('referer' ));
    //var name = City.record_by_addr(cityData, req.connection.remoteAddress );
  //socket.broadcast({ data: name, referer:  req.header('referer' ) });
});

function broadcastInfo ( ip, referer ) {
  var options = {
    host: 'api.ipinfodb.com',
    port: 80,
    path: '/v3/ip-city/?key=afbce595eb8f0b56719f748ed0c9e7dc84f67dc09a244f340624aa21c958f89a&ip=' + ip
  };
  http.get(options, function(res) {
    var data = '';
    res.on('data', function (chunk) {
      data += chunk;
    });
    res.on('end', function () {
      data = data.split(';');
      socket.broadcast({ data: data[6], referer: referer });
    });
  })
}

// Only listen on $ node app.js
if (!module.parent) {
  app.listen( PORT );
  console.log("Express server listening on port %d", app.address().port);
}

var socket = io.listen( app ); 

(function fakeData () {
  socket.broadcast({ data: 'fake' });
  setTimeout( fakeData, Math.random() * 10000 );
})();
