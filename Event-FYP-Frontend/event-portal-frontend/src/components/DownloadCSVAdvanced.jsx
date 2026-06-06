import React from "react";
import { Download, FileSpreadsheet } from "lucide-react";

const DownloadCSVAdvanced = ({ 
  data,           // Array of data to export
  filename,       // Name of the file
  buttonText = "Download CSV",
  buttonIcon = "download",  // "download" or "spreadsheet"
  customHeaders,  // Custom column names
  mapData,        // Function to map data to custom format
  onCustomDownload,
  className = "",
  showDate = true,
  size = "md",
  disabled = false
}) => {

  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-5 py-2.5 text-sm gap-2",
    lg: "px-6 py-3 text-base gap-2.5"
  };

  const convertToCSV = () => {
    if (!data || data.length === 0) return "";
    
    let headers = [];
    let rows = [];
    
    if (customHeaders && mapData) {
      // Use custom headers and mapping
      headers = customHeaders;
      rows = data.map(item => mapData(item));
    } else {
      // Auto-detect headers
      headers = Object.keys(data[0]);
      rows = data.map(row => headers.map(header => row[header] || ""));
    }
    
    // Create CSV content
    const csvRows = [];
    csvRows.push(headers.join(","));
    
    for (const row of rows) {
      const values = row.map(value => {
        const escaped = String(value || "").replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(","));
    }
    
    return csvRows.join("\n");
  };

  const handleDownload = () => {
    if (disabled) return;
    
    // If custom download function provided, use that
    if (onCustomDownload) {
      onCustomDownload();
      return;
    }

    // Otherwise use default CSV download
    if (!data || data.length === 0) {
      alert("No data available to download.");
      return;
    }

    const csvData = convertToCSV();
    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    
    let finalFilename = filename || "data";
    if (showDate) {
      const date = new Date().toISOString().split("T")[0];
      finalFilename = `${finalFilename}_${date}`;
    }
    
    link.setAttribute("download", `${finalFilename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <button 
      onClick={handleDownload}
      disabled={disabled}
      className={`flex items-center gap-2 rounded-xl font-bold text-white 
                 bg-linear-to-r from-[#8b4fa2] to-[#4ECDC4] 
                 shadow-[0_4px_15px_rgba(139,79,162,0.35)] 
                 hover:opacity-90 hover:scale-[1.02] 
                 transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100
                 ${sizeClasses[size]} ${className}`}
    >
      {buttonIcon === "spreadsheet" ? <FileSpreadsheet size={size === "sm" ? 14 : 16} /> : <Download size={size === "sm" ? 14 : 16} />}
      {buttonText}
    </button>
  );
};

export default DownloadCSVAdvanced;