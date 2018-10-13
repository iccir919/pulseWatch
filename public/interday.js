var access_token;
var user_id;

var startDate = moment().subtract(7, "day");
var endDate = moment();

var restingData = [];
var dateLabels = [];

window.chartColors = [
  "rgb(75, 192, 192)",
  "rgb(255, 205, 86)",
  "rgb(255, 159, 64)",
  "rgb(255, 99, 132)",
  "rgb(54, 162, 235)",
  "rgb(153, 102, 255)",
  "rgb(201, 203, 207)"
];

for (var i = 7; i >= 0; i--) {
  dateLabels.push(
    moment()
      .subtract(i, "day")
      .format("MM-DD-YYYY")
  );
}

document.addEventListener("DOMContentLoaded", function() {
  access_token = sessionStorage.getItem("access_token");
  user_id = sessionStorage.getItem("user_id_token");

  if (!access_token && !user_id) {
    window.location.replace("./index.html");
  }

  $(function() {
    $('input[name="daterange"]').daterangepicker(
      {
        startDate: startDate,
        endDate: endDate,
        maxDate: new Date()
      },
      function(start, end, label) {
        getUserHeartRateData(
          end.format("YYYY-MM-DD"),
          start.format("YYYY-MM-DD")
        );
      }
    );
  });
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
      heartRateData = heartRateData["activities-heart"];

      exportCSVFile(heartRateData);

      processDataForCharts(heartRateData);
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

var restingConfig = {
  type: "line",
  data: {
    labels: dateLabels,
    datasets: [
      {
        label: "resting heart rate",
        backgroundColor: window.chartColors[3],
        borderColor: window.chartColors[3],
        data: [],
        fill: false
      }
    ]
  },
  options: {
    maintainAspectRatio: false,
    responsive: true,
    title: {
      display: true,
      text: "Chart for resting heart rate"
    },
    tooltips: {
      mode: "index",
      intersect: false
    },
    hover: {
      mode: "nearest",
      intersect: true
    },
    scales: {
      xAxes: [
        {
          display: true
        }
      ],
      yAxes: [
        {
          display: true,
          scaleLabel: {
            display: true,
            labelString: "resting heart rate"
          }
        }
      ]
    }
  }
};

var zonesData = {
  labels: dateLabels,
  datasets: []
};

var zonesConfig = {
  type: "bar",
  data: zonesData,
  options: {
    maintainAspectRatio: false,
    title: {
      display: true,
      text: "Chart for heart rate zones"
    },
    tooltips: {
      mode: "index",
      intersect: false
    },
    responsive: true,
    scales: {
      xAxes: [
        {
          stacked: true
        }
      ],
      yAxes: [
        {
          stacked: true,
          scaleLabel: {
            display: true,
            labelString: "minutes in heart rate zone"
          }
        }
      ]
    }
  }
};

function processDataForCharts(data) {
  var start = moment(data[0].dateTime, "YYYY-MM-DD");
  var end = moment(data[data.length - 1].dateTime, "YYYY-MM-DD");
  var current = start;
  var newDateLabels = [];
  var newRestingData = [];

  while (current.isSameOrBefore(end)) {
    newDateLabels.push(current.format("MM-DD-YYYY"));
    current = current.add(1, "day");
  }

  var newZonesData = {
    labels: newDateLabels,
    datasets: []
  };

  if (data[0].value.customHeartRateZones.length > 0) {
  } else {
    for (var j = 0; j < data[0].value.heartRateZones.length; j++) {
      newZonesData.datasets.push({
        label: data[0].value.heartRateZones[j].name,
        backgroundColor: window.chartColors[j],
        data: []
      });
    }
  }

  for (var m = 0; m < data.length; m++) {
    newRestingData.push({
      x: moment(data[m].dateTime).format("MM-DD-YYYY"),
      y: data[m].value.restingHeartRate
    });

    if (data[0].value.customHeartRateZones.length > 0) {
    } else {
      for (var j = 0; j < data[0].value.heartRateZones.length; j++) {
        newZonesData.datasets[j].data.push({
          x: data[m].timeDate,
          y: data[m].value.heartRateZones[j].minutes
        });
      }
    }
  }

  var showingDatasets = newZonesData.datasets.splice(1);
  newZonesData.datasets = showingDatasets;

  dateLabels = newDateLabels;
  restingData = newRestingData;

  window.restingChart.config.data.labels = dateLabels;
  window.restingChart.config.data.datasets[0].data = restingData;
  window.restingChart.update();

  window.zonesChart.config.data.labels = dateLabels;
  window.zonesChart.config.data = newZonesData;
  window.zonesChart.update();
}

window.onload = function() {
  var restingCtx = document.getElementById("restingChart").getContext("2d");
  window.restingChart = new Chart(restingCtx, restingConfig);

  var zonesCtx = document.getElementById("zonesChart").getContext("2d");
  window.zonesChart = new Chart(zonesCtx, zonesConfig);

  getUserHeartRateData(
    startDate.format("YYYY-MM-DD"),
    endDate.format("YYYY-MM-DD")
  );
};
