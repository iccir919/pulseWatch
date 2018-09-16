var access_token;
var user_id;
var userHeartRateData;
var date;
var startTime;
var endTime;
var timeRange;
var detailLevel;

document.addEventListener("DOMContentLoaded", function() {
  access_token = sessionStorage.getItem("access_token");
  user_id = sessionStorage.getItem("user_id_token");

  if (!access_token && !user_id) {
    window.location.replace("./index.html");
  }

  $(function() {
    $('input[name="date"]').daterangepicker({
      singleDatePicker: true,
      showDropdowns: true,
      maxDate: new Date()
    });
  });
});

function handleSubmit() {
  date = $('input[name="date"]').val();
  date = formatDate(date);

  startTime = document.getElementById("startTime").value;
  endTime = document.getElementById("endTime").value;

  if (startTime) {
    timeRange = "/time/" + startTime;
    if (endTime) {
      timeRange += "/" + endTime;
    } else {
      timeRange += "/23:59";
    }
  } else {
    timeRange = "";
  }

  if (startTime && endTime) {
    if (moment(startTime, "HH:mm").isBefore(moment(endTime, "HH:mm"))) {
      document.getElementById("startTime").className = "form-control";
      document.getElementById("endTime").className = "form-control";
      getUserHeartRateData(date);
    } else {
      document.getElementById("startTime").className =
        "form-control is-invalid";
      document.getElementById("endTime").className = "form-control is-invalid";
    }
  } else {
    getUserHeartRateData(date);
  }
}

function formatDate(day) {
  var sections = day.split("/");
  var year = sections.pop();
  sections.unshift(year);

  var result = sections.join("-");

  return result;
}

function getUserHeartRateData(date) {
  var header = new Headers();
  header.append("Authorization", "Bearer " + access_token);
  var init = {
    headers: header
  };

  fetch(createFitbitRequest(date), init)
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
  if ($("#perMinute").is(":checked")) {
    detailLevel = "1min";
  } else {
    detailLevel = "1sec";
  }

  return (
    "https://api.fitbit.com/1/user/" +
    user_id +
    "/activities/heart/date/" +
    day +
    "/1d/" +
    detailLevel +
    timeRange +
    ".json"
  );
}

var customTooltips = function(tooltip) {
  $(this._chart.canvas).css("cursor", "pointer");

  var positionY = this._chart.canvas.offsetTop;
  var positionX = this._chart.canvas.offsetLeft;

  $(".chartjs-tooltip").css({
    opacity: 0
  });

  if (!tooltip || !tooltip.opacity) {
    return;
  }

  if (tooltip.dataPoints.length > 0) {
    tooltip.dataPoints.forEach(function(dataPoint) {
      var content = dataPoint.yLabel + " bpm <br> at " + dataPoint.xLabel;
      var $tooltip = $("#tooltip-" + dataPoint.datasetIndex);

      $tooltip.html(content);
      $tooltip.css({
        opacity: 1,
        top: 25 + positionY + dataPoint.y + "px",
        left: positionX + dataPoint.x + "px"
      });
    });
  }
};

function createInterdayGraph(heartRateData) {
  console.log(heartRateData);
  var xValues = [];
  var yValues = [];

  heartRateData.forEach(function(data) {
    xValues.push(data.time);
    yValues.push(data.value);
  });

  xValues = xValues.map(function(value) {
    if ($("#perMinute").is(":checked")) {
      return moment(value, "HH-mm-ss").format("LT");
    } else {
      return moment(value, "HH-mm-ss").format("LTS");
    }
  });

  var ctx = document.getElementById("myChart");
  var chartConfig = {
    type: "bar",
    data: {
      labels: xValues,
      datasets: [
        {
          data: yValues,
          lineTension: 1,
          backgroundColor: "transparent",
          borderColor: "#007bff",
          borderWidth: 4,
          pointBackgroundColor: "#007bff",
          pointRadius: 0
        }
      ]
    },
    options: {
      scales: {
        yAxes: [
          {
            scaleLabel: {
              display: true,
              labelString: "beats per minute"
            },
            ticks: {
              beginAtZero: false
            }
          }
        ],
        xAxes: [
          {
            scaleLabel: {
              display: true,
              labelString: "time"
            },
            ticks: {
              beginAtZero: false
            }
          }
        ]
      },
      legend: {
        display: false
      },
      tooltips: {
        enabled: false,
        mode: "index",
        intersect: false,
        custom: customTooltips
      }
    }
  };
  var myChart = new Chart(ctx, chartConfig);
  myChart.update(chartConfig);
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
