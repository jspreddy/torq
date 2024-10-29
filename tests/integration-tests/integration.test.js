import { ddbDoc } from './ddb-setup';
import { exec } from 'node:child_process';

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
        await ddbDoc.put({ TableName: 'files', Item: { id: '1', version: '2024-01-01', name: 'hello' } });
        await ddbDoc.put({ TableName: 'files', Item: { id: '1', version: '2024-01-02', name: 'world' } });

        await ddbDoc.put({ TableName: 'files', Item: { id: '2', version: '2024-01-01', name: 'asdf' } });

        await ddbDoc.put({ TableName: 'files', Item: { id: 'stars', version: '2024-01-01', name: 'Sun' } });
        await ddbDoc.put({ TableName: 'files', Item: { id: 'stars', version: '2024-01-02', name: 'Vega Prime' } });
        await ddbDoc.put({ TableName: 'files', Item: { id: 'stars', version: '2024-01-03', name: 'Alpha Centauri' } });
        await ddbDoc.put({ TableName: 'files', Item: { id: 'stars', version: '2024-01-04', name: 'Betelgeuse' } });
        await ddbDoc.put({ TableName: 'files', Item: { id: 'stars', version: '2024-01-05', name: 'Polaris' } });
        await ddbDoc.put({ TableName: 'files', Item: { id: 'stars', version: '2024-01-06', name: 'Sirius' } });
        await ddbDoc.put({ TableName: 'files', Item: { id: 'stars', version: '2024-02-01', name: 'Procyon' } });
    });

    afterAll(() => {
        try {
            // here for when there is a orphan java dynamodb local process hanging around.
            exec("kill -9 $(pgrep -f DynamoDBLocal)");
        } catch (e) {
            console.log('Failed to kill orphan java dynamodb-local process');
            console.log(e);
        }
    });

    describe('Connectivity Checks', () => {
        it('should get item by id 1', async () => {
            const { Item } = await ddbDoc.get({ TableName: 'files', Key: { id: '1', version: '2024-01-01' } });
            expect(Item).toEqual({
                id: '1',
                name: 'hello',
                version: '2024-01-01',
            });
        });

        it('should get item by id 2', async () => {
            const { Item } = await ddbDoc.get({ TableName: 'files', Key: { id: '2', version: '2024-01-01' } });
            expect(Item).toEqual({
                id: '2',
                name: 'asdf',
                version: '2024-01-01',
            });
        });
    });

    describe('class: Query', () => {

        describe('With only HASH key on table definition', () => {

            it('should Query for item 1', async () => {
                const table = new Table('files', 'id');
                const x = new Query(table);
                x.where.hash.eq('1');

                const response = await ddbDoc.query(x.toDynamo());

                expect(response).toMatchObject({
                    Count: 2,
                    ScannedCount: 2,
                    Items: [
                        {
                            id: '1',
                            name: 'hello',
                            version: '2024-01-01',
                        },
                        {
                            id: '1',
                            name: 'world',
                            version: '2024-01-02',
                        },
                    ],
                });
            });

            it('should Query for item 2', async () => {
                const table = new Table('files', 'id');
                const x = new Query(table);
                x.where.hash.eq('2');

                const response = await ddbDoc.query(x.toDynamo());

                expect(response).toMatchObject({
                    Count: 1,
                    ScannedCount: 1,
                    Items: [
                        {
                            id: '2',
                            name: 'asdf',
                            version: '2024-01-01',
                        },
                    ],
                });
            });
        });

        describe('With HASH and RANGE keys on table definition', () => {

            it('should Query for item 2, with hash key only', async () => {
                const table = new Table('files', 'id', 'version');
                const x = new Query(table);
                x.where.hash.eq('2');

                const response = await ddbDoc.query(x.toDynamo());

                expect(response).toMatchObject({
                    Count: 1,
                    ScannedCount: 1,
                    Items: [
                        {
                            id: '2',
                            name: 'asdf',
                            version: '2024-01-01',
                        },
                    ],
                });
            });

            it('should Query for item 1 with hash and range keys', async () => {
                const table = new Table('files', 'id', 'version');
                const x = new Query(table);
                x.where.hash.eq('1')
                    .where.range.eq('2024-01-02');

                const response = await ddbDoc.query(x.toDynamo());

                expect(response).toMatchObject({
                    Count: 1,
                    ScannedCount: 1,
                    Items: [
                        {
                            id: '1',
                            name: 'world',
                            version: '2024-01-02',
                        },
                    ],
                });
            });

        });

        describe('RANGE key operations', () => {

            it('should Query for stars, where version is between 2024-01-02 and 2024-01-04', async () => {
                const table = new Table('files', 'id', 'version');
                const x = new Query(table);
                x.where.hash.eq('stars')
                    .where.range.between('2024-01-02', '2024-01-04');

                const response = await ddbDoc.query(x.toDynamo());

                expect(response).toMatchObject({
                    Count: 3,
                    ScannedCount: 3,
                    Items: [
                        {
                            id: 'stars',
                            name: 'Vega Prime',
                            version: '2024-01-02',
                        },
                        {
                            id: 'stars',
                            name: 'Alpha Centauri',
                            version: '2024-01-03',
                        },
                        {
                            id: 'stars',
                            name: 'Betelgeuse',
                            version: '2024-01-04',
                        },
                    ],
                });
            });

            it('should query for stars, where version is greater than 2024-01-04', async () => {
                const table = new Table('files', 'id', 'version');
                const x = new Query(table);
                x.where.hash.eq('stars')
                    .where.range.gt('2024-01-04');

                const response = await ddbDoc.query(x.toDynamo());

                expect(response).toMatchObject({
                    Count: 3,
                    ScannedCount: 3,
                    Items: [
                        {
                            id: 'stars',
                            name: 'Polaris',
                            version: '2024-01-05',
                        },
                        {
                            id: 'stars',
                            name: 'Sirius',
                            version: '2024-01-06',
                        },
                        {
                            id: 'stars',
                            name: 'Procyon',
                            version: '2024-02-01',
                        },
                    ],
                });
            });

            it('should query for stars, where version is greater than or equal to 2024-01-04', async () => {
                const table = new Table('files', 'id', 'version');
                const x = new Query(table);
                x.where.hash.eq('stars')
                    .where.range.gtEq('2024-01-04');

                const response = await ddbDoc.query(x.toDynamo());

                expect(response).toMatchObject({
                    Count: 4,
                    ScannedCount: 4,
                    Items: [
                        {
                            id: 'stars',
                            name: 'Betelgeuse',
                            version: '2024-01-04',
                        },
                        {
                            id: 'stars',
                            name: 'Polaris',
                            version: '2024-01-05',
                        },
                        {
                            id: 'stars',
                            name: 'Sirius',
                            version: '2024-01-06',
                        },
                        {
                            id: 'stars',
                            name: 'Procyon',
                            version: '2024-02-01',
                        },
                    ],
                });
            });

            it('should query for stars, where version is less than 2024-01-04', async () => {
                const table = new Table('files', 'id', 'version');
                const x = new Query(table);
                x.where.hash.eq('stars')
                    .where.range.lt('2024-01-04');

                const response = await ddbDoc.query(x.toDynamo());

                expect(response).toMatchObject({
                    Count: 3,
                    ScannedCount: 3,
                    Items: [
                        {
                            id: 'stars',
                            name: 'Sun',
                            version: '2024-01-01',
                        },
                        {
                            id: 'stars',
                            name: 'Vega Prime',
                            version: '2024-01-02',
                        },
                        {
                            id: 'stars',
                            name: 'Alpha Centauri',
                            version: '2024-01-03',
                        },
                    ],
                });
            });

            it('should query for stars, where version is less than or equal to 2024-01-02', async () => {
                const table = new Table('files', 'id', 'version');
                const x = new Query(table);
                x.where.hash.eq('stars')
                    .where.range.ltEq('2024-01-02');

                const response = await ddbDoc.query(x.toDynamo());

                expect(response).toMatchObject({
                    Count: 2,
                    ScannedCount: 2,
                    Items: [
                        {
                            id: 'stars',
                            name: 'Sun',
                            version: '2024-01-01',
                        },
                        {
                            id: 'stars',
                            name: 'Vega Prime',
                            version: '2024-01-02',
                        },
                    ],
                });
            });

            it('should query for stars, where version begins with 2024-01', async () => {
                const table = new Table('files', 'id', 'version');
                const x = new Query(table);
                x.where.hash.eq('stars')
                    .where.range.beginsWith('2024-01');

                const response = await ddbDoc.query(x.toDynamo());

                expect(response).toMatchObject({
                    Count: 6,
                    ScannedCount: 6,
                    Items: [
                        {
                            id: 'stars',
                            name: 'Sun',
                            version: '2024-01-01',
                        },
                        {
                            id: 'stars',
                            name: 'Vega Prime',
                            version: '2024-01-02',
                        },
                        {
                            id: 'stars',
                            name: 'Alpha Centauri',
                            version: '2024-01-03',
                        },
                        {
                            id: 'stars',
                            name: 'Betelgeuse',
                            version: '2024-01-04',
                        },
                        {
                            id: 'stars',
                            name: 'Polaris',
                            version: '2024-01-05',
                        },
                        {
                            id: 'stars',
                            name: 'Sirius',
                            version: '2024-01-06',
                        },
                    ],
                });
            });
        });

        describe('FILTER operations', () => {

            it('should filter for stars, where name = "Sun"', async () => {
                const table = new Table('files', 'id', 'version');
                const x = new Query(table);
                x.where.hash.eq('stars')
                    .filter.eq('name', 'Sun');

                const response = await ddbDoc.query(x.toDynamo());

                expect(response).toMatchObject({
                    Count: 1,
                    ScannedCount: 7, // because filter iterates over all items with hash key = stars
                    Items: [
                        {
                            id: 'stars',
                            name: 'Sun',
                            version: '2024-01-01',
                        },
                    ],
                });
            });

            it('should filter for stars, where name begins with "S"', async () => {
                const table = new Table('files', 'id', 'version');
                const x = new Query(table);
                x.where.hash.eq('stars')
                    .filter.beginsWith('name', 'S');

                const response = await ddbDoc.query(x.toDynamo());

                expect(response).toMatchObject({
                    Count: 2,
                    ScannedCount: 7,
                    Items: [
                        {
                            id: 'stars',
                            name: 'Sun',
                            version: '2024-01-01',
                        },
                        {
                            id: 'stars',
                            name: 'Sirius',
                            version: '2024-01-06',
                        },
                    ],
                });
            });

            it('should filter for stars, where name contains "o"', async () => {
                const table = new Table('files', 'id', 'version');
                const x = new Query(table);
                x.where.hash.eq('stars')
                    .filter.contains('name', 'o');

                const response = await ddbDoc.query(x.toDynamo());

                expect(response).toMatchObject({
                    Count: 2,
                    ScannedCount: 7,
                    Items: [
                        {
                            id: 'stars',
                            name: 'Polaris',
                            version: '2024-01-05',
                        },
                        {
                            id: 'stars',
                            name: 'Procyon',
                            version: '2024-02-01',
                        },
                    ],
                });
            });

            it('should filter for stars, where name not equal to "Sun"', async () => {
                const table = new Table('files', 'id', 'version');
                const x = new Query(table);
                x.where.hash.eq('stars')
                    .filter.notEq('name', 'Sun');

                const response = await ddbDoc.query(x.toDynamo());

                expect(response).toMatchObject({
                    Count: 6,
                    ScannedCount: 7,
                    Items: [
                        {
                            id: 'stars',
                            name: 'Vega Prime',
                            version: '2024-01-02',
                        },
                        {
                            id: 'stars',
                            name: 'Alpha Centauri',
                            version: '2024-01-03',
                        },
                        {
                            id: 'stars',
                            name: 'Betelgeuse',
                            version: '2024-01-04',
                        },
                        {
                            id: 'stars',
                            name: 'Polaris',
                            version: '2024-01-05',
                        },
                        {
                            id: 'stars',
                            name: 'Sirius',
                            version: '2024-01-06',
                        },
                        {
                            id: 'stars',
                            name: 'Procyon',
                            version: '2024-02-01',
                        },
                    ],
                });
            });

            it.skip('TODO: should filter for stars, where name is >= A and < C', async () => {
                const table = new Table('files', 'id', 'version');
                const x = new Query(table);
                x.where.hash.eq('stars')
                    .filter.gtEq('name', 'A')
                    .filter.lt('name', 'C');

                const query = x.toDynamo();
                console.log(query);
                const response = await ddbDoc.query(query);

                expect(response).toMatchObject({
                    Count: 2,
                    ScannedCount: 7,
                    Items: [
                        {
                            id: 'stars',
                            name: 'Alpha Centauri',
                            version: '2024-01-03',
                        },
                        {
                            id: 'stars',
                            name: 'Betelgeuse',
                            version: '2024-01-04',
                        },
                    ],
                });
            });

            it.skip('TODO: should filter for stars, where name is between A and C', async () => {
                const table = new Table('files', 'id', 'version');
                const x = new Query(table);
                x.where.hash.eq('stars')
                    .filter.between('name', 'A', 'C');

                const query = x.toDynamo();
                console.log(query);
                const response = await ddbDoc.query(query);

                expect(response).toMatchObject({
                    Count: 2,
                    ScannedCount: 7,
                    Items: [
                        {
                            id: 'stars',
                            name: 'Alpha Centauri',
                            version: '2024-01-03',
                        },
                        {
                            id: 'stars',
                            name: 'Betelgeuse',
                            version: '2024-01-04',
                        },
                    ],
                });
            });
        });
    });
});
