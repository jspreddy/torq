import { ddbDoc } from './ddb-setup';
import userData from './data/users-data';
import * as Promise from 'bluebird';

import {
    Table,
    Query,
} from '../../src';

const usersTable = new Table('users', 'pk', 'sk');

async function addUserRecord(user) {
    return ddbDoc.put({ TableName: 'users', Item: user });
};

const queryMetadata = {
    $metadata: {
        attempts: 1,
        cfId: undefined,
        extendedRequestId: undefined,
        httpStatusCode: 200,
        requestId: expect.any(String),
        totalRetryDelay: 0,
    },
};

describe('Users Table Integration Tests', () => {
    beforeAll(async () => {
        // setup data for the users table from ./data/users-data.js
        await Promise.map(userData, (user) => addUserRecord(user));
    });

    describe('Query', () => {

        describe("ramana@example.com", () => {
            it('should fetch one user by pk and sk', async () => {
                const x = new Query(usersTable);

                x.select(['pk', 'sk', 'firstName', 'lastName', 'age'])
                    .where.hash.eq('ramana@example.com')
                    .where.range.eq('user');

                const result = await ddbDoc.query(x.toDynamo());
                expect(result.Items.length).toBe(1);
                expect(result.Items).toEqual([
                    {
                        pk: 'ramana@example.com',
                        sk: 'user',
                        firstName: 'ramana',
                        lastName: 'reddy',
                        age: 30
                    }
                ]);
            });

            it('should fetch all types for one email', async () => {
                const x = new Query(usersTable);

                x.select()
                    .where.hash.eq('ramana@example.com');

                const result = await ddbDoc.query(x.toDynamo());
                expect(result.Items.length).toBe(3);
                expect(result.Items).toEqual([
                    {
                        sk: 'role:basic',
                        name: 'basic',
                        pk: 'ramana@example.com',
                        privilege: 'read-basic-app'
                    },
                    {
                        sk: 'role:reports',
                        name: 'reports',
                        pk: 'ramana@example.com',
                        privilege: 'reports',
                        deleted_at: '2024-01-01T00:00:00.000Z'
                    },
                    {
                        firstName: 'ramana',
                        lastName: 'reddy',
                        favCar: 'Tesla',
                        address: '123 Main St',
                        phone: '123-456-7890',
                        favStar: 'Polaris',
                        sk: 'user',
                        pk: 'ramana@example.com',
                        favColor: 'blue',
                        age: 30
                    }
                ]);
            });

            it('should fetch records by filter for one email', async () => {
                const x = new Query(usersTable);

                x.select()
                    .where.hash.eq('ramana@example.com')
                    .filter.gt('age', 10);

                const result = await ddbDoc.query(x.toDynamo());
                expect(result.Items.length).toBe(1);
                expect(result.Items).toEqual([
                    {
                        pk: 'ramana@example.com',
                        sk: 'user',
                        age: 30,
                        favCar: 'Tesla',
                        favColor: 'blue',
                        favStar: 'Polaris',
                        firstName: 'ramana',
                        lastName: 'reddy',
                        phone: '123-456-7890',
                        address: '123 Main St',
                    }
                ]);
            });

            it('should fetch role records for one email', async () => {
                const x = new Query(usersTable);

                x.select()
                    .where.hash.eq('ramana@example.com')
                    .where.range.beginsWith('role:');

                const result = await ddbDoc.query(x.toDynamo());
                expect(result.Items.length).toBe(2);
                expect(result.Items).toEqual([
                    {
                        sk: 'role:basic',
                        name: 'basic',
                        pk: 'ramana@example.com',
                        privilege: 'read-basic-app'
                    },
                    {
                        sk: 'role:reports',
                        name: 'reports',
                        pk: 'ramana@example.com',
                        privilege: 'reports',
                        deleted_at: '2024-01-01T00:00:00.000Z'
                    }
                ]);
            });

            it('should fetch un-deleted role records for one email', async () => {
                const x = new Query(usersTable);

                x.select()
                    .where.hash.eq('ramana@example.com')
                    .where.range.beginsWith('role:')
                    .filter.attributeNotExists('deleted_at');

                const result = await ddbDoc.query(x.toDynamo());
                expect(result.Items.length).toBe(1);
                expect(result.Items).toEqual([
                    {
                        sk: 'role:basic',
                        name: 'basic',
                        pk: 'ramana@example.com',
                        privilege: 'read-basic-app'
                    }
                ]);
            });
        });

        describe("suresh@example.com", () => {
            it('should fetch one user by pk and sk', async () => {
                const x = new Query(usersTable);

                x.select(['pk', 'sk', 'firstName', 'lastName', 'age'])
                    .where.hash.eq('suresh@example.com')
                    .where.range.eq('user');

                const result = await ddbDoc.query(x.toDynamo());
                expect(result.Items.length).toBe(1);
                expect(result.Items).toEqual([
                    {
                        age: 25,
                        firstName: 'suresh',
                        lastName: 'kumar',
                        pk: 'suresh@example.com',
                        sk: 'user',
                    },
                ]);
            });

            it('should fetch all roles for this user', async () => {
                const x = new Query(usersTable);

                x.select()
                    .where.hash.eq('suresh@example.com')
                    .where.range.beginsWith('role:');

                const result = await ddbDoc.query(x.toDynamo());
                expect(result.Items.length).toBe(12);
                expect(result.Items).toMatchSnapshot();
            });

            it('should fetch un-deleted roles for this user', async () => {
                const x = new Query(usersTable);

                x.select()
                    .where.hash.eq('suresh@example.com')
                    .where.range.beginsWith('role:')
                    .filter.attributeNotExists('deleted_at');

                const result = await ddbDoc.query(x.toDynamo());
                expect(result.Items.length).toBe(8);
                expect(result.Items).toMatchSnapshot();
            });

            it('should count undeleted roles', async () => {
                const x = new Query(usersTable);
                x.count()
                    .where.hash.eq('suresh@example.com')
                    .where.range.beginsWith('role:')
                    .filter.attributeNotExists('deleted_at');

                const result = await ddbDoc.query(x.toDynamo());
                expect(result.Count).toBe(8);
                expect(result).toEqual(
                    {
                        ...queryMetadata,
                        Count: 8,
                        ScannedCount: 12,
                    }
                );
            });
        });

        describe('mahesh@example.com', () => {
            it('should count all records for this user', async () => {
                const x = new Query(usersTable);
                x.count().where.hash.eq('mahesh@example.com');
                const result = await ddbDoc.query(x.toDynamo());
                expect(result.Count).toBe(16);
                expect(result).toEqual(
                    {
                        ...queryMetadata,
                        Count: 16,
                        ScannedCount: 16,
                    }
                );
            });

            it('should count user objects for this user', async () => {
                const x = new Query(usersTable);
                x.count()
                    .where.hash.eq('mahesh@example.com')
                    .where.range.eq('user');
                const result = await ddbDoc.query(x.toDynamo());
                expect(result.Count).toBe(1);
                expect(result).toEqual(
                    {
                        ...queryMetadata,
                        Count: 1,
                        ScannedCount: 1,
                    }
                );
            });

            it('should count addresses for this user', async () => {
                const x = new Query(usersTable);
                x.count()
                    .where.hash.eq('mahesh@example.com')
                    .where.range.beginsWith('address:');
                const result = await ddbDoc.query(x.toDynamo());
                expect(result.Count).toBe(6);
                expect(result).toEqual(
                    {
                        ...queryMetadata,
                        Count: 6,
                        ScannedCount: 6,
                    }
                );
            });

            it('should count orders for this user', async () => {
                const x = new Query(usersTable);
                x.count()
                    .where.hash.eq('mahesh@example.com')
                    .where.range.beginsWith('order:');
                const result = await ddbDoc.query(x.toDynamo());
                expect(result.Count).toBe(5);
                expect(result).toEqual(
                    {
                        ...queryMetadata,
                        Count: 5,
                        ScannedCount: 5,
                    }
                );
            });

            it('should count wishlist for this user', async () => {
                const x = new Query(usersTable);
                x.count()
                    .where.hash.eq('mahesh@example.com')
                    .where.range.beginsWith('wishlist:');
                const result = await ddbDoc.query(x.toDynamo());
                expect(result.Count).toBe(2);
                expect(result).toEqual(
                    {
                        ...queryMetadata,
                        Count: 2,
                        ScannedCount: 2,
                    }
                );
            });

            it('should fetch all wishlist items for this user', async () => {
                const x = new Query(usersTable);
                x.select()
                    .where.hash.eq('mahesh@example.com')
                    .where.range.beginsWith('wishlist:');
                const result = await ddbDoc.query(x.toDynamo());
                expect(result.Items.length).toBe(2);
                expect(result.Items).toMatchSnapshot();
            });

            it('should fetch addresses greater than 2, less than 5', async () => {
                const x = new Query(usersTable);
                x.select()
                    .where.hash.eq('mahesh@example.com')
                    .where.range.between('address:2', 'address:5');
                const result = await ddbDoc.query(x.toDynamo());
                expect(result.Items.length).toBe(4);
                expect(result.Items).toMatchSnapshot();
            });

            it('should fetch addresses in CA', async () => {
                const x = new Query(usersTable);
                x.select()
                    .where.hash.eq('mahesh@example.com')
                    .where.range.beginsWith('address:')
                    .filter.eq('state', 'CA');
                const result = await ddbDoc.query(x.toDynamo());
                expect(result.Items.length).toBe(2);
                expect(result.Items).toMatchSnapshot();
            });

            it('should fetch orders greater than 2024-02 and less than 2024-04', async () => {
                const x = new Query(usersTable);
                x.select()
                    .where.hash.eq('mahesh@example.com')
                    .where.range.beginsWith('order:')
                    .filter.gt('orderDate', '2024-02')
                    .filter.lt('orderDate', '2024-04');
                const result = await ddbDoc.query(x.toDynamo());
                expect(result.Items.length).toBe(2);
                expect(result.Items).toMatchSnapshot();
            });

            it('should fetch orders where size of items is 3', async () => {
                const x = new Query(usersTable);
                x.select()
                    .where.hash.eq('mahesh@example.com')
                    .where.range.beginsWith('order:')
                    .filter.size('items', '=', 3);
                const result = await ddbDoc.query(x.toDynamo());
                expect(result.Items.length).toBe(2);
                expect(result.Items).toMatchSnapshot();
            });

            it('should fetch wishlist where total less than 4000', async () => {
                const x = new Query(usersTable);
                x.select()
                    .where.hash.eq('mahesh@example.com')
                    .where.range.beginsWith('wishlist:')
                    .filter.lt('total', 4000);
                const result = await ddbDoc.query(x.toDynamo());
                expect(result.Items.length).toBe(1);
                expect(result.Items).toMatchSnapshot();
            });

            it('should fetch wishlist where size of items is 3', async () => {
                const x = new Query(usersTable);
                x.select()
                    .where.hash.eq('mahesh@example.com')
                    .where.range.beginsWith('wishlist:')
                    .filter.size('items', '=', 3);
                const result = await ddbDoc.query(x.toDynamo());
                expect(result.Items.length).toBe(1);
                expect(result.Items).toMatchSnapshot();
            });
        });
    });
});