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