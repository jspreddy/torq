import { ddbDoc } from './ddb-setup';

// Local Imports
import {
    Table,
    // Index,
    Query,
    // DdbType,
    // Operation,
} from '../../src';

describe('Integration Tests', () => {
    beforeAll(async () => {
        await ddbDoc.put({ TableName: 'files', Item: { id: '1', hello: 'world' } });
        await ddbDoc.put({ TableName: 'files', Item: { id: '2', hello: 'asdf' } });
    });

    describe('Connectivity Checks', () => {
        it('should get item by id 1', async () => {
            const { Item } = await ddbDoc.get({ TableName: 'files', Key: { id: '1' } });
            expect(Item).toEqual({
                id: '1',
                hello: 'world',
            });
        });

        it('should get item by id 2', async () => {
            const { Item } = await ddbDoc.get({ TableName: 'files', Key: { id: '2' } });
            expect(Item).toEqual({
                id: '2',
                hello: 'asdf',
            });
        });
    });

    describe('class: Query', () => {
        it('should use Query object', async () => {
            const table = new Table('files', 'id');
            const x = new Query(table);
            x.where.hash.eq('2');

            const response = await ddbDoc.query(x.toDynamo());

            expect(response).toMatchObject({
                Count: 1,
                ScannedCount: 1,
                Items: [{
                    id: '2',
                    hello: 'asdf',
                }],
            });
        });
    });
});
