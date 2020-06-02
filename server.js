var express = require("express");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");

var axios = require("axios");
var cheerio = require("cheerio");

var db = require("./models");

var PORT = process.env.PORT || 8080;

var app = express();

app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static("public"));


var MONGODB_URI = process.env.MONGODB_URI || "mongodb://Scott:Mlpftw13@ds153123.mlab.com:53123/heroku_psvqcjrw";

mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true, useUnifiedTopology:true,
});

app.get("/notes", function(req, res) {
  
  db.Note
    .find({})
    .then(function(dbNote) {
      
      res.json(dbNote);
    })
    .catch(function(err) {
     
      res.json(err);
    });
});


app.get("/articles", function(req, res) {
  
  db.Article
    .find({}).populate("note")
    .then(function(dbArticle) {
      
      res.json(dbArticle);
    })
    .catch(function(err) {
      
      res.json(err);
    });
});


app.delete("/articles/deleteAll", function(req, res) {
  
  db.Article.remove( { } ).then(function(err) {
    res.json(err);
  })
  
    
});



app.get("/articles/:id", function(req, res) {
  
  db.Article
    .findOne({ _id: req.params.id })
    
    .populate("note")
    .then(function(dbArticle) {
      
      res.json(dbArticle);
    })
    .catch(function(err) {
     
      res.json(err);
    });
});


app.post("/articles/:id", function(req, res) {
 
  db.Note
    .create(req.body)
    .then(function(dbNote) {
      
      return db.Article.findOneAndUpdate({ _id: req.params.id }, { $addToSet: { note: dbNote._id }}, { new: true });
    })
    .then(function(dbArticle) {
      
      res.json(dbArticle);
    })
    .catch(function(err) {
      
      res.json(err);
    });
});


app.delete("/notes/deleteNote/:note_id/:article_id", function(req, res) {
  
  db.Note.findOneAndRemove({ _id: req.params.note_id }, function(err) {
    
    if (err) {
      console.log(err);
      res.send(err);
    }
    else { 
      db.Article.findOneAndUpdate({ _id: req.params.article_id }, {$pull: {note: req.params.note_id}})
        .exec(function(err, data) {
          
          if (err) {
            console.log(err);
            res.send(err);
          } else {
            res.send(data);
          }
        });
    }
  });
});



app.post("/saved/:id", function(req, res) {  // grab it by the id and save it
    db.Article.findOneAndUpdate({_id: req.params.id}, {$set: {saved: true}})
        .then(function(dbArticle) {
            res.json(dbArticle);
        });
});


app.get("/saved", function(req, res) {
 
  db.Article.find({saved: true}).populate("note")
    .then(function(dbArticle) {
      
     
     res.json(dbArticle);
    })
    .catch(function(err) {
      
      res.json(err);
    });
});


app.post("/deleteSaved/:id", function(req, res) {
    
   db.Article.findOneAndUpdate({_id: req.params.id}, {$set: {saved: false}})
        
        .then(function(dbArticle) {
            res.json(dbArticle);
        })
        .catch(function(err) {
            
            res.json(err);
        });
});


app.get("/scrape", function(req, res) {
    
    axios.get("https://www.theonion.com/latest").then(function(response) {
        
        var $ = cheerio.load(response.data);
        $("article").each(function(i, element) {
          
            var result = {};
            
            result.title =$(this).find("h2").text()
                
            result.link = $(this).find(".cw4lnv-5").children("a").attr("href")
                
            result.summary = $(this).find("h2").text()
                  
              console.log(result)
                
              
           
            result.title && result.link && result.summary && db.Article
                .create(result)
                .then(function(dbArticle) {
                console.log(dbArticle);
                })
                .catch(function(err) {
                    
                    res.json(err);
                });
        });
        res.send("soemthing");
    });
   
});


// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});
