/**
 * Created by timothychu on 8/13/15.
 */
var mongoose = require('mongoose');

var PostSchema = new mongoose.Schema({
    title: String,
    link: String,
    author: String,
    upvotes: {type: Number, default: 0},
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
    numComments: Number
});

PostSchema.methods.upvote = function(cb) {
    this.upvotes += 1;           //updates in the backend server
    this.save(cb);
};

PostSchema.methods.downvote = function(cb) {
    this.upvotes -= 1;           //updates in the backend server
    this.save(cb);
};

PostSchema.methods.incCommentNum = function(cb) {
    this.numComments += 1;           //updates in the backend server
    this.save(cb);
};

mongoose.model('Post', PostSchema);



