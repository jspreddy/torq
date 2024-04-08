import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb"; // ES Modules import
// const { DynamoDBClient, QueryCommand } = require("@aws-sdk/client-dynamodb"); // CommonJS import
const client = new DynamoDBClient(config);
const input = { // QueryInput
    TableName: "STRING_VALUE", // required
    IndexName: "STRING_VALUE",
    Select: "ALL_ATTRIBUTES" || "ALL_PROJECTED_ATTRIBUTES" || "SPECIFIC_ATTRIBUTES" || "COUNT",
    AttributesToGet: [ // AttributeNameList
        "STRING_VALUE",
    ],
    Limit: Number("int"),
    ConsistentRead: true || false,
    KeyConditions: { // KeyConditions
        "<keys>": { // Condition
            AttributeValueList: [ // AttributeValueList
                { // AttributeValue Union: only one key present
                    S: "STRING_VALUE",
                    N: "STRING_VALUE",
                    B: new Uint8Array(), // e.g. Buffer.from("") or new TextEncoder().encode("")
                    SS: [ // StringSetAttributeValue
                        "STRING_VALUE",
                    ],
                    NS: [ // NumberSetAttributeValue
                        "STRING_VALUE",
                    ],
                    BS: [ // BinarySetAttributeValue
                        new Uint8Array(), // e.g. Buffer.from("") or new TextEncoder().encode("")
                    ],
                    M: { // MapAttributeValue
                        "<keys>": {//  Union: only one key present
                            S: "STRING_VALUE",
                            N: "STRING_VALUE",
                            B: new Uint8Array(), // e.g. Buffer.from("") or new TextEncoder().encode("")
                            SS: [
                                "STRING_VALUE",
                            ],
                            NS: [
                                "STRING_VALUE",
                            ],
                            BS: [
                                new Uint8Array(), // e.g. Buffer.from("") or new TextEncoder().encode("")
                            ],
                            M: {
                                "<keys>": "<AttributeValue>",
                            },
                            L: [ // ListAttributeValue
                                "<AttributeValue>",
                            ],
                            NULL: true || false,
                            BOOL: true || false,
                        },
                    },
                    L: [
                        "<AttributeValue>",
                    ],
                    NULL: true || false,
                    BOOL: true || false,
                },
            ],
            ComparisonOperator: "EQ" || "NE" || "IN" || "LE" || "LT" || "GE" || "GT" || "BETWEEN" || "NOT_NULL" || "NULL" || "CONTAINS" || "NOT_CONTAINS" || "BEGINS_WITH", // required
        },
    },
    QueryFilter: { // FilterConditionMap
        "<keys>": {
            AttributeValueList: [
                "<AttributeValue>",
            ],
            ComparisonOperator: "EQ" || "NE" || "IN" || "LE" || "LT" || "GE" || "GT" || "BETWEEN" || "NOT_NULL" || "NULL" || "CONTAINS" || "NOT_CONTAINS" || "BEGINS_WITH", // required
        },
    },
    ConditionalOperator: "AND" || "OR",
    ScanIndexForward: true || false,
    ExclusiveStartKey: { // Key
        "<keys>": "<AttributeValue>",
    },
    ReturnConsumedCapacity: "INDEXES" || "TOTAL" || "NONE",
    ProjectionExpression: "STRING_VALUE",
    FilterExpression: "STRING_VALUE",
    KeyConditionExpression: "STRING_VALUE",
    ExpressionAttributeNames: { // ExpressionAttributeNameMap
        "<keys>": "STRING_VALUE",
    },
    ExpressionAttributeValues: { // ExpressionAttributeValueMap
        "<keys>": "<AttributeValue>",
    },
};
const command = new QueryCommand(input);
const response = await client.send(command);

const output = { // QueryOutput
    Items: [ // ItemList
        { // AttributeMap
            "<keys>": { // AttributeValue Union: only one key present
                S: "STRING_VALUE",
                N: "STRING_VALUE",
                B: new Uint8Array(),
                SS: [ // StringSetAttributeValue
                    "STRING_VALUE",
                ],
                NS: [ // NumberSetAttributeValue
                    "STRING_VALUE",
                ],
                BS: [ // BinarySetAttributeValue
                    new Uint8Array(),
                ],
                M: { // MapAttributeValue
                    "<keys>": {//  Union: only one key present
                        S: "STRING_VALUE",
                        N: "STRING_VALUE",
                        B: new Uint8Array(),
                        SS: [
                            "STRING_VALUE",
                        ],
                        NS: [
                            "STRING_VALUE",
                        ],
                        BS: [
                            new Uint8Array(),
                        ],
                        M: {
                            "<keys>": "<AttributeValue>",
                        },
                        L: [ // ListAttributeValue
                            "<AttributeValue>",
                        ],
                        NULL: true || false,
                        BOOL: true || false,
                    },
                },
                L: [
                    "<AttributeValue>",
                ],
                NULL: true || false,
                BOOL: true || false,
            },
        },
    ],
    Count: Number("int"),
    ScannedCount: Number("int"),
    LastEvaluatedKey: { // Key
        "<keys>": "<AttributeValue>",
    },
    ConsumedCapacity: { // ConsumedCapacity
        TableName: "STRING_VALUE",
        CapacityUnits: Number("double"),
        ReadCapacityUnits: Number("double"),
        WriteCapacityUnits: Number("double"),
        Table: { // Capacity
            ReadCapacityUnits: Number("double"),
            WriteCapacityUnits: Number("double"),
            CapacityUnits: Number("double"),
        },
        LocalSecondaryIndexes: { // SecondaryIndexesCapacityMap
            "<keys>": {
                ReadCapacityUnits: Number("double"),
                WriteCapacityUnits: Number("double"),
                CapacityUnits: Number("double"),
            },
        },
        GlobalSecondaryIndexes: {
            "<keys>": {
                ReadCapacityUnits: Number("double"),
                WriteCapacityUnits: Number("double"),
                CapacityUnits: Number("double"),
            },
        },
    },
};

