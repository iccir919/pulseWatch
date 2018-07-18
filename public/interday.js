window.onload = function() {
  var access_token = sessionStorage.getItem("access_token");
  var user_id_token = sessionStorage.getItem("user_id_token");
};

function createInterdayGraph(heartRateData) {
  var xValues = [];
  var yValues = [];

  heartRateData.forEach(function(data) {
    xValues.push(data.dateTime);
    yValues.push(data.value.restingHeartRate);
  });

  var ctx = document.getElementById("myChart");
  var myChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday"
      ],
      datasets: [
        {
          data: [15339, 21345, 18483, 24003, 23489, 24092, 12034],
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

function graphFitbitData(heartRateDataArray) {
  var xValues = [];
  var yValues = [];

  heartRateDataArray.forEach(function(data) {
    xValues.push(data.dateTime);
    yValues.push(data.value.restingHeartRate);
  });

  var config = [
    {
      x: xValues,
      y: yValues,
      type: "scatter",
      line: { color: "#17BECF" },
      name: "Resting Heart Rate"
    }
  ];
  Plotly.newPlot("chart", config);

  (function() {
    var d3 = Plotly.d3;
    var WIDTH_IN_PERCENT_OF_PARENT = 100,
      HEIGHT_IN_PERCENT_OF_PARENT = 90;

    var gd3 = d3.selectAll(".responsive-plot").style({
      width: WIDTH_IN_PERCENT_OF_PARENT + "%",
      "margin-left": (100 - WIDTH_IN_PERCENT_OF_PARENT) / 2 + "%",

      height: HEIGHT_IN_PERCENT_OF_PARENT + "vh",
      "margin-top": (100 - HEIGHT_IN_PERCENT_OF_PARENT) / 2 + "vh"
    });

    var nodes_to_resize = gd3[0]; //not sure why but the goods are within a nested array
    window.onresize = function() {
      for (var i = 0; i < nodes_to_resize.length; i++) {
        Plotly.Plots.resize(nodes_to_resize[i]);
      }
    };
    Plotly.Plots.resize(nodes_to_resize[0]);
  })();

  $("#chart-section").removeClass("hidden");
}
