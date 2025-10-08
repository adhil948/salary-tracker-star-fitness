// ========== GLOBAL VARIABLES ==========
let entries = JSON.parse(localStorage.getItem('salaryEntries')) || [];
let employees = JSON.parse(localStorage.getItem('salaryEmployees')) || [];
let currentMonth = new Date().toISOString().slice(0, 7);

const airtableConfig = {
    apiKey: localStorage.getItem('airtableApiKey') || '',
    baseId: localStorage.getItem('airtableBaseId') || '',
};

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('monthSelector').value = currentMonth;
    document.getElementById('entryDate').valueAsDate = new Date();
    loadEmployeeList();
    loadEntries();
    
    document.getElementById('entryForm').addEventListener('submit', function(e) {
        e.preventDefault();
        addEntry();
    });

    document.getElementById('fileInput').addEventListener('change', handleFileImport);
    document.getElementById('monthSelector').addEventListener('change', loadEntries);
    document.getElementById('uploadCloudBtn').addEventListener('click', uploadToCloud);
document.getElementById('restoreCloudBtn').addEventListener('click', restoreFromCloud);
});


// ========== BACKUP FUNCTIONS (exportData, importData, etc.) ==========
// These functions are unchanged from your original code.
// For brevity, they are not repeated here but should be included.
// In script.js, replace the old exportData function with this one

