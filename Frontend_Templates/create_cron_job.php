<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Get selected schedule from the request body
    $data = json_decode(file_get_contents("php://input"), true);
    $schedule = $data['schedule'];

    if ($schedule !== 'none') {
        // Construct cron job commands for database creation and script execution
        $create_db_command = "cd /var/www/html/Frontend_Templates && php create_db.php >> /var/www/cron_log.txt 2>&1";
        $run_script_command = "cd /var/www/html/Frontend_Templates && php run_script.php >> /var/www/cron_log.txt 2>&1";

        // Construct cron job commands
        $cron_job_create_db = "$schedule $create_db_command";
        $cron_job_run_script = "$schedule $run_script_command";

        // Specify the directory for the crontab.txt file
        $crontab_file_path = '../../crontab.txt'; // Adjust as needed

        // Add the new cron jobs to the crontab
        file_put_contents($crontab_file_path, $cron_job_create_db . PHP_EOL);
        file_put_contents($crontab_file_path, $cron_job_run_script . PHP_EOL, FILE_APPEND);

        // Install updated crontab
        $output = shell_exec("crontab $crontab_file_path");
        
        echo "Cron jobs scheduled successfully for schedule: $schedule";
    } else {
        // Remove existing crontab if schedule is set to 'none'
        exec('crontab -r');
        echo "No cron jobs scheduled.";
    }
}
?>
