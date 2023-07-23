'use strict'

const { ZwaveDevice } = require('homey-zwavedriver')

// Documentation: https://Products.Z-WaveAlliance.org/ProductManual/File?folder=&filename=Manuals/2293/IDL Operational Manual EN v1.3.pdf

class IDlock150 extends ZwaveDevice {
  async onNodeInit () {
    // enable debugging
    // this.enableDebug();

    // print the node's info to the console
    // this.printNode();

    this.registerCapability('locked', 'DOOR_LOCK', {
      getOpts: {
        getOnStart: true,
        getOnOnline: false
      },
      report: 'DOOR_LOCK_OPERATION_REPORT',
      reportParserV2 (report) {
        if (report && Object.prototype.hasOwnProperty.call(report, 'Door Lock Mode')) {
          // reset alarm_tamper or alarm_heat based on Unlock report
          if (report['Door Lock Mode'] === 'Door Unsecured') {
            if (this.getCapabilityValue('alarm_tamper')) {
              this.setCapabilityValue('alarm_tamper', false).catch(err => this.error('DOOR LOCK: Setting \'alarm_tamper\' capability value failed:', err))
            }
            if (this.getCapabilityValue('alarm_heat')) {
              this.setCapabilityValue('alarm_heat', false).catch(err => this.error('DOOR LOCK: Setting \'alarm_heat\' capability value failed:', err))
            }
            this.log('DOOR_LOCK: reset tamper and heat alarm')
          };
          return report['Door Lock Mode'] === 'Door Secured'
        }
        return null
      }
    })

    this.registerCapability('locked', 'NOTIFICATION', {
      getOpts: {
        getOnStart: true,
        getOnOnline: false
      },
      reportParser: report => {
        this.log('  ---- Notification ----')
        if (report && report['Notification Type'] === 'Access Control' && Object.prototype.hasOwnProperty.call(report, 'Event')) {
          const triggerSettings = this.homey.settings.get('triggerSettings') || { homey: false, code: false, tag: false, button: false, auto: false }
          let token = { who: 'Uknown', type: 'None' }
          let state = { who: 'Uknown', type: 'none' }

          // Lock jammed
          if (report.Event === 11) {
            this.homey.flow.getDeviceTriggerCard('lock_jammed').trigger(this, null, null).catch(this.error)
            this.log('Triggered lock jammed')
          }

          // Button/manual lock/unlock Operation
          else if (report.Event === 1 || report.Event === 2) {
            token = { who: 'Button', type: 'Manual' }
            state = { who: 'Button', type: 'manual' }
            if (report.Event === 1) {
              this.triggerDoorLock(token, state, triggerSettings.button)
            } else {
              this.triggerDoorUnlock(token, state, triggerSettings.button)
            }
          }

          // Auto lock locked Operation
          else if (report.Event === 9) {
            token = { who: 'Automatic', type: 'Automatic' }
            state = { who: 'Automatic', type: 'automatic' }
            this.triggerDoorLock(token, state, triggerSettings.auto)
          }

          // Other operations, index based
          else if (Object.prototype.hasOwnProperty.call(report, 'Event Parameter')) {
            let triggerSetting
            const keyType = parseInt(report['Event Parameter'][0])
            const codes = JSON.parse(this.homey.settings.get('codes'))
            const indexMode = this.getSetting('Index_Mode')
            let masterIndex = 1
            let serviceIndex = 2
            let keyOffset = -59
            let tagOffset = -9
            // Override vith new indexing from v1.6
            if (indexMode === '2') {
              masterIndex = 109
              serviceIndex = 108
              keyOffset = 0
              tagOffset = -25
            }
            // Keypad Unlock Operation
            if (report.Event === 5 || report.Event === 6) {
              triggerSetting = triggerSettings.code
              if (keyType === masterIndex) {
                token = { who: 'Master', type: 'Code' }
                state = { who: 'Master', type: 'code' }
              } else if (keyType === serviceIndex) {
                token = { who: 'Service', type: 'Code' }
                state = { who: 'Service', type: 'code' }
              } else {
                const keyId = keyType + keyOffset
                const type = parseInt(report['Event (Raw)'][0])
                let user = 'Unknown [key:' + keyId + ']'
                for (const i in codes) {
                  if (codes[i].index === keyId && codes[i].type === type) {
                    user = codes[i].user
                  }
                }
                token = { who: user, type: 'Code' }
                state = { who: user, type: 'code' }
              }
            }
            // RF Lock/Unlock Operation
            else if (report.Event === 3 || report.Event === 4) {
              if (keyType === 0) {
                triggerSetting = triggerSettings.homey
                token = { who: 'Homey', type: 'Automatic' }
                state = { who: 'Homey', type: 'automatic' }
              } else {
                const tagId = keyType + tagOffset
                const type = parseInt(report['Event (Raw)'][0])
                let user = 'Unknown [tag:' + tagId + ']'
                for (const i in codes) {
                  if (codes[i].index === tagId && codes[i].type === type) {
                    user = codes[i].user
                  }
                }
                triggerSetting = triggerSettings.tag
                token = { who: user, type: 'Tag' }
                state = { who: user, type: 'tag' }
              }
            }
            if (report.Event === 3 || report.Event === 5) {
              this.triggerDoorLock(token, state, triggerSetting)
            } else {
              this.triggerDoorUnlock(token, state, triggerSetting)
            }
          }
        }
        return null
      }
    })

    this.registerCapability('alarm_contact', 'DOOR_LOCK', {
      get: 'DOOR_LOCK_OPERATION_GET',
      getOpts: {
        getOnStart: true,
        getOnOnline: false
      },
      report: 'DOOR_LOCK_OPERATION_REPORT',
      reportParserV2 (report) {
        if (report && Object.prototype.hasOwnProperty.call(report, 'Door Condition')) {
          this.log('Door Condition has changed:', report['Door Condition'])
          // check if Bit 0 is 1 (door closed) and return the inverse (alarm when door open)
          return !(report['Door Condition'] & 0b001)
        };
        return null
      }
    })

    this.registerCapability('measure_battery', 'BATTERY', {
      getOpts: {
        getOnStart: false,
        getOnOnline: false
      }
    })

    this.registerCapability('alarm_battery', 'BATTERY', {
      getOpts: {
        getOnStart: false,
        getOnOnline: false
      }
    })

    this.registerCapability('alarm_tamper', 'NOTIFICATION', {
      getOpts: {
        getOnStart: false,
        getOnOnline: false
      }
    })

    this.registerCapability('alarm_heat', 'NOTIFICATION', {
      get: 'NOTIFICATION_GET',
      getOpts: {
        getOnStart: false,
        getOnOnline: false
      },
      getParser: () => ({
        'V1 Alarm Type': 0,
        'Notification Type': 'Emergency',
        Event: 2
      }),
      report: 'NOTIFICATION_REPORT',
      reportParser: report => {
        if (report && report['Notification Type'] === 'Emergency' && Object.prototype.hasOwnProperty.call(report, 'Event (Parsed)')) {
          if (report['Event (Parsed)'] === 'Contact Fire Service') return true
          if (report['Event (Parsed)'] === 'Event inactive' && Object.prototype.hasOwnProperty.call(report, 'Event Parameter') && (report['Event Parameter'][0] === 2 || report['Event Parameter'][0] === 254)) {
            return false
          }
        }
        return null
      }
    })
  }

