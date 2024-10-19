# midas

SQL Like query builder for dynamodb.


## Features

SQL Like Query interface for better code readability.

- Keys: Hash Keys and Range Keys
- Supports Filters
- Supports range operations for range key and for filters.
- Supports limit
- Select specific columns
- Handles reserved and special character names by using `ExpressionAttributeNames`

> [See unit tests file for all the features that are supported.](https://github.com/jspreddy/midas/blob/main/tests/unit-tests/query.test.js#L69)



-----------------------------

## Examples

### Example 1: Basic query

```js
const x = new Query('some-table-name', 'pk', 'sk');

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
const x = new Query('some-table-name', '_friend', '_best');

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

> See the section on `"Reserved & Special Char Names"` in [unit tests](https://github.com/jspreddy/midas/blob/main/tests/unit-tests/query.test.js#L570) for more examples.



### More Examples

> [See unit tests file for all the features that are supported.](https://github.com/jspreddy/midas/blob/main/tests/unit-tests/query.test.js#L69)



-----------------------------



# For Maintainer

## Docs

Dynamodb: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/WorkingWithItems.html


## TODO

TODO: Add dynamodb integration tests using jest-dynamodb. 
https://jestjs.io/docs/dynamodb


TODO: Add suppport for COUNT.
https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Query.Other.html#Query.Count


TODO: Add support for pagination / lastEvaluatedKey.
https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Query.Pagination.html


TODO: Add support for consumed capacity.
https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Query.Other.html#Query.CapacityUnits


TODO: Add support for scan.
https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Scan.html


TODO: Add support for parallel scans.
https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Scan.html#Scan.ParallelScan


TODO: Add support for easy ttl operations.
https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/TTL.html


TODO: Add index support.
https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/SecondaryIndexes.html