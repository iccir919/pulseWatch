var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var cors = require('cors');

var Fitbit = require('fitbit-node');
var client = new Fitbit("22CJTT", "9f0e34b58b1d10fa617db34f511af6db");
var redirect_uri = "http://localhost:3000/fitbit_oauth_callback";
var scope = "heartrate profile";

app.use(bodyParser.json());
app.use(express.static('public'));
app.use(cors());

app.get('/fitbit', function (req, res) {
    res.redirect(client.getAuthorizeUrl(scope, redirect_uri));
});

app.get('/fitbit_oauth_callback', function (req, res) {
   client.getAccessToken(req.query.code, redirect_uri).then(function(result){
       client.get('/activities/heart/date/today/1m.json', result.access_token).then(function(heartRate){
       	res.send(heartRate);
       });
   }).catch(function (error) {
        res.redirect('/fitbit');
    });
});

app.listen(3000, function(err){
    console.log("Running on port 3000");
})