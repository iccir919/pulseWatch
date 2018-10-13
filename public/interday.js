var access_token;
var user_id;

var startDate = moment().subtract(7, "day");
var endDate = moment();

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

  dateLabels = dateLabels.map(date => moment(date).format("ll"));
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

      processData(heartRateData);
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

var restingData = {
  type: "line",
  yAxisID: "y-axis-1",
  label: "Resting heart rate",
  borderColor: window.chartColors[4],
  backgroundColor: window.chartColors[4],
  borderWidth: 3,
  fill: false,
  data: []
};

var zonesDatasets = [];

var comboConfig = {
  type: "bar",
  data: {
    labels: dateLabels,
    datasets: []
  },
  options: {
    maintainAspectRatio: false,
    responsive: true,
    title: {
      display: true,
      text: "Resting Heart Rate and Heart Rate Zones Combo Chart"
    },
    tooltips: {
      callbacks: {
        label: function(tooltipItem, data) {
          var label = data.datasets[tooltipItem.datasetIndex].label || "";

          if (label) {
            label += ": ";
          }
          label += tooltipItem.yLabel;
          if (tooltipItem.datasetIndex === 0) {
            label += " bpm";
          } else {
            label += " minutes";
          }
          return label;
        }
      },
      mode: "index",
      intersect: true
    },
    scales: {
      xAxes: [
        {
          gridLines: {
            display: true,
            drawBorder: true,
            drawOnChartArea: false
          },
          stacked: true
        }
      ],
      yAxes: [
        {
          gridLines: {
            display: true,
            drawBorder: true,
            drawOnChartArea: false
          },
          display: true,
          scaleLabel: {
            display: true,
            labelString: "resting heart rate"
          },
          position: "left",
          id: "y-axis-1"
        },
        {
          stacked: true,
          display: true,
          scaleLabel: {
            display: true,
            labelString: "minutes in heart rate zone"
          },
          position: "right",
          id: "y-axis-2"
        }
      ]
    }
  }
};

function processData(data) {
  console.log(data);
  restingData.data = [];
  zonesDatasets = [];
  dateLabels = [];

  for (var j = 0; j < data[0].value.heartRateZones.length; j++) {
    zonesDatasets.push({
      yAxisID: "y-axis-2",
      type: "bar",
      label: data[0].value.heartRateZones[j].name,
      backgroundColor: window.chartColors[j],
      data: [],
      borderColor: window.chartColors[j],
      borderWidth: 2
    });
  }

  for (var m = 0; m < data.length; m++) {
    restingData.data.push(data[m].value.restingHeartRate);

    for (var k = 0; k < zonesDatasets.length; k++) {
      zonesDatasets[k].data.push({
        x: data[m].dateTime,
        y: data[m].value.heartRateZones[k].minutes
      });
    }

    dateLabels.push(data[m].dateTime);
  }

  dateLabels = dateLabels.map(date => moment(date).format("ll"));
  zonesDatasets.shift();

  window.comboChart.config.data.datasets = [restingData].concat(zonesDatasets);
  window.comboChart.config.data.labels = dateLabels;
  window.comboChart.update();
}

window.onload = function() {
  var comboCtx = document.getElementById("interdayChart").getContext("2d");
  window.comboChart = new Chart(comboCtx, comboConfig);

  getUserHeartRateData(
    startDate.format("YYYY-MM-DD"),
    endDate.format("YYYY-MM-DD")
  );
};
