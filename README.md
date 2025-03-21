# torq

SQL Like query builder for dynamodb.


## Features

SQL Like Query interface for better code readability.

- Supports `select`, `scan` and `count` operations
- Supports **select**ing specific columns
- Supports **Hash Keys** and **Range Keys**
- Supports **Filters**
- Supports various operations for **Range Keys** and **Filters**
- Supports **Pagination** and **limit**ing results.
- Automatically handles reserved and special character attribute names by using `ExpressionAttributeNames`
- Supports querying on **Indexes**, with optional scan direction
- Well Tested: Unit tests + Integration Tests (using `jest-dynamodb`).
- Supports returning **Consumed Capacity** from dynamodb

> See tests for all the features that are supported, and examples on how to use them.
> - [Unit Tests](https://github.com/jspreddy/torq/blob/main/tests/unit-tests/index.test.js)
> - [Integration tests: Files Table](https://github.com/jspreddy/torq/blob/main/tests/integration-tests/00-files-table.test.js#L45)
> - [Integration tests: Users Table](https://github.com/jspreddy/torq/blob/main/tests/integration-tests/01-users-table.test.js#L33)


## Examples

### Example 1: Basic query

```js
const myTable = new Table('some-table-name', 'pk', 'sk');
const x = new Query(myTable);

x.select(['asdf', 'pqrs'])
    .where.hash.eq('aasdf')
    .where.range.eq('1235:238h9084')
    .filter.eq('flower', 'rose')
    .filter.eq('isPolinated', true)
    .limit(10);

// Convert to object that can be used with dynamodb client.
console.log(x.toDynamo());

```

This is what `x.toDynamo()` returns.
```js
{
    TableName: 'some-table-name',
    Limit: 10,
    ProjectionExpression: "asdf, pqrs",
    KeyConditionExpression: "pk = :pk and sk = :sk",
    FilterExpression: "flower = :flower and isPolinated = :isPolinated",
    ExpressionAttributeValues: {
        ":pk": 'aasdf',
        ':sk': '1235:238h9084',
        ':flower': 'rose',
        ':isPolinated': true,
    },
}
```


### Example 2: Automatic handling of reserved attribute names.

```js
const table = new Table('some-table-name', '_friend', '_best');
const x = new Query(table);

// query builder
x.select(['asdf', 'pqrs'])
    .where.hash.eq('ramana')
    .where.range.eq('bestie')
    .filter.eq('_test', true)
    .filter.eq('__test', 'stop!');


// log the result
console.log(x.toDynamo());
```

This is the resulting dynamo query.
```js
{
    TableName: 'some-table-name',
    Limit: 25,
    ProjectionExpression: "asdf, pqrs",
    KeyConditionExpression: "#_friend = :_friend and #_best = :_best",
    FilterExpression: "#_test = :_test and #__test = :__test",
    ExpressionAttributeNames: {
        '#_friend': '_friend',
        '#_best': '_best',
        '#_test': '_test',
        '#__test': '__test',
    },
    ExpressionAttributeValues: {
        ':_friend': 'ramana',
        ':_best': 'bestie',
        ':_test': true,
        ':__test': 'stop!',
    },
}
```

> See the section on `"Reserved & Special Char Names"` in [unit tests](https://github.com/jspreddy/torq/blob/main/tests/unit-tests/query.test.js#L570) for more examples.



### More Examples

See tests for all the features that are supported, and examples on how to use them.
- [Unit Tests](https://github.com/jspreddy/torq/blob/main/tests/unit-tests/index.test.js)
- [Integration tests: Files Table](https://github.com/jspreddy/torq/blob/main/tests/integration-tests/00-files-table.test.js#L45)
- [Integration tests: Users Table](https://github.com/jspreddy/torq/blob/main/tests/integration-tests/01-users-table.test.js#L33)



-----------------------------



# For Maintainer

## Reference Docs

Docs for referencing while building this library.

- [AWS Dynamodb](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/WorkingWithItems.html)
- [Dynamo Reserved Words](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/ReservedWords.html)
- [Dynamo Scan](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Scan.html)
- [Dynamo Parallel Scan](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Scan.html#Scan.ParallelScan)
- [Dynamo TTL](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/TTL.html)


## TODO

- TODO: Provide an interface to run the dynamodb operations (Query, Scan).

- TODO: Add recursive ddb query/scan to fill the requested limit.

- TODO: Add support for parallel scans.
  https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Scan.html#Scan.ParallelScan

- TODO: Add support for easy ttl operations.
  https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/TTL.html
