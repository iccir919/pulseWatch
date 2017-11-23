var user_id;
var access_token;
var userHeartRateData;;

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
          userHeartRateData = heartRateData["activities-heart"];

          exportCSVFile(userHeartRateData);

          var dataWithRestingRate = returnDataWithRestingRate(userHeartRateData);

          graphFitbitData(dataWithRestingRate);
      });
}

function convertToCSV(array) {
    var str = 'Date, Out of Range Calories Out, Out of Range Max, Out of Range Min, Out of Range Minutes,' +
    'Fat Burn Calories Out, Fat Burn Max, Fat Burn Min, Fat Burn Minutes,' + 
    'Cardio Calories Out, Cardio Max, Cardio Min, Cardio Minutes,' + 
    'Peak Calories Out, Peak Max, Peak Min, Peak Minutes, Resting Heart Rate' + '\r\n';

    for (var i = 0; i < array.length; i++) {
        var line = '';

        line += array[i].dateTime;
        line += ',';

        array[i].value.heartRateZones.forEach(function(zone){
            for(var dataItem in zone){
                if(dataItem !== "name"){
                    line += zone[dataItem];
                    line += ',';
                }
            }
        })
        
        line += array[i].value.restingHeartRate;

        str += line + '\r\n';
    }

    return str;
}



function exportCSVFile(array) {

    var csv = this.convertToCSV(array);

    var exportedFilenmae = 'export.csv';

    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

    var link = document.createElement("a");
    link.innerHTML = "Download"
    if (link.download !== undefined) { // feature detection
        // Browsers that support HTML5 download attribute
        var url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", exportedFilenmae);
        document.body.appendChild(link);
    }
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

