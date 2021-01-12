'use strict';

const Homey = require('homey');

class IDlock150Driver extends Homey.Driver {

    onInit() {
        super.onInit();

        this.awaymodeAction = new Homey.FlowCardAction('setawaymode')
            .register()
            .registerRunListener((args, state) => {
                return args.device.awaymodeActionRunListener(args, state);
            });

    }
}

module.exports = IDlock150Driver;