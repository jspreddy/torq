import { Query } from '@jspreddy/midas';
// import { Query } from '../../dist/main';
// import { Query } from '../../dist/module';

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
                hashVal: 'aasdf',
                rangeVal: '1235:238h9084',
                filters: [
                    { attrib: 'flower', val: 'rose', type: 'eq' },
                    { attrib: 'isPolinated', val: true, type: 'eq' }
                ],
                index: undefined,
                limit: 10
            });
        });
    });

    describe('Hash and Range', () => {
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
    });

});
