// We're using this BLE plugin that's also available in the PhoneGap Developer App:
// https://github.com/don/cordova-plugin-ble-central

// Service/Characteristics for BME-Sensor.
var ENV_SERVICE	       	= "181a";
var ENV_TEMP			= "2a6e";
var ENV_HUM				= "2a6f";
var ENV_PRESS			= "2a6d";

// Service/Characteristics for MICS-Sensor.
var GAS_SERVICE   		= "4b822f90-3941-4a4b-a3cc-b2602ffe0d00";
var GAS_CO_RAW			= "4b822fa1-3941-4a4b-a3cc-b2602ffe0d00";
var GAS_CO_CALIB		= "4b822fa2-3941-4a4b-a3cc-b2602ffe0d00";
var GAS_NO2_RAW			= "4b822f91-3941-4a4b-a3cc-b2602ffe0d00";
var GAS_NO2_CALIB		= "4b822f92-3941-4a4b-a3cc-b2602ffe0d00";
var GAS_NH3_RAW			= "4b822fb1-3941-4a4b-a3cc-b2602ffe0d00";
var GAS_NH3_CALIB		= "4b822fb2-3941-4a4b-a3cc-b2602ffe0d00";

// Start listening for deviceready event.
document.addEventListener('deviceready', onDeviceReady, false);

var activeSensor;
var connectedDevice;
var scanTimeout;
var connected = false;

function onDeviceReady() { }

// When scan button is clicked, check if BLE is enabled and available, then start BLE scan.
function startBLEScan() {
	ble.isEnabled(bleEnabled, bleDisabled);
}

// Show message when BLE is disabled or not available.
function bleDisabled() {
	new $.nd2Toast({message : "Enable Bluetooth first."});
}

// BLE is enabled, start scan for 10 seconds.
function bleEnabled() {
	// Show message.
	new $.nd2Toast({message : "Started 10 second scan."});
	 
	// Start scan with "device found"-callback.
	ble.scan([], 10, function(device) {
		addDev(device);
	}, function() {
		new $.nd2Toast({message : "Scan failed."});
	});
	
	// Disable scan button and remove list entries from previous scan.
	$("#scanButton").switchClass("ui-enabled", "ui-disabled");
	$(".deviceItem").hide('slow', function() { $(this).remove(); });
	$(".deviceItemEnv").hide('slow', function() { $(this).remove(); });
	
	// If device was not found after 10 seconds, stop scan.
	scanTimeout = setTimeout(stopBLEScan, 10000);
}

// "Device found" callback.
function addDev(device) {
	// Copy insivible list entry template.
	var newDiv = $("#deviceItem").clone();
	
	// Check if found device is Teco_Env environment sensor.
	if (device.name.toUpperCase() === "TECO_ENV") {
		
		// Add to list and add RSSI.
		newDiv.attr("id","whatever") 
		.appendTo("#deviceList")
		.switchClass("deviceItemTemplate", "deviceItemEnv")
		.find("#deviceRSSI").html("RSSI: " + device.rssi + " dB");
		
		// Set onClick listener. When device is not yet connected, clicking starts connect call.
		newDiv.click(function() {
			clearTimeout(scanTimeout)
			
			if (!connected) {
				// Stop scan before connecting.
				ble.stopScan(stopSuccess, stopFailure);
				// Remove all other list items.
				$(".deviceItem").hide("slow", function() { $(this).remove(); });
				newDiv.find("#deviceInfo").html("Connecting...");
				
				// For easy access.
				activeSensor = newDiv;
				
				//Hide picture
					Highcharts.chart('container', {
					    chart: {
					        type: 'column'
					    },
					    title: {
					        text: 'Concentration of harmful gases'
					    },
					    
					    xAxis: {
					        
					        crosshair: true
					    },
					    yAxis: {
					        min: 0,
					        title: {
					            text: 'Concentration (ppm)'
					        }
					    },
					    tooltip: {
					       
					        shared: true,
					        useHTML: true
					    },
					    plotOptions: {
					        column: {
					            pointPadding: 0.2,
					            borderWidth: 0,
					   } },
					    
					    series: [{
					        name: 'CO',
					        data: [0.5],
					        zones: [{
					         value: 30,
					         color: '#7cb5ec'
					      		}, {
					      	 value: 
					         color: '#f7a35c'
					     	}, {
					     		//DANGER
					     	}] }, 
					    	{
					        name: 'NH3',
					        data: [1],
					        zones: [{
					          value: 20,
					          color: '#7cb5ec'
					          }, {
					          value:  ,
					          color: '#f7a35c'
					     	 }, {
					     	 	//DANGER
					   		}]}, 
					      {
					        name: 'NO2',
					        data: [2],
					        zones: [{
					          value: 0.5,
					          color: '#7cb5ec'
					          }, {
					          value:  ,
					          color: '#f7a35c'
					      	  },{
					      	  	//Sort of Danger
					    	}]}
					      ]
					});

				

				// Disable scan button and connect.
				$("#scanButton").switchClass("ui-enabled", "ui-disabled");
				ble.connect(device.id, connectSuccess, connectFailure);
				connected = true;
			} else {
			
				// Clicking when connected: start disconnect.
				ble.disconnect(device.id, connectFailure, connectFailure);
				connected = false;
			}
		});
		
		newDiv.show();
	} else {
	
		// If device is not a TECO Environment Sensor, set info accordingly. No onClick.
		newDiv.attr("id","whatever") 
		.appendTo("#deviceList")
		.switchClass("deviceItemTemplate", "deviceItem")
		.find("#deviceRSSI").html("RSSI: " + device.rssi + " dB");
		newDiv.find("#deviceInfo").html("Unknown device, cannot connect.")
		newDiv.find("#deviceName").html("Device: " + device.name)
		newDiv.find("#deviceImg").attr('src','img/unknown.jpg');
		newDiv.show();		
	}
}

