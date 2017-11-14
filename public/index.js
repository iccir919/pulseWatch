(function() {

    window.onJSClientLoad = function() {
        window.setTimeout(checkAuth, 1);
    };

    function checkAuth() {
          handleAuthResult(false);
    }

    // Handle the result of a gapi.auth.authorize() call.
    function handleAuthResult(param) {
        if (param) {
            // Authorization was successful. Hide authorization prompts and show
            // content that should be visible after authorization succeeds.
            $('.pre-auth').hide();
            $('.post-auth').show();


        } else {
            // Authorization was unsuccessful. Show content related to prompting for
            // authorization and hide content that should be visible if authorization
            // succeeds.
            $('.post-auth').hide();
            $('.pre-auth').show();

            // Make the #login-link clickable. Attempt a non-immediate OAuth 2.0
            // client flow. The current function is called when that flow completes.
        }
    }

    // This helper method displays a message on the page.
    function displayMessage(message) {
        $('#message').text(message).show();
    }

    // This helper method hides a previously displayed message on the page.
    function hideMessage() {
        $('#message').hide();
    }
 

}());