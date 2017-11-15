var user_id;
var access_token;

$(function () {
    access_token = getAccessToken();
    user_id = getUserId();
    
    if(access_token && user_id) {
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
    }
});

function handleDateFormSubmit(){
    var startDate = document.getElementById("start_date").value;
    var endDate = document.getElementById("end_date").value;

    getUserHeartRateData(startDate, endDate);
}

function getUserHeartRateData(startDate, endDate){
    var header = new Headers()
    header.append("Authorization", "Bearer " + access_token);
    var init = {
        headers: header
    }

    fetch(createFitbitRequest(startDate, endDate), init).then(function(heartRateData) {
        return heartRateData.json();
      }).then(function(heartRateData) {
          heartRateData = heartRateData["activities-heart"];
          
          var dataWithRestingRate = returnDataWithRestingRate(heartRateData);

          graphFitbitData(dataWithRestingRate);
      });
}

function returnDataWithRestingRate(heartRateData){
    return heartRateData.filter(function(dailyData){
        return dailyData.value.restingHeartRate
    })
}

function graphFitbitData(heartRateDataArray) {
    var xValues = [];
    var yValues = [];

    heartRateDataArray.forEach(function(data){
        xValues.push(data.dateTime);
        yValues.push(data.value.restingHeartRate);
    })

    var data = [
        {
            x: xValues,
            y: yValues,
            type: 'scatter',
            line: {color: '#17BECF'}
        }
    ];

    Plotly.newPlot('chart', data);
}

function createFitbitRequest(startDate, endDate) {
        return "https://api.fitbit.com/1/user/" + user_id + "/activities/heart/date/"
        + startDate + "/" + endDate + ".json";
}

function getParameterByName(name) {
    var match = RegExp('[#&]' + name + '=([^&]*)').exec(window.location.hash);
    return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
}
  
function getAccessToken() {
    return getParameterByName('access_token');
}
  
function getUserId() {
    return getParameterByName('user_id');
}

