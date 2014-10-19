var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var IntersectionSchema = new Schema({
    loc : [Number]    
  });

mongoose.model('Intersection', IntersectionSchema)