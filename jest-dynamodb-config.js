module.exports = {
    tables: [
        {
            TableName: `files`,
            KeySchema: [
                { AttributeName: 'id', KeyType: 'HASH' },
                { AttributeName: 'version', KeyType: 'RANGE' },
            ],
            AttributeDefinitions: [
                { AttributeName: 'id', AttributeType: 'S' },
                { AttributeName: 'version', AttributeType: 'S' },
            ],
            GlobalSecondaryIndexes: [
                {
                    IndexName: 'version-index',
                    KeySchema: [{ AttributeName: 'version', KeyType: 'HASH' }],
                    Projection: {
                        ProjectionType: 'ALL',
                    },
                    ProvisionedThroughput: { ReadCapacityUnits: 10, WriteCapacityUnits: 10 },
                },
            ],
            ProvisionedThroughput: { ReadCapacityUnits: 10, WriteCapacityUnits: 10 },
        },
        {
            TableName: `users`,
            KeySchema: [
                { AttributeName: 'pk', KeyType: 'HASH' },
                { AttributeName: 'sk', KeyType: 'RANGE' },
            ],
            AttributeDefinitions: [
                { AttributeName: 'pk', AttributeType: 'S' },
                { AttributeName: 'sk', AttributeType: 'S' },
            ],
            ProvisionedThroughput: { ReadCapacityUnits: 10, WriteCapacityUnits: 10 },
        }
    ],
};