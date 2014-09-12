<?php

// filename for the data dump tsv and sql file generated
$data = "access_log_201409101900";

// set the timezone
$timezone = new DateTimeZone('UTC');

// db connection
$db = new mysqli("localhost", "jq_hackathon", "h4ck_t3h_pl4n37", "cdn_data");

// truncate the `requests` table
$truncateSql = "TRUNCATE TABLE requests";
$db->query($truncateSql);

// get rid of the access log if it exists already
unlink($data . ".sql");

// open the text file to read
$handler = fopen($data . ".txt", "r");
$count = 0;

while ($row = fgetcsv($handler, 0, "\t")) {
  $count++;

  $now = new DateTime("now", $timezone);

  if (($count % 10000) == 0) {
    $now = $now->format("H:i:s");
    //$now = date('H:i:s');
    echo "$count rows written to $data.sql at $now\r\n";
  }

  if (($count % 1000000) == 0) {
    echo "\r\n=====================================\r\n$count rows out of about 20,000,000 written to $data.sql\r\n=====================================\r\n\r\n";
  }

  // make sure we are in UTC for all the dates
  $date = explode("T", $row[0]);
  $time = explode("+", $date[1]);
  $date = new DateTime($date[0] . " " . $time[0], $timezone);
  $row[0] = $date->getTimestamp();

  // format a couple rows
  $row[3] = str_replace('\'', '\\\'', $row[3]);
  $row[9] = str_replace('\'', '\\\'', $row[9]);
  $row[12] = str_replace('\'', '\\\'', $row[12]);

  // sql statement
  $insertSql = "INSERT INTO requests
    (time, client_ip, hostname, uri, query_string, status, cache_status, bytes, referer, user_agent, client_latitude, client_longitude, client_city, client_state, client_country)
    VALUES (FROM_UNIXTIME($row[0]), '$row[1]', '$row[2]', '$row[3]', '$row[4]', '$row[5]', '$row[6]', '$row[7]', '$row[8]', '$row[9]', '$row[10]', '$row[11]', '$row[12]', '$row[13]', '$row[14]');\r\n";

  // $db->query($insertSql) or die('failed on row' . $count . "\r\n" . $db->errno . ' ' . $db->error . "\r\n" . print_r($row));
  file_put_contents($data . ".sql", $insertSql, FILE_APPEND);
}

fclose($handler);

die("success \r\n");

?>
