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

        // Remove existing crontab
        exec('crontab -r');

        // Add the new cron jobs to the crontab
        file_put_contents('/var/www/crontab.txt', $cron_job_create_db . PHP_EOL, FILE_APPEND);
        file_put_contents('/var/www/crontab.txt', $cron_job_run_script . PHP_EOL, FILE_APPEND);

        // Install updated crontab
        exec('crontab /var/www/crontab.txt');

        echo "Cron jobs scheduled successfully for schedule: $schedule";
    } else {
        // Remove existing crontab if schedule is set to 'none'
        exec('crontab -r');
        echo "No cron jobs scheduled.";
    }
}
?>
