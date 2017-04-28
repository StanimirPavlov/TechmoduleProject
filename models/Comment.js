const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;

let commentSchema = mongoose.Schema({
    author:{type:ObjectId, required: true, ref:'User'},
    content:{type: String, required: true},
    article:{type:ObjectId, required: true, ref:'Article'},
    date: {type: Date, default: Date.now()},
});

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;