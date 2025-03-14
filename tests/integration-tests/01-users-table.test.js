import _ from 'lodash';
import { ddbDoc, ddbRecursive } from './ddb-setup';
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
            describe("COUNT", () => {
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

            it('should fetch addresses between 2 and 5', async () => {
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

            it('should work with multiple filters on same attribute', async () => {
                const x = new Query(usersTable);
                x.select()
                    .where.hash.eq('mahesh@example.com')
                    .where.range.beginsWith('address:')
                    .filter.beginsWith('zip', '9')
                    .filter.beginsWith('zip', '90');
                const result = await ddbDoc.query(x.toDynamo());
                expect(result.Items.length).toBe(1);
                expect(result.Items).toMatchSnapshot();
            });
        });

        describe('ramesh@example.com: Pagination', () => {
            it('should fetch first page of records, returning a last evaluated key', async () => {
                const x = new Query(usersTable);
                x.select().where.hash.eq('ramesh@example.com');
                const result = await ddbDoc.query(x.toDynamo());
                expect(result.Items.length).toBe(25);
                expect(result.ScannedCount).toBe(25);
                expect(result.LastEvaluatedKey).toEqual({
                    "pk": "ramesh@example.com",
                    "sk": "role:research-write",
                });
                expect(_.omit(result, '$metadata')).toMatchSnapshot();
            });

            it("should fetch second page of records, using the last evaluated key from the first page", async () => {
                // total: 33, page1: 25, page2: 8
                const x = new Query(usersTable);
                x.select().where.hash.eq('ramesh@example.com');
                const result = await ddbDoc.query(x.toDynamo());
                expect(result.Items.length).toBe(25);
                expect(result.ScannedCount).toBe(25);
                expect(result.LastEvaluatedKey).toEqual({
                    "pk": "ramesh@example.com",
                    "sk": "role:research-write",
                });
                x.startAfter(result.LastEvaluatedKey);
                const result2 = await ddbDoc.query(x.toDynamo());
                expect(x.toDynamo()).toEqual({
                    TableName: "users",
                    KeyConditionExpression: "pk = :pk",
                    ExpressionAttributeValues: {
                        ":pk": "ramesh@example.com",
                    },
                    Limit: 25,
                    ExclusiveStartKey: {
                        pk: "ramesh@example.com",
                        sk: "role:research-write",
                    },
                });
                expect(result2.Items.length).toBe(8);
                expect(result2.ScannedCount).toBe(8);
                expect(_.omit(result2, '$metadata')).toMatchSnapshot();
            });

            it("should fetch fetch 3 records at a time", async () => {
                // total: 33, page1: 25, page2: 8
                const x = new Query(usersTable);
                x.select().where.hash.eq('ramesh@example.com').limit(3);

                let result;
                let counter = 0;
                let scannedCount = 0;
                let records = [];
                do {
                    x.startAfter(result?.LastEvaluatedKey);
                    result = await ddbDoc.query(x.toDynamo());
                    counter += result.Items.length;
                    scannedCount += result.ScannedCount;
                    records.push(...result.Items);
                } while (result.LastEvaluatedKey)


                expect(counter).toBe(33);
                expect(scannedCount).toBe(33);
                expect(records.length).toBe(33);
                expect(records).toMatchSnapshot();
            });
        });
    });

    describe('Scan', () => {
        it('should return all records', async () => {
            const x = new Query(usersTable);
            x.scan();
            const result = await ddbDoc.scan(x.toDynamo());
            expect(result.Items.length).toBe(25);
            expect(result.Items).toMatchSnapshot();
        });

        it('should return all records with specific columns', async () => {
            const x = new Query(usersTable);
            x.scan(['pk', 'sk']);
            const result = await ddbDoc.scan(x.toDynamo());
            expect(result.Items.length).toBe(25);
            expect(result.Items).toMatchSnapshot();
        });

        it('should return records for reserved column names', async () => {
            const x = new Query(usersTable);
            x.scan(['name']).limit(3);
            const result = await ddbDoc.scan(x.toDynamo());
            expect(result.Items.length).toBe(3);
            expect(result.Items).toMatchSnapshot();
        });

        it('should return records for reserved column names and filter on same column', async () => {
            const x = new Query(usersTable);
            x.scan(['pk', 'sk', 'name', 'privilege'])
                .filter.beginsWith('name', 'b')
                .limit(200);
            const result = await ddbDoc.scan(x.toDynamo());
            expect(result.Items.length).toBe(4);
            expect(result.Items).toMatchSnapshot();
        });

        it('with multiple filters, should return 1 record', async () => {
            const x = new Query(usersTable);
            x.scan()
                .filter.eq('sk', 'user')
                .filter.beginsWith('firstName', 's')
                .filter.contains('firstName', 'h');
            const query = x.toDynamo();
            const result = await ddbRecursive.scanAll(query);
            expect(result.Items.length).toBe(1);
            expect(result.Items).toMatchSnapshot();
        });

        it('should return all user records', async () => {
            const x = new Query(usersTable);
            x.scan()
                .filter.eq('sk', 'user');
            const query = x.toDynamo();
            const result = await ddbRecursive.scanAll(query);
            expect(result.Items.length).toBe(24);
            expect(result.Items).toMatchSnapshot();
        });

        it('should return all user records of age between 30 and 40', async () => {
            const x = new Query(usersTable);
            x.scan(['pk', 'sk', 'age'])
                .filter.eq('sk', 'user')
                .filter.gt('age', 30)
                .filter.lt('age', 40);

            const query = x.toDynamo();
            const result = await ddbRecursive.scanAll(query);
            expect(result.Items.length).toBe(10);
            expect(result.Items).toMatchSnapshot();
        });

        it('should return all user records with firstName containing "a" and "i"', async () => {
            const x = new Query(usersTable);
            x.scan(['pk', 'sk', 'firstName'])
                .filter.eq('sk', 'user')
                .filter.contains('firstName', 'a')
                .filter.contains('firstName', 'i');

            const query = x.toDynamo();
            const result = await ddbRecursive.scanAll(query);
            expect(result.Items.length).toBe(7);
            expect(result.Items).toMatchSnapshot();
        });
    });

    describe('Count', () => {
        it('should return count of records', async () => {
            const x = new Query(usersTable);
            x.count();
            const result = await ddbDoc.scan(x.toDynamo());
            expect(result.Count).toBe(25);
            expect(_.omit(result, '$metadata')).toMatchSnapshot();
        });

        it('should return recursive count of all records', async () => {
            const x = new Query(usersTable);
            x.count();
            const result = await ddbRecursive.scanAll(x.toDynamo());
            expect(result.Count).toBe(85);
            expect(result.Items.length).toBe(0);
            expect(_.omit(result, '$metadata')).toMatchSnapshot();
        });

        it('should return count of records for filter on reserved column name', async () => {
            const x = new Query(usersTable);
            x.count()
                .filter.beginsWith('name', 'b')
                .limit(200);
            const result = await ddbRecursive.scanAll(x.toDynamo());
            expect(result.Count).toBe(4);
            expect(result.Items.length).toBe(0);
            expect(_.omit(result, '$metadata')).toMatchSnapshot();
        });

        it('should return count of records using multiple filters', async () => {
            const x = new Query(usersTable);
            x.count()
                .filter.eq('sk', 'user')
                .filter.beginsWith('firstName', 'r')
                .filter.contains('firstName', 'a');
            const query = x.toDynamo();
            const result = await ddbRecursive.scanAll(query);
            expect(result.Count).toBe(4);
            expect(result.Items.length).toBe(0);
            expect(_.omit(result, '$metadata')).toMatchSnapshot();
        });

        it('should return count of records using raw filter', async () => {
            const x = new Query(usersTable);
            x.count()
                .filter.raw('sk = :sk and begins_with(#fn, :fn1) and contains(#fn, :fn2)', {
                    keys: {
                        '#fn': 'firstName',
                    },
                    vals: {
                        ':sk': 'user',
                        ':fn1': 'r',
                        ':fn2': 'a'
                    }
                });
            const query = x.toDynamo();
            const result = await ddbRecursive.scanAll(query);
            expect(result.Count).toBe(4);
            expect(result.Items.length).toBe(0);
            expect(_.omit(result, '$metadata')).toMatchSnapshot();
        });

        it('should return count of users', async () => {
            const x = new Query(usersTable);
            x.count()
                .filter.eq('sk', 'user');
            const query = x.toDynamo();
            const result = await ddbRecursive.scanAll(query);
            expect(result.Count).toBe(24);
            expect(result.Items.length).toBe(0);
            expect(_.omit(result, '$metadata')).toMatchSnapshot();
        });

        it('should return count of users of age between 30 and 40', async () => {
            const x = new Query(usersTable);
            x.count()
                .filter.eq('sk', 'user')
                .filter.gt('age', 30)
                .filter.lt('age', 40);

            const query = x.toDynamo();
            const result = await ddbRecursive.scanAll(query);
            expect(result.Count).toBe(10);
            expect(result.Items.length).toBe(0);
            expect(_.omit(result, '$metadata')).toMatchSnapshot();
        });

        it('should return count of users with firstName containing "a" and "i"', async () => {
            const x = new Query(usersTable);
            x.count()
                .filter.eq('sk', 'user')
                .filter.contains('firstName', 'a')
                .filter.contains('firstName', 'i');

            const query = x.toDynamo();
            const result = await ddbRecursive.scanAll(query);
            expect(result.Count).toBe(7);
            expect(result.Items.length).toBe(0);
            expect(_.omit(result, '$metadata')).toMatchSnapshot();
        });
    });
});
