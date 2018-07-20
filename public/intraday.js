var access_token;
var user_id;

var userHeartRateData;

var date;

document.addEventListener("DOMContentLoaded", function() {
  access_token = sessionStorage.getItem("access_token");
  user_id = sessionStorage.getItem("user_id_token");

  if (!access_token && !user_id) {
    window.location.replace("./index.html");
  }

  $(function() {
    $("#singledaypicker").datetimepicker({
      format: "L"
    });
  });
});

function handleSubmit() {
  date = document.getElementById("singledayinput").value;
  date = formatDate(date);

  getUserHeartRateData(date);
}

function formatDate(day) {
  var sections = day.split("/");
  var year = sections.pop();
  sections.unshift(year);

  var result = sections.join("-");

  return result;
}

function getUserHeartRateData(day) {
  var header = new Headers();
  header.append("Authorization", "Bearer " + access_token);
  var init = {
    headers: header
  };

  fetch(createFitbitRequest(day), init)
    .then(function(heartRateData) {
      return heartRateData.json();
    })
    .then(function(heartRateData) {
      userHeartRateData = heartRateData["activities-heart-intraday"].dataset;

      exportCSVFile(userHeartRateData);

      createInterdayGraph(userHeartRateData);
    });
}

function createFitbitRequest(day) {
  return (
    "https://api.fitbit.com/1/user/" +
    user_id +
    "/activities/heart/date/" +
    day +
    "/1d/1min.json"
  );
}

function createInterdayGraph(heartRateData) {
  console.log(heartRateData);
  var xValues = [];
  var yValues = [];

  heartRateData.forEach(function(data) {
    xValues.push(data.time);
    yValues.push(data.value);
  });

  xValues = xValues.map(function(value) {
    return moment(value, "HH-mm-ss").format("LT");
  });

  var ctx = document.getElementById("myChart");
  var myChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: xValues,
      datasets: [
        {
          data: yValues,
          lineTension: 0,
          backgroundColor: "transparent",
          borderColor: "#007bff",
          borderWidth: 4,
          pointBackgroundColor: "#007bff"
        }
      ]
    },
    options: {
      scales: {
        yAxes: [
          {
            display: true,
            scaleLabel: {
              display: true,
              labelString: "beats per minute"
            },
            ticks: {
              beginAtZero: false
            }
          }
        ]
      },
      legend: {
        display: false
      }
    }
  });
}
function exportCSVFile(array) {
  var csv = convertToCSV(array);

  var exportedFilenmae = date + ".csv";

  var blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });

  var link = document.getElementById("download-link");
  if (link.download !== undefined) {
    // feature detection
    // Browsers that support HTML5 download attribute
    var url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", exportedFilenmae);
    link.style.display = "block";
  }
}

function convertToCSV(data) {
  var string = d3.csvFormatRows(
    [["Time", "Heart Rate"]].concat(
      data.map(function(d, i) {
        return [d.time, d.value];
      })
    )
  );
  return string;
}
