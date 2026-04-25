let currentUser = null;
const STORAGE_KEY = 'ipt_demo_v1';
const api = window.apiClient;

function getDefaultData() {
    return {
        accounts: [],
        departments: [
            { id: 1, name: 'Engineering', description: 'Software development and engineering team' },
            { id: 2, name: 'HR', description: 'Human resources and recruitment' }
        ],
        employees: [],
        requests: []
    };
}

function loadFromStorage() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
            window.db = JSON.parse(data);
            if (!window.db.accounts) window.db.accounts = [];
            if (!window.db.departments) window.db.departments = [];
            if (!window.db.employees) window.db.employees = [];
            if (!window.db.requests) window.db.requests = [];
        } else {
            window.db = getDefaultData();
            saveToStorage();
        }
    } catch (e) {
        window.db = getDefaultData();
        saveToStorage();
    }
}

function saveToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(window.db));
}

function showToast(message, type) {
    type = type || 'info';
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(function() {
        toast.classList.add('toast-fade');
        setTimeout(function() { toast.remove(); }, 400);
    }, 3000);
}

function navigateTo(hash) {
    window.location.hash = hash;
}

function handleRouting() {
    let hash = window.location.hash || '#/';
    if (!hash || hash === '#') hash = '#/';

    const pageName = hash.substring(2) || 'home';
    const pageId = pageName + '-page';

    const protectedRoutes = ['profile', 'requests', 'employees', 'accounts', 'departments'];
    const adminRoutes = ['employees', 'accounts', 'departments'];

    if (protectedRoutes.includes(pageName) && !currentUser) {
        navigateTo('#/login');
        return;
    }
    if (adminRoutes.includes(pageName) && (!currentUser || currentUser.role !== 'Admin')) {
        showToast('Access Denied. Admin Only', 'error');
        navigateTo('#/profile');
        return;
    }

    document.querySelectorAll('.page').forEach(function(page) {
        page.classList.remove('active');
    });

    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
    } else {
        document.getElementById('home-page').classList.add('active');
    }

    if (pageName === 'profile' && currentUser) renderProfile();
    if (pageName === 'verify-email') {
        const email = localStorage.getItem('unverified_email');
        if (email) document.getElementById('verifyEmailDisplay').textContent = email;
    }
    if (pageName === 'accounts') renderAccountsList();
    if (pageName === 'departments') renderDepartmentsList();
    if (pageName === 'employees') renderEmployeesTable();
    if (pageName === 'requests') renderRequestsList();
}

window.addEventListener('hashchange', handleRouting);

function setAuthState(isAuth, user) {
    if (isAuth && user) {
        currentUser = user;
        document.body.classList.add('authenticated');
        document.body.classList.remove('not-authenticated');
        if (user.role === 'Admin') {
            document.body.classList.add('is-admin');
        } else {
            document.body.classList.remove('is-admin');
        }
        document.getElementById('userDropdown').textContent = user.firstName + ' ' + user.lastName + ' \u25BC';
    } else {
        currentUser = null;
        document.body.classList.remove('authenticated', 'is-admin');
        document.body.classList.add('not-authenticated');
        document.getElementById('userDropdown').textContent = 'Username \u25BC';
    }
}

