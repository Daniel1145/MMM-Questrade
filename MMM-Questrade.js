
'use strict';

Module.register("MMM-Questrade", {
    defaults: {
        tableTitle: 'Positions',
        maxRows: 10,
        rowBorder: true,
        updateInterval: 30000,
        columns: [
          'symbol',
          'openQuantity',
          'currentMarketValue',
          'openPnl',
          'dayPnl'
        ],
        columnAliases: {
          symbol: 'Symbol',
          openQuantity: 'Open Quantity',
          currentMarketValue: 'Market Value',
          openPnl: 'Open P&L',
          dayPnl: 'Day P&L',
        }
    },

    getStyles: function() {
        return ['MMM-Questrade.css'];
    },

	start: function() {
        const self = this;
        Log.info('Now Starting module: ' + self.name);

        self.tableData = {};

        self.fetchTableData();
        setInterval(() => {
            self.fetchTableData();
        }, self.config.updateInterval);
    },

    getDom: function() {
        const self = this;
        const wrapper = document.createElement('div');
        var header = document.createElement("header");
		header.innerHTML = this.config.tableTitle;
		wrapper.appendChild(header);
        const tableData = this.tableData;

        if (Object.keys(tableData).length === 0) {
            wrapper.className = 'small dimmed';
            wrapper.innerHTML = `Loading...`;
        } else {
            wrapper.setAttribute('id', 'questrade');
            wrapper.appendChild(self.buildTableDom(tableData, self.config));
        }

        return wrapper;
    },
    
    buildTableDom: function(tableData) {
        const decimalColumns = ['openPnl', 'dayPnl', 'currentMarketValue', 'currentPrice', 'averageEntryPrice', 'closedPnl', 'totalCost'].reduce((acc, colToFind) => {
            acc[colToFind] = tableData.columns.findIndex(currColumn => currColumn === colToFind);
            return acc;
        }, {});
        const self = this;

        var tableWrapper = document.createElement('table');
        tableWrapper.className = 'qt-table';
    
        var columnsWrapper = document.createElement('tr');
        var tmp = tableData.columns[decimalColumns['dayPnl']];
        tableData.columns[decimalColumns['dayPnl']] = tableData.columns[tableData.columns.length - 1];
        tableData.columns[tableData.columns.length - 1] = tmp;
        tableData.columns.map(column => {
            var columnElement = document.createElement('th');
            columnElement.className = 'bright' + (self.config.rowBorder ? ' show-border' : '');
            columnElement.appendChild(document.createTextNode(Object.keys(self.config.columnAliases).includes(column) ? self.config.columnAliases[column] : column));
            columnsWrapper.appendChild(columnElement);
        });
    
        tableWrapper.appendChild(columnsWrapper);
    
        tableData.rows.map((row, rowNum) => {
            if (rowNum < self.config.maxRows) {
                var rowWrapper = document.createElement('tr');
                var tmp = row[decimalColumns['dayPnl']];
                row[decimalColumns['dayPnl']] = row[row.length - 1];
                row[row.length - 1] = tmp;
                row.map((cell, col) => {
                    if (Object.values(decimalColumns).includes(col)) {
                        cell = cell.toFixed(2);
                    }
                    var cellElement = document.createElement('td');
                    var pnl = ((col === decimalColumns.openPnl || col === decimalColumns.dayPnl) ? (cell >= 0 ? 'profit' : 'loss') : '');
                    cellElement.className = (self.config.rowBorder ? 'show-border ' : '') + pnl;
                    cellElement.appendChild(document.createTextNode(cell));
                    rowWrapper.appendChild(cellElement);
                });
                tableWrapper.appendChild(rowWrapper);
            }
        });

        return tableWrapper;
    },

    fetchTableData: function() {
        this.sendSocketNotification('FETCH_POSITIONS', this.config);
    },

    socketNotificationReceived: function(notification, payload) {
        var self = this;
        if (notification === 'POSITIONS_RECEIVED') {
            const { tableConfig, tableData } = payload;
            self.tableData = tableData;
            self.updateDom();
        }
        if (notification === 'ACCESS_TOKEN_EXPIRED') {
            console.log("received access token expired");
            self.sendSocketNotification('GET_ACCESS_TOKEN', self.config);
        }
        if (notification === 'ACCESS_TOKEN_RECEIVED') {
            self.config = payload;
            console.log(self.config);
            self.fetchTableData(self.config);
            self.updateDom();
        }
    },
});