  async triggerDoorLock (token, state, triggerSetting) {
    // this.setCapabilityValue('locked', true) // not sure if needed - but the lock icon has wrong if not added
    this.log('---- Trigger door lock ---- ')
    this.homey.flow.getDeviceTriggerCard('door_lock').trigger(this, token, state).catch(this.error)
    if (triggerSetting) {
      this.log('---- Trigger unlockstate ----')
      this.homey.flow.getDeviceTriggerCard('unlockstate').trigger(this, token, state).catch(this.error)
    }
    this.log('Door lock tokens:', token)
    this.log('Door lock states:', state)
  }

  async triggerDoorUnlock (token, state, triggerSetting) {
    // this.setCapabilityValue('locked', false)  // not sure if needed - but the lock icon has wrong if not added
    this.log('---- Trigger door unlock ---- ')
    this.homey.flow.getDeviceTriggerCard('door_unlock').trigger(this, token, state).catch(this.error)
    if (triggerSetting) {
      this.log('---- Trigger lockstate ----')
      this.homey.flow.getDeviceTriggerCard('lockstate').trigger(this, token, state).catch(this.error)
    }
    this.log('Door unlock tokens:', token)
    this.log('Door unlock states:', state)
  }

  async awaymodeActionRunListener (args, state) {
    console.log('---- Set away mode ---- ')
    return this.configurationSet({
      index: 1, // Doorlock_mode
      size: 1
    }, args.mode)
      .then(result => {
        // Also update app setting to same value
        this.setSettings({ Doorlock_mode: args.mode })
        return result
      })
  }
}
module.exports = IDlock150
