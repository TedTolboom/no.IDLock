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
				getOnStart: true,
			}
		});
		this.registerCapability('door', 'DOOR_LOCK', {
			get: 'DOOR_LOCK_OPERATION_GET',
			getOpts: {
				getOnStart: true,
			},
			report: 'DOOR_LOCK_OPERATION_REPORT',
			reportParserV2(report) {
				if (report && report.hasOwnProperty('Door Condition')) {
					var doorConditionBinaryArray = (report['Door Condition']).toString(2);
					this.log('Door Condition has changed:', report['Door Condition'], 'binary array', doorConditionBinaryArray)
					return (doorConditionBinaryArray[0] === 1) ? 0 : 1;
				};
				return null;
			},
		});
		// this.registerCapability('locked', 'NOTIFICATION');
		this.registerCapability('measure_battery', 'BATTERY');
		this.registerCapability('alarm_tamper', 'NOTIFICATION');
		this.registerCapability('alarm_fire', 'NOTIFICATION', {
			get: 'NOTIFICATION_GET',
			getOpts: {
				getOnStart: true,
			},
			getParser: () => ({
				'V1 Alarm Type': 0,
				'Notification Type': 'Emergency',
				Event: 2,
			}),
			report: 'NOTIFICATION_REPORT',
			reportParser: report => {
				if (report && report['Notification Type'] === 'Emergency' && report.hasOwnProperty('Event (Parsed)')) {
					if (report['Event (Parsed)'] === 'Contact Fire Service') return true;
					if (report['Event (Parsed)'] === 'Event inactive' &&
						report.hasOwnProperty('Event Parameter') &&
						(report['Event Parameter'][0] === 2 ||
							report['Event Parameter'][0] === 254)) {
						return false;
					}
				}
				return null;
			}
		});
		this.registerCapability('alarm_battery', 'BATTERY');

		this.registerReportListener('CENTRAL_SCENE', 'CENTRAL_SCENE_NOTIFICATION', (rawReport, parsedReport) => {
			this.log('Scene notification report:', rawReport);
		});
	}
}
module.exports = IDLock101;
