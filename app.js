
/**
 * Module dependencies.
 */

var express = require('express'),
	routes = require('./routes'),
	http = require('http'),
	path = require('path'),
    io = require('socket.io'),
    mongoose = require('mongoose'),
    userModel = require('./models/users.js'),
    intersectionModel = require('./models/intersection.js');

var app = express();

var dbString = 'mongodb://evan:Sk8board@ds047050.mongolab.com:47050/kingoftheblock';

mongoose.connect(dbString);

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use('/assets', express.static('assets'));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);

function handler (req, res) {
    fs.readfile(__direname  + '/index.html',
    function (err, data) {
        if (err) {
            res.writeHead(500);
            return res.end('Error loading index.html');
        }

        res.writeHead(200);
        res.end(data);
    });
}

var server = http.createServer(app);
server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});


//model stuff
var User = mongoose.model('User'),
    Intersection = mongoose.model('Intersection');

Intersection.collection.ensureIndex({ loc : "2d" }, function(error, res) {
    if(error){
        return console.error('failed ensureIndex with error', error);
    }
    console.log('ensureIndex succeeded with response', res);
});    


//sockets stuff
var blocksio = io.listen(server);

blocksio.sockets.on('connection', function(socket) { 

    function userWithCoordsProto() {

        this.coordsVisited = [];
        this.userId = "";
        var self = this;

        this.updateBlocks = function(coords) {
            this.coordsVisited.push(coords);

            this.getClosestIntersections(coords, function(results) {
                var blocks = self.calculateBlocks(results) 
                console.log(blocks);

                var newUser = User({
                    userId : self.userId,
                    blocks : [{loc1 : blocks[0],
                               loc2 : blocks[1],
                               loc3 : blocks[2],
                               loc4 : blocks[3],
                               score : 1}] 
                });

                newUser.save(console.log);
            });
        }

        this.updateBlocksOnStart = function(coords) {
            this.coordsVisited.push(coords);
            this.getNearestValidIntersection(coords, function(results) {
                var blocks = self.calculateBlocks(results);
                               
                var newUser = User({
                    userId : self.userId,
                    blocks : [{loc1 : blocks[0],
                               loc2 : blocks[1],
                               loc3 : blocks[2],
                               loc4 : blocks[3],
                               score : 1}] 
                });            

                newUser.save(console.log);
            });
        }

        this.getClosestIntersections = function(coords, callback) {    
            Intersection.find({ 
                loc : { '$near' : coords } 
            }).limit(4).exec(function(err, results) {
                callback(results);
            });
        }

        this.getNearestValidIntersection = function(coords, callback) {
            Intersection.find({ 
                loc : { '$near' : coords } 
            }).limit(1).exec(function(err, results) {
                callback(results);
            });
        }

        this.calculateBlocks = function(coordsList) {
            return [[1,1],[1,1],[1,1],[1,1]]
        }
    }

    var userWithCoords = new userWithCoordsProto();   

    socket.on('startLocation', function(data) {            
        socket.set('userId', data.userId, function() {
            console.log("starting loc");
            console.log(data.userId);
            console.log(data.coords);
            userWithCoords.userId = data.userId;
            userWithCoords.updateBlocksOnStart(data.coords);
        })
    });

    socket.on('updateLocation', function(data) {        
        socket.set('userId', data.userId, function() {
            console.log("updating loc");
            console.log(data.userId);
            console.log(data.coords);            
            userWithCoords.updateBlocks(data.coords);
        })     
    });
});