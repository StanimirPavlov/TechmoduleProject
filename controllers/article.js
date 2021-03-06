const Article = require('mongoose').model('Article');
const Comment = require('mongoose').model('Comment');

module.exports = {
    createGet: (req, res) => {
        res.render('article/create');
    },

    createPost: (req, res) => {
        let articleArgs = req.body;

        let errorMsg = '';

        if(!req.isAuthenticated()){
            errorMsg = 'You should be logged in to make articles!';
        }else if(!articleArgs.title){
            errorMsg = 'Invalid title!';
        }else if(!articleArgs.content){
            errorMsg = 'Invalid content';
        }

        if(errorMsg){
            res.render('article/create', {
                error: errorMsg
            });

            return;
        }

        let image = req.files.image;

        if(image){
            let filename = image.name;

            image.mv(`./public/images/${filename}`, err =>{
                if(err){
                    console.log(err.message);
                }
            });
        }

        let userId = req.user.id;
        articleArgs.author = userId;

        if(image){
            articleArgs.imagePath = `/images/${image.name}`;
        }

        Article.create(articleArgs).then(article => {
            req.user.articles.push(article.id);
            req.user.save(err =>{
                if(err){
                    res.render('article/create', {
                        error: err.message
                    });
                }else{
                    res.redirect('/');
                }
            });
        });
    },
    detailsGet: (req, res) =>{
        let id = req.params.id;

        Article.findById(id).populate('author').then(article =>{
            if(!req.user) {
                res.render('article/details', {article: article, isUserAuthorized: false});
                return;
            }


            req.user.isInRole('Admin').then(isAdmin =>{
                let isUserAuthorized = isAdmin || req.user.isAuthor(article);

                res.render('article/details', {article: article, isUserAuthorized: isUserAuthorized});
            });
        });
    },
    editGet:(req, res) =>{
        let id = req.params.id;

        if(!req.isAuthenticated()){
            let returnUrl = `/article/edit/${id}`;
            req.session.returnUrl = returnUrl;

            res.redirect('/user/login');
            return;
        }

        Article.findById(id).then(article =>{
            req.user.isInRole('Admin').then(isAdmin =>{
                if(!isAdmin && !req.user.isAuthor(article)){
                    res.redirect('/');
                    return;
                }

                res.render('article/edit', article)
            });
        });
    },

    editPost: (req, res) =>{
        let id = req.params.id;
        let articleArgs = req.body;
        let errorMsg = '';
        let image = req.files.image;
        if(image) {
            articleArgs.imagePath = `/images/${image.name}`;
        }
        if(errorMsg){
            res.render('article/edit', {error: errorMsg})
        }else {
            if (image) {
                Article.update({_id: id}, {
                    $set: {
                        title: articleArgs.title,
                        content: articleArgs.content,
                        imagePath: articleArgs.imagePath,
                        tags: articleArgs.tags
                    }
                })
                    .then(updateStatus => {
                        res.redirect(`/article/details/${id}`);
                    });
            }
            else {
                Article.update({_id: id}, {
                    $set: {
                        title: articleArgs.title,
                        content: articleArgs.content,
                        tags: articleArgs.tags
                    }
                })
                    .then(updateStatus => {
                        res.redirect(`/article/details/${id}`);
                    });
            }
        }
    },

    deleteGet: (req, res)=>{
        let id = req.params.id;

         if(!req.isAuthenticated()){
             let returnUrl = `/article/delete/${id}`;
             req.session.returnUrl = returnUrl;

             res.redirect('/user/login');
             return;
         }

         Article.findById(id).then(article =>{
             req.user.isInRole('Admin').then(isAdmin =>{
                 if(!isAdmin && !req.user.isAuthor(article)){
                     res.redirect('/');
                     return;
                 }

                 res.render('article/delete', article)
             });
         });
    },

    deletePost: (req, res)=>{
        let id = req.params.id;
        Article.findOneAndRemove({_id: id}).populate('author').then(article =>{
            let author = article.author;

            let index = author.articles.indexOf(article.id);

            if(index < 0){
                let errorMsg = 'Article was not found for that author!';
                res.render('article/delete', {error: errorMsg});
            }else{
                let count = 1;
                author.articles.splice(index, count);
                author.save().then((user)=>{
                    res.redirect('/');
                });
            }
        });
    },

    commentGet: (req, res)=> {
            res.render('article/comment');
    },

    commentPost:(req, res)=>{
        res.redirect('/');
        let commentArgs = req.body;

        let errorMsg = '';

        if(!req.isAuthenticated()) {
            errorMsg = 'You should be logged in to make comments!';
        }
        if(errorMsg){
            res.render('article/comment', {
                error: errorMsg
            });
            return;
        }

        let userId = req.user.id;
        commentArgs.author = userId;

        let id = req.params.id;
        let articleArgs = req.body;
        commentArgs.article = id;

        Comment.create(commentArgs).then(comment => {
            req.article.comments.push(comment.id);
            req.article.save(err =>{
                if(err){
                    res.render('article/comment', {
                        error: err.message
                    });
                }else{
                    res.redirect(`/article/details/${id}`);
                }
            });
        });
        //console.log(userId);
        //console.log(articleId);
    }
};