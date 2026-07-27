/**
 * PROJECT FTTH ENTERPRISE DASHBOARD - EXCEL UPLOAD MODULE
 * SheetJS integration, Drag & Drop, Column Auto-Mapping, Excel Template Download.
 * Strictly follows user column layout: No, City, Area, FAT, Tikor FAT, Date RFS, Years, MITRA, Action, IDDLE, USED, TOTAL
 */

let parsedUploadedData = [];

document.addEventListener("DOMContentLoaded", () => {
  const dropzone = document.getElementById("upload-dropzone");
  const fileInput = document.getElementById("excel-file-input");
  const browseBtn = document.getElementById("browse-file-btn");
  const importBtn = document.getElementById("import-btn");
  const resetBtn = document.getElementById("reset-btn");
  const templateBtn = document.getElementById("download-template-btn");
  const previewSection = document.getElementById("upload-preview-section");
  const previewBody = document.getElementById("preview-table-body");
  const progressContainer = document.getElementById("upload-progress-container");
  const progressBar = document.getElementById("upload-progress-bar");
  const fileNameDisplay = document.getElementById("file-name-display");

  if (!dropzone || !fileInput) return;

  // Trigger File Dialog
  if (browseBtn) {
    browseBtn.addEventListener("click", () => fileInput.click());
  }

  // Drag & Drop Listeners
  ["dragenter", "dragover"].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropzone.classList.add("dragover");
    }, false);
  });

  ["dragleave", "drop"].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropzone.classList.remove("dragover");
    }, false);
  });

  dropzone.addEventListener("drop", (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files.length > 0) {
      handleFileSelected(files[0]);
    }
  });

  fileInput.addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
      handleFileSelected(e.target.files[0]);
    }
  });

  /**
   * Reads selected Excel file using SheetJS
   * Handles multi-header rows (e.g. Row 2/3 header with PORT IDDLE USED TOTAL)
   * @param {File} file Uploaded file
   */
  function handleFileSelected(file) {
    const validExtensions = [".xlsx", ".xls"];
    const fileName = file.name.toLowerCase();
    const isValid = validExtensions.some(ext => fileName.endsWith(ext));

    if (!isValid) {
      showToast("Invalid file format! Please upload .xlsx or .xls file.", "danger");
      return;
    }

    if (fileNameDisplay) fileNameDisplay.textContent = file.name;
    if (progressContainer) progressContainer.classList.remove("d-none");
    if (progressBar) progressBar.style.width = "40%";

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convert sheet to array of arrays to handle multi-row headers
        const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });

        if (progressBar) progressBar.style.width = "80%";

        // Detect header row index (looking for 'City', 'FAT', 'Area', or 'MITRA')
        let headerRowIndex = 0;
        for (let r = 0; r < Math.min(rawRows.length, 10); r++) {
          const rowStr = rawRows[r].join(" ").toLowerCase();
          if (rowStr.includes("city") || rowStr.includes("fat") || rowStr.includes("mitra") || rowStr.includes("idle") || rowStr.includes("used")) {
            headerRowIndex = r;
            break;
          }
        }

        // Convert worksheet using detected header row
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { range: headerRowIndex, defval: "" });

        // Auto Map Columns
        parsedUploadedData = autoMapExcelColumns(jsonData);

        if (progressBar) progressBar.style.width = "100%";

        setTimeout(() => {
          if (progressContainer) progressContainer.classList.add("d-none");
          renderPreviewTable(parsedUploadedData);
          if (previewSection) previewSection.classList.remove("d-none");
          if (importBtn) importBtn.disabled = false;
          showToast(`Successfully parsed ${parsedUploadedData.length} records!`, "success");
        }, 300);

      } catch (err) {
        console.error("Excel Read Error", err);
        showToast("Error reading Excel file! Please check file structure.", "danger");
        if (progressContainer) progressContainer.classList.add("d-none");
      }
    };
    reader.readAsArrayBuffer(file);
  }

  /**
   * Auto maps raw excel headers to standardized FTTH FAT Port fields:
   * No, City, Area, FAT, Tikor FAT, Date RFS, Years, MITRA, Action, IDDLE, USED, TOTAL
   * @param {Array} rawRows Raw JSON rows from SheetJS
   * @returns {Array} Standardized dataset
   */
  function autoMapExcelColumns(rawRows) {
    return rawRows.map((row, index) => {
      const getKey = (possibleKeys) => {
        for (let pk of possibleKeys) {
          const matched = Object.keys(row).find(k => k.trim().toLowerCase() === pk.toLowerCase());
          if (matched && row[matched] !== undefined && row[matched] !== "") return row[matched];
        }
        return "";
      };

      const city = getKey(["City", "Kota", "Region"]) || "Jakarta";
      const area = getKey(["Area", "Wilayah", "Sub Area"]) || "Kebayoran";
      const fat = getKey(["FAT", "Nama FAT", "ODP", "Site"]) || `FAT-${index + 1}`;
      const tikor = getKey(["Tikor FAT", "Tikor", "Koordinat", "Lat/Lng", "Lat, Lng"]) || "-6.2442, 106.8006";
      const dateRfs = getKey(["Date RFS", "RFS Date", "Tanggal RFS", "Date"]) || new Date().toISOString().split("T")[0];
      const years = parseInt(getKey(["Years", "Year", "Tahun"])) || new Date().getFullYear();
      const mitra = getKey(["MITRA", "Mitra", "Vendor", "Kontraktor"]) || "PT Telecom Infrastructure";
      const action = getKey(["Action", "Status", "Keterangan"]) || "RFS Completed";

      const totalPorts = parseInt(getKey(["TOTAL", "Total", "Target HP", "Target"])) || 16;
      const usedPorts = parseInt(getKey(["USED", "Used", "Actual HP", "Actual"])) || 0;
      let idlePorts = parseInt(getKey(["IDDLE", "IDLE", "Idle", "Remaining"])) || Math.max(0, totalPorts - usedPorts);

      // Extract Lat, Lng from Tikor FAT string e.g. "-6.2442, 106.8006"
      let lat = -6.2088;
      let lng = 106.8456;
      if (tikor && tikor.includes(",")) {
        const parts = tikor.split(",");
        lat = parseFloat(parts[0].trim()) || lat;
        lng = parseFloat(parts[1].trim()) || lng;
      }

      return {
        No: index + 1,
        City: city,
        Area: area,
        FAT: fat,
        "Tikor FAT": tikor,
        "Date RFS": dateRfs,
        Years: years,
        MITRA: mitra,
        Action: action,
        IDDLE: idlePorts,
        USED: usedPorts,
        TOTAL: totalPorts,

        // Backward compatibility mappings
        Date: dateRfs,
        Region: city,
        Cluster: `${area} (${fat})`,
        Site: fat,
        POP: `POP-${city.toUpperCase().replace(/\s+/g, '')}`,
        ODC: `ODC-${area.toUpperCase().replace(/\s+/g, '')}`,
        ODP: fat,
        Vendor: mitra,
        Supervisor: "SPV Field",
        PIC: mitra,
        Status: action.toLowerCase().includes("complete") ? "Completed" : (action.toLowerCase().includes("progress") ? "In Progress" : "Pending"),
        TargetHP: totalPorts,
        ActualHP: usedPorts,
        Lat: lat,
        Lng: lng
      };
    });
  }

  /**
   * Renders parsed data preview table safely
   * @param {Array} data Parsed records
   */
  function renderPreviewTable(data) {
    if (!previewBody) return;
    previewBody.replaceChildren(); // Safe DOM clearing

    data.slice(0, 10).forEach(row => {
      const tr = document.createElement("tr");

      const fields = [
        row.No, row.City, row.Area, row.FAT, row["Tikor FAT"],
        row["Date RFS"], row.MITRA, row.Action, row.IDDLE, row.USED, row.TOTAL
      ];

      fields.forEach(val => {
        const td = document.createElement("td");
        td.textContent = val;
        tr.appendChild(td);
      });

      previewBody.appendChild(tr);
    });
  }

  // Import Action Button
  if (importBtn) {
    importBtn.addEventListener("click", () => {
      if (parsedUploadedData.length === 0) {
        showToast("No data to import!", "warning");
        return;
      }
      saveProjectData(parsedUploadedData);
      showToast("Report Imported Successfully! Dashboard updated.", "success");
      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 1000);
    });
  }

  // Reset Button
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      parsedUploadedData = [];
      if (fileInput) fileInput.value = "";
      if (fileNameDisplay) fileNameDisplay.textContent = "No file chosen";
      if (previewSection) previewSection.classList.add("d-none");
      if (importBtn) importBtn.disabled = true;
      showToast("Upload form reset.", "info");
    });
  }

  // Generate Exact Matching Excel Template matching user screenshot
  if (templateBtn) {
    templateBtn.addEventListener("click", () => {
      // Row 1: Merged headers structure
      // Row 2: No | City | Area | FAT | Tikor FAT | Date RFS | Years | MITRA | Action | IDDLE | USED | TOTAL
      const wsData = [
        ["", "", "", "", "", "", "", "", "", "PORT", "", ""],
        ["No", "City", "Area", "FAT", "Tikor FAT", "Date RFS", "Years", "MITRA", "Action", "IDDLE", "USED", "TOTAL"],
        [1, "Jakarta Selatan", "Kebayoran Baru", "FAT-JKS-001", "-6.2442, 106.8006", "2026-07-01", 2026, "PT Telecom Infrastructure", "RFS Completed", 3, 13, 16],
        [2, "Jakarta Selatan", "Pondok Indah", "FAT-JKS-002", "-6.2653, 106.7842", "2026-07-03", 2026, "PT Telecom Infrastructure", "In Progress", 6, 10, 16],
        [3, "Bandung", "Dago", "FAT-BDG-001", "-6.8841, 107.6136", "2026-07-05", 2026, "PT Fiber Karya", "RFS Completed", 2, 14, 16],
        [4, "Surabaya", "Gubeng", "FAT-SBY-001", "-7.2754, 112.7541", "2026-07-10", 2026, "PT Jaringan Utama", "RFS Completed", 0, 16, 16],
        [5, "Medan", "Medan Baru", "FAT-MDN-001", "3.5781, 98.6653", "2026-07-12", 2026, "PT Optik Nusantara", "In Progress", 5, 11, 16]
      ];

      const worksheet = XLSX.utils.aoa_to_sheet(wsData);

      // Merge PORT across J1:L1 (cols 9-11 in 0-indexed)
      worksheet["!merges"] = [
        { s: { r: 0, c: 9 }, e: { r: 0, c: 11 } }
      ];

      // Auto Column Widths
      worksheet["!cols"] = [
        { wch: 6 },  // No
        { wch: 18 }, // City
        { wch: 18 }, // Area
        { wch: 16 }, // FAT
        { wch: 22 }, // Tikor FAT
        { wch: 14 }, // Date RFS
        { wch: 10 }, // Years
        { wch: 26 }, // MITRA
        { wch: 18 }, // Action
        { wch: 10 }, // IDDLE
        { wch: 10 }, // USED
        { wch: 10 }  // TOTAL
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "FAT Port Report");
      XLSX.writeFile(workbook, "FTTH_FAT_Port_Report_Template.xlsx");

      showToast("Downloaded Exact FTTH FAT Port Report Template (.xlsx)!", "success");
    });
  }
});
