// ========== GLOBAL VARIABLES ==========
let entries = JSON.parse(localStorage.getItem('salaryEntries')) || [];
let employees = JSON.parse(localStorage.getItem('salaryEmployees')) || [];
let currentMonth = new Date().toISOString().slice(0, 7);
let editingEntryId = null;




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
function deleteEmployee() {
    const employeeId = document.getElementById('employeeSelect').value;

    if (!employeeId) {
        showStatus('Please select an employee first', 'error');
        return;
    }

    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee) return;

    const confirmMsg =
        `⚠️ Delete employee "${employee.name}"?\n\n` +
        `This will also delete ALL salary entries of this employee.\n` +
        `This action cannot be undone.`;

    if (!confirm(confirmMsg)) return;

    // Remove employee
    employees = employees.filter(emp => emp.id !== employeeId);

    // Remove related entries
    entries = entries.filter(entry => entry.employee !== employeeId);

    saveEmployees();
    saveEntries();

    loadEmployeeList();
    document.getElementById('wageSettingsSection').style.display = 'none';
    document.getElementById('entriesList').innerHTML = '';

    showStatus(`Employee "${employee.name}" deleted successfully`, 'success');
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    // Return dd/mm/yyyy for en-IN
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
}

function showStatus(message, type) {
    const statusDiv = document.getElementById('statusMessage');
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    statusDiv.style.display = 'block';
    setTimeout(() => { statusDiv.style.display = 'none'; }, 4000);
}

// ========== OT HOURS CONVERSION ==========
function convertOThours(inputElement) {
    let value = (inputElement.value || '').toString().trim();

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

            inputElement.dataset.originalValue = value;
            inputElement.dataset.decimalValue = totalHours.toFixed(2);
            inputElement.value = totalHours.toFixed(2);
            return totalHours;
        }

        // Normal conversion
        const decimalMinutes = minutes / 60;
        const totalHours = hours + decimalMinutes;

        inputElement.dataset.originalValue = value;
        inputElement.dataset.decimalValue = totalHours.toFixed(2);
        inputElement.value = totalHours.toFixed(2);

        return totalHours;
    }

    // If it's just a whole number, treat as hours with zero minutes
    const wholeHours = parseInt(value) || 0;

    inputElement.dataset.originalValue = value;
    inputElement.dataset.decimalValue = wholeHours.toFixed(2);
    inputElement.value = wholeHours.toFixed(2);

    return wholeHours;
}

