require('../models/users.js');
var mongoose = require('mongoose');
var User = mongoose.model('User');

// render the desktop/mobile index pages
exports.blocks = function(req, res){

  var userId = req.query.username
  console.log(userId)

  User.find({userId : { $in: [userId]}}, function(err, results) {
    var blocks = []
    for (var i = 0; i < results.length; i++) {
      var loc1= results[i]['blocks'][0]['loc1'] 
      var loc2= results[i]['blocks'][0]['loc2'] 
      var loc3= results[i]['blocks'][0]['loc3'] 
      var loc4= results[i]['blocks'][0]['loc4'] 
      blocks.push([loc1,loc2,loc3,loc4])
    }

    console.log(blocks)
    
    res.json({blocks: blocks});
  });


 

};