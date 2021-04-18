const express = require('express');
const bodyParser = require("body-parser");
const parser = bodyParser.urlencoded({
    extended: false
});
const Datastore = require('nedb');
const db = new Datastore({
    filename: "links",
    autoload: true
});
const app = express();
const port = 1935;

app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    res.render("index", {
        yt: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        image: "https://i.imgur.com/pLj6IR5.png",
        ytLink: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    });
})

app.post('/create', parser, (req, res) => {
    db.insert({
        image: req.body.images,
        youtube: req.body.yt
    }, (err, doc) => {
        res.end("/get?id=" + doc._id)
    })
})

app.get('/get', (req, res) => {
    if (!req.get("User-Agent").includes("discord")) return res.redirect("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    db.findOne({
        _id: req.query.id
    }, function(err, doc) {
        if (!doc) return;
        res.render("index", {
            yt: new URLSearchParams(new URL(doc.youtube).search).get("v"),
            image: doc.image,
            ytLink: doc.youtube
        });
    })
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})