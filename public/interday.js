var access_token;
var user_id;

var userHeartRateData;

var startDate;
var endDate;

document.addEventListener("DOMContentLoaded", function() {
  access_token = sessionStorage.getItem("access_token");
  user_id = sessionStorage.getItem("user_id_token");

  if (!access_token && !user_id) {
    window.location.replace("./index.html");
  }

  $("#startDate").datetimepicker({
    format: "L",
    defaultDate: moment().subtract(1, "months").format("L")
  });
  $("#endDate").datetimepicker({
    format: "L",
    defaultDate: moment().format("L")
  });

  $("#startDate").on("change.datetimepicker", function(e) {
    $("#endDate").datetimepicker("minDate", e.date);
  });
  $("#endDate").on("change.datetimepicker", function(e) {
    $("#startDate").datetimepicker("maxDate", e.date);
  });
});

function handleSubmit() {
  startDate = document.getElementById("startDate").value;
  endDate = document.getElementById("endDate").value;

  startDate = formatDate(startDate);
  endDate = formatDate(endDate);

  getUserHeartRateData(startDate, endDate);
}

function formatDate(date) {
  var sections = date.split("/");
  var year = sections.pop();
  sections.unshift(year);

  var result = sections.join("-");

  return result;
}

function getUserHeartRateData(from, to) {
  var header = new Headers();
  header.append("Authorization", "Bearer " + access_token);
  var init = {
    headers: header
  };

  fetch(createFitbitRequest(from, to), init)
    .then(function(heartRateData) {
      return heartRateData.json();
    })
    .then(function(heartRateData) {
      userHeartRateData = heartRateData["activities-heart"];

      exportCSVFile(userHeartRateData);

      var dataWithRestingRate = userHeartRateData.filter(function(dailyData) {
        return dailyData.value.restingHeartRate;
      });
      createInterdayGraph(dataWithRestingRate);
    });
}

function createFitbitRequest(from, to) {
  return (
    "https://api.fitbit.com/1/user/" +
    user_id +
    "/activities/heart/date/" +
    from +
    "/" +
    to +
    ".json"
  );
}

function createInterdayGraph(heartRateData) {
  var xValues = [];
  var yValues = [];

  heartRateData.forEach(function(data) {
    xValues.push(data.dateTime);
    yValues.push(data.value.restingHeartRate);
  });

  xValues = xValues.map(function(value) {
    return moment(value, "YYYY-MM-DD").format("LL");
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

  var exportedFilenmae = "export.csv";

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
    [["Date", "Resting Heart Rate"]].concat(
      data.map(function(d, i) {
        return [d.dateTime, d.value.restingHeartRate];
      })
    )
  );
  return string;
}
