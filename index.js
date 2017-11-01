/*
* An annoted demo of how to access the FitBit OAuth 2.0 library 
* using Node.js, Redis and Express.js
*
* See README
* 
* Author: Robin Mayfield <robin@degu.io>
*
*/

// Get the Environament Variables for accessing later
var dotenv  = require('dotenv'); dotenv.load();
// JS promise lib
var rp      = require('request-promise');

// REDIS
/*
* Using Redis in this example for the easy storage/retrieval of user objects. 
*/
var Redis = require("redis");
var redis = Redis.createClient(process.env.REDIS_URL);

// FITBIT API CLIENT DETAILS
var clientId        = process.env.FITBIT_CLIENT_ID;
var clientSecret    = process.env.FITBIT_API_SECRET;
// 
var client_encoded  = new Buffer(clientId + ':' + clientSecret).toString('base64');
var redirect_uri    = 'http://localhost:3000/auth/fitbit/callback';

// EXPRESS JS - web server with simple DSL 
var express = require('express');
var bodyParser = require('body-parser')
var app = express();
app.use(bodyParser.json());

// LOGIN TO FITBIT
// https://dev.fitbit.com/docs/oauth2
app.get('/auth', function (req, res, next) {
  // redirects user to the FitBit authorisation page
  res.redirect(authUrl());
});

// FITBIT CALLBACK 
app.get('/auth/fitbit/callback', function (req, res, next) {
  var code = req.query.code;

  // GET ACCESS TOKEN
  // https://dev.fitbit.com/docs/oauth2/#access-token-request
  var op = {
    uri: 'https://api.fitbit.com/oauth2/token',
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + client_encoded,
    },
    form: {
      client_id: clientId,
      grant_type: 'authorization_code',
      redirect_uri: redirect_uri,
      code: code
    }
  };

  rp(op)
    .then(function (tokens) {
      // Debug to view the 
      console.log(JSON.stringify(tokens));

      // SAMPLE TOKENS
      // {\"access_token\":\"asdfasdfasdfasdfasdfasdfasdfasdfasdf\",
      // \"expires_in\":3600,\"refresh_token\":\"asdfasdfasdfasdfasdf\",
      // \"scope\":\"activity sleep nutrition weight heartrate location social\",
      // \"token_type\":\"Bearer\",\"user_id\":\"234TY3\"}"

      // SAVE TOKENS FOR LATER USE
      var user_id = JSON.parse(tokens).user_id;
      // add the user_id to a list
      redis.sadd('fitbit_users', user_id);
      // save the tokens to a hash
      redis.hset('fitbit_tokens', user_id, tokens);

      // redirect to the user page
      res.redirect('/user/'+ user_id);

    })
    .catch(function (err) {
      res.status(500).send({error: err});
    });


});

// Show the User's food log
// https://dev.fitbit.com/docs/food-logging/#get-food-logs
app.get('/user/:user_id', function (req, res) {
  
  var user_id = req.params.user_id;
  console.log(user_id);

  // NOTE: Set this to the date you wish to view
  var log_date = "2015-12-09";

  // get the token from the redis store hash
  redis.hget('fitbit_tokens', user_id, function (err, tokens) {
    if (err)
      return res.status(500).send({error: err});

    // get the access token 
    var access_token = JSON.parse(tokens).access_token;

    // Set the request header
    // see - https://dev.fitbit.com/docs/oauth2/#making-requests
    var op = {
      uri: 'https://api.fitbit.com/1/user/' + user_id + '/foods/log/date/' + log_date + '.json',
      headers: {
        'Authorization': 'Bearer ' + access_token,
      }
    };

    rp(op)
      .then(function (food_log) {
        // display the food log
        res.send(food_log);
      })
      .catch(function (err) {
        res.status(500).send({error: err});
      });
    
  })
});



/*
* Generates an Authorisation URL as outlined here: https://dev.fitbit.com/docs/oauth2/#authorization-page
*/
var authUrl = function () {
  
  // SAMPLE Authorisation URL
  // https://www.fitbit.com/oauth2/authorize?
  // response_type=code
  // &client_id=DF32R
  // &redirect_uri=http%3A%2F%2Fexample.com%2Fcallback
  // &scope=activity%20nutrition%20heartrate%20location%20nutrition%20profile%20settings%20sleep%20social%20weight

  var url = 'https://www.fitbit.com/oauth2/authorize?response_type=code&client_id='
    + clientId + '&redirect_uri=' + encodeURI(redirect_uri) 
    + '&scope=' + encodeURI('activity heartrate location nutrition sleep social weight');

  // Debug: display the generated url
  console.log('URL: %s', url);
  
  return url;

}

app.listen(3000);