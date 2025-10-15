// ========== GLOBAL VARIABLES ==========
let entries = JSON.parse(localStorage.getItem('salaryEntries')) || [];
let employees = JSON.parse(localStorage.getItem('salaryEmployees')) || [];
let currentMonth = new Date().toISOString().slice(0, 7);

const airtableConfig = {
    apiKey: localStorage.getItem('airtableApiKey') || '',
    baseId: localStorage.getItem('airtableBaseId') || '',
};

// ========== UTILITY FUNCTIONS ==========
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

// ========== OT HOURS CONVERSION ==========
// ========== OT HOURS CONVERSION ==========
// ========== OT HOURS CONVERSION ==========
// ========== OT HOURS CONVERSION ==========
// ========== OT HOURS CONVERSION ==========
function convertOThours(inputElement) {
    let value = inputElement.value.trim();
    
    if (!value || value === '0') {
        inputElement.value = '0';
        inputElement.dataset.originalValue = '0';
        inputElement.dataset.decimalValue = '0';
        return 0;
    }
    
    // Check if this is already a converted decimal value
    if (inputElement.dataset.decimalValue && parseFloat(inputElement.dataset.decimalValue) === parseFloat(value)) {
        return parseFloat(value);
    }
    
    // Always treat as hours.minutes format
    if (value.includes('.')) {
        const parts = value.split('.');
        const hours = parseInt(parts[0]) || 0;
        let minutesStr = parts[1];
        
        // Pad with zero if single digit (1.3 = 1 hour 30 minutes)
        if (minutesStr.length === 1) {
            minutesStr = minutesStr + '0';
        }
        
        let minutes = parseInt(minutesStr) || 0;
        
        // Handle invalid minutes (>59)
        if (minutes > 59) {
            const extraHours = Math.floor(minutes / 60);
            minutes = minutes % 60;
            const totalHours = hours + extraHours + (minutes / 60);
            
            // Store both original and decimal values
            inputElement.dataset.originalValue = value;
            inputElement.dataset.decimalValue = totalHours.toFixed(2);
            inputElement.value = totalHours.toFixed(2);
            return totalHours;
        }
        
        // Normal conversion
        const decimalMinutes = minutes / 60;
        const totalHours = hours + decimalMinutes;
        
        // Store both original and decimal values
        inputElement.dataset.originalValue = value;
        inputElement.dataset.decimalValue = totalHours.toFixed(2);
        inputElement.value = totalHours.toFixed(2);
        
        return totalHours;
    }
    
    // If it's just a whole number, treat as hours with zero minutes
    const wholeHours = parseInt(value) || 0;
    
    // Store both original and decimal values
    inputElement.dataset.originalValue = value;
    inputElement.dataset.decimalValue = wholeHours.toFixed(2);
    inputElement.value = wholeHours.toFixed(2);
    
    return wholeHours;
}

function convertBulkOThours(inputElement) {
    let value = inputElement.value.trim();
    
    if (!value || value === '0') {
        inputElement.value = '0';
        inputElement.dataset.originalValue = '0';
        inputElement.dataset.decimalValue = '0';
        return 0;
    }
    
    // Check if this is already a converted decimal value
    if (inputElement.dataset.decimalValue && parseFloat(inputElement.dataset.decimalValue) === parseFloat(value)) {
        return parseFloat(value);
    }
    
    // Always treat as hours.minutes format
    if (value.includes('.')) {
        const parts = value.split('.');
        const hours = parseInt(parts[0]) || 0;
        let minutesStr = parts[1];
        
        // Pad with zero if single digit
        if (minutesStr.length === 1) {
            minutesStr = minutesStr + '0';
        }
        
        let minutes = parseInt(minutesStr) || 0;
        
        if (minutes > 59) {
            const extraHours = Math.floor(minutes / 60);
            minutes = minutes % 60;
            const totalHours = hours + extraHours + (minutes / 60);
            
            inputElement.dataset.originalValue = value;
            inputElement.dataset.decimalValue = totalHours.toFixed(2);
            inputElement.value = totalHours.toFixed(2);
            return totalHours;
        }
        
        const decimalMinutes = minutes / 60;
        const totalHours = hours + decimalMinutes;
        
        inputElement.dataset.originalValue = value;
        inputElement.dataset.decimalValue = totalHours.toFixed(2);
        inputElement.value = totalHours.toFixed(2);
        return totalHours;
    }
    
    // Whole number
    const wholeHours = parseInt(value) || 0;
    
    inputElement.dataset.originalValue = value;
    inputElement.dataset.decimalValue = wholeHours.toFixed(2);
    inputElement.value = wholeHours.toFixed(2);
    
    return wholeHours;
}
// ========== ENHANCED OT DISPLAY FUNCTIONS ==========
// Optional: Function to display decimal hours as time format for better readability
function formatHoursAsTime(decimalHours) {
    if (!decimalHours || decimalHours === 0) return '0h';
    
    const hours = Math.floor(decimalHours);
    const minutes = Math.round((decimalHours - hours) * 60);
    
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
}

