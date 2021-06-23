require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const mongoose = require("mongoose");
const dns = require("dns");
const validUrl = require("valid-url");

// Basic Configuration
const port = process.env.PORT || 3000;
// Connecting to and setting up DB
const uri = process.env.MONGO_URI;

const connect = mongoose.connect(process.env.MONGO_BD, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () {
  console.log("we're connected!");
});

const urlSchema = new mongoose.Schema({
  original_url: {
    type: String,
  },
  short_url: {
    type: Number,
  },
});

const urlModel = mongoose.model("Link", urlSchema);

app.use(cors());
// parse form data
app.use(express.urlencoded({ extended: false }));
// parse json
app.use(express.json());
// Accessing/ using static folder
app.use("/public", express.static(`${process.cwd()}/public`));

// Short url var

var nm = 0;

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});

app.post("/api/shorturl", async (req, res) => {
  if (!validUrl.isWebUri(req.body.url)) {
    res.json({ error: "invalid URL" });
  } else {
    try {
      const link = await urlModel.create({ original_url: req.body.url, short_url: (nm += 1) });
      res.status(201).json({ original_url: req.body.url, short_url: nm });
    } catch (error) {
      return res.status(500).json({ error: error });
    }
  }
});

app.get("/api/shorturl/:short_url?", async (req, res) => {
  try {
    const { short_url } = req.params;
    const link = await urlModel.findOne({ short_url });
    if (!link) {
      return res.status(404).json({ msg: `No link with short_url: ${short_url}` });
    }
    // res.status(200).json(link);
    res.redirect(link.original_url);
  } catch (error) {
    res.status(500).json({ msg: error });
  }
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
