'use strict';

const Homey = require('homey');

class IDLock extends Homey.App {

	onInit() {

		this.log('IDLock is running...');

		// Triggers

		this.unlockTrigger = new Homey.FlowCardTriggerDevice('lockstate').register(); // deprecated
		
		this.lockTrigger = new Homey.FlowCardTriggerDevice('unlockstate').register(); // deprecated

		this.lockJammedTrigger = new Homey.FlowCardTriggerDevice('lock_jammed').register();

		this.doorLockTrigger = new Homey.FlowCardTriggerDevice('door_lock')
			.register()
			.registerRunListener(this.onTypeWhoMatchTrigger.bind(this));		
	 	this.doorLockTrigger
			.getArgument('who')
			.registerAutocompleteListener(this.onWhoAutoComplete.bind(this));

		this.doorUnlockTrigger = new Homey.FlowCardTriggerDevice('door_unlock')
			.register()
			.registerRunListener(this.onTypeWhoMatchTrigger.bind(this));				
		this.doorUnlockTrigger 
			.getArgument('who')
			.registerAutocompleteListener(this.onWhoAutoComplete.bind(this));

		// Conditions

		this.doorLockingCondition = new Homey.FlowCardCondition('door_locking')
			.register()
			.registerRunListener(this.onTypeWhoMatchTrigger.bind(this));				
		this.doorLockingCondition 
			.getArgument('who')
			.registerAutocompleteListener(this.onWhoAutoComplete.bind(this));

		this.doorUnlockingCondition = new Homey.FlowCardCondition('door_unlocking')
			.register()
			.registerRunListener(this.onTypeWhoMatchTrigger.bind(this));				
		this.doorUnlockingCondition 
			.getArgument('who')
			.registerAutocompleteListener(this.onWhoAutoComplete.bind(this));

		// Actions
			
		this.awaymodeAction = new Homey.FlowCardAction('set_awaymode')
			.register()
			.registerRunListener((args, state) => { return args.device.awaymodeActionRunListener(args, state); });
	}

	onTypeWhoMatchTrigger(args, state) {
		this.log(args.type);
		this.log(args.who);
		this.log(state);
		
		return (args.type === state.type || args.type === 'any') 
			&& (args.who.name.toLowerCase() === state.who.toLowerCase() || args.who.name.toLowerCase() === 'any');
	}

	onWhoAutoComplete(query, args) {
		let distinctNames = [...new Set(JSON.parse(Homey.ManagerSettings.get('codes')).map(item => item.user))].sort();
		let resultArray = distinctNames.map( user => { return { name:user } });
		resultArray.unshift({ name: 'Unknown' });
		resultArray.unshift({ name: 'Any' });
		resultArray = resultArray.filter(result => { return result.name.toLowerCase().indexOf(query.toLowerCase()) > -1; });
		return resultArray;
	}

}

module.exports = IDLock;