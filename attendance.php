<?php
require_once 'config.php';
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

try {
    $stmt = $pdo->query("
        SELECT e.id, e.nom, e.prenom, e.department, p.check_in, p.check_out,
               CASE WHEN p.id IS NOT NULL THEN 'present' ELSE 'absent' END as status
        FROM employes e
        LEFT JOIN pointages p ON e.id = p.employe_id AND p.date = CURDATE()
        ORDER BY e.nom
    ");
    $attendance = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
   
    $result = [];
    foreach ($attendance as $a) {
        $result[] = [
            'name' => $a['prenom'] . ' ' . $a['nom'],
            'department' => $a['department'],
            'check_in' => $a['check_in'] ? substr($a['check_in'], 0, 5) : null,
            'check_out' => $a['check_out'] ? substr($a['check_out'], 0, 5) : null,
            'status' => $a['status']
        ];
    }
    
    echo json_encode(['success' => true, 'attendance' => $result]);
} catch(Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>
