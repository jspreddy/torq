import { Query } from '../../src';

describe('class: Query', () => {

    describe('Internal State Checks', () => {
        it('should initialize with values', async () => {
            const x = new Query('some-table-name', 'pk', 'sk');
            expect(x.state).toMatchObject({
                tableName: 'some-table-name',
                hashKey: 'pk',
                rangeKey: 'sk'
            });
        });

        it('should have proper state after chaining methods', async () => {
            const x = new Query('some-table-name', 'pk', 'sk');

            x.select(['asdf', 'pqrs'])
                .where.hash.eq('aasdf')
                .where.range.eq('1235:238h9084')
                .filter.eq('flower', 'rose')
                .filter.eq('isPolinated', true)
                .limit(10);

            expect(x.state).toEqual({
                tableName: 'some-table-name',
                hashKey: 'pk',
                rangeKey: 'sk',
                selections: ['asdf', 'pqrs'],
                keys: [
                    { key: "pk", val: "aasdf", type: "hash-eq" },
                    { key: "sk", val: "1235:238h9084", type: "eq" },
                ],
                filters: [
                    { key: 'flower', val: 'rose', type: 'eq' },
                    { key: 'isPolinated', val: true, type: 'eq' }
                ],
                index: undefined,
                limit: 10
            });

            expect(x.toDynamo()).toEqual({
                TableName: "some-table-name",
                ProjectionExpression: "asdf, pqrs",
                KeyConditionExpression: "pk = :pk and sk = :sk",
                FilterExpression: "flower = :flower and isPolinated = :isPolinated",
                ExpressionAttributeNames: undefined,
                ExpressionAttributeValues: {
                    ":flower": "rose",
                    ":isPolinated": true,
                    ":pk": "aasdf",
                    ":sk": "1235:238h9084",
                },
                Limit: 10,
            });
        });
    });

    describe('Hash and Range equals', () => {
        it('should return proper dynamo query for hash and range', async () => {
            const x = new Query('some-table-name', 'pk', 'sk');

            x.select()
                .where.hash.eq('aasdf')
                .where.range.eq('1235:238h9084')
                .limit(10);

            expect(x.toDynamo()).toEqual({
                TableName: 'some-table-name',
                Limit: 10,
                KeyConditionExpression: "pk = :pk and sk = :sk",
                ExpressionAttributeValues: {
                    ":pk": 'aasdf',
                    ':sk': '1235:238h9084'
                },
            });
        });
    });

    describe('Range Operations', () => {
        it('should return correct begins_with query', async () => {
            const x = new Query('some-table-name', 'pk', 'sk');

            x.select()
                .where.hash.eq('aasdf')
                .where.range.beginsWith('asdf#');

            expect(x.toDynamo()).toEqual({
                TableName: 'some-table-name',
                KeyConditionExpression: "pk = :pk and begins_with(sk, :sk)",
                ExpressionAttributeValues: {
                    ":pk": 'aasdf',
                    ':sk': 'asdf#'
                },
                Limit: 25,
            });
        });

        it('should return query for ">" operation', async () => {
            const x = new Query('some-table-name', 'pk', 'sk');

            x.select()
                .where.hash.eq('sai.jonnala')
                .where.range.gt(10);

            expect(x.toDynamo()).toEqual({
                TableName: 'some-table-name',
                KeyConditionExpression: "pk = :pk and sk > :sk",
                ExpressionAttributeValues: {
                    ":pk": 'sai.jonnala',
                    ':sk': 10
                },
                Limit: 25,
            });
        });

        it('should return query for ">=" operation', async () => {
            const x = new Query('some-table-name', 'pk', 'sk');

            x.select()
                .where.hash.eq('sai.jonnala')
                .where.range.gtEq('9000');

            expect(x.toDynamo()).toEqual({
                TableName: 'some-table-name',
                KeyConditionExpression: "pk = :pk and sk >= :sk",
                ExpressionAttributeValues: {
                    ":pk": 'sai.jonnala',
                    ':sk': '9000'
                },
                Limit: 25,
            });
        });

        it('should return query for "<" operation', async () => {
            const x = new Query('some-table-name', 'pk', 'height');

            x.select()
                .where.hash.eq('sai.jonnala')
                .where.range.lt(6);

            expect(x.toDynamo()).toEqual({
                TableName: 'some-table-name',
                KeyConditionExpression: "pk = :pk and height < :height",
                ExpressionAttributeValues: {
                    ":pk": 'sai.jonnala',
                    ':height': 6,
                },
                Limit: 25,
            });
        });

        it('should return query for "<=" operation', async () => {
            const x = new Query('some-table-name', 'pk', 'height');

            x.select()
                .where.hash.eq('sai.jonnala')
                .where.range.ltEq(5.11);

            expect(x.toDynamo()).toEqual({
                TableName: 'some-table-name',
                KeyConditionExpression: "pk = :pk and height <= :height",
                ExpressionAttributeValues: {
                    ":pk": 'sai.jonnala',
                    ':height': 5.11,
                },
                Limit: 25,
            });
        });

        it('should return correct between query', async () => {
            const x = new Query('git-history-table', 'pk', 'date');

            x.select()
                .where.hash.eq('commit')
                .where.range.between('2024-01-01', '2024-12-31');

            expect(x.toDynamo()).toEqual({
                TableName: 'git-history-table',
                KeyConditionExpression: "pk = :pk and #date BETWEEN :date_start AND :date_end",
                ExpressionAttributeValues: {
                    ":pk": 'commit',
                    ':date_start': '2024-01-01',
                    ':date_end': '2024-12-31',
                },
                ExpressionAttributeNames: {
                    "#date": "date",
                },
                Limit: 25,
            });
        });
    });

    describe('selects', () => {
        it('should return proper selections', async () => {
            const x = new Query('some-table-name', 'pk', 'sk');

            x.select(['pk', 'sk', 'asdf', 'qwer'])
                .where.hash.eq('aasdf')
                .where.range.eq('1235:238h9084')
                .limit(10);

            expect(x.toDynamo()).toEqual({
                TableName: 'some-table-name',
                Limit: 10,
                ProjectionExpression: "pk, sk, asdf, qwer",
                KeyConditionExpression: "pk = :pk and sk = :sk",
                ExpressionAttributeValues: {
                    ":pk": 'aasdf',
                    ':sk': '1235:238h9084'
                },
            });
        });
    });

    describe('Filters', () => {
        it('should return key condition, filter expression and their combined attributes', async () => {
            const x = new Query('some-table-name', 'pk', 'sk');

            x.select(['asdf', 'pqrs'])
                .where.hash.eq('aasdf')
                .where.range.eq('1235:238h9084')
                .filter.eq('flower', 'rose')
                .filter.eq('isPolinated', true)
                .limit(10);

            expect(x.toDynamo()).toEqual({
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
            });
        });

        it('should return correct query for "=" (equals) operation', async () => {
            const x = new Query('some-table-name', 'pk', 'sk');

            x.select()
                .where.hash.eq('asdf')
                .where.range.eq('asdf')
                .filter.eq('weight', 124);

            expect(x.toDynamo()).toEqual({
                TableName: 'some-table-name',
                KeyConditionExpression: "pk = :pk and sk = :sk",
                FilterExpression: "weight = :weight",
                ExpressionAttributeValues: {
                    ":pk": 'asdf',
                    ':sk': 'asdf',
                    ":weight": 124,
                },
                Limit: 25,
            });
        });

        it('should return correct query for "<>" (not equals) operation', async () => {
            const x = new Query('some-table-name', 'pk', 'sk');

            x.select()
                .where.hash.eq('asdf')
                .where.range.eq('asdf')
                .filter.notEq('weight', 124);

            expect(x.toDynamo()).toEqual({
                TableName: 'some-table-name',
                KeyConditionExpression: "pk = :pk and sk = :sk",
                FilterExpression: "weight <> :weight",
                ExpressionAttributeValues: {
                    ":pk": 'asdf',
                    ':sk': 'asdf',
                    ":weight": 124,
                },
                Limit: 25,
            });
        });

        it('should return correct query for ">" operation', async () => {
            const x = new Query('some-table-name', 'pk', 'sk');

            x.select()
                .where.hash.eq('asdf')
                .where.range.eq('asdf')
                .filter.gt('weight', 124);

            expect(x.toDynamo()).toEqual({
                TableName: 'some-table-name',
                KeyConditionExpression: "pk = :pk and sk = :sk",
                FilterExpression: "weight > :weight",
                ExpressionAttributeValues: {
                    ":pk": 'asdf',
                    ':sk': 'asdf',
                    ":weight": 124,
                },
                Limit: 25,
            });
        });

        it('should return correct query for ">=" operation', async () => {
            const x = new Query('some-table-name', 'pk', 'sk');

            x.select()
                .where.hash.eq('asdf')
                .where.range.eq('asdf')
                .filter.gtEq('weight', 124);

            expect(x.toDynamo()).toEqual({
                TableName: 'some-table-name',
                KeyConditionExpression: "pk = :pk and sk = :sk",
                FilterExpression: "weight >= :weight",
                ExpressionAttributeValues: {
                    ":pk": 'asdf',
                    ':sk': 'asdf',
                    ":weight": 124,
                },
                Limit: 25,
            });
        });

        it('should return correct query for "<" operation', async () => {
            const x = new Query('some-table-name', 'pk', 'sk');

            x.select()
                .where.hash.eq('asdf')
                .where.range.eq('asdf')
                .filter.lt('weight', 124);

            expect(x.toDynamo()).toEqual({
                TableName: 'some-table-name',
                KeyConditionExpression: "pk = :pk and sk = :sk",
                FilterExpression: "weight < :weight",
                ExpressionAttributeValues: {
                    ":pk": 'asdf',
                    ':sk': 'asdf',
                    ":weight": 124,
                },
                Limit: 25,
            });
        });

        it('should return correct query for "<=" operation', async () => {
            const x = new Query('some-table-name', 'pk', 'sk');

            x.select()
                .where.hash.eq('asdf')
                .where.range.eq('asdf')
                .filter.ltEq('weight', 124);

            expect(x.toDynamo()).toEqual({
                TableName: 'some-table-name',
                KeyConditionExpression: "pk = :pk and sk = :sk",
                FilterExpression: "weight <= :weight",
                ExpressionAttributeValues: {
                    ":pk": 'asdf',
                    ':sk': 'asdf',
                    ":weight": 124,
                },
                Limit: 25,
            });
        });

        it('should return correct begins_with query', async () => {
            const x = new Query('some-table-name', 'pk', 'sk');

            x.select()
                .where.hash.eq('asdf')
                .where.range.eq('asdf')
                .filter.beginsWith('flower', 'red');

            expect(x.toDynamo()).toEqual({
                TableName: 'some-table-name',
                KeyConditionExpression: "pk = :pk and sk = :sk",
                FilterExpression: "begins_with(flower, :flower)",
                ExpressionAttributeValues: {
                    ":pk": 'asdf',
                    ':sk': 'asdf',
                    ":flower": "red",
                },
                Limit: 25,
            });
        });

        it('should return correct attribute_exists query', async () => {
            const x = new Query('some-table-name', 'pk', 'sk');

            x.select()
                .where.hash.eq('asdf')
                .where.range.eq('asdf')
                .filter.attributeExists('flower')
                .filter.attributeExists('fruit')
                .filter.attributeExists('connection');

            expect(x.toDynamo()).toEqual({
                TableName: 'some-table-name',
                KeyConditionExpression: "pk = :pk and sk = :sk",
                FilterExpression: "attribute_exists(flower) and attribute_exists(fruit) and attribute_exists(#connection)",
                ExpressionAttributeValues: {
                    ":pk": 'asdf',
                    ':sk': 'asdf',
                },
                ExpressionAttributeNames: {
                    "#connection": "connection",
                },
                Limit: 25,
            });
        });

        it('should return correct attribute_not_exists query', async () => {
            const x = new Query('some-table-name', 'pk', 'sk');

            x.select()
                .where.hash.eq('asdf')
                .where.range.eq('asdf')
                .filter.attributeExists('flower')
                .filter.attributeNotExists('fruit')
                .filter.attributeNotExists('connection');

            expect(x.toDynamo()).toEqual({
                TableName: 'some-table-name',
                KeyConditionExpression: "pk = :pk and sk = :sk",
                FilterExpression: "attribute_exists(flower) and attribute_not_exists(fruit) and attribute_not_exists(#connection)",
                ExpressionAttributeValues: {
                    ":pk": 'asdf',
                    ':sk': 'asdf',
                },
                ExpressionAttributeNames: {
                    "#connection": "connection",
                },
                Limit: 25,
            });
        });
    });

    describe('Reserved Names', () => {
        it('should convert dynamo reserved names to ExpressionAttributeNames', async () => {
            const x = new Query('some-table-name', 'pk', 'BY');

            x.select(['asdf', 'pqrs'])
                .where.hash.eq('aasdf')
                .where.range.eq('sai')
                .filter.eq('ABORT', true)
                .filter.eq('ACTION', 'stop!')
                .filter.eq('ATOMIC', 'Bam!!!!')
                .filter.eq('something', 'not to be exp named')
                .limit(10);

            expect(x.toDynamo()).toEqual({
                TableName: 'some-table-name',
                Limit: 10,
                ProjectionExpression: "asdf, pqrs",
                KeyConditionExpression: "pk = :pk and #BY = :BY",
                FilterExpression: "#ABORT = :ABORT and #ACTION = :ACTION and #ATOMIC = :ATOMIC and something = :something",
                ExpressionAttributeNames: {
                    '#BY': 'BY',
                    '#ABORT': 'ABORT',
                    '#ACTION': 'ACTION',
                    '#ATOMIC': 'ATOMIC',
                },
                ExpressionAttributeValues: {
                    ":pk": 'aasdf',
                    ':BY': 'sai',
                    ':ABORT': true,
                    ':ACTION': 'stop!',
                    ':ATOMIC': 'Bam!!!!',
                    ':something': 'not to be exp named',
                },
            });
        });

        it('should return correct beginswith query for reserved attribute name', async () => {
            const x = new Query('spies', 'name', 'AGENT');

            x.select()
                .where.hash.eq('sai.jonnala')
                .where.range.beginsWith('007#');

            expect(x.toDynamo()).toEqual({
                TableName: 'spies',
                KeyConditionExpression: "#name = :name and begins_with(#AGENT, :AGENT)",
                ExpressionAttributeValues: {
                    ":name": 'sai.jonnala',
                    ':AGENT': '007#',
                },
                ExpressionAttributeNames: {
                    "#AGENT": "AGENT",
                    "#name": "name",
                },
                Limit: 25,
            });
        });
    });

});
