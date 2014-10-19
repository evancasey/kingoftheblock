
/**
 * Module dependencies.
 */

var express = require('express'),
	routes = require('./routes'),  
    blocks = require('./routes/blocks'), 
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
app.get('/blocks', blocks.blocks);

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

Intersection.collection.ensureIndex({ loc : "2dsphere" }, function(error, res) {
    if(error){
        return console.error('failed ensureIndex with error', error);
    }
    console.log('ensureIndex succeeded with response', res);
});    


//sockets stuff
var blocksio = io.listen(server);

blocksio.sockets.on('connection', function(socket) { 

    function userWithCoordsProto() {

        this.visitedIntersections = [];        
        this.userId = "";

        var self = this;

        this.updateBlocks = function(coords) {            

            var closestNextIntersection = self.getClosestIntersections(coords, 10, function(results) {
                console.log("results" + results);                
                // console.log(self.visitedIntersections[self.visitedIntersections.length - 1].loc);
            
                // console.log(self.visitedIntersections[0].loc);

                if (results[0].loc[0] != self.visitedIntersections[self.visitedIntersections.length - 1].loc[0]) {

                    self.visitedIntersections.push(results[0]);

                    console.log("updating blocks!");

                    // update blocks owned
                    self.getClosestIntersections(results[0].loc, 5, function(results) {
                        
                        console.log(blocks);

                        var newUser = User({
                            userId : self.userId,
                            blocks : [{loc1 : results[1].loc,
                                       loc2 : results[2].loc,
                                       loc3 : results[3].loc,
                                       loc4 : results[4].loc,
                                       score : 1}] 
                        });

                        newUser.save(console.log);
                    });

                } 
            });

        }

        this.updateBlocksOnStart = function(coords) {             
            if (self.visitedIntersections.length == 0) {
                self.getClosestIntersections(coords, 1, function(results) {
                    self.visitedIntersections.push(results[0]);
                });      
            } else {
                self.updateBlocks(coords)
            }
          
        }

        this.getClosestIntersections = function(coords, thresh, callback) {              
            Intersection.find({ 
                loc : {$nearSphere: coords}                      
            }).limit(thresh).exec(function(err, results) {                                
                callback(results);
            });
        }

        // this.calculateBlocks = function(coords) {
        //     self.getClosestIntersections(coords, 4, function(results) {
        //         return results
        //     });
        // }

    }

    var userWithCoords = new userWithCoordsProto();   


    socket.on('updateLocation', function(data) {        
        socket.set('userId', data.userId, function() {
            console.log("updating loc");
            console.log(data.userId);
            console.log(data.coords);            
            userWithCoords.updateBlocksOnStart(data.coords);
        });
    });
});