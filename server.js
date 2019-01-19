'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');

var cors = require('cors');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 

app.use(cors());

app.use(bodyParser.urlencoded({extended: false}));

app.use((req, res, next) => {
  console.log(req.method + ' ' + req.path + ' - ' + req.ip);
  next();
});

/** this project needs to parse POST bodies **/
// you should mount the body-parser here

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});


var urlSchema = mongoose.Schema({
  originaleurl: String,
  shorturl: String
});

var URLs = mongoose.model('URLs', urlSchema);

var validurl = /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/;

app.post('/api/shorturl/new', (req, res) => {
  mongo.MongoClient.connect(process.env.MONGOLAB_URI, (err, db) => {
    if (err) res.json({error: "Sorry we cannot complete your request right now. Please try again later"});
    var shorten = (done) => {
      var originalurl = req.body.url;
      // res.json({originalurl: req.body.url})
      if (!validurl.test(originalurl)) done({error: "invalid URL"});

      var url_collection = db.collection('url_collection');
      
      url_collection.count().then(count => {
        
        var shorturl = 'https://iron-rutabaga.glitch.me/api/shorturl/' + ++count;
        
        url_collection.insert({originalurl: originalurl, shorturl: shorturl});
        done({originalurl: originalurl, shorurl: shorturl});
      });
    }

    shorten((data) => res.json(data));
  });
});


// redirect to the original url
app.get('/api/shorturl/:id', (req, res) => {
  mongo.MongoClient.connect(process.env.MONGOLAB_URI, (err, db) => {
    if (err) res.json({error: "Sorry we cannot complete your request right now. Please try again later"});
    
    var collection = db.collection('url_collection');
    
    var query = (db, done) => {
      collection.findOne({"shorturl": "https://iron-rutabaga.glitch.me/api/shorturl/" + req.params.id},(err, data) => {
        if (err) res.json({"error": "We could not find that url"});
        else {
          res.redirect(data.originalurl);
        }
      });
    };
    
    // close the database
    query(db, () => db.close());
  });
});

app.listen(port, function () {
  console.log('Node.js listening ...');
});