import _ from 'lodash';
import {
    DynamoDB,
    // DynamoDBClient,
} from '@aws-sdk/client-dynamodb';
import {
    DynamoDBDocument,
    // DynamoDBDocumentClient,
} from '@aws-sdk/lib-dynamodb';

const isTest = process.env.JEST_WORKER_ID;

const config = {
    endpoint: 'http://localhost:8000',
    region: 'local-env',
    credentials: {
        accessKeyId: 'fakeMyKeyId',
        secretAccessKey: 'fakeSecretAccessKey',
    },
};


export const ddb = new DynamoDB({
    ...(isTest && config),
});

export const ddbDoc = DynamoDBDocument.from(
    ddb,
    {
        marshallOptions: {
            convertEmptyValues: true,
        },
    }
);


// These Barebones clients require that we handle marshalling and unmarshalling.
// So, I am not using them.
//
// barebones client
// export const ddbClient = new DynamoDBClient({
//     ...(isTest && config),
// });
// barebones client
// export const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

export const ddbRecursive = {
    scanAll: async (query) => {
        let response = {};
        let result = {
            $metadata: [],
            $LastEvaluatedKeys: [],
            Items: [],
            Count: 0,
            ScannedCount: 0,
        };
        do {
            query.ExclusiveStartKey = response.LastEvaluatedKey;
            response = await ddbDoc.scan(query);
            result = {
                $metadata: [
                    ...result.$metadata,
                    response.$metadata,
                ],
                $LastEvaluatedKeys: [
                    ...result.$LastEvaluatedKeys,
                    response.LastEvaluatedKey,
                ],
                Items: [
                    ...result.Items,
                    ...response.Items,
                ],
                Count: result.Count + response.Count,
                ScannedCount: result.ScannedCount + response.ScannedCount,
                LastEvaluatedKey: response.LastEvaluatedKey,
            };
        } while (!_.isNil(response?.LastEvaluatedKey));

        return result;
    },
};
