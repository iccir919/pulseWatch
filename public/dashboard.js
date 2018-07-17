window.onload = function() {
  var access_token = getAccessToken();

  // Optional: an ID Token will be returned by Auth0
  // if your response_type argument contained id_token
  var user_id_token = getIdToken();

  sessionStorage.setItem("access_token", access_token);
  sessionStorage.setItem("user_id_token", user_id_token);
};

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
