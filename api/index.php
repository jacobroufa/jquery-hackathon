<?php

require_once 'vendor/autoload.php';
require_once 'db.php';

$api = new \Slim\Slim();

$api->response->headers->set('Content-Type', 'application/json');

$api->get('/no', function() {

die('shut up');

});

$api->get('/versions/:number', function($number = null) use ($db) {

  $sql = "SELECT DISTINCT(uri) FROM requests WHERE uri LIKE '%\.js%'";

  if ($number != "all") {
    $number = addslashes($number);
    $sql = "$sql AND uri LIKE '%$number%'";
  }

  $res = $db->query($sql);

  if ($res) {
    print_r($res);
  }

});

$api->get('/referer/:string', function($string) use ($db) {

  $sql = "SELECT DISTINCT(referer) FROM requests";

  if ($string == 'porn') {
    $sql = "$sql WHERE referer LIKE '%xxx%'";
  }

  if ($string == 'shame') {
    $sql = "$sql WHERE uri LIKE '%-latest%'";
  }

  $res = $db->query($sql);

  if ($res) {
    print_r($res);
  }

});

$api->post('/ids', function() use ($db) {
  $ids = $_POST['ids'];
  $json = array();

  $sql = "SELECT * FROM requests WHERE id IN($ids)";
  $res = $db->query($sql);

  while ($row = $res->fetch_assoc()) {
    $json[] = $row;
  }

  echo json_encode($json, JSON_NUMERIC_CHECK);
});

$api->get('/world-breakdown', function() use ($db) {
  $json = array('type' => 'FeatureCollection', 'features' => array());
  $sql = "SELECT client_latitude AS lat, client_longitude AS lon, COUNT(id) AS num, GROUP_CONCAT(id SEPARATOR ',') AS ids FROM requests GROUP BY client_latitude, client_longitude";
  $res = $db->query($sql);

  while ($row = $res->fetch_assoc()) {
    $json['features'][] = array(
      'type' => 'Feature',
      'geometry' => array(
        'type' => 'Point',
        'coordinates' => array($row['lat'], $row['lon'])
      ),
      'properties' => array(
        'ids' => $row['ids']
      ));
  }

  echo json_encode($json, JSON_NUMERIC_CHECK);
});

$api->run();

?>
