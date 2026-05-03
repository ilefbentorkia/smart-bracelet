const API = {
    stats: 'http://localhost/smart-bracelet-site/api/data.php',
    attendance: 'http://localhost/smart-bracelet-site/api/attendance.php',
    employees: 'http://localhost/smart-bracelet-site/api/employe.php',
    alerts: 'http://localhost/smart-bracelet-site/api/alert.php',
    health: 'http://localhost/smart-bracelet-site/api/health.php',
    dashboard: 'http://localhost/smart-bracelet-site/api/dashboard.php';
    
};

document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('live-stats')) {
        loadHomeStats();
        setInterval(loadHomeStats, 10000); 
    }
    if (document.querySelector('.dashboard-container')) {
        loadDashboardData();
        setInterval(loadDashboardData, 5000); 
    }
});

async function loadHomeStats() {
    try {
        const response = await fetch(API.stats);
        const data = await response.json();
        if (data.success) {
            document.getElementById('total-employees').textContent = data.total_employees || 0;
            document.getElementById('present-today').textContent = data.present_today || 0;
            document.getElementById('active-alerts').textContent = data.active_alerts || 0;
            document.getElementById('avg-heart-rate').textContent = data.avg_heart_rate || 0;
        }
    } catch (error) {
        console.error('Erreur stats:', error);
    }
}

async function loadDashboardData() {
    await Promise.all([
        loadAttendance(),
        loadEmployees(),
        loadAlerts(),
        loadHealthData()
    ]);
    const now = new Date();
    const updateSpan = document.getElementById('last-update-time');
    if (updateSpan) updateSpan.textContent = `Dernière mise à jour: ${now.toLocaleTimeString()}`;
}

async function loadAttendance() {
    try {
        const response = await fetch(API.attendance);
        const data = await response.json();
        const attendanceDiv = document.getElementById('attendance-list');
        if (data.success && data.attendance.length > 0) {
            let html = '<table class="attendance-table"><thead><tr><th>Employé</th><th>Arrivée</th><th>Départ</th><th>Statut</th></tr></thead><tbody>';
            data.attendance.forEach(emp => {
                html += `<tr>
                    <td><strong>${emp.name}</strong><br><small>${emp.department}</small></td>
                    <td>${emp.check_in || '--'}</td>
                    <td>${emp.check_out || '--'}</td>
                    <td><span class="status-badge ${emp.status === 'present' ? 'status-present' : 'status-absent'}">${emp.status === 'present' ? 'Présent' : 'Absent'}</span></td>
                </tr>`;
            });
            html += '</tbody></table>';
            attendanceDiv.innerHTML = html;
        } else {
            attendanceDiv.innerHTML = '<div class="loading">Aucune donnée de présence</div>';
        }
    } catch (error) {
        console.error('Erreur chargement présence:', error);
    }
}

async function loadEmployees() {
    try {
        const response = await fetch(API.employees);
        const data = await response.json();
        const employeesDiv = document.getElementById('employees-list');
        if (data.success && data.employees.length > 0) {
            let html = '';
            data.employees.forEach(emp => {
                const statusText = emp.present_today ? 'Présent' : 'Absent';
                const initials = emp.name.split(' ').map(n => n[0]).join('');
                html += `
                    <div class="employee-item">
                        <div class="employee-avatar">${initials}</div>
                        <div class="employee-info">
                            <div class="employee-name">${emp.name}</div>
                            <div class="employee-department">${emp.department} • ${emp.email}</div>
                            <div class="employee-health">
                                <i class="fas fa-heart" style="color: #e74c3c;"></i> ${emp.last_heart_rate || '--'} BPM
                                <i class="fas fa-thermometer-half" style="margin-left: 10px;"></i> ${emp.last_temperature || '--'}°C
                            </div>
                        </div>
                        <div class="employee-status">
                            <span class="status-badge status-${statusText.toLowerCase()}">${statusText}</span>
                        </div>
                    </div>
                `;
            });
            employeesDiv.innerHTML = html;
            const searchInput = document.getElementById('search-employee');
            if (searchInput) {
                searchInput.onkeyup = (e) => {
                    const term = e.target.value.toLowerCase();
                    document.querySelectorAll('.employee-item').forEach(item => {
                        const name = item.querySelector('.employee-name').textContent.toLowerCase();
                        const dept = item.querySelector('.employee-department').textContent.toLowerCase();
                        item.style.display = (name.includes(term) || dept.includes(term)) ? 'flex' : 'none';
                    });
                };
            }
        } else {
            employeesDiv.innerHTML = '<div class="loading">Aucun employé</div>';
        }
    } catch (error) {
        console.error('Erreur chargement employés:', error);
    }
}

