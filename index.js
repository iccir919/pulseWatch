var express = require("express");
var app = express();

var PORT = 8000;

app.use(express.static("public"));

app.listen(PORT, () => console.log(`Listening on port ${PORT}!`));