// function handleRegistration() {
async function handleRegistration() {
    const firstName = document.getElementById('regFirstName').value.trim();
    const lastName = document.getElementById('regLastName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;

    if (!firstName || !lastName || !email || !password) {
        showToast('Please fill in all fields', 'error');
        return;
    }
    if (password.length < 6) {
        showToast('Password must be at least 6 characters', 'error');
        return;
    }
    try {
        await api.register({
            title: 'Mr',
            firstName: firstName,
            lastName: lastName,
            email: email,
            password: password,
            confirmPassword: password,
            role: 'User'
        });

        localStorage.setItem('unverified_email', email);
        document.getElementById('verifyEmailDisplay').textContent = email;
        document.getElementById('registerForm').reset();
        showToast('Account created! Continue to login.', 'success');
        navigateTo('#/verify-email');
    } catch (error) {
        showToast(error.message || 'Registration failed', 'error');
    }
}

function simulateEmailVerification() {
    const unverifiedEmail = localStorage.getItem('unverified_email');
    if (!unverifiedEmail) {
        showToast('No email to verify', 'error');
        return;
    }

    localStorage.removeItem('unverified_email');
    showToast('Email verification simulated. You can now login.', 'success');
    navigateTo('#/login');
}

async function handleLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const alertDiv = document.getElementById('loginAlert');
    alertDiv.innerHTML = '';

    if (!email || !password) {
        alertDiv.innerHTML = '<div class="alert alert-danger">Please fill in all fields</div>';
        return;
    }

    try {
        const result = await api.login({ email: email, password: password });
        api.setAuthToken(result.token);
        setAuthState(true, result.user);
        document.getElementById('loginForm').reset();
        alertDiv.innerHTML = '';
        showToast('Login successful!', 'success');
        if (result.user.role === 'Admin') {
            await Promise.all([
                renderAccountsList(),
                renderDepartmentsList(),
                renderEmployeesTable()
            ]);
        }
        navigateTo('#/profile');
    } catch (error) {
        alertDiv.innerHTML = '<div class="alert alert-danger">' + (error.message || 'Invalid email or password.') + '</div>';
    }
}

function handleLogout() {
    api.clearAuthToken();
    setAuthState(false);
    showToast('Logged out successfully', 'success');
    navigateTo('#/');
}

function renderProfile() {
    if (currentUser) {
        document.getElementById('profileName').textContent = currentUser.firstName + ' ' + currentUser.lastName;
        document.getElementById('profileEmail').textContent = currentUser.email;
        document.getElementById('profileRole').textContent = currentUser.role;
    }
}

let editingAccountId = null;

async function renderAccountsList() {
    const tbody = document.getElementById('accountsBody');
    tbody.innerHTML = '';
    try {
        const users = await api.getUsers();
        window.db.accounts = users.map(function(user) {
            return {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                verified: true
            };
        });
    } catch (error) {
        showToast(error.message || 'Failed to load accounts', 'error');
        return;
    }

    window.db.accounts.forEach(function(acc) {
        const tr = document.createElement('tr');
        tr.innerHTML =
            '<td>' + acc.firstName + ' ' + acc.lastName + '</td>' +
            '<td>' + acc.email + '</td>' +
            '<td>' + acc.role + '</td>' +
            '<td>' + (acc.verified ? '\u2714' : '\u2014') + '</td>' +
            '<td>' +
                '<button class="btn-sm btn-edit" data-id="' + acc.id + '">Edit</button> ' +
                '<button class="btn-sm btn-warn" data-id="' + acc.id + '">Reset PW</button> ' +
                '<button class="btn-sm btn-danger" data-id="' + acc.id + '">Delete</button>' +
            '</td>';
        tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.btn-edit').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var id = Number(btn.getAttribute('data-id'));
            editAccount(id);
        });
    });

    tbody.querySelectorAll('.btn-warn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var id = Number(btn.getAttribute('data-id'));
            resetAccountPassword(id);
        });
    });

    tbody.querySelectorAll('.btn-danger').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var id = Number(btn.getAttribute('data-id'));
            deleteAccount(id);
        });
    });
}

function showAccountForm(account) {
    document.getElementById('accountForm').style.display = 'block';
    if (account) {
        editingAccountId = account.id;
        document.getElementById('accFirstName').value = account.firstName;
        document.getElementById('accLastName').value = account.lastName;
        document.getElementById('accEmail').value = account.email;
        document.getElementById('accPassword').value = '';
        document.getElementById('accRole').value = account.role;
        document.getElementById('accVerified').checked = account.verified;
        document.getElementById('accEmail').disabled = true;
    } else {
        editingAccountId = null;
        document.getElementById('accFirstName').value = '';
        document.getElementById('accLastName').value = '';
        document.getElementById('accEmail').value = '';
        document.getElementById('accPassword').value = '';
        document.getElementById('accRole').value = 'User';
        document.getElementById('accVerified').checked = false;
        document.getElementById('accEmail').disabled = false;
    }
}

function hideAccountForm() {
    document.getElementById('accountForm').style.display = 'none';
    editingAccountId = null;
    document.getElementById('accEmail').disabled = false;
}

