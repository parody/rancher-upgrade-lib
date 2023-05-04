const RancherAPI = require('./RancherAPI');

const help = () => {
    console.log(`
Expect env vars
---------------
RANCHER_API_ENDPOINT
RANCHER_API_KEY
RANCHER_API_SECRET

Command line parameters
-----------------------
Required:
--service, --serviceName <name>     Rancher service name to upgrade.
--image, --imageRepo <name>         Dockerhub image name.
--tag, --imageTag <name>            Dockerhub image tag name.


Optional:
--upgrade-timeout, --serviceUpgradedTimeout <millis>   Timeout in ms for service to be upgraded. Defaults to 600000 (10min)
--upgrade-interval, --intervalMillis <millis>          Interval between upgrades between batches. Defaults to 30000 (30s)
--batch, --batch-size, --batchSize <number>            Size of each batch. Defaults to 1.
--start-first, --startFirst                            Start before stop. Defaults to true.
--confirm-before, --confirmBefore                      Confirm the previous upgrade (service state = upgraded) before start. Defaults to false.
--confirm-after, --confirmAfter                        Confirms the upgrade when finishing upgrading. Defaults to true.

`);
};


// ENV-ONLY parameters
['RANCHER_API_ENDPOINT','RANCHER_API_KEY','RANCHER_API_SECRET'].forEach((name) => {
    if (!process.env[name]) {
        help();
        console.error(name, 'is not defined.');
        process.exit(1);
    }
});




let api;
let CONFIG;



const argv = require('minimist')(process.argv.slice(2), {
    alias : {
        serviceName : ['service'],
        imageRepo : ['image'],
        imageTag : ['tag'],
        serviceUpgradedTimeout : ['upgrade-timeout'],
        batchSize : ['batch-size', 'batch'],
        intervalMillis : ['upgrade-interval'],
        startFirst : ['start-first'],
        confirmBefore : ['confirm-before'],
        confirmAfter : ['confirm-after'],
    },
    boolean : ['confirmAfter', 'confirmBefore', 'startFirst'],
    default : {
        serviceUpgradedTimeout : 10*60*1000,
        batchSize : 1,
        intervalMillis : 30*1000,
        startFirst : true,
        confirmBefore : false,
        confirmAfter : true,
    }
});

try {
    api = new RancherAPI({
        endpoint: process.env['RANCHER_API_ENDPOINT'],
        apikey: process.env['RANCHER_API_KEY'],
        apisecret: process.env['RANCHER_API_SECRET'],
    });

    // ENV or Commandline parameters
    CONFIG = {
        serviceName : argv.serviceName,
        imageRepo : argv.imageRepo,
        imageTag : argv.imageTag,
        serviceUpgradedTimeout : argv.serviceUpgradedTimeout,
        batchSize : argv.batchSize,
        intervalMillis : argv.intervalMillis,
        startFirst: argv.startFirst,
        confirmBefore: argv.confirmBefore,
        confirmAfter: argv.confirmAfter,
    };

} catch(e) {
    help();
    console.error(e);
    process.exit(1);
}

console.log('Using parameters:', CONFIG);

api.inServiceUpgrade({
    ...CONFIG,
    environment : { APP_VERSION: CONFIG.imageTag }
}).then(function(service) {
    console.log('SUCCESS!');
}, function(e) {
    help();
    console.log('FAILED!', e);
});
