// main_page.js

document.addEventListener("DOMContentLoaded", function() {
    const showDevicesButton = document.getElementById('showDevicesButton');

    showDevicesButton.addEventListener('click', startDevicePopulation);

    const modeToggle = document.getElementById('modeToggle');
    const modeLabel = document.getElementById('toggleLabel');
    const slider = document.getElementById('slider');

    modeToggle.checked = false;
    modeLabel.textContent = 'Monitoring';
    slider.style.backgroundColor = '#4CAF50';
});

async function startDevicePopulation() {
    localStorage.setItem('infoDisplayed', 'true');
    const progressBar = document.getElementById('progress-bar');
    const progressBarContainer = document.getElementById('progressBar_container');
    progressBarContainer.style.display = 'block'; // Display progress bar container
    progressBar.style.display = 'block'; // Display progress bar

    try {
        await createDatabase();
        progressBar.style.width = '5%';
        await runNetScanScript();
        progressBar.style.width = '5%';
        await showDevices();
    } catch (error) {
        console.error('Error populating devices:', error);
        clearInterval(interval);
    } finally {
        // Hide the progress bar when finished
        // progressBarContainer.style.display = 'none';
    }
}
async function createDatabase() {
    try {
        // Make a request to the PHP file to create the database
        const response = await fetch('create_db.php');
        if (!response.ok) {
            throw new Error('Failed to create database');
        }
        console.log('Database created successfully');
    } catch (error) {
        throw new Error('Error creating database: ' + error.message);
    }
}
async function runNetScanScript() {
    console.log("Trying to run Script")
    try {
        const response = await fetch('run_script.php'); 
        if (!response.ok) {
            console.log("Failed to Run")
            throw new Error('Failed to run netScan.py script');
        }
    } catch (error) {
        throw new Error('Failed to run netScan.py script');
    }
}

async function showDevices() {
    const flaggedDevicesContainer = document.getElementById('flaggedDevices');
    const unflaggedDevicesContainer = document.getElementById('unflaggedDevices');
    const progressBarContainer = document.getElementById('progressBar_container');
    const progressBar = document.getElementById('progress-bar');

    progressBar.style.width = '10%';

    flaggedDevicesContainer.innerHTML = '';
    unflaggedDevicesContainer.innerHTML = '';

    try {
        const response = await fetch('../Backend_Scripts/localIP.json');
        const devicesData = await response.json();

        let count = 0;
        const initialProgress = 10;
        const totalDevices = Object.keys(devicesData).length;
        const delayBetweenDevices = 1000; // milliseconds

        progressBar.style.width = '10%'; // Reset progress to 10%

        for (const deviceName in devicesData) {
            const device = devicesData[deviceName];

            const deviceElement = document.createElement('div');
            deviceElement.classList.add('device');
            deviceElement.innerHTML = `
            <div class="deviceHeader" onclick="toggleDeviceDetails(this)">
                ${deviceName}
                <span class="expandIcon">+</span>
            </div>
            <div class="deviceDetails">
                <p>IP: ${device.IP}</p>
                <p>MAC: ${device.MAC}</p>
                <p>Company: ${device.Company}</p>
                <p>Flagged: ${device.flagged ? 'Yes' : 'No'}</p>
                <p>Password Changed: ${device.passwordChanged}</p>
                <p>Device Accessible: ${device.Accessible ? 'Yes' : 'No'}</p>
                <p>Device has Password Field: ${device.hasPasswordField ? 'Yes' : 'No'}</p>
                <p>Password Changed Date: ${device.lastPasswordChange}</p>
                ${device.flagged ? `<button onclick="changePassword('${deviceName}', '${device.MAC}', '${device.IP}')">Change Password</button>` : ''}
            </div>
        `;

            // Add a slight delay before appending the device element
            await new Promise(resolve => setTimeout(resolve, delayBetweenDevices));

            if (device.flagged) {
                flaggedDevicesContainer.appendChild(deviceElement);
            } else {
                unflaggedDevicesContainer.appendChild(deviceElement);
            }

            // Update progress bar
            count++;
            const progress = initialProgress + ((count / totalDevices) * (100 - initialProgress));
            progressBar.style.width = `${progress}%`;
        }

        // progressBar.style.display = 'none';
    } catch (error) {
        console.error('Error fetching or parsing device data:', error);
    }
}