async function saveAccount() {
    var firstName = document.getElementById('accFirstName').value.trim();
    var lastName = document.getElementById('accLastName').value.trim();
    var email = document.getElementById('accEmail').value.trim();
    var password = document.getElementById('accPassword').value;
    var role = document.getElementById('accRole').value;
    var verified = document.getElementById('accVerified').checked;

    if (!firstName || !lastName || !email) {
        showToast('Please fill in required fields', 'error');
        return;
    }

    try {
        if (editingAccountId) {
            const updatePayload = {
                title: 'Mr',
                firstName: firstName,
                lastName: lastName,
                role: role,
                email: email
            };

            if (password && password.length >= 6) {
                updatePayload.password = password;
                updatePayload.confirmPassword = password;
            }

            await api.updateUser(editingAccountId, updatePayload);
            showToast('Account updated', 'success');
        } else {
            if (!password || password.length < 6) {
                showToast('Password must be at least 6 characters', 'error');
                return;
            }

            await api.createUser({
                title: 'Mr',
                firstName: firstName,
                lastName: lastName,
                email: email,
                password: password,
                confirmPassword: password,
                role: role,
            });
            showToast('Account created', 'success');
        }

        hideAccountForm();
        await renderAccountsList();
    } catch (error) {
        showToast(error.message || 'Failed to save account', 'error');
    }
}

function editAccount(id) {
    var acc = window.db.accounts.find(function(a) { return a.id === id; });
    if (acc) showAccountForm(acc);
}

async function resetAccountPassword(id) {
    var newPw = prompt('Enter new password (min 6 characters):');
    if (newPw && newPw.length >= 6) {
        var acc = window.db.accounts.find(function(a) { return a.id === id; });
        if (acc) {
            try {
                await api.updateUser(id, {
                    password: newPw,
                    confirmPassword: newPw,
                });
                showToast('Password reset successfully', 'success');
            } catch (error) {
                showToast(error.message || 'Password reset failed', 'error');
            }
        }
    } else if (newPw !== null) {
        showToast('Password must be at least 6 characters', 'error');
    }
}

async function deleteAccount(id) {
    if (currentUser && currentUser.id === id) {
        showToast('Cannot delete your own account', 'error');
        return;
    }
    if (confirm('Are you sure you want to delete this account?')) {
        try {
            await api.deleteUser(id);
            showToast('Account deleted', 'success');
            await renderAccountsList();
        } catch (error) {
            showToast(error.message || 'Failed to delete account', 'error');
        }
    }
}

let editingDeptId = null;

async function renderDepartmentsList() {
    var tbody = document.getElementById('departmentsBody');
    tbody.innerHTML = '';

    try {
        window.db.departments = await api.getDepartments();
    } catch (error) {
        showToast(error.message || 'Failed to load departments', 'error');
        return;
    }

    window.db.departments.forEach(function(dept) {
        var tr = document.createElement('tr');
        tr.innerHTML =
            '<td>' + dept.name + '</td>' +
            '<td>' + dept.description + '</td>' +
            '<td><button class="btn-sm btn-edit" data-id="' + dept.id + '">Edit</button> ' +
            '<button class="btn-sm btn-danger" data-id="' + dept.id + '">Delete</button></td>';
        tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.btn-edit').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var id = Number(btn.getAttribute('data-id'));
            editDept(id);
        });
    });

    tbody.querySelectorAll('.btn-danger').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var id = Number(btn.getAttribute('data-id'));
            deleteDept(id);
        });
    });
}

function showDeptForm(dept) {
    document.getElementById('departmentForm').style.display = 'block';
    if (dept) {
        editingDeptId = dept.id;
        document.getElementById('deptName').value = dept.name;
        document.getElementById('deptDescription').value = dept.description;
    } else {
        editingDeptId = null;
        document.getElementById('deptName').value = '';
        document.getElementById('deptDescription').value = '';
    }
}

function hideDeptForm() {
    document.getElementById('departmentForm').style.display = 'none';
    editingDeptId = null;
}