// Function to convert back to time format for display (optional)
function displayAsTimeFormat(inputElement) {
    const value = parseFloat(inputElement.value) || 0;
    if (value === 0) {
        inputElement.value = '0';
        return;
    }
    
    const hours = Math.floor(value);
    const minutes = Math.round((value - hours) * 60);
    
    if (minutes === 0) {
        inputElement.value = hours.toString();
    } else {
        inputElement.value = `${hours}.${minutes.toString().padStart(2, '0')}`;
    }
}

// ========== BULK ENTRY FUNCTIONS ==========
// ========== BULK ENTRY FUNCTIONS ==========
// ========== BULK ENTRY FUNCTIONS ==========
function loadBulkEntryForm() {
    const date = document.getElementById('bulkEntryDate').value;
    if (!date) {
        showStatus('Please select a date first', 'error');
        return;
    }
    
    const dailyWageEmployees = employees.filter(emp => emp.paymentType === 'daily');
    
    if (dailyWageEmployees.length === 0) {
        showStatus('No daily wage employees found!', 'error');
        return;
    }
    
    const container = document.getElementById('bulkEntryFormContainer');
    let formHTML = `
        <h4>Bulk Daily Entries for ${formatDate(date)}</h4>
        <p><strong>Daily Wage Employees Only</strong> (${dailyWageEmployees.length} employees)</p>
        <p><small>💡 OT Hours: Enter as 1.30 (1h 30m) or 1.5 (1.5 hours)</small></p>
        <table>
            <tr>
                <th>Employee</th>
                <th>Status</th>
                <th>OT Hours</th>
                <th>Work Description</th>
                <th>Salary/Advance</th>
                <th>Notes</th>
                <th>Remove</th>
            </tr>`;

    dailyWageEmployees.forEach(emp => {
        formHTML += `
            <tr data-employee-id="${emp.id}">
                <td>${emp.name}</td>
                <td>
                    <select class="bulk-status">
                        <option value="Present" selected>Present</option>
                        <option value="Absent">Absent</option>
                        <option value="Weekly Off">Weekly Off</option>
                        <option value="Holiday">Holiday</option>
                    </select>
                </td>
                <td>
                    <input type="text" class="bulk-ot" value="0" placeholder="1.30 or 1.5" style="width: 80px;">
                </td>
                <td><input type="text" class="bulk-work" placeholder="Optional work description"></td>
                <td><input type="number" class="bulk-advance" value="0" min="0"></td>
                <td><input type="text" class="bulk-notes" placeholder="Optional notes"></td>
                <td>
                    <button type="button" class="remove-bulk-btn" style="background: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">
                        ❌ Remove
                    </button>
                </td>
            </tr>`;
    });

    formHTML += `</table>
        <div style="margin-top: 15px;">
            <button type="button" id="saveBulkEntriesBtn" style="background: #28a745;">💾 Save All Entries</button>
            <button type="button" id="clearBulkFormBtn" style="background: #6c757d;">🗑️ Clear Form</button>
        </div>`;
    
    container.innerHTML = formHTML;
    
    // Add event listeners
    const saveBtn = document.getElementById('saveBulkEntriesBtn');
    const clearBtn = document.getElementById('clearBulkFormBtn');
    
    if (saveBtn) saveBtn.addEventListener('click', saveBulkEntries);
    if (clearBtn) clearBtn.addEventListener('click', clearBulkForm);
    
    // Add real-time OT conversion
    container.addEventListener('blur', function(e) {
        if (e.target.classList.contains('bulk-ot')) {
            convertBulkOThours(e.target);
        }
    }, true);
    
    container.addEventListener('click', function(e) {
        if (e.target.classList.contains('remove-bulk-btn')) {
            removeEmployeeFromBulk(e.target);
        }
    });
}
function saveBulkEntries() {
    console.log("=== SAVE BULK ENTRIES STARTED ===");
    
    const date = document.getElementById('bulkEntryDate').value;
    const container = document.getElementById('bulkEntryFormContainer');
    const rows = container.querySelectorAll('tr[data-employee-id]');
    
    if (rows.length === 0) {
        showStatus('No employees remaining in the bulk entry form!', 'error');
        return;
    }
    
    let entriesAdded = 0;
    const newEntries = [];

    // Process each row
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const employeeId = row.dataset.employeeId;
        const employee = employees.find(emp => emp.id === employeeId);
        if (!employee) continue;
        
        const statusSelect = row.querySelector('.bulk-status');
        const status = statusSelect ? statusSelect.value : 'Present';
        
        // Skip absent employees (no entry needed)
        if (status === 'Absent') continue;
        
        const otInput = row.querySelector('.bulk-ot');
        
        // FIX: Use the stored decimal value instead of converting again
        let otHours = 0;
        if (otInput.dataset.decimalValue) {
            // Use the pre-calculated decimal value
            otHours = parseFloat(otInput.dataset.decimalValue);
            console.log("Using stored decimal value:", otHours);
        } else {
            // Fallback: convert if no stored value
            otHours = convertBulkOThours(otInput);
            console.log("Converted value:", otHours);
        }
        
        const workInput = row.querySelector('.bulk-work');
        const workDescription = workInput ? workInput.value.trim() : '';
        
        const advanceInput = row.querySelector('.bulk-advance');
        const salaryAdvance = advanceInput ? parseFloat(advanceInput.value) || 0 : 0;
        
        const notesInput = row.querySelector('.bulk-notes');
        const notes = notesInput ? notesInput.value.trim() : '';

        const entry = {
            id: Date.now() + i,
            date: date,
            employee: employeeId,
            status: status,
            otHours: otHours,
            work: workDescription,
            salaryAdvance: salaryAdvance,
            notes: notes,
            pieceName: '',
            piecesFinished: 0,
            advanceDate: salaryAdvance > 0 ? date : '',
            shift: ''
        };
        
        console.log("Final entry OT hours:", entry.otHours);
        newEntries.push(entry);
        entriesAdded++;
    }

    if (entriesAdded > 0) {
        entries.push(...newEntries);
        saveEntries();
        loadEntries();
        showStatus(`✅ ${entriesAdded} bulk entries saved successfully!`, 'success');
        
        setTimeout(() => {
            container.innerHTML = '';
        }, 1500);
    } else {
        showStatus('No entries were added.', 'warning');
    }
}
function removeEmployeeFromBulk(buttonElement) {
    const row = buttonElement.closest('tr');
    const employeeName = row.querySelector('td').textContent;
    
    if (confirm(`Remove ${employeeName} from bulk entry?`)) {
        row.style.transition = 'opacity 0.3s';
        row.style.opacity = '0';
        
        setTimeout(() => {
            row.remove();
            updateBulkEntryCount();
            showStatus(`Removed ${employeeName} from bulk entry`, 'info');
        }, 300);
    }
}

