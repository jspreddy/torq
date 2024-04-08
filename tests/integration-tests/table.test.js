import { Table } from 'jspreddy-test';

describe('class: Table', () => {
    describe('class: Table', () => {
        it('should initialize with values', async () => {
            const x = new Table('some-table-name', 'pk', 'sk');
            expect(x.state).toMatchObject({
                name: 'some-table-name',
                hashKey: 'pk',
                rangeKey: 'sk'
            });
        });

        it('should have proper state after chaining methods', async () => {
            const x = new Table('some-table-name', 'pk', 'sk');
            x.select(['asdf', 'pqrs'])
                .where.hash.eq('aasdf')
                .where.range.eq('1235:238h9084')
                .filter.eq('flower', 'rose')
                .filter.eq('isPolinated', true)
                .limit(10);

            expect(x.state).toEqual({
                name: 'some-table-name',
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
                limit: 110
            });
        });
    });
});
