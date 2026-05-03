<?php
header("Content-Type: application/json");

$conn = new mysqli("localhost", "root", "", "smart_bracelet");

if ($conn->connect_error) {
    echo json_encode(["error" => "Connexion DB échouée"]);
    exit;
}


$attendance = [];
$sql = "SELECT e.nom, e.prenom, p.check_in, p.check_out
        FROM pointages p
        JOIN employes e ON e.id = p.employe_id
        WHERE p.date = CURDATE()";

$res = $conn->query($sql);
while($row = $res->fetch_assoc()){
    $attendance[] = $row;
}


$employees = [];
$res = $conn->query("SELECT nom, prenom, email, department FROM employes");
while($row = $res->fetch_assoc()){
    $employees[] = $row;
}


$alerts = [];
$sql = "SELECT e.nom, a.alert_message, a.niveau
        FROM alertes a
        JOIN employes e ON e.id = a.employe_id
        WHERE a.resolu = 0
        ORDER BY a.created_at DESC";

$res = $conn->query($sql);
while($row = $res->fetch_assoc()){
    $alerts[] = $row;
}


$heartRate = [];
$res = $conn->query("SELECT heart_rate FROM sante_data ORDER BY recorded_at DESC LIMIT 10");
while($row = $res->fetch_assoc()){
    $heartRate[] = $row['heart_rate'];
}


$temp = [];
$res = $conn->query("SELECT temperature FROM sante_data ORDER BY recorded_at DESC LIMIT 10");
while($row = $res->fetch_assoc()){
    $temp[] = $row['temperature'];
}

echo json_encode([
    "attendance" => $attendance,
    "employees" => $employees,
    "alerts" => $alerts,
    "heartRate" => array_reverse($heartRate),
    "temperature" => array_reverse($temp)
]);
?>