async function loadAlerts() {
    try {
        const response = await fetch(API.alerts);
        const data = await response.json();
        const alertsDiv = document.getElementById('alerts-list');
        const alertCountSpan = document.getElementById('alert-count');
        if (data.success && data.alerts.length > 0) {
            alertCountSpan.textContent = data.alerts.length;
            let html = '';
            data.alerts.forEach(alert => {
                let alertClass = '', icon = '';
                if (alert.alert_type === 'high_heart_rate') {
                    alertClass = 'alert-critical';
                    icon = '<i class="fas fa-heartbeat"></i>';
                } else if (alert.alert_type === 'fever') {
                    alertClass = 'alert-warning';
                    icon = '<i class="fas fa-thermometer-full"></i>';
                } else {
                    alertClass = 'alert-warning';
                    icon = '<i class="fas fa-exclamation-triangle"></i>';
                }
                html += `
                    <div class="alert-item ${alertClass}">
                        <div class="alert-title">${icon} ${alert.employee_name}</div>
                        <div class="alert-message">${alert.alert_message}<br><small>${alert.created_at}</small></div>
                    </div>
                `;
            });
            alertsDiv.innerHTML = html;
        } else {
            alertCountSpan.textContent = '0';
            alertsDiv.innerHTML = '<div class="loading">Aucune alerte active</div>';
        }
    } catch (error) {
        console.error('Erreur chargement alertes:', error);
    }
}

let heartRateChart, temperatureChart;

async function loadHealthData() {
    try {
        const response = await fetch(API.health);
        const data = await response.json();
        if (data.success && data.health_data.length > 0) {
            const labels = data.health_data.map(item => item.time);
            const heartRates = data.health_data.map(item => item.heart_rate);
            const temperatures = data.health_data.map(item => item.temperature);
            
            if (heartRateChart) {
                heartRateChart.data.labels = labels;
                heartRateChart.data.datasets[0].data = heartRates;
                heartRateChart.update();
            } else {
                const ctx = document.getElementById('heartRateChart').getContext('2d');
                heartRateChart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Fréquence Cardiaque (BPM)',
                            data: heartRates,
                            borderColor: '#e74c3c',
                            backgroundColor: 'rgba(231, 76, 60, 0.1)',
                            tension: 0.4,
                            fill: true
                        }]
                    },
                    options: { responsive: true, maintainAspectRatio: true }
                });
            }
            
            if (temperatureChart) {
                temperatureChart.data.labels = labels;
                temperatureChart.data.datasets[0].data = temperatures;
                temperatureChart.update();
            } else {
                const ctx = document.getElementById('temperatureChart').getContext('2d');
                temperatureChart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Température (°C)',
                            data: temperatures,
                            borderColor: '#f39c12',
                            backgroundColor: 'rgba(243, 156, 18, 0.1)',
                            tension: 0.4,
                            fill: true
                        }]
                    },
                    options: { responsive: true, maintainAspectRatio: true }
                });
            }
        }
    } catch (error) {
        console.error('Erreur chargement données santé:', error);
    }
}