async function saveDept() {
    var name = document.getElementById('deptName').value.trim();
    var description = document.getElementById('deptDescription').value.trim();

    if (!name) {
        showToast('Department name is required', 'error');
        return;
    }

    try {
        if (editingDeptId) {
            await api.updateDepartment(editingDeptId, {
                name: name,
                description: description
            });
        } else {
            await api.createDepartment({
                name: name,
                description: description
            });
        }
        hideDeptForm();
        await renderDepartmentsList();
        showToast(editingDeptId ? 'Department updated' : 'Department added', 'success');
    } catch (error) {
        showToast(error.message || 'Failed to save department', 'error');
    }
}

function editDept(id) {
    var dept = window.db.departments.find(function(d) { return d.id === id; });
    if (dept) showDeptForm(dept);
}

async function deleteDept(id) {
    if (confirm('Delete this department?')) {
        try {
            await api.deleteDepartment(id);
            showToast('Department deleted', 'success');
            await renderDepartmentsList();
        } catch (error) {
            showToast(error.message || 'Failed to delete department', 'error');
        }
    }
}

function addDepartment() {
    showDeptForm(null);
}

let editingEmployeeId = null;

async function renderEmployeesTable() {
    var tbody = document.getElementById('employeesBody');
    tbody.innerHTML = '';

    try {
        const [employees, departments] = await Promise.all([
            api.getEmployees(),
            api.getDepartments()
        ]);
        window.db.employees = employees;
        window.db.departments = departments;
    } catch (error) {
        showToast(error.message || 'Failed to load employees', 'error');
        return;
    }

    window.db.employees.forEach(function(emp) {
        var dept = window.db.departments.find(function(d) { return d.id === emp.deptId; });
        var tr = document.createElement('tr');
        tr.innerHTML =
            '<td>' + emp.employeeId + '</td>' +
            '<td>' + emp.email + '</td>' +
            '<td>' + emp.position + '</td>' +
            '<td>' + (dept ? dept.name : 'N/A') + '</td>' +
            '<td>' +
                '<button class="btn-sm btn-edit" data-id="' + emp.id + '">Edit</button> ' +
                '<button class="btn-sm btn-danger" data-id="' + emp.id + '">Delete</button>' +
            '</td>';
        tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.btn-edit').forEach(function(btn) {
        btn.addEventListener('click', function() {
            editEmployee(Number(btn.getAttribute('data-id')));
        });
    });
    tbody.querySelectorAll('.btn-danger').forEach(function(btn) {
        btn.addEventListener('click', function() {
            deleteEmployee(Number(btn.getAttribute('data-id')));
        });
    });

    populateDeptDropdown();
}

function populateDeptDropdown() {
    var select = document.getElementById('empDept');
    select.innerHTML = '<option value="">Select Department</option>';
    window.db.departments.forEach(function(d) {
        var opt = document.createElement('option');
        opt.value = d.id;
        opt.textContent = d.name;
        select.appendChild(opt);
    });
}

function showEmployeeForm(emp) {
    document.getElementById('employeeForm').style.display = 'block';
    populateDeptDropdown();

    if (emp !== undefined && emp !== null) {
        editingEmployeeId = emp.id;
        document.getElementById('empId').value = emp.employeeId;
        document.getElementById('empEmail').value = emp.email;
        document.getElementById('empPosition').value = emp.position;
        document.getElementById('empDept').value = emp.deptId;
        document.getElementById('empHireDate').value = emp.hireDate || '';
    } else {
        editingEmployeeId = null;
        document.getElementById('empId').value = '';
        document.getElementById('empEmail').value = '';
        document.getElementById('empPosition').value = '';
        document.getElementById('empDept').value = '';
        document.getElementById('empHireDate').value = '';
    }
}

function hideEmployeeForm() {
    document.getElementById('employeeForm').style.display = 'none';
    editingEmployeeId = null;
}

