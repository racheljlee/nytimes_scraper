var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
var request = require("request");

// Scraping Tools
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = 3000;

// Initialize Express
var app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Use body-parser for handling form submissions
app.use(bodyParser.urlencoded({ extended: true }));
// Use express.static to serve the public folder as a static directory
app.use(express.static("public"));

// Connect to the Mongo DB
mongoose.connect("mongodb://localhost/nytimes");

// Routes

// A GET route for scraping NYTimes website
// app.get("/scrape", function(req, res) {
//   request("https://www.nytimes.com/", function (err, res, html) {
//     var $ = cheerio.load(html);
//     var results = [];

//     $("h2.story-heading").each(function(i, element) {
//       var headline = $(element).children("a").text();
//       var summary = $(element).closest("p").hasClass("summary");
//       var url = $(element).children("a").attr("href");
//       results.push({
//           headline: headline,
//           summary: summary,
//           url: url
//       });
//       db.scrapedData.insert({
//         title: title,
//         link: link
//       });
//     });
//     console.log(results);
//   });
//   res.send("Scrape complete!");
// });


app.get("/scrape", function(req, res) {
  axios.get("https://www.nytimes.com/").then(function(response) {
    var $ = cheerio.load(response.data);

    $("h2.story-heading").each(function(i, element) {
      var result = {};

      result.headline = $(this).children("a").text();
      result.summary = $(this).closest("p").hasClass("summary");
      result.url = $(this).children("a").attr("href");

      db.Article.create(result)
        .then(function(dbArticle) {
        })
        .catch(function(err) {
          return res.json(err);
        });
    });

    res.send("Scrape Complete");
  });
});

// Route for getting all Articles from the db
app.get("/articles", function(req, res) {
  // TODO: Finish the route so it grabs all of the articles
  db.Article.find({})
  .then(function(dbArticle) {
    res.json(dbArticle);
  })
  .catch(function(err) {
    res.json(err);
  });
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function(req, res) {
  // TODO
  // ====
  // Finish the route so it finds one article using the req.params.id,
  db.Article.findById(req.params.id)
  // and run the populate method with "note",
    .populate("note")
  // then responds with the article with the note included
  .then(function(dbArticle) {
    res.json(dbArticle);
  }).catch(function(err) {
    res.json(err);
  });
});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function(req, res) {
  db.Note.create(req.body)
    .then(function(dbNote) {
      return db.Article.findOneAndUpdate({_id: req.params.id}, {note: dbNote._id}, {new:true});
    })
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
  .catch(function(err) {
      res.json(err);
    });
});

// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});
