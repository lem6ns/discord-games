const express = require('express');
const bodyParser = require("body-parser");
const fetch = require('node-fetch');
const FormData = require('form-data')
const { createCanvas, loadImage } = require('canvas');
const fileUpload = require('express-fileupload');
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
app.use(express.static('public'))
app.use(fileUpload({
    useTempFiles: true,
    tempFileDir : '/tmp/'
}));

app.get('/', (req, res) => {
    res.render("landing")
})

app.post('/generator', async (req, res) => {
    if (!/http(?:s?):\/\/(?:www\.)?youtu(?:be\.com\/watch\?v=)([\w\-\_]*)(&(amp;)?‌​[\w\?‌​=]*)?/g.test(req.body.youtubeLink)) {
        return res.status(400).send(`<h1>Input a valid Youtube link!</h1><meta http-equiv="refresh" content="3;url=generator.html"/>`)
    }
    if (!req.files.image) {
        return res.status(400).send(`<h1>lol</h1><meta http-equiv="refresh" content="3;url=generator.html"/>`)
    }
    res.render("generator", {
        embed: `<!DOCTYPE html>
<html>
    <head>
        <meta property="og:type" content="video.other">
        <meta property="twitter:player" content="https://www.youtube.com/embed/${new URLSearchParams(new URL(req.body.youtubeLink).search).get("v")}">
        <meta property="og:video:type" content="text/html">
        <meta property="og:video:width" content="900">
        <meta property="og:video:height" content="506">
        <meta name="twitter:image" content="${await generate(req.files.image)}">
        <meta http-equiv="refresh" content="0;url=${req.body.youtubeLink}"/>
    </head>
</html>`})
})

async function generate(image) {
    //init
    const canvas = createCanvas(1250, 703)
    const ctx = canvas.getContext("2d");
    
    //load images
    const game = await loadImage(image.tempFilePath)
    const footer = await loadImage("public/disc_games.png");
    const center = await loadImage("public/center.png")
    
    //draw
    ctx.drawImage(game, 0, 0, 1250, 703)
    ctx.drawImage(footer, 0, 618);
    ctx.drawImage(center, 499, 273);

    //upload
    let body = new FormData()
    body.append("image", canvas.toDataURL().split(',')[1])
    let upload = await fetch("https://api.imgur.com/3/image", {method: "POST",headers: {"Authorization": "Client-ID 5fae4323a27c0cf","Content-Length": canvas.toDataURL().split(',')[1].length},body: body,redirect: "follow"}).then(r=>r.json())
    return upload.data.link;
}

app.post('/create', parser, async (req, res) => {
    if (!/http(?:s?):\/\/(?:www\.)?youtu(?:be\.com\/watch\?v=)([\w\-\_]*)(&(amp;)?‌​[\w\?‌​=]*)?/g.test(req.body.youtubeLink)) {
        res.render("index", {
            yt: "https://www.youtube.com/embed/dQw4w9WgXcQ",
            image: "https://i.imgur.com/pLj6IR5.png",
            youtubeLink: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            link:`<h1 style="color: red;"> Invalid YouTube link! </h1>`
        })
        return;
    }
    if (req.files && !req.body.image) req.body.image = await generate(req.files.image);
    if (!req.body.image.startsWith("https://i.imgur.com/")) {
        res.render("index", {
            yt: "https://www.youtube.com/embed/dQw4w9WgXcQ",
            image: "https://i.imgur.com/pLj6IR5.png",
            youtubeLink: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            link:`<h1 style="color: red;"> Invalid image! </h1>`
        })
        return;
    }
    db.insert({
        image: req.body.image,
        youtube: req.body.youtubeLink
    }, (err, doc) => {
        res.render("index", {
            yt: "https://www.youtube.com/embed/dQw4w9WgXcQ",
            image: "https://i.imgur.com/pLj6IR5.png",
            youtubeLink: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            link:`<h1>Link: <a href="http://${req.headers.host}/get?id=${doc._id}">${req.headers.host}/get?id=${doc._id}</a></h1>`
        })
    })
})

app.get('/get', (req, res) => {
    db.findOne({
        _id: req.query.id
    }, function(err, doc) {
        if (!doc) {
            return res.render("index", {
                yt: "https://www.youtube.com/embed/dQw4w9WgXcQ",
                image: "https://i.imgur.com/pLj6IR5.png",
                youtubeLink: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                link:""
            })
        }
        if (!req.get("User-Agent").includes("discord")) return res.redirect(doc.youtube);
        res.render("index", {
            yt: new URLSearchParams(new URL(doc.youtube).search).get("v"),
            image: doc.image,
            youtubeLink: doc.youtube,
            link: ""
        });
    })
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})