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
const links = [
    "https://i.imgur.com/nJdB00j.png",
    "https://i.imgur.com/pLj6IR5.png",
    "https://i.imgur.com/fcR8UU7.png",
    "https://i.imgur.com/6Hw06Sk.png",
    "https://i.imgur.com/8iUdkeQ.png"
];
const app = express();
const port = 1935;

app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    res.render("landing")
})

app.post('/create', parser, (req, res) => {
    if (!links.includes(req.body.images)) {
        res.render("index", {
            yt: "https://www.youtube.com/embed/dQw4w9WgXcQ",
            image: "https://i.imgur.com/pLj6IR5.png",
            ytLink: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            link:`<h1 style="color: red;">Invalid image!</h1>`
        })
        return;
    }
    if (!/http(?:s?):\/\/(?:www\.)?youtu(?:be\.com\/watch\?v=|\.be\/)([\w\-\_]*)(&(amp;)?‌​[\w\?‌​=]*)?/g.test(req.body.yt)) {
        res.render("index", {
            yt: "https://www.youtube.com/embed/dQw4w9WgXcQ",
            image: "https://i.imgur.com/pLj6IR5.png",
            ytLink: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            link:`<h1 style="color: red;">Invalid YouTube link!</h1>`
        })
        return;
    }
    db.insert({
        image: req.body.images,
        youtube: req.body.yt
    }, (err, doc) => {
        res.render("index", {
            yt: "https://www.youtube.com/embed/dQw4w9WgXcQ",
            image: "https://i.imgur.com/pLj6IR5.png",
            ytLink: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            link:`<h1>Link: <a href="${req.headers.host}/get?id=${doc._id}">${req.headers.host}/get?id=${doc._id}</a></h1>`
        })
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
            ytLink: doc.youtube,
            link: ""
        });
    })
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})