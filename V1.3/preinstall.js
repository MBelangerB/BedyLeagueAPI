

'use strict';

const dragonUpdate = require('./controller/cronTask');

async function preInstall() {
    try {
        var ds = new dragonUpdate();

        await ds.initFolder().then(async init => {
            console.log(`initFolder : ${init}`);
            await ds.loadAPIConfigFile().then(async loading => {
                console.log(`Loading REsult : ${loading}`);
                await ds.downloadVersionFile().then(async updateVersion => {
                    console.log(`update version : ${updateVersion}`);
                    if (updateVersion) {
                        await ds.downloadFileData().then(result => {
                            console.log(`Download State: ${result}`)
                        });
                    }

                });
            });
        });

       return true;
    } catch (ex) {
        console.error(ex);
        return false;
    }
};

preInstall();
