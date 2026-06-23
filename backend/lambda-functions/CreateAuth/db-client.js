'use strict';

// Drop-in replacement for data-api-client using AWS SDK v3 (compatible with Node 20 Lambda runtime).
// Exposes the same .query(sql, params) interface so no call-site changes are needed in DatabaseController.js.

const { RDSDataClient, ExecuteStatementCommand } = require('@aws-sdk/client-rds-data');

const client = new RDSDataClient({});

module.exports = function (config) {
    return {
        query: async function (sql, params) {
            const parameters = params
                ? Object.entries(params).map(([name, value]) => {
                      if (value === null || value === undefined) {
                          return { name, value: { isNull: true } };
                      } else if (typeof value === 'boolean') {
                          return { name, value: { booleanValue: value } };
                      } else if (typeof value === 'number') {
                          return Number.isInteger(value)
                              ? { name, value: { longValue: value } }
                              : { name, value: { doubleValue: value } };
                      } else {
                          return { name, value: { stringValue: String(value) } };
                      }
                  })
                : [];

            const command = new ExecuteStatementCommand({
                secretArn: config.secretArn,
                resourceArn: config.resourceArn,
                database: config.database,
                sql,
                parameters,
                includeResultMetadata: true,
            });

            const response = await client.send(command);

            const result = {
                numberOfRecordsUpdated: response.numberOfRecordsUpdated || 0,
            };

            // Expose auto-increment id for INSERT statements
            if (response.generatedFields && response.generatedFields.length > 0) {
                const f = response.generatedFields[0];
                result.insertId = f.longValue !== undefined ? f.longValue : f.stringValue;
            }

            // Convert RDS row/column format to plain objects
            if (response.records && response.columnMetadata) {
                result.records = response.records.map(row => {
                    const obj = {};
                    row.forEach((cell, i) => {
                        const col = response.columnMetadata[i].name;
                        if (cell.isNull) {
                            obj[col] = null;
                        } else if (cell.booleanValue !== undefined) {
                            obj[col] = cell.booleanValue;
                        } else if (cell.longValue !== undefined) {
                            obj[col] = cell.longValue;
                        } else if (cell.doubleValue !== undefined) {
                            obj[col] = cell.doubleValue;
                        } else if (cell.stringValue !== undefined) {
                            obj[col] = cell.stringValue;
                        } else if (cell.blobValue !== undefined) {
                            obj[col] = cell.blobValue;
                        } else {
                            obj[col] = null;
                        }
                    });
                    return obj;
                });
            } else {
                result.records = [];
            }

            return result;
        },
    };
};
