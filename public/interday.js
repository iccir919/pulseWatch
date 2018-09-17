var access_token;
var user_id;

var userHeartRateData;

var startDate;
var endDate;

var ctx = document.getElementById("myChart");
var config = {
  type: "line",
  data: {
    labels: [],
    datasets: [
      {
        data: [],
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
};

document.addEventListener("DOMContentLoaded", function() {
  access_token = sessionStorage.getItem("access_token");
  user_id = sessionStorage.getItem("user_id_token");

  if (!access_token && !user_id) {
    window.location.replace("./index.html");
  }

  $(function() {
    $('input[name="daterange"]').daterangepicker(
      {
        maxDate: new Date()
      },
      function(start, end, label) {
        startDate = start.format("YYYY-MM-DD");
        endDate = end.format("YYYY-MM-DD");
        getUserHeartRateData(
          end.format("YYYY-MM-DD"),
          start.format("YYYY-MM-DD")
        );
      }
    );
  });

  window.myLine = new Chart(ctx, config);
});

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

  window.myLine.config.data.labels = xValues;
  window.myLine.config.data.datasets[0].data = yValues;

  window.myLine.update();
}

function exportCSVFile(array) {
  var csv = convertToCSV(array);

  var exportedFilenmae = startDate + "--" + endDate;

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
