var button = document.getElementById("btn_scan");
var Bluetooth_Table = document.getElementById("bluetooth_Table");
var Output_Table = document.getElementById("output_Table");
var isBluetoothPresent = false;
var isConnected = false;
var bluetoothDeviceServer = null;
var bluetoothDevice;
var connectedDevice_Server;
var infoCharacteristic;


var commodity_name, temperature, moisture, quantity;

const list_Commodities = ["GROUNDNUT", "SOYABEAN", "MUSTARD", "MOONG", "CHANA", "WHEAT", "BARLEY"];
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
        .then(function () {
            console.log('SW registered');
        });
}

async function ClickedButton() {

    if (isConnected) {
        isConnected = false;
        Disconnect_Device();
    }
    else {

        // Checking Bluetooth Availability
        navigator.bluetooth.getAvailability().then((available) => {
            if (available) {
                isBluetoothPresent = true;
                console.log("This device supports Bluetooth!");
                Connect_to_Bluetooth();

            } else {
                console.log("Bluetooth is not supported! ");
                Bluetooth_Table.rows.item(1).cells.item(1).innerHTML = "Device does not supports Bluetooth";
                isBluetoothPresent = false
            }
        });

    }


}

async function Connect_to_Bluetooth() {
    // Connecting Bluetooth 
    if (isBluetoothPresent == true) {
        Bluetooth_Table.rows.item(1).cells.item(1).innerHTML = "Connecting";
        try {
            bluetoothDevice = await navigator.bluetooth.requestDevice(
                {
                    filters: [
                        { namePrefix: "DM" }
                    ],
                    optionalServices: ['6e400001-b5a3-f393-e0a9-e50e24dcca9e']

                }
            )

            Bluetooth_Table.rows.item(0).cells.item(1).innerHTML = bluetoothDevice.name
            console.log('Requesting any Bluetooth Device...');
            connect();

        } catch (error) {
            console.log('Argh! ' + error);
        }

    }
}

async function Disconnect() {

    console.log("Bluetooth Disconnected");
    if (isConnected) {
        exponentialBackoff(500 /* max retries */, 2 /* seconds delay */,
            function toTry() {
                console.log('Connecting to Bluetooth Device... ');
                return bluetoothDevice.gatt.connect();
            },
            function success() {
                console.log('> Bluetooth Device connected.');
                fetchData();
            },
            async function fail() {
                console.log('Failed to reconnect.');
                console.log('Argh!' + error);
                isConnected = false;
                Bluetooth_Table.rows.item(0).cells.item(1).innerHTML = "Not Connected";
                Bluetooth_Table.rows.item(1).cells.item(1).innerHTML = "Disconnected";
                button.innerHTML = "Connect Bluetooth Devices";

            });
    }


}
function Disconnect_Device() {

    bluetoothDeviceServer.disconnect();
    isConnected = false;
    button.innerHTML = "Connect Bluetooth Devices";
    onResetButtonClick()
    console.log("Bluetooth Disconnected");

}


async function connect() {

    console.log('Connecting to Bluetooth Device... ');
    connectedDevice_Server = await bluetoothDevice.gatt.connect();
    console.log('> Bluetooth Device connected.');
    bluetoothDevice.addEventListener('gattserverdisconnected', Disconnect);

    await fetchData();


}
async function fetchData() {
    bluetoothDeviceServer = connectedDevice_Server;
    isConnected = true;

    console.log(bluetoothDeviceServer);

    Bluetooth_Table.rows.item(1).cells.item(1).innerHTML = "CONNECTED";
    button.innerHTML = "Disconnect";

    console.log('Getting Service...');

    var infoService = await bluetoothDeviceServer.getPrimaryService("6e400001-b5a3-f393-e0a9-e50e24dcca9e");

    // // We will get all characteristics from device_information
    infoCharacteristic = await infoService.getCharacteristic("6e400003-b5a3-f393-e0a9-e50e24dcca9e");
    console.log(await infoCharacteristic);

    commodity_name = null;
    temperature = null;
    moisture = null;
    quantity = null;

    infoCharacteristic.addEventListener('characteristicvaluechanged', handleLevelChanged);
    onStartNotificationsButtonClick();
}
async function onStartNotificationsButtonClick() {
    try {
        console.log('Starting Moisture Meter Notifications...');
        await infoCharacteristic.startNotifications();

        console.log('> Notifications started');
    } catch (error) {
        console.log('Argh! ' + error);
    }
}

function onResetButtonClick() {
    if (infoCharacteristic) {
        infoCharacteristic.removeEventListener('characteristicvaluechanged',
            handleLevelChanged);
        infoCharacteristic = null;
    }
    // Note that it doesn't disconnect device.
    bluetoothDevice = null;
    Bluetooth_Table.rows.item(0).cells.item(1).innerHTML = "Not Connected";
    Bluetooth_Table.rows.item(1).cells.item(1).innerHTML = "Disconnected";
    button.innerHTML = "Connect Bluetooth Devices";
    Output_Table.rows.item(0).cells.item(1).innerHTML = "NA";
    Output_Table.rows.item(1).cells.item(1).innerHTML = "NA";
    Output_Table.rows.item(2).cells.item(1).innerHTML = "NA";
    Output_Table.rows.item(3).cells.item(1).innerHTML = "NA";
    console.log('> Bluetooth Device reset');
}

async function handleLevelChanged(event) {
    console.log('Characteristic Value Changed');
    console.log(event.target.value);
    let value = event.target.value;
    var level = new TextDecoder().decode(value);
    level = level.substring(1);
    console.log(level);
    level = level.trim();
    if (list_Commodities.includes(level)) {
        commodity_name = level;
    }
    else if (level.lastIndexOf(',') != -1) {
        const array = level.split(',');
        moisture = array[0];
        temperature = array[1];
        quantity = array[2];
    }
    console.log(commodity_name + " " + moisture + " " + temperature + " " + quantity);
    if (checkIsValid(commodity_name) && checkIsValid(moisture) && checkIsValid(quantity) && checkIsValid(temperature)) {
        displayOutput();
    }

}
function displayOutput() {
    Output_Table.rows.item(0).cells.item(1).innerHTML = commodity_name;
    Output_Table.rows.item(1).cells.item(1).innerHTML = moisture + " %";
    Output_Table.rows.item(2).cells.item(1).innerHTML = temperature + " °C";
    Output_Table.rows.item(3).cells.item(1).innerHTML = quantity + " GM";
}

function checkIsValid(variable) {
    if (variable == null || variable === 'undefined') {
        return false;
    }
    return true;
}
function exponentialBackoff(max, delay, toTry, success, fail) {
    toTry().then(result => success(result))
        .catch(_ => {
            if (max === 0) {
                return fail();
            }
            console.log('Retrying in ' + delay + 's... (' + max + ' tries left)');
            setTimeout(function () {
                exponentialBackoff(--max, delay, toTry, success, fail);
            }, delay * 1000);
        });
}
