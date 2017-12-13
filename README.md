# ID Lock Z-wave

This app adds support for ID Lock Z-wave devices made by [ID Lock AS](https://idlock.no/).

## Links:
[ID Lock app Athom apps](https://apps.athom.com/app/no.IDLock)                    
[ID Lock Github repository](https://github.com/TedTolboom/no.IDLock)   

**Note:** This app is using [HomeyConfig composer](https://www.npmjs.com/package/node-homey-config-composer).   
Please file Pull Requests on the *development* branch of this repository and with respect to the refactored files in _/drivers_ and _/config_ folders.   

## Supported devices
* ID Lock 101 (incl. Z-Wave module board 01A)

## Supported Languages:
* English

## ID Lock 101 Features

The ID Lock 101 driver supports the following capabilities:
* Door lock / unlocked
* Door open / closed (contact alarm)
* Heat alarm
* Tamper alarm
* Battery (alarm)

Triggers:
* Door lock / unlocked
* Generic "an alarm triggered" trigger cards from devices, with additional logic AND condition isolating device

 Actions:
 * Door lock / unlock

Open work:
* Device specific alarm triggers flow cards (incl. door open state)
* Notification cards providing tokens with door unlock condition (manual, RFID, keypad etc)

## Change Log:
### v 1.0.0
* App store release for ID lock 101 (including Z-Wave module board 01A)
