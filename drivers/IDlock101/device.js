'use strict';

const ZwaveDevice = require('homey-meshdriver').ZwaveDevice;

// Documentation: https://Products.Z-WaveAlliance.org/ProductManual/File?folder=&filename=Manuals/2293/IDL Operational Manual EN v1.3.pdf

class IDLock101 extends ZwaveDevice {
	onMeshInit() {
		// enable debugging
		this.enableDebug();

		// print the node's info to the console
		this.printNode();

		this.registerCapability('locked', 'DOOR_LOCK', {
			getOpts: {
				getOnStart: true, // get the initial value on app start
				// pollInterval: 'poll_interval_battery' // maps to device settings
				// getOnWakeUp: true, // only useful for battery devices
			}
		});
		// this.registerCapability('locked', 'NOTIFICATION');
		this.registerCapability('measure_battery', 'BATTERY');
		this.registerCapability('alarm_battery', 'BATTERY');
	}
}
module.exports = IDLock101;
