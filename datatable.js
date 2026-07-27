/**
 * PROJECT FTTH ENTERPRISE DASHBOARD - DATATABLES CONTROLLER
 * Render DataTables strictly matching user columns:
 * No, City, Area, FAT, Tikor FAT, Date RFS, Years, MITRA, Action, IDDLE, USED, TOTAL
 */

let projectDataTable = null;

document.addEventListener("DOMContentLoaded", () => {
  if (typeof $.fn.dataTable === "undefined") return;

  const dataset = getStoredProjectData();
  renderProjectDataTable(dataset);
});

/**
 * Initializes DataTables instance matching user Excel header layout
 * @param {Array} data FTTH Project dataset
 */
function renderProjectDataTable(data) {
  const tableEl = $("#ftth-project-datatable");
  if (!tableEl.length) return;

  if ($.fn.DataTable.isDataTable(tableEl)) {
    tableEl.DataTable().destroy();
    tableEl.empty();
  }

  projectDataTable = tableEl.DataTable({
    data: data,
    responsive: true,
    pageLength: 10,
    lengthMenu: [[10, 25, 50, -1], [10, 25, 50, "All"]],
    dom: '<"d-flex justify-content-between align-items-center mb-3"Bf>rt<"d-flex justify-content-between align-items-center mt-3"lip>',
    buttons: [
      { extend: "excelHtml5", className: "btn btn-sm btn-ftth-primary me-1", text: '<i class="fas fa-file-excel me-1"></i> Excel' },
      { extend: "csvHtml5", className: "btn btn-sm btn-ftth-outline me-1", text: '<i class="fas fa-file-csv me-1"></i> CSV' },
      { extend: "pdfHtml5", className: "btn btn-sm btn-ftth-outline me-1", text: '<i class="fas fa-file-pdf me-1"></i> PDF' },
      { extend: "print", className: "btn btn-sm btn-ftth-outline me-1", text: '<i class="fas fa-print me-1"></i> Print' }
    ],
    columns: [
      { title: "No", data: "No" },
      { title: "City", data: "City" },
      { title: "Area", data: "Area" },
      { title: "FAT", data: "FAT" },
      { title: "Tikor FAT", data: "Tikor FAT" },
      { title: "Date RFS", data: "Date RFS" },
      { title: "Years", data: "Years" },
      { title: "MITRA", data: "MITRA" },
      {
        title: "Action",
        data: "Action",
        render: function(data) {
          let badgeClass = "badge-ftth-info";
          const str = (data || "").toString().toLowerCase();
          if (str.includes("complete") || str.includes("rfs")) badgeClass = "badge-ftth-success";
          else if (str.includes("progress")) badgeClass = "badge-ftth-warning";
          else if (str.includes("pending") || str.includes("row")) badgeClass = "badge-ftth-danger";

          return `<span class="badge-ftth ${badgeClass}">${data}</span>`;
        }
      },
      { title: "IDDLE", data: "IDDLE", className: "text-center font-monospace" },
      { title: "USED", data: "USED", className: "text-center font-monospace fw-bold text-success" },
      { title: "TOTAL", data: "TOTAL", className: "text-center font-monospace fw-bold" },
      {
        title: "Achievement",
        data: null,
        render: function(data) {
          const total = parseInt(data.TOTAL) || 0;
          const used = parseInt(data.USED) || 0;
          const pct = total > 0 ? Math.round((used / total) * 100) : 0;
          let badgeClass = "badge-ftth-danger";
          if (pct >= 80) badgeClass = "badge-ftth-success";
          else if (pct >= 50) badgeClass = "badge-ftth-warning";

          return `<span class="badge-ftth ${badgeClass}">${pct}%</span>`;
        }
      }
    ]
  });
}

function updateDataTableData(filteredData) {
  if (projectDataTable) {
    projectDataTable.clear();
    projectDataTable.rows.add(filteredData);
    projectDataTable.draw();
  }
}
