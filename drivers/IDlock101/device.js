'use strict';

const { ZwaveDevice } = require('homey-zwavedriver');

// Documentation: https://Products.Z-WaveAlliance.org/ProductManual/File?folder=&filename=Manuals/2293/IDL Operational Manual EN v1.3.pdf

class IDlock101 extends ZwaveDevice {
	onMeshInit() {
		// enable debugging
		// this.enableDebug();

		// print the node's info to the console
		// this.printNode();

		
		this.registerCapability('locked', 'DOOR_LOCK', {
			getOpts: {
				getOnStart: true,
				getOnOnline: false,
			},
			report: 'DOOR_LOCK_OPERATION_REPORT',
			reportParserV2(report) {
				if (report && report.hasOwnProperty('Door Lock Mode')) {
					// reset alarm_tamper or alarm_heat based on Unlock report
					if (report['Door Lock Mode'] === 'Door Unsecured') {
						if (this.getCapabilityValue('alarm_tamper')) {
							this.setCapabilityValue('alarm_tamper', false).catch(err => this.error('DOOR LOCK: Setting \'alarm_tamper\' capability value failed:', err))
						}
						if (this.getCapabilityValue('alarm_heat')) {
							this.setCapabilityValue('alarm_heat', false).catch(err => this.error('DOOR LOCK: Setting \'alarm_heat\' capability value failed:', err))
						}
						this.log('DOOR_LOCK: reset tamper and heat alarm');
					};
					return report['Door Lock Mode'] === 'Door Secured';
				}
				return null;
			},
		});

		this.registerCapability('alarm_contact', 'DOOR_LOCK', {
			get: 'DOOR_LOCK_OPERATION_GET',
			getOpts: {
				getOnStart: true,
			},
			report: 'DOOR_LOCK_OPERATION_REPORT',
			reportParserV2(report) {
				if (report && report.hasOwnProperty('Door Condition')) {
					this.log('Door Condition has changed:', report['Door Condition']);
					// check if Bit 0 is 1 (door closed) and return the inverse (alarm when door open)
					return !Boolean(report['Door Condition'] & 0b001);
				};
				return null;
			},
		});

		// register BATTERY capabilities
		this.registerCapability('measure_battery', 'BATTERY', {
			getOpts: {
				getOnStart: true,
				getOnOnline: false,
			}
		});

		this.registerCapability('alarm_battery', 'BATTERY');

		// register alarm capabilities for devices with COMMAND_CLASS_NOTIFICATION
		const commandClassNotification = this.getCommandClass('NOTIFICATION');
		if (!(commandClassNotification instanceof Error)) {
			this.registerCapability('alarm_tamper', 'NOTIFICATION', {
				getOpts: {
					getOnStart: true,
					getOnOnline: false,
				}
			});

			this.registerCapability('alarm_heat', 'NOTIFICATION', {
				get: 'NOTIFICATION_GET',
				getOpts: {
					getOnStart: true,
					getOnOnline: false,
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
			this.log('registered COMMAND_CLASS_NOTIFICATION capabilities listeners');
		}
		// register alarm capabilities for devices with COMMAND_CLASS_ALARM
		if (!(this.getCommandClass('ALARM') instanceof Error)) {
			this.registerCapability('alarm_tamper', 'ALARM', {
				get: 'ALARM_GET',
				getOpts: {
					getOnStart: true,
				},
				getParser: () => ({
					'Alarm Type': 10,
				}),
				report: 'ALARM_REPORT',
				reportParser: report => {
					if (report && report['Alarm Type'] === 10 && report.hasOwnProperty('Alarm Level')) {
						return report['Alarm Level'] === 1
					}
					return null;
				}
			});

			this.registerCapability('alarm_heat', 'ALARM', {
				get: 'ALARM_GET',
				getOpts: {
					getOnStart: true,
				},
				getParser: () => ({
					'Alarm Type': 4,
				}),
				report: 'ALARM_REPORT',
				reportParser: report => {
					if (report && report['Alarm Type'] === 4 && report.hasOwnProperty('Alarm Level')) {
						return report['Alarm Level'] === 1
					}
					return null;
				}
			});

			this.log('registered COMMAND_CLASS_ALARM capabilities listeners');
		}
	}
}
module.exports = IDlock101;
