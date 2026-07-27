/**
 * PROJECT FTTH ENTERPRISE DASHBOARD - CHART.JS INITIALIZER
 * Generates and updates 10 dynamic charts for FAT Port Dashboard:
 * City, Area, FAT, Tikor FAT, Date RFS, MITRA, Action, IDDLE, USED, TOTAL
 */

let chartInstances = {};

document.addEventListener("DOMContentLoaded", () => {
  if (typeof Chart === "undefined") return;

  const dataset = getStoredProjectData();
  initExecutiveCharts(dataset);
});

function initExecutiveCharts(data) {
  const primaryColor = "#0F3D91";
  const accentColor = "#FF7A00";
  const successColor = "#28A745";
  const dangerColor = "#DC3545";
  const warningColor = "#FFC107";
  const infoColor = "#17A2B8";

  // Chart 1: Line Chart - Daily RFS Progress
  createOrUpdateChart("chart-daily-progress", {
    type: "line",
    data: {
      labels: data.slice(0, 7).map(d => d["Date RFS"] || d.Date),
      datasets: [{
        label: "Daily USED Ports Added",
        data: data.slice(0, 7).map(d => d.USED || d.ActualHP),
        borderColor: primaryColor,
        backgroundColor: "rgba(15, 61, 145, 0.1)",
        fill: true,
        tension: 0.4
      }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });

  // Chart 2: Line Chart - Weekly Cumulative USED Ports
  createOrUpdateChart("chart-weekly-progress", {
    type: "line",
    data: {
      labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
      datasets: [{
        label: "Weekly Cumulative USED Ports",
        data: [2939, 5800, 8900, 11757],
        borderColor: accentColor,
        backgroundColor: "rgba(255, 122, 0, 0.15)",
        fill: true,
        tension: 0.3
      }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });

  // Chart 3: Bar Chart - USED Ports per City
  const cityGroup = aggregateBy(data, "City");
  createOrUpdateChart("chart-area-progress", {
    type: "bar",
    data: {
      labels: Object.keys(cityGroup),
      datasets: [{
        label: "USED Ports",
        data: Object.values(cityGroup).map(arr => arr.reduce((sum, item) => sum + parseInt(item.USED || item.ActualHP || 0), 0)),
        backgroundColor: primaryColor,
        borderRadius: 8
      }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });

  // Chart 4: Bar Chart - USED Ports per Area
  const areaGroup = aggregateBy(data, "Area");
  createOrUpdateChart("chart-cluster-progress", {
    type: "bar",
    data: {
      labels: Object.keys(areaGroup).slice(0, 6),
      datasets: [{
        label: "USED Ports",
        data: Object.values(areaGroup).slice(0, 6).map(arr => arr.reduce((sum, item) => sum + parseInt(item.USED || item.ActualHP || 0), 0)),
        backgroundColor: infoColor,
        borderRadius: 8
      }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });

  // Chart 5: Horizontal Bar - Top FAT Port Utilization
  createOrUpdateChart("chart-top-clusters", {
    type: "bar",
    data: {
      labels: data.slice(0, 6).map(d => d.FAT || d.ODP),
      datasets: [{
        label: "Port Utilization %",
        data: data.slice(0, 6).map(d => {
          const tot = parseInt(d.TOTAL) || 16;
          const usd = parseInt(d.USED) || 0;
          return Math.round((usd / tot) * 100);
        }),
        backgroundColor: accentColor,
        borderRadius: 6
      }]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false
    }
  });

  // Chart 6: Pie Chart - Action / Status Distribution
  const actionCounts = countBy(data, "Action");
  createOrUpdateChart("chart-status-pie", {
    type: "pie",
    data: {
      labels: Object.keys(actionCounts),
      datasets: [{
        data: Object.values(actionCounts),
        backgroundColor: [successColor, warningColor, dangerColor, primaryColor]
      }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });

  // Chart 7: Doughnut Chart - MITRA Share
  const mitraGroup = aggregateBy(data, "MITRA");
  createOrUpdateChart("chart-vendor-doughnut", {
    type: "doughnut",
    data: {
      labels: Object.keys(mitraGroup),
      datasets: [{
        data: Object.values(mitraGroup).map(arr => arr.reduce((sum, item) => sum + parseInt(item.USED || item.ActualHP || 0), 0)),
        backgroundColor: [primaryColor, accentColor, successColor, infoColor]
      }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });

  // Chart 8: Radar Chart - MITRA SLA Performance
  createOrUpdateChart("chart-supervisor-radar", {
    type: "radar",
    data: {
      labels: ["RFS Speed", "Port Usage", "Quality", "Tikor Accuracy", "Zero Faults"],
      datasets: [
        {
          label: "PT Telecom Infrastructure",
          data: [92, 88, 95, 94, 90],
          borderColor: primaryColor,
          backgroundColor: "rgba(15, 61, 145, 0.2)"
        },
        {
          label: "PT Fiber Karya",
          data: [89, 94, 91, 96, 92],
          borderColor: accentColor,
          backgroundColor: "rgba(255, 122, 0, 0.2)"
        }
      ]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });

  // Chart 9: Area Chart - Monthly Port Utilization S-Curve
  createOrUpdateChart("chart-achievement-trend", {
    type: "line",
    data: {
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"],
      datasets: [{
        label: "Port Utilization Rate %",
        data: [45, 58, 65, 72, 80, 84, 88],
        borderColor: successColor,
        backgroundColor: "rgba(40, 167, 69, 0.18)",
        fill: true,
        tension: 0.4
      }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });

  // Chart 10: Gauge Chart (Semi Doughnut) - Overall USED vs IDLE Ports
  const totalTarget = data.reduce((s, i) => s + (parseInt(i.TOTAL || i.TargetHP) || 0), 0);
  const totalActual = data.reduce((s, i) => s + (parseInt(i.USED || i.ActualHP) || 0), 0);
  const achievementRate = totalTarget > 0 ? Math.round((totalActual / totalTarget) * 100) : 0;
  const remainingRate = Math.max(0, 100 - achievementRate);

  createOrUpdateChart("chart-overall-gauge", {
    type: "doughnut",
    data: {
      labels: ["USED Ports", "IDLE Ports"],
      datasets: [{
        data: [achievementRate, remainingRate],
        backgroundColor: [successColor, "rgba(200, 200, 200, 0.3)"],
        borderWidth: 0
      }]
    },
    options: {
      rotation: -90,
      circumference: 180,
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      }
    }
  });
}

function createOrUpdateChart(canvasId, config) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  if (chartInstances[canvasId]) {
    chartInstances[canvasId].destroy();
  }

  chartInstances[canvasId] = new Chart(canvas, config);
}

function aggregateBy(array, key) {
  return array.reduce((acc, obj) => {
    const val = obj[key] || "Other";
    acc[val] = acc[val] || [];
    acc[val].push(obj);
    return acc;
  }, {});
}

function countBy(array, key) {
  return array.reduce((acc, obj) => {
    const val = obj[key] || "Other";
    acc[val] = (acc[val] || 0) + 1;
    return acc;
  }, {});
}

function updateExecutiveCharts(filteredData) {
  initExecutiveCharts(filteredData);
}
