const Article = require('mongoose').model('Article');

module.exports = {

  index: (req, res) => {

      Article.find({}).sort({_id:-1}).limit(6).populate('author').then(articles => {
          for(let article of articles){
              if(article.content.length > 165) {
                  article.content = article.content.substring(0, 165) + '...';
              }
          }
        res.render('home/index', {
            articles
        });
      });
  }
};