function exportData() {
    // Directly get the most up-to-date data from localStorage to ensure everything is included.
    const currentEntries = JSON.parse(localStorage.getItem('salaryEntries')) || [];
    const currentEmployees = JSON.parse(localStorage.getItem('salaryEmployees')) || [];

    // Prepare the data object for the backup file
    const data = {
        entries: currentEntries,
        employees: currentEmployees,
        exportDate: new Date().toISOString(),
        app: "Star Fitness Salary Tracker",
        version: "1.1" // Updated version to reflect changes
    };
    
    // Create and download the JSON file
    const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    const date = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = `star-fitness-backup-${date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showStatus('✅ Backup file downloaded successfully!', 'success');
}

function importData() {
    document.getElementById('fileInput').click();
}

function handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (!data.entries || !data.employees) throw new Error('Invalid format');
            if (confirm('This will replace ALL current data. Continue?')) {
                entries = data.entries;
                employees = data.employees;
                saveEntries();
                saveEmployees();
                loadEmployeeList();
                loadEntries();
                showStatus('✅ Data restored successfully!', 'success');
            }
        } catch (error) {
            showStatus('❌ Error: Invalid backup file', 'error');
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

const CLOUD_URL = "https://script.google.com/macros/s/AKfycbyE9YTFLvYC3BUOlqhhI1xkfbdlMwpieeOeK4hy0NoNZj-OUVqhL6S0NB-DJXPb-Q8PvQ/exec"; // Replace with your Apps Script URL

// For GET requests (restore) - use JSONP
function restoreFromCloud() {
  return new Promise((resolve, reject) => {
    const callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
    const script = document.createElement('script');
    
    window[callbackName] = function(data) {
      delete window[callbackName];
      document.body.removeChild(script);
      
      if (data.error) {
        reject(new Error(data.error));
        return;
      }
      
      // Process the data
      const restoredData = data.entries ? data : {
        entries: data.entries || [],
        employees: data.employees || []
      };

      entries = restoredData.entries || [];
      employees = restoredData.employees || [];
      localStorage.setItem("salaryData", JSON.stringify(restoredData));
      
      resolve(restoredData);
    };

    script.src = CLOUD_URL + '?callback=' + callbackName;
    document.body.appendChild(script);
  });
}

// For POST requests (upload) - use a proxy
async function uploadToCloud() {
  try {
    const data = {
      entries,
      employees,
      exportDate: new Date().toISOString(),
      app: "Star Fitness Salary Tracker",
      version: "1.1"
    };
    
    // Method 1: Use a CORS proxy
    const proxyUrl = 'https://corsproxy.io/?';
    const response = await fetch(proxyUrl + encodeURIComponent(CLOUD_URL), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();
    
    if (result.success) {
      alert("✅ " + result.message);
    } else {
      throw new Error(result.error);
    }
  } catch (err) {
    console.error("Upload error:", err);
    
    // Method 2: Fallback - open in new window
    const fallback = confirm("❌ Direct upload failed. Would you like to try an alternative method?");
    if (fallback) {
      uploadViaForm();
    }
  }
}

// Fallback method using form submission
function uploadViaForm() {
  const data = {
    entries,
    employees,
    exportDate: new Date().toISOString(),
    app: "Star Fitness Salary Tracker", 
    version: "1.1"
  };
  
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = CLOUD_URL;
  form.target = '_blank';
  
  const input = document.createElement('input');
  input.name = 'data';
  input.value = JSON.stringify(data);
  form.appendChild(input);
  
  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
  
  alert("📤 Opening backup page... Please wait a moment for the upload to complete.");
}


// ========== EMPLOYEE MANAGEMENT FUNCTIONS ==========
function addEmployee() {
    const name = document.getElementById('newEmployeeName').value.trim();
    const paymentType = document.getElementById('newEmployeePaymentType').value;
    const otRate = parseFloat(document.getElementById('newEmployeeOTRate').value);

    if (!name) {
        showStatus('Please enter employee name', 'error');
        return;
    }
    
    const id = name.toLowerCase().replace(/\s+/g, '_') + Date.now();
    if (employees.find(emp => emp.name.toLowerCase() === name.toLowerCase())) {
        showStatus('An employee with this name already exists!', 'error');
        return;
    }

    const newEmployee = {
        id: id,
        name: name,
        paymentType: paymentType,
        dailyWage: 900, // Default value
        pieces: [], // For piece-rate workers
        otRate: otRate,
        oldBalance: 0
    };

    employees.push(newEmployee);
    saveEmployees();
    loadEmployeeList();
    document.getElementById('newEmployeeName').value = '';
    showStatus(`Employee ${name} added successfully!`, 'success');
}

function loadEmployeeSettings() {
    const employeeId = document.getElementById('employeeSelect').value;
    const wageSettingsSection = document.getElementById('wageSettingsSection');
    // Get all elements that need to be toggled
    const pieceRateManagement = document.getElementById('pieceRateManagement');
    const dailyWageLabel = document.getElementById('dailyWageLabel');
    const pieceNameCell = document.getElementById('pieceNameCell');
    const piecesFinishedCell = document.getElementById('piecesFinishedCell');
    const pieceNameHeader = document.getElementById('pieceNameHeader');
    const piecesFinishedHeader = document.getElementById('piecesFinishedHeader');

    // Reset UI state
    pieceRateManagement.style.display = 'none';
    dailyWageLabel.style.display = 'block';
    pieceNameCell.style.display = 'none';
    piecesFinishedCell.style.display = 'none';
    pieceNameHeader.style.display = 'none';
    piecesFinishedHeader.style.display = 'none';

    if (!employeeId) {
        wageSettingsSection.style.display = 'none';
        loadEntries();
        return;
    }

    const employee = employees.find(emp => emp.id === employeeId);
    if (employee) {
        document.getElementById('currentEmployeeName').textContent = employee.name;
        document.getElementById('displayEmployeeName').textContent = employee.name;
        document.getElementById('otRate').value = employee.otRate;
        document.getElementById('oldBalance').value = employee.oldBalance;

        if (employee.paymentType === 'piece') {
            // If piece worker, show all piece-rate related fields
            dailyWageLabel.style.display = 'none';
            pieceRateManagement.style.display = 'block';
            pieceNameCell.style.display = 'table-cell';
            piecesFinishedCell.style.display = 'table-cell';
            pieceNameHeader.style.display = 'table-cell';
            piecesFinishedHeader.style.display = 'table-cell';
            renderPieceList(employee);
            populatePieceNameDropdown(employee);
        } else {
            // If daily worker, the UI is already correct from the reset above
            document.getElementById('dailyWage').value = employee.dailyWage;
        }

        wageSettingsSection.style.display = 'block';
    }
    loadEntries();
}

function saveEmployeeSettings() {
    const employeeId = document.getElementById('employeeSelect').value;
    const employee = employees.find(emp => emp.id === employeeId);
    
    if (employee) {
        if (employee.paymentType === 'daily') {
            employee.dailyWage = parseFloat(document.getElementById('dailyWage').value);
        }
        employee.otRate = parseFloat(document.getElementById('otRate').value);
        employee.oldBalance = parseFloat(document.getElementById('oldBalance').value);
        
        saveEmployees();
        showStatus('Settings saved for ' + employee.name, 'success');
    }
}

// --- NEW Piece Management Functions ---
function renderPieceList(employee) {
    const container = document.getElementById('pieceListContainer');
    if (!employee.pieces || employee.pieces.length === 0) {
        container.innerHTML = '<p>No pieces defined for this employee.</p>';
        return;
    }

    let tableHTML = `
        <table>
            <tr><th>Piece Name</th><th>Price</th><th>Action</th></tr>
    `;
    employee.pieces.forEach((piece, index) => {
        tableHTML += `
            <tr>
                <td>${piece.name}</td>
                <td>${piece.price}</td>
                <td><button onclick="deletePiece('${employee.id}', ${index})" style="background:#dc3545;">Delete</button></td>
            </tr>
        `;
    });
    tableHTML += '</table>';
    container.innerHTML = tableHTML;
}

function addPiece() {
    const employeeId = document.getElementById('employeeSelect').value;
    const employee = employees.find(emp => emp.id === employeeId);
    
    const name = document.getElementById('newPieceName').value.trim();
    const price = parseFloat(document.getElementById('newPiecePrice').value);

    if (employee && name && price > 0) {
        if (!employee.pieces) employee.pieces = [];
        employee.pieces.push({ name, price });
        saveEmployees();
        loadEmployeeSettings(); // Refresh the view
        document.getElementById('newPieceName').value = '';
        document.getElementById('newPiecePrice').value = '';
    } else {
        showStatus('Please provide a valid name and price.', 'error');
    }
}

function deletePiece(employeeId, pieceIndex) {
    const employee = employees.find(emp => emp.id === employeeId);
    if (employee && confirm(`Are you sure you want to delete this piece?`)) {
        employee.pieces.splice(pieceIndex, 1);
        saveEmployees();
        loadEmployeeSettings(); // Refresh the view
    }
}

function populatePieceNameDropdown(employee) {
    const select = document.getElementById('pieceNameSelect');
    select.innerHTML = '<option value="">Select Piece</option>';
    if (employee.pieces) {
        employee.pieces.forEach(piece => {
            const option = document.createElement('option');
            option.value = piece.name;
            option.textContent = `${piece.name} (₹${piece.price})`;
            select.appendChild(option);
        });
    }
}

// ========== ENTRY MANAGEMENT FUNCTIONS ==========
// In script.js

function addEntry() {
    const employeeId = document.getElementById('employeeSelect').value;
    if (!employeeId) {
        showStatus('Please select an employee first', 'error');
        return;
    }

    const employee = employees.find(emp => emp.id === employeeId);
    const pieceName = document.getElementById('pieceNameSelect').value;
    const piecesFinished = parseFloat(document.getElementById('piecesFinished').value) || 0;

    if (employee.paymentType === 'piece' && piecesFinished > 0 && !pieceName) {
        showStatus('Please select the piece name.', 'error');
        return;
    }

    const entry = {
        id: Date.now(),
        employee: employeeId,
        date: document.getElementById('entryDate').value,
        work: document.getElementById('workDescription').value,
        shift: document.getElementById('shift').value, // RESTORED
        status: document.getElementById('status').value,
        otHours: parseFloat(document.getElementById('otHours').value) || 0,
        pieceName: pieceName,
        piecesFinished: piecesFinished,
        salaryAdvance: parseFloat(document.getElementById('salaryAdvance').value) || 0,
        advanceDate: document.getElementById('advanceDate').value, // RESTORED
        notes: document.getElementById('notes').value
    };

    entries.push(entry);
    saveEntries();
    loadEntries();
    document.getElementById('entryForm').reset();
    document.getElementById('entryDate').valueAsDate = new Date();
    showStatus('Entry added successfully!', 'success');
}

function loadEntries() {
    // ... (This function is largely the same, but the table needs the new columns)
    const month = document.getElementById('monthSelector').value;
    const employeeId = document.getElementById('employeeSelect').value;
    
    if (!employeeId) {
        document.getElementById('entriesList').innerHTML = '<p>Please select an employee to see entries.</p>';
        return;
    }

    const monthlyEntries = entries
        .filter(entry => entry.employee === employeeId && entry.date.startsWith(month))
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    const entriesList = document.getElementById('entriesList');
    if (monthlyEntries.length === 0) {
        entriesList.innerHTML = '<p>No entries for this month.</p>';
        return;
    }

    let tableHTML = `
        <table>
            <tr>
                <th>Date</th><th>Work</th><th>Shift</th><th>Status</th><th>OT</th><th>Piece Name</th><th>Pieces</th><th>Advance</th><th>Notes</th><th>Action</th>
            </tr>`;
    monthlyEntries.forEach(entry => {
        tableHTML += `
            <tr>
                <td>${formatDate(entry.date)}</td>
                <td>${entry.work}</td>
                <td>${entry.shift || '-'}</td>
                <td>${entry.status}</td>
                <td>${entry.otHours}</td>
                <td>${entry.pieceName || '-'}</td>
                <td>${entry.piecesFinished || '-'}</td>
                <td>${entry.salaryAdvance}</td>
                <td>${entry.notes}</td>
                <td><button onclick="deleteEntry(${entry.id})" style="background:#dc3545;">Delete</button></td>
            </tr>
        `;
    });
    tableHTML += `</table>`;
    entriesList.innerHTML = tableHTML;
}

function deleteEntry(id) {
    if (confirm('Delete this entry?')) {
        entries = entries.filter(entry => entry.id !== id);
        saveEntries();
        loadEntries();
        showStatus('Entry deleted', 'success');
    }
}


// ========== BULK ENTRY FUNCTIONS ==========
function loadBulkEntryForm() {
    const date = document.getElementById('bulkEntryDate').value;
    if (!date) {
        showStatus('Please select a date first', 'error');
        return;
    }
    
    const container = document.getElementById('bulkEntryFormContainer');
    let formHTML = `
        <h4>Entries for ${formatDate(date)}</h4>
        <table>
            <tr><th>Employee</th><th>Status</th><th>OT</th><th>Piece Name</th><th>Pieces</th><th>Notes</th></tr>`;

    employees.forEach(emp => {
        let pieceDropdown = '-';
        if (emp.paymentType === 'piece') {
            pieceDropdown = `<select class="bulk-piece-name">
                <option value="">Select Piece</option>`;
            (emp.pieces || []).forEach(p => {
                pieceDropdown += `<option value="${p.name}">${p.name}</option>`;
            });
            pieceDropdown += `</select>`;
        }

        formHTML += `
            <tr data-employee-id="${emp.id}">
                <td>${emp.name}</td>
                <td>
                    <select class="bulk-status">
                        <option value="Present">Present</option>
                        <option value="Absent">Absent</option>
                        <option value="Weekly Off">Weekly Off</option>
                    </select>
                </td>
                <td><input type="number" class="bulk-ot" value="0"></td>
                <td>${pieceDropdown}</td>
                <td><input type="number" class="bulk-pieces" value="0" ${emp.paymentType !== 'piece' ? 'disabled' : ''}></td>
                <td><input type="text" class="bulk-notes"></td>
            </tr>`;
    });

    formHTML += `</table><button onclick="saveBulkEntries()">Save All Entries</button>`;
    container.innerHTML = formHTML;
}

function saveBulkEntries() {
    const date = document.getElementById('bulkEntryDate').value;
    const rows = document.querySelectorAll('#bulkEntryFormContainer tr[data-employee-id]');
    let entriesAdded = 0;

    rows.forEach(row => {
        const employeeId = row.dataset.employeeId;
        const status = row.querySelector('.bulk-status').value;
        if (status !== 'Absent') {
            const entry = {
                id: Date.now() + Math.random(),
                date,
                employee: employeeId,
                status,
                otHours: parseFloat(row.querySelector('.bulk-ot').value) || 0,
                pieceName: row.querySelector('.bulk-piece-name')?.value || '',
                piecesFinished: parseFloat(row.querySelector('.bulk-pieces').value) || 0,
                notes: row.querySelector('.bulk-notes').value,
                work: '', salaryAdvance: 0,
            };
            entries.push(entry);
            entriesAdded++;
        }
    });

    if (entriesAdded > 0) {
        saveEntries();
        loadEntries();
        showStatus(`${entriesAdded} entries saved successfully!`, 'success');
        document.getElementById('bulkEntryFormContainer').innerHTML = '';
    } else {
        showStatus('No entries were added.', 'warning');
    }
}


// ========== PRINT REPORT & CALCULATION ==========
function printReport() {
    const employeeId = document.getElementById('employeeSelect').value;
    const month = document.getElementById('monthSelector').value;
    if (!employeeId) {
        showStatus('Please select an employee first', 'error');
        return;
    }

    const employee = employees.find(emp => emp.id === employeeId);
    const monthlyEntries = entries.filter(e => e.employee === employeeId && e.date.startsWith(month));

    // --- CALCULATION LOGIC ---
    const totalOTHours = monthlyEntries.reduce((sum, e) => sum + e.otHours, 0);
    const totalAdvance = monthlyEntries.reduce((sum, e) => sum + e.salaryAdvance, 0);
    let earnedWages = 0;
    let summaryDetailsHTML = '';
    
    if (employee.paymentType === 'piece') {
        let pieceTotal = 0;
        const pieceSummary = {};
        
        monthlyEntries.forEach(entry => {
            if (entry.pieceName && entry.piecesFinished > 0) {
                const piece = (employee.pieces || []).find(p => p.name === entry.pieceName);
                if (piece) {
                    pieceTotal += entry.piecesFinished * piece.price;
                    // For detailed report
                    if (!pieceSummary[entry.pieceName]) {
                        pieceSummary[entry.pieceName] = { count: 0, price: piece.price };
                    }
                    pieceSummary[entry.pieceName].count += entry.piecesFinished;
                }
            }
        });
        
        earnedWages = pieceTotal + (totalOTHours * employee.otRate);
        summaryDetailsHTML = '<tr><td colspan="2"><b>Piece Work Summary</b></td></tr>';
        for (const name in pieceSummary) {
            summaryDetailsHTML += `<tr><td>${name} (${pieceSummary[name].count} x ₹${pieceSummary[name].price})</td><td>₹${pieceSummary[name].count * pieceSummary[name].price}</td></tr>`;
        }

    } else { // Daily wage
        const totalDaysWorked = monthlyEntries.filter(e => e.status === 'Present').length;
        earnedWages = (totalDaysWorked * employee.dailyWage) + (totalOTHours * employee.otRate);
        summaryDetailsHTML = `
            <tr><td>Daily Wage Rate:</td><td>₹${employee.dailyWage}</td></tr>
            <tr><td>Total Days Worked:</td><td>${totalDaysWorked}</td></tr>
        `;
    }

    const netPayable = earnedWages + employee.oldBalance - totalAdvance;

    // --- GENERATE HTML FOR PRINT ---
    let reportHTML = `
        <div class="print-header">
            <h2>STAR FITNESS EQUIPMENT MANUFACTURER</h2>
            <p><strong>Salary Sheet for: ${employee.name} - ${month}</strong></p>
        </div>
        <table>
            <tr><th>Date</th><th>Work</th><th>Status</th><th>OT</th><th>Piece Name</th><th>Pieces</th><th>Advance</th><th>Notes</th></tr>`;
    
    monthlyEntries.sort((a,b) => new Date(a.date) - new Date(b.date)).forEach(entry => {
        reportHTML += `
            <tr>
                <td>${formatDate(entry.date)}</td>
                <td>${entry.work || '-'}</td>
                <td>${entry.status}</td>
                <td>${entry.otHours}</td>
                <td>${entry.pieceName || '-'}</td>
                <td>${entry.piecesFinished || '-'}</td>
                <td>${entry.salaryAdvance}</td>
                <td>${entry.notes || '-'}</td>
            </tr>
        `;
    });

    reportHTML += `
        </table>
        <div class="print-summary">
            <h3>SUMMARY FOR ${employee.name.toUpperCase()}</h3>
            <table>
                ${summaryDetailsHTML}
                <tr><td>OT Hourly Rate:</td><td>₹${employee.otRate}</td></tr>
                <tr><td>Total OT Hours:</td><td>${totalOTHours.toFixed(1)}</td></tr>
                <tr><td><b>Total Earned from Work:</b></td><td><b>₹${earnedWages.toFixed(2)}</b></td></tr>
                <tr><td>Total Advance Given:</td><td>₹${totalAdvance.toFixed(2)}</td></tr>
                <tr><td>Old Balance:</td><td>₹${employee.oldBalance.toFixed(2)}</td></tr>
                <tr><td style="font-weight: bold; font-size: 1.1em;">Net Payable:</td><td style="font-weight: bold; font-size: 1.1em;">₹${netPayable.toFixed(2)}</td></tr>
            </table>
        </div>
        <div style="margin-top: 50px; display: flex; justify-content: space-between;">
            <p>Labour Signature: _________________________</p>
            <p>Receiver Signature: _________________________</p>
        </div>
    `;

    const printDiv = document.getElementById('printReport');
    printDiv.innerHTML = reportHTML;
    printDiv.style.display = 'block';
    window.print();
    printDiv.style.display = 'none';
}


// ========== STORAGE & UTILITY FUNCTIONS ==========
function saveEntries() {
    localStorage.setItem('salaryEntries', JSON.stringify(entries));
}
function saveEmployees() {
    localStorage.setItem('salaryEmployees', JSON.stringify(employees));
}
function loadEmployeeList() {
    const select = document.getElementById('employeeSelect');
    const currentVal = select.value;
    select.innerHTML = '<option value="">-- Select Employee --</option>';
    employees.forEach(emp => {
        const option = document.createElement('option');
        option.value = emp.id;
        option.textContent = emp.name;
        select.appendChild(option);
    });
    select.value = currentVal;
}
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    // Add timezone offset to prevent date from shifting
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() + userTimezoneOffset).toLocaleDateString('en-IN');
}
function showStatus(message, type) {
    const statusDiv = document.getElementById('statusMessage');
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    statusDiv.style.display = 'block';
    setTimeout(() => { statusDiv.style.display = 'none'; }, 4000);
}
function clearAllData() {
    if (confirm('⚠️ WARNING! This will delete ALL employees and entries permanently. This cannot be undone. Are you sure?')) {
        entries = [];
        employees = [];
        saveEntries();
        saveEmployees();
        location.reload();
    }

}




