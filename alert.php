<?php
require_once 'config.php';
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

try {
    $stmt = $pdo->query("
        SELECT a.*, e.nom, e.prenom, e.department
        FROM alertes a
        JOIN employes e ON a.employe_id = e.id
        WHERE a.resolu = FALSE
        ORDER BY a.created_at DESC
        LIMIT 20
    ");
    $alerts = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $result = [];
    foreach ($alerts as $alert) {
        $result[] = [
            'employee_name' => $alert['prenom'] . ' ' . $alert['nom'],
            'alert_type' => $alert['alert_type'],
            'alert_message' => $alert['alert_message'],
            'created_at' => date('d/m/Y H:i', strtotime($alert['created_at']))
        ];
    }
    
    echo json_encode(['success' => true, 'alerts' => $result]);
} catch(Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>
