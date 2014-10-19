var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var UserSchema = new Schema({
    userId : String,
    blocks : [{loc1 : [Number],
               loc2 : [Number],
               loc3 : [Number],
               loc4 : [Number],
               score : Number}]
  });

mongoose.model('User', UserSchema)