function convertBulkOThours(inputElement) {
    let value = (inputElement.value || '').toString().trim();

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
function formatHoursAsTime(decimalHours) {
    if (!decimalHours || decimalHours === 0) return '0h';

    const hours = Math.floor(decimalHours);
    const minutes = Math.round((decimalHours - hours) * 60);

    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
}

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
function loadBulkEntryForm() {
    const date = document.getElementById('bulkEntryDate').value;
    if (!date) {
        showStatus('Please select a date first', 'error');
        return;
    }

   const dailyWageEmployees = employees
    .filter(emp => emp.paymentType === 'daily')
    .sort((a, b) => a.name.localeCompare(b.name));


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
                <th>Total Hours Worked</th>
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
                    <input type="text"
       class="bulk-total-hours"
       value="0"
       placeholder="8.30 = 8h 30m"
       style="width: 90px;">

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
    <button type="button" onclick="markAllBulkStatus('Present')" style="background:#28a745;">✅ Mark All Present</button>
    <button type="button" onclick="markAllBulkStatus('Absent')" style="background:#dc3545;">❌ Mark All Absent</button>
    <br><br>
    <button type="button" id="saveBulkEntriesBtn" style="background:#007bff;">💾 Save All Entries</button>
    <button type="button" id="clearBulkFormBtn" style="background:#6c757d;">🗑️ Clear Form</button>
</div>
`;

    container.innerHTML = formHTML;

    // Add event listeners
    const saveBtn = document.getElementById('saveBulkEntriesBtn');
    const clearBtn = document.getElementById('clearBulkFormBtn');

    if (saveBtn) saveBtn.addEventListener('click', saveBulkEntries);
    if (clearBtn) clearBtn.addEventListener('click', clearBulkForm);

    // Add real-time OT conversion
    container.addEventListener('blur', function(e) {
if (e.target.classList.contains('bulk-total-hours')) {
    convertBulkOThours(e.target);
}
    }, true);

    container.addEventListener('click', function(e) {
        if (e.target.classList.contains('remove-bulk-btn')) {
            removeEmployeeFromBulk(e.target);
        }
    });
}

function calculateBulkStatusAndOT(totalHours) {
    totalHours = parseFloat(totalHours) || 0;

    if (totalHours >= 8) {
        return {
            status: 'Present',
            otHours: totalHours - 8
        };
    } else {
        return {
            status: 'Absent',
            otHours: totalHours
        };
    }
}

function markAllBulkStatus(status) {
    document.querySelectorAll('.bulk-status').forEach(select => {
        select.value = status;
    });

    document.querySelectorAll('.bulk-total-hours').forEach(input => {
        if (status === 'Absent') input.value = '0';
        if (status === 'Present' && input.value === '0') input.value = '8';
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

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const employeeId = row.dataset.employeeId;
        const employee = employees.find(emp => emp.id === employeeId);
        if (!employee) continue;

        // 👉 TOTAL HOURS INPUT
        const totalHoursInput = row.querySelector('.bulk-total-hours');

        let totalHours = 0;
        if (totalHoursInput.dataset.decimalValue) {
            totalHours = parseFloat(totalHoursInput.dataset.decimalValue);
        } else {
            totalHours = convertBulkOThours(totalHoursInput);
        }

        // 👉 AUTO CALCULATE STATUS + OT
        const result = calculateBulkStatusAndOT(totalHours);
        const status = result.status;
        const otHours = result.otHours;

        // OPTIONAL: skip completely zero rows
        if (totalHours === 0 && status === 'Absent') {
            continue;
        }

        const workDescription =
            row.querySelector('.bulk-work')?.value.trim() || '';

        const salaryAdvance =
            parseFloat(row.querySelector('.bulk-advance')?.value) || 0;

        const notes =
            row.querySelector('.bulk-notes')?.value.trim() || '';

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
        showStatus('No valid entries to save.', 'warning');
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

    // *** MONTHLY - include monthly fields if paymentType === 'monthly'
    const newEmployee = {
        id: id,
        name: name,
        paymentType: paymentType, // 'daily' | 'piece' | 'monthly'
        dailyWage: 900,
        pieces: [],
        otRate: otRate,
        oldBalance: 0,
        // monthly-specific defaults
        monthlySalary: paymentType === 'monthly' ? 15000 : undefined,
        manualAbsentDays: paymentType === 'monthly' ? 0 : undefined
    };

    // Ensure dailyWage is set for monthly as monthly/30
    if (paymentType === 'monthly') {
        newEmployee.dailyWage = parseFloat((newEmployee.monthlySalary / 30).toFixed(2));
    }

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
            // piece UI
            dailyWageLabel.style.display = 'none';
            pieceRateManagement.style.display = 'block';
            pieceNameCell.style.display = 'table-cell';
            piecesFinishedCell.style.display = 'table-cell';
            pieceNameHeader.style.display = 'table-cell';
            piecesFinishedHeader.style.display = 'table-cell';
            renderPieceList(employee);
            populatePieceNameDropdown(employee);
        } else if (employee.paymentType === 'monthly') {
            // *** MONTHLY - Show monthly salary, computed daily (monthly/30), and manual absent input
            dailyWageLabel.style.display = 'block';
            pieceRateManagement.style.display = 'none';
            pieceNameCell.style.display = 'none';
            piecesFinishedCell.style.display = 'none';
            pieceNameHeader.style.display = 'none';
            piecesFinishedHeader.style.display = 'none';

            // Build the monthly UI inside the dailyWageLabel element
            const monthlySalaryVal = employee.monthlySalary ? employee.monthlySalary : 0;
            const computedDaily = (monthlySalaryVal / 30) || 0;

            dailyWageLabel.innerHTML = `
                Monthly Salary: <input type="number" id="monthlySalary" value="${monthlySalaryVal}" step="0.01">
                <br>
                Daily (monthly/30): <input type="number" id="dailyWage" value="${computedDaily.toFixed(2)}" step="0.01" disabled>
                <br>
                Days Absent (manual override): <input type="number" id="manualAbsentDays" value="${employee.manualAbsentDays || 0}" min="0" max="30">
            `;
        } else {
            // daily wage UI
            dailyWageLabel.style.display = 'block';
            pieceRateManagement.style.display = 'none';
            dailyWageLabel.innerHTML = 'Daily Wage: <input type="number" id="dailyWage" value="' + (employee.dailyWage || 900) + '">';
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
            const dailyVal = parseFloat(document.getElementById('dailyWage').value) || 0;
            employee.dailyWage = dailyVal;
        } else if (employee.paymentType === 'monthly') {
            // *** MONTHLY - save monthly salary and derived daily wage and manual absent days
            const monthlyVal = parseFloat(document.getElementById('monthlySalary').value) || 0;
            const manualAbsent = parseInt(document.getElementById('manualAbsentDays').value) || 0;
            employee.monthlySalary = monthlyVal;
            employee.dailyWage = parseFloat((monthlyVal / 30).toFixed(2));
            employee.manualAbsentDays = manualAbsent;
            // update the readonly dailyWage input to reflect change
            const dw = document.getElementById('dailyWage');
            if (dw) dw.value = employee.dailyWage;
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

    if (editingEntryId) {
    const index = entries.findIndex(e => e.id === editingEntryId);
    if (index !== -1) {
        entries[index] = { ...entry, id: editingEntryId };
        showStatus('Entry updated successfully!', 'success');
    }
    editingEntryId = null;
} else {
    entries.push(entry);
    showStatus('Entry added successfully!', 'success');
}

    saveEntries();
    loadEntries();
    document.getElementById('entryForm').reset();
    document.getElementById('entryDate').valueAsDate = new Date();

    // Reset OT hours display and stored values
    otHoursInput.value = '0';
    otHoursInput.dataset.originalValue = '0';
    otHoursInput.dataset.decimalValue = '0';
editingEntryId = null;

    showStatus('Entry added successfully!', 'success');
}
function editEntry(entryId) {
    const entry = entries.find(e => e.id === entryId);
    if (!entry) return;

    editingEntryId = entryId;

    document.getElementById('entryDate').value = entry.date;
    document.getElementById('workDescription').value = entry.work || '';
    document.getElementById('shift').value = entry.shift || '';
    document.getElementById('status').value = entry.status || 'Present';
    document.getElementById('salaryAdvance').value = entry.salaryAdvance || 0;
    document.getElementById('advanceDate').value = entry.advanceDate || '';
    document.getElementById('notes').value = entry.notes || '';

    // OT hours
    const otInput = document.getElementById('otHours');
    otInput.value = entry.otHours || 0;
    otInput.dataset.decimalValue = entry.otHours || 0;

    // Piece data
    document.getElementById('pieceNameSelect').value = entry.pieceName || '';
    document.getElementById('piecesFinished').value = entry.piecesFinished || 0;

    showStatus('Editing entry — make changes and click Add Entry to save', 'info');
}

function loadEntries() {
    const month = document.getElementById('monthSelector').value;
    const employeeId = document.getElementById('employeeSelect').value;

    if (!employeeId) {
        document.getElementById('entriesList').innerHTML = '<p>Please select an employee to see entries.</p>';
        return;
    }

    // If month is empty, fallback to currentMonth
    const effectiveMonth = month || currentMonth;

    const monthlyEntries = entries
        .filter(entry => entry.employee === employeeId && entry.date.startsWith(effectiveMonth))
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
                <td>
    <button onclick="editEntry(${entry.id})" style="background:#ffc107; color:black;">
        ✏️ Edit
    </button>
    <button onclick="deleteEntry(${entry.id})" style="background:#dc3545;">
        🗑️ Delete
    </button>
</td>

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

// ========== BACKUP FUNCTIONS ==========
function exportData() {
    const currentEntries = JSON.parse(localStorage.getItem('salaryEntries')) || [];
    const currentEmployees = JSON.parse(localStorage.getItem('salaryEmployees')) || [];

    const data = {
        entries: currentEntries,
        employees: currentEmployees,
        exportDate: new Date().toISOString(),
        app: "Star Fitness Salary Tracker",
        version: "1.2"
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

// ========== PRINT REPORT ==========

function calculateDailyHours(entry) {
    if (entry.status !== 'Present') return 0;
    const ot = parseFloat(entry.otHours) || 0;
    return 8 + ot;
}


function formatHoursToHM(decimalHours) {
    if (!decimalHours || decimalHours <= 0) return '0:00';

    const hours = Math.floor(decimalHours);
    const minutes = Math.round((decimalHours - hours) * 60);

    return `${hours}:${minutes.toString().padStart(2, '0')}`;
}


function printReport() {
    const employeeId = document.getElementById('employeeSelect').value;
    const month = document.getElementById('monthSelector').value;
    if (!employeeId) {
        showStatus('Please select an employee first', 'error');
        return;
    }

    const effectiveMonth = month || currentMonth;
    const employee = employees.find(emp => emp.id === employeeId);
    const monthlyEntries = entries.filter(e => e.employee === employeeId && e.date.startsWith(effectiveMonth));

    // Ensure numeric sum for OT hours
    const totalOTHours = monthlyEntries.reduce((sum, e) => sum + (parseFloat(e.otHours) || 0), 0);
    const totalMonthlyHours = monthlyEntries.reduce((sum, e) => {
    return sum + calculateDailyHours(e);
}, 0);

    const totalAdvance = monthlyEntries.reduce((sum, e) => sum + (parseFloat(e.salaryAdvance) || 0), 0);
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

    } else if (employee.paymentType === 'monthly') {
        // *** MONTHLY - salary calculation based on entries or manual absent days
        const monthlyDays = 30; // using fixed 30 as per requirement
        // Count present days from entries if available
        const presentDaysFromEntries = monthlyEntries.filter(e => e.status === 'Present').length;
        const absentDaysFromEntries = monthlyEntries.filter(e => e.status === 'Absent').length;

        // Decide which source to use for days:
        // If user has entered any entry data for this month (present OR absent), prefer entries.
        // Otherwise, use manualAbsentDays if set.
        let presentDays = 0;
        let absentDays = 0;
        if (monthlyEntries.length > 0) {
            presentDays = presentDaysFromEntries;
            absentDays = absentDaysFromEntries;
        } else {
            absentDays = parseInt(employee.manualAbsentDays || 0);
            if (absentDays < 0) absentDays = 0;
            if (absentDays > monthlyDays) absentDays = monthlyDays;
            presentDays = monthlyDays - absentDays;
        }

        const dailyRate = parseFloat(employee.dailyWage || (employee.monthlySalary ? (employee.monthlySalary/30) : 0));
        const monthlyBase = parseFloat(employee.monthlySalary || 0);

        earnedWages = (presentDays * dailyRate) + (totalOTHours * employee.otRate);

        summaryDetailsHTML = `
            <tr><td>Monthly Salary:</td><td>₹${monthlyBase.toFixed(2)}</td></tr>
            <tr><td>Daily (Monthly/30):</td><td>₹${dailyRate.toFixed(2)}</td></tr>
            <tr><td>Days Present:</td><td>${presentDays}</td></tr>
            <tr><td>Days Absent:</td><td>${absentDays}</td></tr>
            <tr><td>Total OT Hours:</td><td>${totalOTHours.toFixed(2)}</td></tr>
        `;

        // New: Total Hours Worked (for monthly employees it's useful too)
        // const totalHoursWorked = (presentDays * 8) + totalOTHours;
        // summaryDetailsHTML += `<tr><td>Total Hours Worked:</td><td>${totalHoursWorked.toFixed(2)} hours</td></tr>`;

    } else {
        // default: daily wage calculation (existing behavior)
        const totalDaysWorked = monthlyEntries.filter(e => e.status === 'Present').length;
        earnedWages = (totalDaysWorked * employee.dailyWage) + (totalOTHours * employee.otRate);
        summaryDetailsHTML = `
            <tr><td>Daily Wage Rate:</td><td>₹${employee.dailyWage}</td></tr>
            <tr><td>Total Days Worked:</td><td>${totalDaysWorked}</td></tr>
            <tr><td>Total OT Hours:</td><td>${totalOTHours.toFixed(2)}</td></tr>
            <tr>
    <td><b>Total Hours Worked (Month):</b></td>
    <td><b>${formatHoursToHM(totalMonthlyHours)}</b></td>

</tr>

        `;

        // NEW: Total Hours Worked for daily employees
        // const totalHoursWorked = (totalDaysWorked * 8) + totalOTHours;
        // summaryDetailsHTML += `<tr><td>Total Hours Worked:</td><td>${totalHoursWorked.toFixed(2)} hours</td></tr>`;
    }

    const netPayable = earnedWages + (employee.oldBalance || 0) - totalAdvance;

    let reportHTML = `
        <div class="print-header">
            <h2>STAR FITNESS EQUIPMENT MANUFACTURER</h2>
            <p><strong>Salary Sheet for: ${employee.name} - ${effectiveMonth}</strong></p>
        </div>
        <table>
            <tr>
    <th>Date</th>
    <th>Work</th>
    <th>Status</th>
    <th>OT</th>
    <th>Hours Worked</th>
    <th>Piece Name</th>
    <th>Pieces</th>
    <th>Advance</th>
    <th>Notes</th>
</tr>
`;

    monthlyEntries.sort((a,b) => new Date(a.date) - new Date(b.date)).forEach(entry => {
const dailyHours = calculateDailyHours(entry);
reportHTML += `
<tr>
    <td>${formatDate(entry.date)}</td>
    <td>${entry.work || '-'}</td>
    <td>${entry.status}</td>
    <td>${entry.otHours}</td>
    <td>${formatHoursToHM(dailyHours)}</td>
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
                <tr><td><b>Total Earned from Work:</b></td><td><b>₹${earnedWages.toFixed(2)}</b></td></tr>
                <tr><td>Total Advance Given:</td><td>₹${totalAdvance.toFixed(2)}</td></tr>
                <tr><td>Old Balance:</td><td>₹${(employee.oldBalance || 0).toFixed(2)}</td></tr>
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

    document.getElementById('entryDate').valueAsDate = new Date();
    loadEmployeeList();
    loadEntries();
});


