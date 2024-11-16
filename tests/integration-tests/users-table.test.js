import { ddbDoc } from './ddb-setup';

import {
    Table,
    Query,
} from '../../src';


const usersTable = new Table('users', 'pk', 'sk');
async function addUserRecord(user) {
    return ddbDoc.put({ TableName: 'users', Item: user });
};

describe('Users Table Integration Tests', () => {
    beforeAll(async () => {
        // setup data for a users table, with first and last names, age, email, phone, address, fav star, fav color, fav car.   
        await addUserRecord({ pk: 'ramana@example.com', sk: 'user', firstName: 'ramana', lastName: 'reddy', age: 30, phone: '123-456-7890', address: '123 Main St', favStar: 'Polaris', favColor: 'blue', favCar: 'Tesla' });
        await addUserRecord({ pk: 'ramana@example.com', sk: 'role:basic', name: 'basic', privilege: 'read-basic-app' });
        await addUserRecord({ pk: 'ramana@example.com', sk: 'role:reports', name: 'reports', privilege: 'reports', deleted_at: '2024-01-01T00:00:00.000Z' });

        await addUserRecord({ pk: 'suresh@example.com', sk: 'user', firstName: 'suresh', lastName: 'kumar', age: 25, phone: '123-456-7890', address: '456 Elm St', favStar: 'Sirius', favColor: 'red', favCar: 'Ford' });
        await addUserRecord({ pk: 'suresh@example.com', sk: 'role:basic', name: 'basic', privilege: 'read-basic-app' });
        await addUserRecord({ pk: 'suresh@example.com', sk: 'role:reports', name: 'reports', privilege: 'reports' });

        await addUserRecord({ pk: 'mahesh@example.com', sk: 'user', firstName: 'mahesh', lastName: 'babu', age: 40, phone: '123-456-7890', address: '789 Oak St', favStar: 'Betelgeuse', favColor: 'green', favCar: 'Toyota' });
        await addUserRecord({ pk: 'mahesh@example.com', sk: 'role:basic', name: 'basic', privilege: 'read-basic-app' });
        await addUserRecord({ pk: 'mahesh@example.com', sk: 'role:reports', name: 'reports', privilege: 'reports' });

        await addUserRecord({ pk: 'ramesh@example.com', sk: 'user', firstName: 'ramesh', lastName: 'yadav', age: 35, phone: '123-456-7890', address: '101 Pine St', favStar: 'Alpha Centauri', favColor: 'yellow', favCar: 'Honda' });
        await addUserRecord({ pk: 'ramesh@example.com', sk: 'role:basic', name: 'basic', privilege: 'read-basic-app' });
        await addUserRecord({ pk: 'ramesh@example.com', sk: 'role:reports', name: 'reports', privilege: 'reports' });

        await addUserRecord({ pk: 'priya@example.com', sk: 'user', firstName: 'priya', lastName: 'sharma', age: 28, phone: '123-456-7891', address: '202 Cedar St', favStar: 'Vega Prime', favColor: 'purple', favCar: 'BMW' });
        await addUserRecord({ pk: 'priya@example.com', sk: 'role:basic', name: 'basic', privilege: 'read-basic-app' });
        await addUserRecord({ pk: 'priya@example.com', sk: 'role:reports', name: 'reports', privilege: 'reports' });

        await addUserRecord({ pk: 'raj@example.com', sk: 'user', firstName: 'raj', lastName: 'patel', age: 45, phone: '123-456-7892', address: '303 Maple St', favStar: 'Procyon', favColor: 'orange', favCar: 'Audi' });
        await addUserRecord({ pk: 'raj@example.com', sk: 'role:basic', name: 'basic', privilege: 'read-basic-app' });
        await addUserRecord({ pk: 'raj@example.com', sk: 'role:reports', name: 'reports', privilege: 'reports' });

        await addUserRecord({ pk: 'neha@example.com', sk: 'user', firstName: 'neha', lastName: 'gupta', age: 32, phone: '123-456-7893', address: '404 Birch St', favStar: 'Sun', favColor: 'pink', favCar: 'Mercedes' });
        await addUserRecord({ pk: 'neha@example.com', sk: 'role:basic', name: 'basic', privilege: 'read-basic-app' });
        await addUserRecord({ pk: 'neha@example.com', sk: 'role:reports', name: 'reports', privilege: 'reports' });

        await addUserRecord({ pk: 'amit@example.com', sk: 'user', firstName: 'amit', lastName: 'singh', age: 38, phone: '123-456-7894', address: '505 Walnut St', favStar: 'Polaris', favColor: 'black', favCar: 'Lexus' });
        await addUserRecord({ pk: 'amit@example.com', sk: 'role:basic', name: 'basic', privilege: 'read-basic-app' });
        await addUserRecord({ pk: 'amit@example.com', sk: 'role:reports', name: 'reports', privilege: 'reports' });

        await addUserRecord({ pk: 'deepa@example.com', sk: 'user', firstName: 'deepa', lastName: 'verma', age: 29, phone: '123-456-7895', address: '606 Ash St', favStar: 'Sirius', favColor: 'white', favCar: 'Volvo' });
        await addUserRecord({ pk: 'deepa@example.com', sk: 'role:basic', name: 'basic', privilege: 'read-basic-app' });
        await addUserRecord({ pk: 'deepa@example.com', sk: 'role:reports', name: 'reports', privilege: 'reports' });

        await addUserRecord({ pk: 'vikram@example.com', sk: 'user', firstName: 'vikram', lastName: 'malhotra', age: 42, phone: '123-456-7896', address: '707 Spruce St', favStar: 'Betelgeuse', favColor: 'gray', favCar: 'Jaguar' });
        await addUserRecord({ pk: 'vikram@example.com', sk: 'role:basic', name: 'basic', privilege: 'read-basic-app' });
        await addUserRecord({ pk: 'vikram@example.com', sk: 'role:reports', name: 'reports', privilege: 'reports' });

        await addUserRecord({ pk: 'pooja@example.com', sk: 'user', firstName: 'pooja', lastName: 'joshi', age: 31, phone: '123-456-7897', address: '808 Fir St', favStar: 'Alpha Centauri', favColor: 'brown', favCar: 'Porsche' });
        await addUserRecord({ pk: 'pooja@example.com', sk: 'role:basic', name: 'basic', privilege: 'read-basic-app' });
        await addUserRecord({ pk: 'pooja@example.com', sk: 'role:reports', name: 'reports', privilege: 'reports' });

        await addUserRecord({ pk: 'rahul@example.com', sk: 'user', firstName: 'rahul', lastName: 'shah', age: 36, phone: '123-456-7898', address: '909 Pine St', favStar: 'Vega Prime', favColor: 'maroon', favCar: 'Maserati' });
        await addUserRecord({ pk: 'rahul@example.com', sk: 'role:basic', name: 'basic', privilege: 'read-basic-app' });
        await addUserRecord({ pk: 'rahul@example.com', sk: 'role:reports', name: 'reports', privilege: 'reports' });

        await addUserRecord({ pk: 'anjali@example.com', sk: 'user', firstName: 'anjali', lastName: 'mehta', age: 27, phone: '123-456-7899', address: '111 Oak St', favStar: 'Procyon', favColor: 'navy', favCar: 'Bentley' });
        await addUserRecord({ pk: 'anjali@example.com', sk: 'role:basic', name: 'basic', privilege: 'read-basic-app' });
        await addUserRecord({ pk: 'anjali@example.com', sk: 'role:reports', name: 'reports', privilege: 'reports' });

        await addUserRecord({ pk: 'kiran@example.com', sk: 'user', firstName: 'kiran', lastName: 'desai', age: 44, phone: '123-456-7810', address: '222 Elm St', favStar: 'Sun', favColor: 'teal', favCar: 'Ferrari' });
        await addUserRecord({ pk: 'kiran@example.com', sk: 'role:basic', name: 'basic', privilege: 'read-basic-app' });
        await addUserRecord({ pk: 'kiran@example.com', sk: 'role:reports', name: 'reports', privilege: 'reports' });

        await addUserRecord({ pk: 'arjun@example.com', sk: 'user', firstName: 'arjun', lastName: 'kapoor', age: 33, phone: '123-456-7811', address: '333 Maple St', favStar: 'Polaris', favColor: 'crimson', favCar: 'Lamborghini' });
        await addUserRecord({ pk: 'arjun@example.com', sk: 'role:basic', name: 'basic', privilege: 'read-basic-app' });
        await addUserRecord({ pk: 'arjun@example.com', sk: 'role:reports', name: 'reports', privilege: 'reports' });

        await addUserRecord({ pk: 'meera@example.com', sk: 'user', firstName: 'meera', lastName: 'roy', age: 39, phone: '123-456-7812', address: '444 Cedar St', favStar: 'Sirius', favColor: 'violet', favCar: 'Range Rover' });
        await addUserRecord({ pk: 'meera@example.com', sk: 'role:basic', name: 'basic', privilege: 'read-basic-app' });
        await addUserRecord({ pk: 'meera@example.com', sk: 'role:reports', name: 'reports', privilege: 'reports' });

        await addUserRecord({ pk: 'arun@example.com', sk: 'user', firstName: 'arun', lastName: 'nair', age: 34, phone: '123-456-7813', address: '555 Birch St', favStar: 'Betelgeuse', favColor: 'indigo', favCar: 'Rolls Royce' });
        await addUserRecord({ pk: 'arun@example.com', sk: 'role:basic', name: 'basic', privilege: 'read-basic-app' });
        await addUserRecord({ pk: 'arun@example.com', sk: 'role:reports', name: 'reports', privilege: 'reports' });

        await addUserRecord({ pk: 'divya@example.com', sk: 'user', firstName: 'divya', lastName: 'menon', age: 41, phone: '123-456-7814', address: '666 Walnut St', favStar: 'Alpha Centauri', favColor: 'turquoise', favCar: 'McLaren' });
        await addUserRecord({ pk: 'divya@example.com', sk: 'role:basic', name: 'basic', privilege: 'read-basic-app' });
        await addUserRecord({ pk: 'divya@example.com', sk: 'role:reports', name: 'reports', privilege: 'reports' });

        await addUserRecord({ pk: 'sanjay@example.com', sk: 'user', firstName: 'sanjay', lastName: 'iyer', age: 37, phone: '123-456-7815', address: '777 Ash St', favStar: 'Vega Prime', favColor: 'gold', favCar: 'Bugatti' });
        await addUserRecord({ pk: 'sanjay@example.com', sk: 'role:basic', name: 'basic', privilege: 'read-basic-app' });
        await addUserRecord({ pk: 'sanjay@example.com', sk: 'role:reports', name: 'reports', privilege: 'reports' });

        await addUserRecord({ pk: 'ritu@example.com', sk: 'user', firstName: 'ritu', lastName: 'das', age: 30, phone: '123-456-7816', address: '888 Spruce St', favStar: 'Procyon', favColor: 'silver', favCar: 'Aston Martin' });
        await addUserRecord({ pk: 'ritu@example.com', sk: 'role:basic', name: 'basic', privilege: 'read-basic-app' });
        await addUserRecord({ pk: 'ritu@example.com', sk: 'role:reports', name: 'reports', privilege: 'reports' });

        await addUserRecord({ pk: 'vivek@example.com', sk: 'user', firstName: 'vivek', lastName: 'sinha', age: 43, phone: '123-456-7817', address: '999 Fir St', favStar: 'Sun', favColor: 'bronze', favCar: 'Infiniti' });
        await addUserRecord({ pk: 'vivek@example.com', sk: 'role:basic', name: 'basic', privilege: 'read-basic-app' });
        await addUserRecord({ pk: 'vivek@example.com', sk: 'role:reports', name: 'reports', privilege: 'reports' });

        await addUserRecord({ pk: 'kavita@example.com', sk: 'user', firstName: 'kavita', lastName: 'bose', age: 35, phone: '123-456-7818', address: '121 Pine St', favStar: 'Polaris', favColor: 'magenta', favCar: 'Acura' });
        await addUserRecord({ pk: 'kavita@example.com', sk: 'role:basic', name: 'basic', privilege: 'read-basic-app' });
        await addUserRecord({ pk: 'kavita@example.com', sk: 'role:reports', name: 'reports', privilege: 'reports' });

        await addUserRecord({ pk: 'rohit@example.com', sk: 'user', firstName: 'rohit', lastName: 'sen', age: 40, phone: '123-456-7819', address: '131 Oak St', favStar: 'Sirius', favColor: 'cyan', favCar: 'Chrysler' });
        await addUserRecord({ pk: 'rohit@example.com', sk: 'role:basic', name: 'basic', privilege: 'read-basic-app' });
        await addUserRecord({ pk: 'rohit@example.com', sk: 'role:reports', name: 'reports', privilege: 'reports' });

        await addUserRecord({ pk: 'maya@example.com', sk: 'user', firstName: 'maya', lastName: 'rao', age: 26, phone: '123-456-7820', address: '141 Elm St', favStar: 'Betelgeuse', favColor: 'lime', favCar: 'Cadillac' });
        await addUserRecord({ pk: 'maya@example.com', sk: 'role:basic', name: 'basic', privilege: 'read-basic-app' });
        await addUserRecord({ pk: 'maya@example.com', sk: 'role:reports', name: 'reports', privilege: 'reports' });

    });

    describe('Query', () => {
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
});