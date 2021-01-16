'use strict';

const ZwaveDevice = require('homey-meshdriver').ZwaveDevice;
const Homey = require('homey');

// Documentation: https://Products.Z-WaveAlliance.org/ProductManual/File?folder=&filename=Manuals/2293/IDL Operational Manual EN v1.3.pdf

class IDlock150 extends ZwaveDevice {

	onMeshInit() {

		// enable debugging
		// this.enableDebug();

		// print the node's info to the console
		// this.printNode();

		let unlockTrigger = new Homey.FlowCardTriggerDevice('lockstate').register();
		let lockTrigger = new Homey.FlowCardTriggerDevice('unlockstate').register();
		let lockJammedTrigger = new Homey.FlowCardTriggerDevice('lockjammed').register();

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
						if (this.getCapabilityValue('alarm_tamper')) this.setCapabilityValue('alarm_tamper', false);
						if (this.getCapabilityValue('alarm_heat')) this.setCapabilityValue('alarm_heat', false);
						this.log('DOOR_LOCK: reset tamper and heat alarm');
					};
					return report['Door Lock Mode'] === 'Door Secured';
				}
				return null;
			},
		});

		this.registerCapability('locked', 'NOTIFICATION', {
			getOpts: {
				getOnStart: true,
				getOnOnline: false,
			},
			reportParser: report => {
				this.log("  ---- Notification ----");
				if (report && report['Notification Type'] === 'Access Control' && report.hasOwnProperty('Event')) {
					var triggerSettings = Homey.ManagerSettings.get('triggerSettings') || { "homey": false, "code": false, "tag": false, "button": false };
					// Manual lock Operation
					if (report['Event'] === 1) {
						if (triggerSettings.button) {
							lockTrigger.trigger(this, { "who": "Button", "type": "Manual" }, null).catch(this.error).then(this.log('Button locked the door'));
						}
					}
					// Manual Unlock Operation
					else if (report['Event'] === 2) {
						if (triggerSettings.button) {
							unlockTrigger.trigger(this, { "who": "Button", "type": "Manual" }, null).catch(this.error).then(this.log('Button opened the door'));
						}
					}
					// Auto lock locked Operation
					else if (report['Event'] === 9) {
						if (triggerSettings.auto) {
							lockTrigger.trigger(this, { "who": "Auto", "type": "Automatic" }, null).catch(this.error).then(this.log('Auto lock/relock of the door'));
						}
					}
					// Lock jammed
					else if (report['Event'] === 11) {
						lockJammedTrigger.trigger(this, null, null).catch(this.error).then(this.log('Lock jammed'));
					}
					// Other operations
					else {
						if (report.hasOwnProperty('Event Parameter')) {
							var keyType = parseInt(report['Event Parameter'][0]);
							var codes = JSON.parse(Homey.ManagerSettings.get('codes'));
							var indexMode = this.getSettings().Index_Mode;						
							var masterIndex = 1;
							var serviceIndex = 2
							var keyOffset = -59;
							var tagOffset = -9;
							// Override vith new indexing from v1.6
							if (indexMode === '2') {
								masterIndex = 109;
								serviceIndex = 108
								keyOffset = 0;
								tagOffset = -25;
							}
							// Keypad Unlock Operation
							if (report['Event'] === 5 || report['Event'] === 6) {
								if (keyType === masterIndex) {
									if (triggerSettings.code) {
										if (report['Event'] === 5) {
											lockTrigger.trigger(this, { "who": "Master", "type": "Keypad" }, null).catch(this.error).then(this.log('Master locked the door'));
										}
										else {
											unlockTrigger.trigger(this, { "who": "Master", "type": "Keypad" }, null).catch(this.error).then(this.log('Master opened the door'));
										}
									}
								} else if (keyType === serviceIndex) {
									if (triggerSettings.code) {
										if (report['Event'] === 5) {
											lockTrigger.trigger(this, { "who": "Service", "type": "Keypad" }, null).catch(this.error).then(this.log('Service locked the door'));
										}
										else {
											unlockTrigger.trigger(this, { "who": "Service", "type": "Keypad" }, null).catch(this.error).then(this.log('Service opened the door'));
										}
									}
								}
								else {
									let keyId = keyType + keyOffset;
									let type = parseInt(report['Event (Raw)'][0]);
									let user = 'Unknown [key:' + keyId + ']';
									this.log("Codes", codes);
									for (var i in codes) {
										if (codes[i].index === keyId && codes[i].type === type) {
											user = codes[i].user;
										}
									}
									if (triggerSettings.code) {
										if (report['Event'] === 5) {
											lockTrigger.trigger(this, { "who": "Unknown", "type": "Keypad" }, null).catch(this.error).then(this.log(user, ' locked the door with code'))
										}
										else {
											unlockTrigger.trigger(this, { "who": user, "type": "Keypad" }, null).catch(this.error).then(this.log(user, ' opened the door with code'))
										}
									}
								}
							}
							// RF Lock/Unlock Operation
							else if (report['Event'] === 3 || report['Event'] === 4) {
								if (keyType === 0) {
									if (triggerSettings.homey) {
										if (report['Event'] === 3) {
											lockTrigger.trigger(this, { "who": "Homey", "type": "Automatic" }, null).catch(this.error).then(this.log('Homey locked the door'));
										}
										else {
											unlockTrigger.trigger(this, { "who": "Homey", "type": "Automatic" }, null).catch(this.error).then(this.log('Homey opened the door'));
										}
									}
								}
								else {
									let tagId = keyType + tagOffset;
									let type = parseInt(report['Event (Raw)'][0]);
									let user = 'Unknown [tag:' + tagId + ']';
									this.log("Codes", codes);
									for (var i in codes) {
										if (codes[i].index === tagId && codes[i].type === type) {
											user = codes[i].user;
										}
									}
									if (triggerSettings.tag) {
										if (report['Event'] === 3) {
											lockTrigger.trigger(this, { "who": "Unknown", "type": "RFID" }, null).catch(this.error).then(this.log(user, ' locked the door with tag'));
										}
										else {
											unlockTrigger.trigger(this, { "who": user, "type": "RFID" }, null).catch(this.error).then(this.log(user, ' opened the door with tag'));
										}
									}
								}
							}
						}
					}
				}
				return null;
			}
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

		this.registerCapability('measure_battery', 'BATTERY', {
			getOpts: {
				getOnStart: true,
				getOnOnline: false,
			}
		});

		this.registerCapability('alarm_tamper', 'NOTIFICATION', {
			getOpts: {
				getOnStart: true,
				getOnOnline: false,
			}
		});

		this.registerCapability('alarm_battery', 'BATTERY');

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
	}

	async awaymodeActionRunListener(args, state) {
		console.log('---- Set away mode ---- ');
		return this.configurationSet({
			index: 1, // Doorlock_mode
			size: 1,
		}, args.mode)
			.then(result => {
				// Also update app setting to same value
				this.setSettings({ Doorlock_mode: args.mode })
				return result;
			})
	}

}
module.exports = IDlock150;