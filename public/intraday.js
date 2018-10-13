var access_token;
var user_id;
var userHeartRateData;
var date;
var startTime;
var endTime;
var timeRange;
var detailLevel;

var ctx = document.getElementById("intradayChart").getContext("2d");
var chartConfig = {
  type: "bar",
  data: {
    labels: [],
    datasets: [
      {
        lineTension: 1,
        backgroundColor: "transparent",
        borderColor: "#007bff",
        borderWidth: 4,
        pointBackgroundColor: "#007bff",
        pointRadius: 0,
        fill: false,
        data: [],
        spanGaps: false
      }
    ]
  },
  options: {
    maintainAspectRatio: false,

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
      mode: "index",
      intersect: false,
      callbacks: {
        label: function(tooltipItem, data) {
          var label = data.datasets[tooltipItem.datasetIndex].label || "";

          if (label) {
            label += ": ";
          }
          label += tooltipItem.yLabel + " bpm";
          return label;
        }
      }
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
    $('input[name="date"]').daterangepicker({
      singleDatePicker: true,
      showDropdowns: true,
      maxDate: new Date()
    });
  });

  window.intradayChart = new Chart(ctx, chartConfig);
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
  var xValues = [];
  var yValues = [];

  heartRateData.forEach(function(data, idx, arr) {
    if (detailLevel === "1min") {
      if (
        idx !== arr.length - 1 &&
        moment(data.time, "HH-mm-ss")
          .add(1, "m")
          .isBefore(moment(arr[idx + 1].time, "HH-mm-ss"))
      ) {
        var currentTime = moment(data.time, "HH-mm-ss");
        while (currentTime.isBefore(moment(arr[idx + 1].time, "HH-mm-ss"))) {
          xValues.push(currentTime.format("LT"));
          yValues.push(null);
          currentTime = currentTime.add(1, "m");
        }
      } else {
        xValues.push(moment(data.time, "HH-mm-ss").format("LT"));
        yValues.push(data.value);
      }
    } else {
      if (
        idx !== arr.length - 1 &&
        moment(data.time, "HH-mm-ss")
          .add(18, "s")
          .isBefore(moment(arr[idx + 1].time, "HH-mm-ss"))
      ) {
        var currentTime = moment(data.time, "HH-mm-ss");
        while (currentTime.isBefore(moment(arr[idx + 1].time, "HH-mm-ss"))) {
          xValues.push(currentTime.format("LTS"));
          yValues.push(null);
          currentTime = currentTime.add(18, "s");
        }
      } else {
        xValues.push(moment(data.time, "HH-mm-ss").format("LTS"));
        yValues.push(data.value);
      }
    }
  });

  window.intradayChart.config.data.labels = xValues;
  window.intradayChart.config.data.datasets[0].data = yValues;

  window.intradayChart.update();
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