async function saveEmployee() {
    var employeeId = document.getElementById('empId').value.trim();
    var email = document.getElementById('empEmail').value.trim();
    var position = document.getElementById('empPosition').value.trim();
    var deptId = Number(document.getElementById('empDept').value);
    var hireDate = document.getElementById('empHireDate').value;

    if (!employeeId || !email || !position || !deptId) {
        showToast('Please fill in all fields', 'error');
        return;
    }

    var empData = {
        employeeId: employeeId,
        email: email,
        position: position,
        deptId: deptId,
        hireDate: hireDate || null
    };

    try {
        if (editingEmployeeId !== null) {
            await api.updateEmployee(editingEmployeeId, empData);
            showToast('Employee updated', 'success');
        } else {
            await api.createEmployee(empData);
            showToast('Employee added', 'success');
        }

        hideEmployeeForm();
        await renderEmployeesTable();
    } catch (error) {
        showToast(error.message || 'Failed to save employee', 'error');
    }
}

function editEmployee(id) {
    var emp = window.db.employees.find(function(e) { return e.id === id; });
    if (emp) showEmployeeForm(emp);
}

async function deleteEmployee(id) {
    if (confirm('Delete this employee?')) {
        try {
            await api.deleteEmployee(id);
            showToast('Employee deleted', 'success');
            await renderEmployeesTable();
        } catch (error) {
            showToast(error.message || 'Failed to delete employee', 'error');
        }
    }
}

async function renderRequestsList() {
    var container = document.getElementById('requestsContent');
    container.innerHTML = '';

    if (!currentUser) return;

    var isAdmin = currentUser.role === 'Admin';
    var userRequests = [];

    try {
        userRequests = await api.getRequests();
        window.db.requests = userRequests;
    } catch (error) {
        container.innerHTML = '<p>Failed to load requests.</p>';
        showToast(error.message || 'Failed to load requests', 'error');
        return;
    }

    if (userRequests.length === 0) {
        container.innerHTML = '<p>No requests found.' + (isAdmin ? '' : ' Click "+ New Request" to create one.') + '</p>';
        return;
    }

    var table = document.createElement('table');
    var headerHtml = '<thead><tr>' +
            '<th>Date</th><th>Type</th><th>Items</th><th>Status</th>';
    if (isAdmin) {
        headerHtml += '<th>Employee Email</th><th>Actions</th>';
    }
    headerHtml += '</tr></thead>';
    table.innerHTML = headerHtml;
    var tbody = document.createElement('tbody');

    userRequests.forEach(function(req) {
        var tr = document.createElement('tr');
        var itemsList = req.items.map(function(i) { return i.name + ' (x' + i.qty + ')'; }).join(', ');
        var badgeClass = 'badge-warning';
        if (req.status === 'Approved') badgeClass = 'badge-success';
        if (req.status === 'Rejected') badgeClass = 'badge-danger';

        var rowHtml = '<td>' + req.date + '</td>' +
            '<td>' + req.type + '</td>' +
            '<td>' + itemsList + '</td>' +
            '<td><span class="badge ' + badgeClass + '">' + req.status + '</span></td>';

        if (isAdmin) {
            rowHtml += '<td>' + req.employeeEmail + '</td>';
            var actionsHtml = '';
            if (req.status === 'Pending') {
                actionsHtml = '<button class="btn-sm btn-success approve-btn" data-req-id="' + req.id + '">Approve</button>' +
                              '<button class="btn-sm btn-danger reject-btn" data-req-id="' + req.id + '">Reject</button>';
            }
            rowHtml += '<td>' + actionsHtml + '</td>';
        }

        tr.innerHTML = rowHtml;
        tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    container.appendChild(table);

    if (isAdmin) {
        tbody.querySelectorAll('.approve-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var reqId = Number(btn.getAttribute('data-req-id'));
                approveRequest(reqId);
            });
        });

        tbody.querySelectorAll('.reject-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var reqId = Number(btn.getAttribute('data-req-id'));
                rejectRequest(reqId);
            });
        });
    }
}

async function approveRequest(reqId) {
    try {
        await api.setRequestStatus(reqId, 'Approved');
        await renderRequestsList();
        showToast('Request approved', 'success');
    } catch (error) {
        showToast(error.message || 'Failed to approve request', 'error');
    }
}

async function rejectRequest(reqId) {
    try {
        await api.setRequestStatus(reqId, 'Rejected');
        await renderRequestsList();
        showToast('Request rejected', 'error');
    } catch (error) {
        showToast(error.message || 'Failed to reject request', 'error');
    }
}

function openRequestModal() {
    document.getElementById('requestModal').style.display = 'flex';
    document.getElementById('requestItems').innerHTML = '';
    addRequestItem();
}

