import { Query } from '../../src/query';

describe('class: Query', () => {
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

    it('should return proper dynamo api reqeust payload', async () => {
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
            ExpressionAttributeValues: {
                ":pk": 'aasdf',
                ':sk': '1235:238h9084'
            },

        });
    });
});
