'use strict';

const Homey = require('homey');

class IDLock extends Homey.App {

	onInit() {

		this.log('IDLock is running...');

		// Triggers

		const doorLockTrigger = this.homey.flow.getTriggerCard('door_lock')
		doorLockTrigger.registerRunListener(this.onTypeWhoMatchTrigger.bind(this))
		doorLockTrigger.getArgument('who').registerAutocompleteListener(this.onWhoAutoComplete.bind(this))

		const doorUnlockTrigger = this.homey.flow.getTriggerCard('door_unlock')
		doorUnlockTrigger.registerRunListener(this.onTypeWhoMatchTrigger.bind(this))
		doorUnlockTrigger.getArgument('who').registerAutocompleteListener(this.onWhoAutoComplete.bind(this))

		// Conditions

		const doorLocking = this.homey.flow.getConditionCard('door_locking')
		doorLocking.registerRunListener(this.onTypeWhoMatchTrigger.bind(this))
		doorLocking.getArgument('who').registerAutocompleteListener(this.onWhoAutoComplete.bind(this))

		const doorUnlocking = this.homey.flow.getConditionCard('door_unlocking')
		doorUnlocking.registerRunListener(this.onTypeWhoMatchTrigger.bind(this))
		doorUnlocking.getArgument('who').registerAutocompleteListener(this.onWhoAutoComplete.bind(this))

		// Actions

		this.homey.flow.getActionCard('set_awaymode').registerRunListener((args, state) => {
			return args.device.awaymodeActionRunListener(args, state)
		})
	}

	onTypeWhoMatchTrigger(args, state) {
		this.log(args.type);
		this.log(args.who);
		this.log(state);
		
		return (args.type === state.type || args.type === 'any') 
			&& (args.who.name.toLowerCase() === state.who.toLowerCase() || args.who.name.toLowerCase() === 'any');
	}

	onWhoAutoComplete(query, args) {
		let distinctNames = [...new Set(JSON.parse(this.homey.settings.get('codes')).map(item => item.user))].sort();
		let resultArray = distinctNames.map( user => { return { name:user } });
		resultArray.unshift({ name: 'Unknown' });
		resultArray.unshift({ name: 'Any' });
		resultArray = resultArray.filter(result => { return result.name.toLowerCase().indexOf(query.toLowerCase()) > -1; });
		return resultArray;
	}

}

module.exports = IDLock;
