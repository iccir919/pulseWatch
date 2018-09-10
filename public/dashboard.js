var userName;

var user_id;
var access_token;

window.onload = function() {
  access_token = getAccessToken();

  // Optional: an ID Token will be returned by Auth0
  // if your response_type argument contained id_token
  user_id = getIdToken();

  if (access_token && user_id) {
    sessionStorage.setItem("access_token", access_token);
    sessionStorage.setItem("user_id_token", user_id);
  } else {
    access_token = sessionStorage.getItem("access_token");
    user_id = sessionStorage.getItem("user_id_token");
  }

  if (access_token && user_id) {
    getUserName();
  } else {
    window.location.replace("./index.html");
  }
};

function getUserName() {
  var header = new Headers();
  header.append("Authorization", "Bearer " + access_token);
  var init = {
    headers: header
  };

  fetch(createUsernameRequest(), init)
    .then(function(profileData) {
      return profileData.json();
    })
    .then(function(profileData) {
      $("#welcome").append(", " + profileData.user.displayName);
    });
}

function createUsernameRequest() {
  return "https://api.fitbit.com/1/user/" + user_id + "/profile.json";
}

function getParameterByName(name) {
  var match = RegExp("[#&]" + name + "=([^&]*)").exec(window.location.hash);
  return match && decodeURIComponent(match[1].replace(/\+/g, " "));
}

function getAccessToken() {
  return getParameterByName("access_token");
}

function getIdToken() {
  return getParameterByName("user_id");
}
