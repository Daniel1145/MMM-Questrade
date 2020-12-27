# MMM-Questrade
A MagicMirror module that fetches and displays your Questrade positions

Screenshot of the module shown in the bottom right using mock data:
![screenshot](/screenshots/MMM-Questrade.PNG)

## Installation
1. Navigate to your MagicMirror/modules directory
2. Clone the module with: `git clone https://github.com/Daniel1145/MMM-Questrade`
3. Configure the module following the instructions below

## Configuration
This module requires you to provide your own account ID, access token, refresh token, and api server from Questrade. These can be found by following the instructions provided here: https://www.questrade.com/api/documentation/getting-started.

To use this module, add the following to your config.js file:
```Javscript
modules: [
  ...
  {
      module: 'MMM-Questrade',
      position: 'top_right',
      config: {
        accountId: <Your account id>,
        authToken: <Your access token>,
        refreshToken: <Your refresh token>,
        apiServer: <Your api server>
      }
   },
   ...
]
```

### Configuration Options
The following configuration are optional, and can be configured to match your needs. As a side note, not all of the possible configurations have been tested, so changing some of these may have unexpected results (mainly the `columns` option)

| Option                       | Description
| ---------------------------- | -----------
| `tableTitle`                 | The title of the table. <br> **Default value:** `Positions`
| `maxRows`                    | The maximum number of rows to display. <br> **Default value:** `10`
| `rowBorder`                  | Whether to display borders between each row or not. <br> **Default value:** `true`
| `updateInterval`             | How often to fetch and update the table data (in milliseconds). <br> **Default value:** `30000`
| `columns`                    | An array containing the columns to be displayed. Possible values are the properties of the Position returned by the Questrade api call, which is found here: `https://www.questrade.com/api/documentation/rest-operations/account-calls/accounts-id-positions`. <br> **Default value:** `['symbol', 'openQuantity', 'currentMarketValue', 'openPnl', 'dayPnl']`
| `columnAliases`              | Object containing the column titles that should be used instead of the default names returned by the api. <br> **Default value:** `{symbol: 'Symbol', openQuantity: 'Open Quantity', currentMarketValue: 'Market Value', openPnl: 'Open P&L', dayPnl: 'Day P&L'}`
