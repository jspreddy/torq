import { ddbDoc } from './ddb-setup';

// Local Imports
import { Query, DdbType, Operation, Index, Table } from '../../src';

describe('Integration Tests', () => {
    beforeAll(async () => {
        await ddbDoc.put({ TableName: 'files', Item: { id: '1', hello: 'world' } });
        await ddbDoc.put({ TableName: 'files', Item: { id: '2', hello: 'asdf' } });
    });

    it('should use basic test setup', async () => {
        const { Item } = await ddbDoc.get({ TableName: 'files', Key: { id: '1' } });
        expect(Item).toEqual({
            id: '1',
            hello: 'world',
        });
    });

    it('should use basic test setup', async () => {
        const { Item } = await ddbDoc.get({ TableName: 'files', Key: { id: '2' } });
        expect(Item).toEqual({
            id: '2',
            hello: 'asdf',
        });
    });

    it('should insert item into table', async () => {
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