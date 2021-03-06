const User = require('mongoose').model('User');
const Role = require('mongoose').model('Role');
const Article = require('mongoose').model('Article');
const encryption = require('./../utilities/encryption');

module.exports = {
    registerGet: (req, res) => {
        res.render('user/register');
    },

    registerPost:(req, res) => {
        let registerArgs = req.body;

        User.findOne({email: registerArgs.email}).then(user => {
            let errorMsg = '';
            if (user) {
                errorMsg = 'User with the same username exists!';
            } else if (registerArgs.password !== registerArgs.repeatedPassword) {
                errorMsg = 'Passwords do not match!'
            }

            if (errorMsg) {
                registerArgs.error = errorMsg;
                res.render('user/register', registerArgs)
            } else {
                let salt = encryption.generateSalt();
                let passwordHash = encryption.hashPassword(registerArgs.password, salt);

                let image = req.files.image;

                if(image){
                    let filename = image.name;

                    image.mv(`./public/pictures/${filename}`, err =>{
                        if(err){
                            console.log(err.message);
                        }
                    });
                }

                registerArgs.imagePath = `/pictures/${image.name}`;

                let roles = [];
                Role.findOne({name: 'User'}).then(role =>{
                  roles.push(role.id);


                  let userObject = {
                      email: registerArgs.email,
                      passwordHash: passwordHash,
                      imagePath: registerArgs.imagePath,
                      resume: registerArgs.resume,
                      fullName: registerArgs.fullName,
                      salt: salt,
                      roles: roles
                    };

                    User.create(userObject).then(user => {
                        role.users.push(user.id);
                        role.save(err =>{
                            if(err){
                                res.render('user/register', {error: err.message})
                            }else{
                                req.logIn(user, (err) => {
                                    if (err) {
                                        registerArgs.error = err.message;
                                        res.render('user/register', registerArgs);
                                        return;
                                    }
                                    res.redirect('/')
                                })
                            }
                        })
                    })
                });
            }
        })
    },

    loginGet: (req, res) => {
        res.render('user/login');
    },

    loginPost: (req, res) => {
        let loginArgs = req.body;
        User.findOne({email: loginArgs.email}).then(user => {
            if (!user ||!user.authenticate(loginArgs.password)) {
                let errorMsg = 'Either username or password is invalid!';
                loginArgs.error = errorMsg;
                res.render('user/login', loginArgs);
                return;
            }

            req.logIn(user, (err) => {
                if (err) {
                    console.log(err);
                    res.redirect('/user/login', {error: err.message});
                    return;
                }

                let returnUrl = '/';
                if(req.session.returnUrl){
                    returnUrl = req.session.returnUrl;
                    delete req.session.returnUrl;
                }

                res.redirect(returnUrl);
            })
        })
    },

    contactsGet: (req, res) => {
        res.render('user/contacts');
    },

    contactsPost: (req, res) =>{
        res.redirect('/');
    },

    logout: (req, res) => {
        req.logOut();
        res.redirect('/');
    },

    infoGet: (req, res) => {

        let articleArgs = req.body;
        let userId = req.user.id;

        Article.find({author:userId}).sort({_id:-1}).populate('author').then(articles => {
            for(let article of articles){
                if(article.content.length > 165) {
                    article.content = article.content.substring(0, 165) + '...';
                }
            }
            res.render('user/info', {
                articles
            });
        });

    }
};




