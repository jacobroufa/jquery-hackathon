<?php

ini_set('memory_limit', '256M');

require_once 'db.php';

$count = 0;

$json = array('type' => 'FeatureCollection', 'features' => array());
$sql = "SELECT CEIL(client_latitude) AS lat, CEIL(client_longitude) AS lon, COUNT(id) AS num, GROUP_CONCAT(id SEPARATOR ',') AS ids FROM requests GROUP BY CEIL(client_latitude), CEIL(client_longitude)";
$res = $db->query($sql);

while ($row = $res->fetch_assoc()) {
  $count++;

  if (($count % 1000) == 0) {
    echo "$count rows \r\n";
  }

  $json['features'][] = array(
    'type' => 'Feature',
    'geometry' => array(
      'type' => 'Point',
      'coordinates' => array($row['lon'], $row['lat'])
    ),
    'properties' => array(
      'count' => $row['num'],
      'ids' => $row['ids']
    ));
}

file_put_contents('world-breakdown-rounded.json', json_encode($json, JSON_NUMERIC_CHECK));

?>
