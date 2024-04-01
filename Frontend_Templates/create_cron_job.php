<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Get selected schedule from the request body
    $data = json_decode(file_get_contents("php://input"), true);
    $schedule = $data['schedule'];

    if ($schedule !== 'none') {
        // Construct cron job commands for database creation and script execution
        $create_db_command = "php create_db.php";
        $run_script_command = "php run_script.php";

        // Construct cron job commands
        $cron_job_create_db = "$schedule $create_db_command";
        $cron_job_run_script = "$schedule $run_script_command";

        // Add the cron jobs to the crontab
        file_put_contents('/tmp/crontab.txt', $cron_job_create_db . PHP_EOL, FILE_APPEND);
        file_put_contents('/tmp/crontab.txt', $cron_job_run_script . PHP_EOL, FILE_APPEND);

        // Install updated crontab
        exec('crontab /tmp/crontab.txt');

        echo "Cron jobs scheduled successfully for schedule: $schedule";
    } else {
        echo "No cron jobs scheduled.";
    }
}
?>
