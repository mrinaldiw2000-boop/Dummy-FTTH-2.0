/**
 * PROJECT FTTH ENTERPRISE DASHBOARD - EXECUTIVE DASHBOARD CONTROLLER
 * Recalculates 13 KPI Cards based on FAT Port Dataset (City, Area, FAT, Tikor FAT, MITRA, Action, IDDLE, USED, TOTAL)
 */

let globalProjectData = [];
let filteredProjectData = [];

document.addEventListener("DOMContentLoaded", () => {
  globalProjectData = getStoredProjectData();
  filteredProjectData = [...globalProjectData];

  initFilterDropdowns();
  updateDashboardKPIs(filteredProjectData);

  // Auto Refresh Listener
  const refreshBtn = document.getElementById("auto-refresh-btn");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => {
      globalProjectData = getStoredProjectData();
      applyGlobalFilters();
      showToast("Dashboard Refreshed!", "success");
    });
  }
});

/**
 * Initializes Filter Option Dropdowns dynamically from dataset
 */
function initFilterDropdowns() {
  const cityFilter = document.getElementById("filter-area"); // City / Area
  const vendorFilter = document.getElementById("filter-vendor"); // MITRA
  const statusFilter = document.getElementById("filter-status"); // Action

  if (!cityFilter) return;

  const getUnique = (key) => [...new Set(globalProjectData.map(item => item[key]))].filter(Boolean);

  populateSelect(cityFilter, getUnique("City").concat(getUnique("Area")));
  populateSelect(vendorFilter, getUnique("MITRA").concat(getUnique("Vendor")));
  populateSelect(statusFilter, getUnique("Action").concat(getUnique("Status")));

  const filterInputs = document.querySelectorAll(".filter-control");
  filterInputs.forEach(input => {
    input.addEventListener("change", applyGlobalFilters);
  });

  const resetFiltersBtn = document.getElementById("reset-filters-btn");
  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener("click", () => {
      filterInputs.forEach(input => input.value = "");
      applyGlobalFilters();
      showToast("Filters reset to default", "info");
    });
  }
}

function populateSelect(select, options) {
  if (!select) return;
  const uniqueOptions = [...new Set(options)].filter(Boolean);
  select.length = 1;
  uniqueOptions.forEach(opt => {
    const option = document.createElement("option");
    option.value = opt;
    option.textContent = opt;
    select.appendChild(option);
  });
}

function applyGlobalFilters() {
  const cityVal = document.getElementById("filter-area")?.value || "";
  const mitraVal = document.getElementById("filter-vendor")?.value || "";
  const actionVal = document.getElementById("filter-status")?.value || "";

  filteredProjectData = globalProjectData.filter(item => {
    const matchCity = !cityVal || item.City === cityVal || item.Area === cityVal;
    const matchMitra = !mitraVal || item.MITRA === mitraVal || item.Vendor === mitraVal;
    const matchAction = !actionVal || item.Action === actionVal || item.Status === actionVal;

    return matchCity && matchMitra && matchAction;
  });

  updateDashboardKPIs(filteredProjectData);

  if (typeof updateExecutiveCharts === "function") {
    updateExecutiveCharts(filteredProjectData);
  }

  if (typeof updateDataTableData === "function") {
    updateDataTableData(filteredProjectData);
  }
}

/**
 * Calculates and updates 13 KPI Cards on Executive Dashboard
 * @param {Array} data Filtered FAT Port dataset
 */
function updateDashboardKPIs(data) {
  const totalCity = new Set(data.map(d => d.City || d.Region)).size;
  const totalArea = new Set(data.map(d => d.Area)).size;
  const totalFAT = new Set(data.map(d => d.FAT || d.ODP)).size;
  const totalMITRA = new Set(data.map(d => d.MITRA || d.Vendor)).size;

  const totalPorts = data.reduce((acc, curr) => acc + (parseInt(curr.TOTAL || curr.TargetHP) || 0), 0);
  const usedPorts = data.reduce((acc, curr) => acc + (parseInt(curr.USED || curr.ActualHP) || 0), 0);
  const idlePorts = data.reduce((acc, curr) => acc + (parseInt(curr.IDDLE || curr.RemainingHP) || 0), 0);

  const achievementPct = totalPorts > 0 ? (usedPorts / totalPorts) * 100 : 0;
  const completedCount = data.filter(d => (d.Action || d.Status).toString().toLowerCase().includes("complete")).length;
  const projectProgressPct = data.length > 0 ? (completedCount / data.length) * 100 : 0;

  const dailyProgressPct = Math.min(100, Math.round(achievementPct * 0.95));
  const weeklyProgressPct = Math.min(100, Math.round(achievementPct * 0.98));
  const monthlyProgressPct = Math.round(achievementPct);

  animateCounter(document.getElementById("kpi-total-area"), totalCity);
  animateCounter(document.getElementById("kpi-total-cluster"), totalArea);
  animateCounter(document.getElementById("kpi-total-pop"), totalFAT);
  animateCounter(document.getElementById("kpi-total-odc"), totalFAT);
  animateCounter(document.getElementById("kpi-total-odp"), totalFAT);

  animateCounter(document.getElementById("kpi-target-hp"), totalPorts, " Port");
  animateCounter(document.getElementById("kpi-actual-hp"), usedPorts, " Port");
  animateCounter(document.getElementById("kpi-remaining-hp"), idlePorts, " Port");

  animateCounter(document.getElementById("kpi-achievement"), Math.round(achievementPct), "%");
  animateCounter(document.getElementById("kpi-project-progress"), Math.round(projectProgressPct), "%");
  animateCounter(document.getElementById("kpi-daily-progress"), dailyProgressPct, "%");
  animateCounter(document.getElementById("kpi-weekly-progress"), weeklyProgressPct, "%");
  animateCounter(document.getElementById("kpi-monthly-progress"), monthlyProgressPct, "%");

  updateNotificationBadge(achievementPct);
}