function updateBulkEntryCount() {
    const container = document.getElementById('bulkEntryFormContainer');
    const remainingRows = container.querySelectorAll('tr[data-employee-id]');
    const countElement = container.querySelector('p');
    
    if (countElement && remainingRows.length > 0) {
        countElement.innerHTML = `<strong>Daily Wage Employees Only</strong> (${remainingRows.length} employees remaining)`;
    }
}

function clearBulkForm() {
    if (confirm('Clear the entire bulk entry form?')) {
        document.getElementById('bulkEntryFormContainer').innerHTML = '';
    }
}


// Add this test function to debug
function testBulkSave() {
    console.log("=== TESTING BULK SAVE ===");
    console.log("Employees:", employees);
    console.log("Entries before:", entries.length);
    
    // Create a simple test entry
    const testEntry = {
        id: Date.now(),
        date: '2024-01-01',
        employee: employees[0]?.id,
        status: 'Present',
        otHours: 2,
        work: 'Test work',
        salaryAdvance: 0,
        notes: 'Test entry',
        pieceName: '',
        piecesFinished: 0,
        advanceDate: '',
        shift: ''
    };
    
    if (employees.length > 0) {
        entries.push(testEntry);
        saveEntries();
        console.log("Entries after:", entries.length);
        showStatus('Test entry added!', 'success');
    } else {
        showStatus('No employees to test with', 'error');
    }
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
        dailyWage: 900,
        pieces: [],
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
            dailyWageLabel.style.display = 'none';
            pieceRateManagement.style.display = 'block';
            pieceNameCell.style.display = 'table-cell';
            piecesFinishedCell.style.display = 'table-cell';
            pieceNameHeader.style.display = 'table-cell';
            piecesFinishedHeader.style.display = 'table-cell';
            renderPieceList(employee);
            populatePieceNameDropdown(employee);
        } else {
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

function renderPieceList(employee) {
    const container = document.getElementById('pieceListContainer');
    if (!employee.pieces || employee.pieces.length === 0) {
        container.innerHTML = '<p>No pieces defined for this employee.</p>';
        return;
    }

    let tableHTML = `<table><tr><th>Piece Name</th><th>Price</th><th>Action</th></tr>`;
    employee.pieces.forEach((piece, index) => {
        tableHTML += `
            <tr>
                <td>${piece.name}</td>
                <td>${piece.price}</td>
                <td><button onclick="deletePiece('${employee.id}', ${index})" style="background:#dc3545;">Delete</button></td>
            </tr>`;
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
        loadEmployeeSettings();
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
        loadEmployeeSettings();
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
function addEntry() {
    const employeeId = document.getElementById('employeeSelect').value;
    if (!employeeId) {
        showStatus('Please select an employee first', 'error');
        return;
    }

    const employee = employees.find(emp => emp.id === employeeId);
    const pieceName = document.getElementById('pieceNameSelect').value;
    const piecesFinished = parseFloat(document.getElementById('piecesFinished').value) || 0;

    // Convert OT hours before processing
    const otHoursInput = document.getElementById('otHours');
    
    // FIX: Use stored decimal value instead of converting again
    let otHours = 0;
    if (otHoursInput.dataset.decimalValue) {
        otHours = parseFloat(otHoursInput.dataset.decimalValue);
    } else {
        otHours = convertOThours(otHoursInput);
    }

    if (employee.paymentType === 'piece' && piecesFinished > 0 && !pieceName) {
        showStatus('Please select the piece name.', 'error');
        return;
    }

    const entry = {
        id: Date.now(),
        employee: employeeId,
        date: document.getElementById('entryDate').value,
        work: document.getElementById('workDescription').value,
        shift: document.getElementById('shift').value,
        status: document.getElementById('status').value,
        otHours: otHours,
        pieceName: pieceName,
        piecesFinished: piecesFinished,
        salaryAdvance: parseFloat(document.getElementById('salaryAdvance').value) || 0,
        advanceDate: document.getElementById('advanceDate').value,
        notes: document.getElementById('notes').value
    };

    entries.push(entry);
    saveEntries();
    loadEntries();
    document.getElementById('entryForm').reset();
    document.getElementById('entryDate').valueAsDate = new Date();
    
    // Reset OT hours display and stored values
    otHoursInput.value = '0';
    otHoursInput.dataset.originalValue = '0';
    otHoursInput.dataset.decimalValue = '0';
    
    showStatus('Entry added successfully!', 'success');
}

function loadEntries() {
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

    let tableHTML = `<table><tr><th>Date</th><th>Work</th><th>Shift</th><th>Status</th><th>OT</th><th>Piece Name</th><th>Pieces</th><th>Advance</th><th>Notes</th><th>Action</th></tr>`;
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
            </tr>`;
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

// ========== BACKUP & CLOUD FUNCTIONS ==========
function exportData() {
    const currentEntries = JSON.parse(localStorage.getItem('salaryEntries')) || [];
    const currentEmployees = JSON.parse(localStorage.getItem('salaryEmployees')) || [];

    const data = {
        entries: currentEntries,
        employees: currentEmployees,
        exportDate: new Date().toISOString(),
        app: "Star Fitness Salary Tracker",
        version: "1.1"
    };
    
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
// Working restore function
async function restoreFromCloud() {
  try {
    console.log("Starting cloud restore...");
    
    // Use JSONP for restore
    const result = await new Promise((resolve, reject) => {
      const callbackName = 'restoreCallback_' + Date.now();
      const script = document.createElement('script');
      
      window[callbackName] = function(data) {
        console.log("Received data:", data);
        delete window[callbackName];
        document.body.removeChild(script);
        resolve(data);
      };

      // Add error handling
      script.onerror = () => {
        delete window[callbackName];
        document.body.removeChild(script);
        reject(new Error('Failed to load backup data'));
      };

      script.src = CLOUD_URL + '?callback=' + callbackName;
      document.body.appendChild(script);
    });

    console.log("Parsed result:", result);

    // Check if we got valid data
    if (!result || Object.keys(result).length === 0) {
      alert("⚠️ No backup found in cloud");
      return;
    }

    if (result.error) {
      alert("❌ Error: " + result.error);
      return;
    }

    // Handle the data structure
    let restoredEntries = [];
    let restoredEmployees = [];

    if (result.entries && result.employees) {
      // New format with entries and employees
      restoredEntries = result.entries;
      restoredEmployees = result.employees;
    } else if (Array.isArray(result)) {
      // Old format - just entries array
      restoredEntries = result;
      // Try to get employees from localStorage as fallback
      const localData = JSON.parse(localStorage.getItem("salaryData") || "{}");
      restoredEmployees = localData.employees || [];
    } else {
      // Unknown format
      alert("❌ Invalid backup data format");
      return;
    }

    // Update global variables
    entries = restoredEntries;
    employees = restoredEmployees;

    // Save to localStorage using the correct keys
    localStorage.setItem("salaryEntries", JSON.stringify(entries));
    localStorage.setItem("salaryEmployees", JSON.stringify(employees));

    // Update UI - FIXED: Use loadEmployeeList() instead of loadEmployees()
    loadEmployeeList();
    loadEntries();
    
    alert(`✅ Data restored successfully!\nEntries: ${entries.length}\nEmployees: ${employees.length}`);
    
  } catch (err) {
    console.error("Restore error:", err);
    alert("❌ Failed to restore from cloud: " + err.message);
  }
}
// Keep your existing upload function (it's working)
async function uploadToCloud() {
  try {
    const data = {
      entries,
      employees,
      exportDate: new Date().toISOString(),
      app: "Star Fitness Salary Tracker",
      version: "1.1"
    };
    
    // Use a CORS proxy for POST requests
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
    alert("❌ Failed to upload to cloud: " + err.message);
  }
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

// ... (Keep your existing cloud functions as they are)

// ========== PRINT REPORT ==========
function printReport() {
    const employeeId = document.getElementById('employeeSelect').value;
    const month = document.getElementById('monthSelector').value;
    if (!employeeId) {
        showStatus('Please select an employee first', 'error');
        return;
    }

    const employee = employees.find(emp => emp.id === employeeId);
    const monthlyEntries = entries.filter(e => e.employee === employeeId && e.date.startsWith(month));

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

    } else {
        const totalDaysWorked = monthlyEntries.filter(e => e.status === 'Present').length;
        earnedWages = (totalDaysWorked * employee.dailyWage) + (totalOTHours * employee.otRate);
        summaryDetailsHTML = `
            <tr><td>Daily Wage Rate:</td><td>₹${employee.dailyWage}</td></tr>
            <tr><td>Total Days Worked:</td><td>${totalDaysWorked}</td></tr>
        `;
    }

    const netPayable = earnedWages + employee.oldBalance - totalAdvance;

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
            </tr>`;
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

function clearAllData() {
    if (confirm('⚠️ WARNING! This will delete ALL employees and entries permanently. This cannot be undone. Are you sure?')) {
        entries = [];
        employees = [];
        saveEntries();
        saveEmployees();
        location.reload();
    }
}

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', function() {
    const monthSelector = document.getElementById('monthSelector');
    const entryForm = document.getElementById('entryForm');
    const fileInput = document.getElementById('fileInput');
    const uploadCloudBtn = document.getElementById('uploadCloudBtn');
    
    if (monthSelector) {
        monthSelector.value = currentMonth;
        monthSelector.addEventListener('change', loadEntries);
    }
    
    if (entryForm) {
        entryForm.addEventListener('submit', function(e) {
            e.preventDefault();
            addEntry();
        });
    }
    
    if (fileInput) {
        fileInput.addEventListener('change', handleFileImport);
    }
    
    if (uploadCloudBtn) {
        uploadCloudBtn.addEventListener('click', uploadToCloud);
    }
    
    document.getElementById('entryDate').valueAsDate = new Date();
    loadEmployeeList();
    loadEntries();
});
