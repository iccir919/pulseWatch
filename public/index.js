var user_id;
var access_token;
var userHeartRateData;
var start_date;
var end_date;


$(function () {
    access_token = getAccessToken();
    user_id = getUserId();
    
    if(access_token && user_id) {
        // Authorization was successful. Hide authorization prompts and show
        // content that should be visible after authorization succeeds.
        $('.pre-auth').addClass('hidden');
        $('.post-auth').removeClass('hidden');

    } else {
      // Authorization was unsuccessful. Show content related to prompting for
      // authorization and hide content that should be visible if authorization
      // succeeds.
      $('.post-auth').addClass('hidden');
      $('.pre-auth').removeClass('hidden');    
    }
});

function handleDateFormSubmit(){
    getUserHeartRateData(start_date, end_date);
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

    var link = document.getElementById("download-link");
    if (link.download !== undefined) { // feature detection
        // Browsers that support HTML5 download attribute
        var url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", exportedFilenmae);
        $("#download-section").removeClass('hidden');
        
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

    $('#chart-section').removeClass("hidden");  
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

$(function() {
    $('#date-range-input').daterangepicker({
        "ranges": {
            "Today": [
                "2017-11-26T16:14:24.358Z",
                "2017-11-26T16:14:24.358Z"
            ],
            "Yesterday": [
                "2017-11-25T16:14:24.358Z",
                "2017-11-25T16:14:24.358Z"
            ],
            "Last 7 Days": [
                "2017-11-20T16:14:24.358Z",
                "2017-11-26T16:14:24.358Z"
            ],
            "Last 30 Days": [
                "2017-10-28T15:14:24.358Z",
                "2017-11-26T16:14:24.358Z"
            ],
            "This Month": [
                "2017-11-01T07:00:00.000Z",
                "2017-12-01T07:59:59.999Z"
            ],
            "Last Month": [
                "2017-10-01T07:00:00.000Z",
                "2017-11-01T06:59:59.999Z"
            ]
        },
        "startDate": "11/20/2017",
        "endDate": "11/26/2017",
        "opens": "center",
        "buttonClasses": "btn btn-md",
        "applyClass": "btn-primary",
        "cancelClass": "btn-warning"
    }, function(start, end, label) {
        start_date = start.format('YYYY-MM-DD');
        end_date = end.format('YYYY-MM-DD')
    });
});