function closeRequestModal() {
    document.getElementById('requestModal').style.display = 'none';
}

function addRequestItem() {
    var container = document.getElementById('requestItems');
    var div = document.createElement('div');
    div.className = 'request-item-row';
    div.innerHTML =
        '<input type="text" placeholder="Item name" class="req-item-name">' +
        '<input type="number" placeholder="Qty" min="1" value="1" class="req-item-qty">' +
        '<button type="button" class="btn-sm btn-danger remove-item-btn">\u00D7</button>';
    container.appendChild(div);

    div.querySelector('.remove-item-btn').addEventListener('click', function() {
        div.remove();
    });
}

async function submitRequest() {
    var type = document.getElementById('requestType').value;
    var itemRows = document.querySelectorAll('#requestItems .request-item-row');
    var items = [];

    itemRows.forEach(function(row) {
        var name = row.querySelector('.req-item-name').value.trim();
        var qty = parseInt(row.querySelector('.req-item-qty').value) || 0;
        if (name && qty > 0) {
            items.push({ name: name, qty: qty });
        }
    });

    if (items.length === 0) {
        showToast('Please add at least one item', 'error');
        return;
    }

    try {
        await api.createRequest({
            type: type,
            items: items
        });
        closeRequestModal();
        showToast('Request submitted', 'success');
        await renderRequestsList();
    } catch (error) {
        showToast(error.message || 'Failed to submit request', 'error');
    }
}

document.addEventListener('DOMContentLoaded', function() {

    loadFromStorage();

    var savedToken = localStorage.getItem('auth_token');
    if (savedToken) {
        api.me()
            .then(async function(result) {
                setAuthState(true, result.user);
                if (result.user.role === 'Admin') {
                    await Promise.all([
                        renderAccountsList(),
                        renderDepartmentsList(),
                        renderEmployeesTable()
                    ]);
                }
            })
            .catch(function() {
                api.clearAuthToken();
                setAuthState(false);
            });
    }

    if (!window.location.hash || window.location.hash === '#') {
        window.location.hash = '#/';
    }
    handleRouting();

    var dropdown = document.querySelector('.dropdown');
    var toggle = document.getElementById('userDropdown');
    if (toggle) {
        toggle.addEventListener('click', function(e) {
            e.preventDefault();
            dropdown.classList.toggle('open');
        });
        document.addEventListener('click', function(e) {
            if (!dropdown.contains(e.target)) {
                dropdown.classList.remove('open');
            }
        });
    }

    document.getElementById('registerForm').addEventListener('submit', function(e) {
        e.preventDefault();
        handleRegistration();
    });

    document.getElementById('simulateVerifyBtn').addEventListener('click', simulateEmailVerification);

    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        handleLogin();
    });

    document.getElementById('logoutBtn').addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        handleLogout();
    });

    document.getElementById('addAccountBtn').addEventListener('click', function() { showAccountForm(null); });
    document.getElementById('saveAccountBtn').addEventListener('click', saveAccount);
    document.getElementById('cancelAccountBtn').addEventListener('click', hideAccountForm);

    document.getElementById('addDeptBtn').addEventListener('click', addDepartment);
    document.getElementById('saveDeptBtn').addEventListener('click', saveDept);
    document.getElementById('cancelDeptBtn').addEventListener('click', hideDeptForm);

    document.getElementById('addEmployeeBtn').addEventListener('click', function() { showEmployeeForm(null); });
    document.getElementById('saveEmployeeBtn').addEventListener('click', saveEmployee);
    document.getElementById('cancelEmployeeBtn').addEventListener('click', hideEmployeeForm);

    document.getElementById('newRequestBtn').addEventListener('click', openRequestModal);
    document.getElementById('closeRequestModal').addEventListener('click', closeRequestModal);
    document.getElementById('addRequestItemBtn').addEventListener('click', addRequestItem);
    document.getElementById('submitRequestBtn').addEventListener('click', submitRequest);

    document.addEventListener('click', function () {
        const toastContainer = document.getElementById('toastContainer');
        if (toastContainer) {
            toastContainer.innerHTML = '';
        }
    });
});