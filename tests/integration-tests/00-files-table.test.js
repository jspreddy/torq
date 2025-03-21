import { ddbDoc } from './ddb-setup';

// Local Imports
import {
    Table,
    Query,
    Index,
} from '../../src';

describe('Integration Tests: Files Table', () => {
    beforeAll(async () => {
        await ddbDoc.put({ TableName: 'files', Item: { id: '1', version: '2024-01-01', name: 'hello' } });
        await ddbDoc.put({ TableName: 'files', Item: { id: '1', version: '2024-01-02', name: 'world' } });

        await ddbDoc.put({ TableName: 'files', Item: { id: '2', version: '2024-01-01', name: 'asdf' } });

        await ddbDoc.put({ TableName: 'files', Item: { id: 'stars', version: '2024-01-01', name: 'Sun' } });
        await ddbDoc.put({ TableName: 'files', Item: { id: 'stars', version: '2024-01-02', name: 'Vega Prime' } });
        await ddbDoc.put({ TableName: 'files', Item: { id: 'stars', version: '2024-01-03', name: 'Alpha Centauri' } });
        await ddbDoc.put({ TableName: 'files', Item: { id: 'stars', version: '2024-01-04', name: 'Betelgeuse', hearts: 20 } });
        await ddbDoc.put({ TableName: 'files', Item: { id: 'stars', version: '2024-01-05', name: 'Polaris' } });
        await ddbDoc.put({ TableName: 'files', Item: { id: 'stars', version: '2024-01-06', name: 'Sirius' } });
        await ddbDoc.put({ TableName: 'files', Item: { id: 'stars', version: '2024-02-01', name: 'Procyon' } });
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

            it('should filter for stars, where name is >= A and < C', async () => {
                const table = new Table('files', 'id', 'version');
                const x = new Query(table);
                x.where.hash.eq('stars')
                    .filter.gtEq('name', 'A')
                    .filter.lt('name', 'C');

                const query = x.toDynamo();
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

            it('should filter for stars, where name is between A and C', async () => {
                const table = new Table('files', 'id', 'version');
                const x = new Query(table);
                x.where.hash.eq('stars')
                    .filter.between('name', 'A', 'C');

                const query = x.toDynamo();
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

            it('should filter for stars, where name is between A and C and version > 2024-01-03', async () => {
                const table = new Table('files', 'id', 'version');
                const x = new Query(table);
                x.where.hash.eq('stars')
                    .filter.between('name', 'A', 'C')
                    .filter.gt('hearts', 10);

                const query = x.toDynamo();
                const response = await ddbDoc.query(query);

                expect(response).toMatchObject({
                    Count: 1,
                    ScannedCount: 7,
                    Items: [
                        {
                            id: 'stars',
                            name: 'Betelgeuse',
                            version: '2024-01-04',
                            hearts: 20,
                        },
                    ],
                });
            });
        });

        describe('Consumed Capacity', () => {
            it('should return consumed capacity TOTAL', async () => {
                const table = new Table('files', 'id', 'version');
                const x = new Query(table);
                x.select()
                    .where.hash.eq('stars')
                    .withConsumedCapacity('TOTAL');

                const response = await ddbDoc.query(x.toDynamo());
                expect(response).toEqual({
                    $metadata: expect.any(Object),
                    ConsumedCapacity: {
                        CapacityUnits: 0.5,
                        TableName: 'files',
                    },
                    Count: 7,
                    Items: expect.any(Array),
                    ScannedCount: 7,
                });
            });

            it('should return consumed capacity INDEXES, when querying a table', async () => {
                const table = new Table('files', 'id', 'version');
                const x = new Query(table);
                x.select()
                    .where.hash.eq('stars')
                    .withConsumedCapacity('INDEXES');

                const response = await ddbDoc.query(x.toDynamo());
                expect(response).toEqual({
                    $metadata: expect.any(Object),
                    ConsumedCapacity: {
                        CapacityUnits: 0.5,
                        Table: {
                            CapacityUnits: 0.5,
                        },
                        TableName: 'files',
                    },
                    Count: 7,
                    Items: expect.any(Array),
                    ScannedCount: 7,
                });
            });

            it('should return consumed capacity INDEXES, when querying an index', async () => {
                const table = new Table('files', 'id', 'version');
                const versionIndex = new Index('version-index', 'version');
                const x = new Query(table);

                x.select()
                    .using(versionIndex)
                    .where.hash.eq('2024-01')
                    .withConsumedCapacity('INDEXES');

                const response = await ddbDoc.query(x.toDynamo());
                expect(response).toEqual({
                    $metadata: expect.any(Object),
                    ConsumedCapacity: {
                        CapacityUnits: 0,
                        GlobalSecondaryIndexes: {
                            'version-index': {
                                CapacityUnits: 0,
                            },
                        },
                        Table: {
                            CapacityUnits: 0,
                        },
                        TableName: 'files',
                    },
                    Count: 0,
                    Items: [],
                    ScannedCount: 0,
                });
            });
        });
    });
});
