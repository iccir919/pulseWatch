window.onload = function() {
  var access_token = sessionStorage.getItem("access_token");
  var user_id_token = sessionStorage.getItem("user_id_token");

  console.log("access", access_token);
  console.log("user_id", user_id_token);
};