// Function to toggle mode
function toggleMode() {
    const modeToggle = document.getElementById('modeToggle');
    const modeLabel = document.getElementById('toggleLabel');
    const slider = document.getElementById('slider');

    if (modeToggle.checked) {
        modeLabel.textContent = 'Active';
        slider.style.backgroundColor = '#FF6347';
    } else {
        modeLabel.textContent = 'Monitoring';
        slider.style.backgroundColor = '#4CAF50';
    }
}

function toggleDeviceDetails(header) {
    const details = header.nextElementSibling;
    details.classList.toggle('show');
    const expandIcon = header.querySelector('.expandIcon');
    expandIcon.textContent = details.classList.contains('show') ? '-' : '+';
}

// Function to handle changing the password for a device
function changePassword(deviceName, MAC, IP) {
    if (confirm(`Are you sure you want to change the password for ${deviceName}?`)) {
        // Log the device information
        console.log(`Changing password for device: ${deviceName}, MAC: ${MAC}, IP: ${IP}`);

        // Send a request to the PHP script to change the password for the flagged device
        fetch('change_password.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({MAC: MAC, IP: IP })
        })
        .then(response => response.text())
        .then(output => {
            console.log('Python script output:', output);
            alert('Password change request sent successfully!');
            location.reload();
        })
        .catch(error => {
            console.error('Error changing password:', error);
            alert('Error changing password. Please try again.');
        });
    }
}


function logout() {
    alert('Logged out successfully!');
    localStorage.removeItem('infoDisplayed');
    window.location.href = 'login.html'; 
}

document.getElementById('logoutButton').addEventListener('click', logout);

function goToPasswordVault() {
    // Make an AJAX request to fetch the latest password vault data
    fetch('password_vault.json')
    .then(response => {
        if (response.ok) {
            return response.json(); // Parse the JSON response
        } else {
            console.warn('password_vault.json not found. Proceeding with an empty vault.');
            return {}; // Return an empty object if the file doesn't exist yet
        }
    })
    .then(passwordVaultData => {
        return fetch('generate_password_vault.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(passwordVaultData)
        });
    })
    .then(response => {
        if (response.ok) {
            console.log("Password vault updated successfully");
            // Redirect to password_vault.html after successful update
            window.location.href = "password_vault.html";
        } else {
            console.error("Error updating password vault");
        }
    })
    .catch(error => {
        console.error("Error:", error);
    });
}

window.addEventListener('load', function() {
    var infoDisplayed = localStorage.getItem('infoDisplayed');
    if (infoDisplayed === 'true') {
        startDevicePopulation()
    }
});

document.addEventListener("DOMContentLoaded", function() {
    // Add event listener to the Submit Schedule button
    document.getElementById("submitScheduleButton").addEventListener("click", handleSubmitSchedule);
});
// Function to handle the submit schedule button click event
function handleSubmitSchedule() {
    // Get the selected schedule value from the dropdown
    const scheduleDropdown = document.getElementById("scheduleDropdown");
    const selectedSchedule = scheduleDropdown.value;

    // Send the selected schedule value to the server
    sendScheduleToServer(selectedSchedule);
}

// Function to send the selected schedule value to the server
function sendScheduleToServer(schedule) {
    // Create an object to hold the data to be sent
    const data = { schedule: schedule };

    // Send an AJAX request to the server using fetch API
    fetch('create_cron_job.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to create cron job');
        }
        console.log('Cron job created successfully');
        // You can perform further actions here if needed
    })
    .catch(error => {
        console.error('Error creating cron job:', error);
        // Handle the error accordingly
    });
}