const NodeHelper = require('node_helper');
const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");
const util = require("util");

module.exports = NodeHelper.create({
        
    start: function(){
        console.log(this.name + ' helper started ...');
    },

    writeConfig: function(access_token, refresh_token, api_server){
        var configFileName = path.resolve(__dirname + "/../../config/config.js");
        try {
            fs.accessSync(configFileName, fs.F_OK);
            var c = require(configFileName);
            var config = Object.assign({}, c);
            let questradeModule = config.modules.find(m => m.module === 'MMM-Questrade');
            var questradeConfig = questradeModule.config;

            questradeConfig.authToken = access_token;
            questradeConfig.refreshToken = refresh_token;
            questradeConfig.apiServer = api_server;

            config.modules[config.modules.findIndex(m => m.module === 'MMM-Questrade')].config = questradeConfig;
            
            var header = "/*************** AUTO GENERATED CONFIG WITH UPDATED QUESTRADE TOKENS ***************/\n\nvar config = \n";
            var footer = "\n\n/*************** DO NOT EDIT THE LINE BELOW ***************/\nif (typeof module !== 'undefined') {module.exports = config;}\n";

            fs.writeFile(configFileName, header + util.inspect(config, {
                showHidden: false,
                depth: null,
                maxArrayLength: null,
                compact: false
            }) + footer,
            (error) => {
                if (error) {
                    console.log("Error:" + error);
                }
                console.info("Saved new config!");
            });
        } catch (e) {
            console.error("Error writing new config: " + e);
        }
    },  

    socketNotificationReceived : function(notification, payload){
        var self = this;
		if (notification === 'FETCH_POSITIONS') {
            const config = payload;
            const url= config.apiServer + "v1/accounts/" + config.accountId + "/positions";

            fetch(url,{
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + config.authToken
                }
            })
            .then(resp => resp.json())
            .then(data => {
                if(data.hasOwnProperty('positions')) {
                    const positions = data.positions;
                    const tableData = {
                        columns: Object.keys(positions[0]).filter(column => config.columns.includes(column)),
                        rows: positions.map(position => {
                            return Object.keys(position)
                            .filter(column => config.columns.includes(column))
                            .reduce((row, column) => {
                                row.push(position[column]);
                                return row;
                            }, [])
                        })
                    };
                    self.sendSocketNotification('POSITIONS_RECEIVED', {
                        config,
                        tableData,
                    });
                } else if(data.hasOwnProperty('code') && data.code === 1017) {
                    console.log("Access token expired");
                    self.sendSocketNotification('ACCESS_TOKEN_EXPIRED', {});
                } else {
                    console.log("Unexpected Error: " + data);
                }
            });
        }
        if (notification === 'GET_ACCESS_TOKEN') {
            const config = payload;
            const token = config.refreshToken;
            const url = "https://login.questrade.com/oauth2/token";

            fetch(url,{
                method: 'POST',
                body: "grant_type=refresh_token&refresh_token=" + token,
                headers: 
                {
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            })
            .then(resp => resp.json())
            .then(data => {
                if(data.hasOwnProperty('access_token')) {
                    config.authToken = data.access_token;
                    config.refreshToken = data.refresh_token;
                    config.apiServer = data.api_server;
                    
                    self.writeConfig(config.authToken, config.refreshToken, config.apiServer);
                    self.sendSocketNotification('ACCESS_TOKEN_RECEIVED', config);
                } else {
                    console.log("Error retrieving access token: " + data);
                }
            })
            .catch((error) => console.log("Error retrieving access token: " + error));
        }
    },      
});