function stopSuccess(){ }

function stopFailure(){ }

// Callback for finished BLE scan. Enable scan burron.
function stopBLEScan(){
	$("#scanButton").switchClass("ui-disabled", "ui-enabled");
	new $.nd2Toast({message : "Scan finished."});
}

// Connection failed or connection lost. Show message accordingly.
function connectFailure(peripheral) {
	new $.nd2Toast({message : "Disconnected"});
	
	// Enable scan button and empty list.
	$("#scanButton").switchClass("ui-disabled", "ui-enabled");	
	$(".deviceItem").hide('slow', function() { $(this).remove(); });
	$(".deviceItemEnv").hide('slow', function() { $(this).remove(); });
	connected = false;
}

// Callback for established connection.
function connectSuccess(peripheral) {
	// Print all device info to debug.
	console.log(JSON.stringify(peripheral));
	
	activeSensor.find("#deviceInfo").html("Connected!")
	connectedDevice = peripheral;
	
	// Start notifications for temperature, humidity and pressure.	
	ble.startNotification(connectedDevice.id, ENV_SERVICE, ENV_TEMP, notifyTEMP, notificationFailure);	
	ble.startNotification(connectedDevice.id, ENV_SERVICE, ENV_HUM, notifyHUM, notificationFailure);	
	ble.startNotification(connectedDevice.id, ENV_SERVICE, ENV_PRESS, notifyPRESS, notificationFailure);

	// Start notifications for CO, NO2 and NH3	
	ble.startNotification(connectedDevice.id, GAS_SERVICE, GAS_CO_RAW, notifyCO_RAW, notificationFailure);
	ble.startNotification(connectedDevice.id, GAS_SERVICE, GAS_CO_CALIB, notifyCO_CALIB, notificationFailure);
	ble.startNotification(connectedDevice.id, GAS_SERVICE, GAS_NO2_RAW, notifyNO2_RAW, notificationFailure);
	ble.startNotification(connectedDevice.id, GAS_SERVICE, GAS_NO2_CALIB, notifyNO2_CALIB, notificationFailure);
	ble.startNotification(connectedDevice.id, GAS_SERVICE, GAS_NH3_RAW, notifyNH3_RAW, notificationFailure);
	ble.startNotification(connectedDevice.id, GAS_SERVICE, GAS_NH3_CALIB, notifyNH3_CALIB, notificationFailure);
}

// Callback when notification request fails.
function notificationFailure(reason) {
	new $.nd2Toast({message : "CNotification request failed."});
}

// Three callbacks, they get called when a notification is received.
function notifyTEMP(buffer) {
	var value = new Int16Array(buffer);
	var floatVal = value[0] / 100.0;
	activeSensor.find("#deviceInfo").html("Temperature: " + floatVal + "°C");
}


function notifyCO_RAW(buffer) {
	var value = new Int16Array(buffer);
	var floatVal = value[0] / 100.0;
	activeSensor.find("#deviceInfo").html("Temperature: " + floatVal + "°C");
}
function notifyCO_CALIB(buffer) {
	var value = new Int16Array(buffer);
	var floatVal = value[0] / 100.0;
	activeSensor.find("#deviceInfo").html("Temperature: " + floatVal + "°C");
}

function notifyNO2_RAW(buffer) {
	var value = new Int16Array(buffer);
	var floatVal = value[0] / 100.0;
	activeSensor.find("#deviceInfo").html("Temperature: " + floatVal + "°C");
}

function notifyNO2_CALIB(buffer) {
	var value = new Int16Array(buffer);
	var floatVal = value[0] / 100.0;
	activeSensor.find("#deviceInfo").html("Temperature: " + floatVal + "°C");
}

function notifyNH3_RAW(buffer) {
	var value = new Int16Array(buffer);
	var floatVal = value[0] / 100.0;
	activeSensor.find("#deviceInfo").html("Temperature: " + floatVal + "°C");
}
function notifyNH3_CALIB(buffer) {
	var value = new Int16Array(buffer);
	var floatVal = value[0] / 100.0;
	activeSensor.find("#deviceInfo").html("Temperature: " + floatVal + "°C");
}



















