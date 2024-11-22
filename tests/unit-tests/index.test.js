import _ from 'lodash';
import { Query, DdbType, Operation, Index, Table } from '../../src';

/**
 * Helper for joining multiple strings into one.
 * @param {string[]} stringArray Array of strings.
 * @returns joined string.
 */
// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
const stringer = (stringArray) => _.join(stringArray, " ");

describe('class: Table', () => {
    it('should throw if name is not provided', async () => {
        expect(() => {
            new Table();
        }).toThrow('Table.constructor(): name must be provided');

        expect(() => {
            new Table('');
        }).toThrow('Table.constructor(): name must be provided');

        expect(() => {
            new Table(null);
        }).toThrow('Table.constructor(): name must be provided');
    });

    it('should throw if hashKey is not provided', async () => {
        expect(() => {
            new Table('some-table-name');
        }).toThrow('Table.constructor(): hashKey must be provided');

        expect(() => {
            new Table('some-table-name', '');
        }).toThrow('Table.constructor(): hashKey must be provided');

        expect(() => {
            new Table('some-table-name', null);
        }).toThrow('Table.constructor(): hashKey must be provided');
    });

    it('should throw if rangeKey is bad', async () => {
        expect(() => {
            new Table('some-table-name', 'pk', '');
        }).toThrow('Table.constructor(): rangeKey is invalid');

        expect(() => {
            new Table('some-table-name', 'pk', 123);
        }).toThrow('Table.constructor(): rangeKey is invalid');
    });

    it('should create a table object, with relevant getters', async () => {
        const tbl = new Table('some-table-name', 'pk');
        expect(tbl).toBeDefined();
        expect(tbl.name).toEqual('some-table-name');
        expect(tbl.hashKey).toEqual('pk');
        expect(tbl.rangeKey).toEqual(undefined);
    });

    it('should create a table object, with hash and range keys', async () => {
        const tbl = new Table('some-table-name', 'pk', 'sk');
        expect(tbl).toBeDefined();
        expect(tbl.name).toEqual('some-table-name');
        expect(tbl.hashKey).toEqual('pk');
        expect(tbl.rangeKey).toEqual('sk');
    });
});

describe('class: Index', () => {
    it('should throw if name is not provided', async () => {
        expect(() => {
            new Index('');
        }).toThrow('Index.constructor(): name must be provided');
    });

    it('should throw if hashKey is not provided', async () => {
        expect(() => {
            new Index('special-index-name');
        }).toThrow('Index.constructor(): hashKey must be provided');

        expect(() => {
            new Index('special-index-name', '');
        }).toThrow('Index.constructor(): hashKey must be provided');
    });

    it('should create an index object, with relevant getters', async () => {
        const idx = new Index('special-index-name', 'new-pk', 'new-sk');
        expect(idx).toBeDefined();
        expect(idx.name).toEqual('special-index-name');
        expect(idx.hashKey).toEqual('new-pk');
        expect(idx.rangeKey).toEqual('new-sk');
    });
});

describe('class: Query', () => {
    const basicTable = new Table('some-table-name', 'pk', 'sk');
    const usersTable = new Table('users-table', 'pk', 'height');

    describe('Internal State Checks', () => {
        it('should initialize with values', async () => {
            const x = new Query(basicTable);
            expect(x.state).toMatchObject({
                tableName: 'some-table-name',
                hashKey: 'pk',
                rangeKey: 'sk'
            });
        });

        it('should have proper state after chaining methods', async () => {
            const x = new Query(basicTable);

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
                mode: 'select',
                selections: ['asdf', 'pqrs'],
                count: false,
                keys: [
                    { key: "pk", val: "aasdf", type: "hash-eq" },
                    { key: "sk", val: "1235:238h9084", type: "eq" },
                ],
                filters: [
                    { key: 'flower', val: 'rose', type: 'eq' },
                    { key: 'isPolinated', val: true, type: 'eq' }
                ],
                index: undefined,
                scanForward: undefined,
                limit: 10
            });

            expect(x.toDynamo()).toEqual({
                TableName: "some-table-name",
                ProjectionExpression: "asdf, pqrs",
                KeyConditionExpression: "pk = :pk and sk = :sk",
                FilterExpression: "flower = :flower and isPolinated = :isPolinated",
                ExpressionAttributeNames: undefined,
                ExpressionAttributeValues: {
                    ":flower": "rose",
                    ":isPolinated": true,
                    ":pk": "aasdf",
                    ":sk": "1235:238h9084",
                },
                Limit: 10,
            });
        });
    });

    describe('Hash and Range keys eq operations', () => {
        it('should return proper dynamo query for hash and range', async () => {
            const x = new Query(basicTable);

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

        it('should throw if we use non-existant rangeKey', async () => {
            const x = new Query(new Table('only-pk-table', 'pk'));
            x.where.hash.eq('aasdf');
            expect(() => {
                x.where.range.eq('1235:238h9084');
            }).toThrow('Query.where.range: Table does not have a rangeKey');
        });
    });

    describe('RangeKey specific operations', () => {
        it('should return correct begins_with query', async () => {
            const x = new Query(basicTable);

            x.select()
                .where.hash.eq('aasdf')
                .where.range.beginsWith('asdf#');

            expect(x.toDynamo()).toEqual({
                TableName: 'some-table-name',
                KeyConditionExpression: "pk = :pk and begins_with(sk, :sk)",
                ExpressionAttributeValues: {
                    ":pk": 'aasdf',
                    ':sk': 'asdf#'
                },
                Limit: 25,
            });
        });

        it('should return query for ">" operation', async () => {
            const x = new Query(basicTable);

            x.select()
                .where.hash.eq('sai.jonnala')
                .where.range.gt(10);

            expect(x.toDynamo()).toEqual({
                TableName: 'some-table-name',
                KeyConditionExpression: "pk = :pk and sk > :sk",
                ExpressionAttributeValues: {
                    ":pk": 'sai.jonnala',
                    ':sk': 10
                },
                Limit: 25,
            });
        });

        it('should return query for ">=" operation', async () => {
            const x = new Query(basicTable);

            x.select()
                .where.hash.eq('sai.jonnala')
                .where.range.gtEq('9000');

            expect(x.toDynamo()).toEqual({
                TableName: 'some-table-name',
                KeyConditionExpression: "pk = :pk and sk >= :sk",
                ExpressionAttributeValues: {
                    ":pk": 'sai.jonnala',
                    ':sk': '9000'
                },
                Limit: 25,
            });
        });

        it('should return query for "<" operation', async () => {
            const x = new Query(usersTable);

            x.select()
                .where.hash.eq('sai.jonnala')
                .where.range.lt(6);

            expect(x.toDynamo()).toEqual({
                TableName: 'users-table',
                KeyConditionExpression: "pk = :pk and height < :height",
                ExpressionAttributeValues: {
                    ":pk": 'sai.jonnala',
                    ':height': 6,
                },
                Limit: 25,
            });
        });

        it('should return query for "<=" operation', async () => {
            const x = new Query(usersTable);

            x.select()
                .where.hash.eq('sai.jonnala')
                .where.range.ltEq(5.11);

            expect(x.toDynamo()).toEqual({
                TableName: 'users-table',
                KeyConditionExpression: "pk = :pk and height <= :height",
                ExpressionAttributeValues: {
                    ":pk": 'sai.jonnala',
                    ':height': 5.11,
                },
                Limit: 25,
            });
        });

        it('should return correct "between" query', async () => {
            const gitHistoryTable = new Table('git-history-table', 'pk', 'date');
            const x = new Query(gitHistoryTable);

            x.select()
                .where.hash.eq('commit')
                .where.range.between('2024-01-01', '2024-12-31');

            expect(x.toDynamo()).toEqual({
                TableName: 'git-history-table',
                KeyConditionExpression: "pk = :pk and #date BETWEEN :date_start AND :date_end",
                ExpressionAttributeValues: {
                    ":pk": 'commit',
                    ':date_start': '2024-01-01',
                    ':date_end': '2024-12-31',
                },
                ExpressionAttributeNames: {
                    "#date": "date",
                },
                Limit: 25,
            });
        });
    });

    describe('Selects', () => {
        it('should return proper selections', async () => {
            const x = new Query(basicTable);

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

        it('should return expression attribute names for reserved column names', async () => {
            const x = new Query(basicTable);
            x.select(['asdf', 'pqrs', 'name']);

            expect(x.toDynamo()).toEqual({
                TableName: 'some-table-name',
                ProjectionExpression: "asdf, pqrs, #name",
                ExpressionAttributeNames: {
                    "#name": "name",
                },
                Limit: 25,
            });
        });

        it('should return correct query for multiple reserved column names', async () => {
            const x = new Query(basicTable);
            x.select(['date', 'delete', 'name', 'asdf']);

            expect(x.toDynamo()).toEqual({
                TableName: 'some-table-name',
                ProjectionExpression: "#date, #delete, #name, asdf",
                ExpressionAttributeNames: {
                    "#date": "date",
                    "#delete": "delete",
                    "#name": "name",
                },
                Limit: 25,
            });
        });
    });

    describe('Filters', () => {
        it('should return key condition, filter expression and their combined attributes', async () => {
            const x = new Query(basicTable);

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

        it('should return correct query for "=" (equals) operation', async () => {
            const x = new Query(basicTable);

            x.select()
                .where.hash.eq('asdf')
                .where.range.eq('asdf')
                .filter.eq('weight', 124);

            expect(x.toDynamo()).toEqual({
                TableName: 'some-table-name',
                KeyConditionExpression: "pk = :pk and sk = :sk",
                FilterExpression: "weight = :weight",
                ExpressionAttributeValues: {
                    ":pk": 'asdf',
                    ':sk': 'asdf',
                    ":weight": 124,
                },
                Limit: 25,
            });
        });

        it('should return correct query for "<>" (not equals) operation', async () => {
            const x = new Query(basicTable);

            x.select()
                .where.hash.eq('asdf')
                .where.range.eq('asdf')
                .filter.notEq('weight', 124);

            expect(x.toDynamo()).toEqual({
                TableName: 'some-table-name',
                KeyConditionExpression: "pk = :pk and sk = :sk",
                FilterExpression: "weight <> :weight",
                ExpressionAttributeValues: {
                    ":pk": 'asdf',
                    ':sk': 'asdf',
                    ":weight": 124,
                },
                Limit: 25,
            });
        });

        it('should return correct query for ">" operation', async () => {
            const x = new Query(basicTable);

            x.select()
                .where.hash.eq('asdf')
                .where.range.eq('asdf')
                .filter.gt('weight', 124);

            expect(x.toDynamo()).toEqual({
                TableName: 'some-table-name',
                KeyConditionExpression: "pk = :pk and sk = :sk",
                FilterExpression: "weight > :weight",
                ExpressionAttributeValues: {
                    ":pk": 'asdf',
                    ':sk': 'asdf',
                    ":weight": 124,
                },
                Limit: 25,
            });
        });

        it('should return correct query for ">=" operation', async () => {
            const x = new Query(basicTable);

            x.select()
                .where.hash.eq('asdf')
                .where.range.eq('asdf')
                .filter.gtEq('weight', 124);

            expect(x.toDynamo()).toEqual({
                TableName: 'some-table-name',
                KeyConditionExpression: "pk = :pk and sk = :sk",
                FilterExpression: "weight >= :weight",
                ExpressionAttributeValues: {
                    ":pk": 'asdf',
                    ':sk': 'asdf',
                    ":weight": 124,
                },
                Limit: 25,
            });
        });

        it('should return correct query for "<" operation', async () => {
            const x = new Query(basicTable);

            x.select()
                .where.hash.eq('asdf')
                .where.range.eq('asdf')
                .filter.lt('weight', 124);

            expect(x.toDynamo()).toEqual({
                TableName: 'some-table-name',
                KeyConditionExpression: "pk = :pk and sk = :sk",
                FilterExpression: "weight < :weight",
                ExpressionAttributeValues: {
                    ":pk": 'asdf',
                    ':sk': 'asdf',
                    ":weight": 124,
                },
                Limit: 25,
            });
        });

        it('should return correct query for "<=" operation', async () => {
            const x = new Query(basicTable);

            x.select()
                .where.hash.eq('asdf')
                .where.range.eq('asdf')
                .filter.ltEq('weight', 124);

            expect(x.toDynamo()).toEqual({
                TableName: 'some-table-name',
                KeyConditionExpression: "pk = :pk and sk = :sk",
                FilterExpression: "weight <= :weight",
                ExpressionAttributeValues: {
                    ":pk": 'asdf',
                    ':sk': 'asdf',
                    ":weight": 124,
                },
                Limit: 25,
            });
        });

        it('should return correct "begins_with" query', async () => {
            const x = new Query(basicTable);

            x.select()
                .where.hash.eq('asdf')
                .where.range.eq('asdf')
                .filter.beginsWith('flower', 'red');

            expect(x.toDynamo()).toEqual({
                TableName: 'some-table-name',
                KeyConditionExpression: "pk = :pk and sk = :sk",
                FilterExpression: "begins_with(flower, :flower)",
                ExpressionAttributeValues: {
                    ":pk": 'asdf',
                    ':sk': 'asdf',
                    ":flower": "red",
                },
                Limit: 25,
            });
        });

        it('should return correct "attribute_exists" query', async () => {
            const x = new Query(basicTable);

            x.select()
                .where.hash.eq('asdf')
                .where.range.eq('asdf')
                .filter.attributeExists('flower')
                .filter.attributeExists('fruit')
                .filter.attributeExists('connection');

            expect(x.toDynamo()).toEqual({
                TableName: 'some-table-name',
                KeyConditionExpression: "pk = :pk and sk = :sk",
                FilterExpression: stringer([
                    "attribute_exists(flower)",
                    "and attribute_exists(fruit)",
                    "and attribute_exists(#connection)",
                ]),
                ExpressionAttributeValues: {
                    ":pk": 'asdf',
                    ':sk': 'asdf',
                },
                ExpressionAttributeNames: {
                    "#connection": "connection",
                },
                Limit: 25,
            });
        });

        it('should return correct "attribute_not_exists" query', async () => {
            const x = new Query(basicTable);

            x.select()
                .where.hash.eq('asdf')
                .where.range.eq('asdf')
                .filter.attributeExists('flower')
                .filter.attributeNotExists('fruit')
                .filter.attributeNotExists('connection');

            expect(x.toDynamo()).toEqual({
                TableName: 'some-table-name',
                KeyConditionExpression: "pk = :pk and sk = :sk",
                FilterExpression: stringer([
                    "attribute_exists(flower)",
                    "and attribute_not_exists(fruit)",
                    "and attribute_not_exists(#connection)",
                ]),
                ExpressionAttributeValues: {
                    ":pk": 'asdf',
                    ':sk': 'asdf',
                },
                ExpressionAttributeNames: {
                    "#connection": "connection",
                },
                Limit: 25,
            });
        });

        it('should return correct "attribute_type" query', async () => {
            const x = new Query(basicTable);

            x.select()
                .where.hash.eq('asdf')
                .where.range.eq('asdf')
                .filter.attributeType('flower', DdbType.String)
                .filter.attributeType('fruit', DdbType.StringSet)
                .filter.attributeType('connection', DdbType.Number)
                .filter.attributeType('car', DdbType.NumberSet)
                .filter.attributeType('photo', DdbType.Binary)
                .filter.attributeType('photos', DdbType.BinarySet)
                .filter.attributeType('is_raw', DdbType.Boolean)
                .filter.attributeType('plane', DdbType.Null)
                .filter.attributeType('aliens', DdbType.List)
                .filter.attributeType('borg', DdbType.Map)
                ;

            expect(x.toDynamo()).toEqual({
                TableName: 'some-table-name',
                KeyConditionExpression: "pk = :pk and sk = :sk",
                FilterExpression: stringer([
                    "attribute_type(flower, :flower)",
                    "and attribute_type(fruit, :fruit)",
                    "and attribute_type(#connection, :connection)",
                    "and attribute_type(car, :car)",
                    "and attribute_type(photo, :photo)",
                    "and attribute_type(photos, :photos)",
                    "and attribute_type(is_raw, :is_raw)",
                    "and attribute_type(plane, :plane)",
                    "and attribute_type(aliens, :aliens)",
                    "and attribute_type(borg, :borg)",
                ]),
                ExpressionAttributeNames: {
                    "#connection": "connection",
                },
                ExpressionAttributeValues: {
                    ":pk": 'asdf',
                    ':sk': 'asdf',
                    ':flower': 'S',
                    ':fruit': 'SS',
                    ':connection': 'N',
                    ':car': 'NS',
                    ':photo': 'B',
                    ':photos': 'BS',
                    ':is_raw': 'BOOL',
                    ':plane': 'NULL',
                    ':aliens': 'L',
                    ':borg': 'M',
                },
                Limit: 25,
            });
        });

        it('should return correct "contains" query', async () => {
            const x = new Query(basicTable);

            x.select()
                .where.hash.eq('asdf')
                .where.range.eq('asdf')
                .filter.contains('name', "abb")
                ;

            expect(x.toDynamo()).toEqual({
                TableName: 'some-table-name',
                KeyConditionExpression: "pk = :pk and sk = :sk",
                FilterExpression: "contains(#name, :name)",
                ExpressionAttributeNames: {
                    "#name": "name",
                },
                ExpressionAttributeValues: {
                    ":pk": 'asdf',
                    ':sk': 'asdf',
                    ':name': 'abb',
                },
                Limit: 25,
            });
        });

        it('should return correct "size" query', async () => {
            const x = new Query(basicTable);

            x.select()
                .where.hash.eq('asdf')
                .where.range.eq('asdf')
                .filter.size('name', Operation.GtEq, 12)
                .filter.size('image', Operation.LtEq, 100)
                .filter.size('function', Operation.Eq, 100)
                .filter.size('url', Operation.NotEq, 10)
                ;

            expect(x.toDynamo()).toEqual({
                TableName: 'some-table-name',
                KeyConditionExpression: "pk = :pk and sk = :sk",
                FilterExpression: "size(#name) >= :size_name and size(image) <= :size_image and size(#function) = :size_function and size(#url) <> :size_url",
                ExpressionAttributeNames: {
                    "#name": "name",
                    "#function": "function",
                    "#url": "url",
                },
                ExpressionAttributeValues: {
                    ":pk": 'asdf',
                    ':sk': 'asdf',
                    ':size_name': 12,
                    ':size_image': 100,
                    ':size_function': 100,
                    ':size_url': 10,
                },
                Limit: 25,
            });
        });

        it('should return correct "between" query', async () => {
            const x = new Query(basicTable);

            x.select()
                .where.hash.eq('asdf')
                .where.range.eq('1234')
                .filter.between('column_name', 'A', 'C');

            expect(x.toDynamo()).toEqual({
                TableName: 'some-table-name',
                KeyConditionExpression: "pk = :pk and sk = :sk",
                FilterExpression: "column_name BETWEEN :column_name_start AND :column_name_end",
                ExpressionAttributeValues: {
                    ":pk": 'asdf',
                    ':sk': '1234',
                    ':column_name_start': 'A',
                    ':column_name_end': 'C',
                },
                Limit: 25,
            });
        });
    });

    describe('Reserved & Special Char Names', () => {
        it('should convert dynamo reserved names to ExpressionAttributeNames', async () => {
            const x = new Query(new Table('some-table-name', 'pk', 'BY'));

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
                FilterExpression: stringer([
                    "#ABORT = :ABORT",
                    "and #ACTION = :ACTION",
                    "and #ATOMIC = :ATOMIC",
                    "and something = :something",
                ]),
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

        it('should convert "_names" to ExpressionAttributeNames', async () => {
            const x = new Query(new Table('some-table-name', '_friend', '_best'));

            x.select(['asdf', 'pqrs'])
                .where.hash.eq('ramana')
                .where.range.eq('bestie')
                .filter.eq('_test', true)
                .filter.eq('__test', 'stop!');

            expect(x.toDynamo()).toEqual({
                TableName: 'some-table-name',
                Limit: 25,
                ProjectionExpression: "asdf, pqrs",
                KeyConditionExpression: "#_friend = :_friend and #_best = :_best",
                FilterExpression: stringer([
                    "#_test = :_test",
                    "and #__test = :__test",
                ]),
                ExpressionAttributeNames: {
                    '#_friend': '_friend',
                    '#_best': '_best',
                    '#_test': '_test',
                    '#__test': '__test',
                },
                ExpressionAttributeValues: {
                    ':_friend': 'ramana',
                    ':_best': 'bestie',
                    ':_test': true,
                    ':__test': 'stop!',
                },
            });
        });

        it('should return correct beginswith query for reserved attribute name', async () => {
            const x = new Query(new Table('spies', 'name', 'AGENT'));

            x.select()
                .where.hash.eq('sai.jonnala')
                .where.range.beginsWith('007#');

            expect(x.toDynamo()).toEqual({
                TableName: 'spies',
                KeyConditionExpression: "#name = :name and begins_with(#AGENT, :AGENT)",
                ExpressionAttributeValues: {
                    ":name": 'sai.jonnala',
                    ':AGENT': '007#',
                },
                ExpressionAttributeNames: {
                    "#AGENT": "AGENT",
                    "#name": "name",
                },
                Limit: 25,
            });
        });

        it('should return correct query for selecting reserved column names and filtering on same column', async () => {
            const x = new Query(new Table('some-table-name', 'pk', 'sk'));
            x.select(['name', 'delete'])
                .where.hash.eq('sai.jonnala')
                .filter.eq('name', 'asdf');

            expect(x.toDynamo()).toEqual({
                TableName: 'some-table-name',
                KeyConditionExpression: "pk = :pk",
                FilterExpression: "#name = :name",
                ProjectionExpression: "#name, #delete",
                ExpressionAttributeNames: {
                    "#name": "name",
                    "#delete": "delete",
                },
                ExpressionAttributeValues: {
                    ":pk": 'sai.jonnala',
                    ":name": 'asdf',
                },
                Limit: 25,
            });
        });
    });

    describe('Using an Index', () => {
        it('should return correct index query', async () => {
            const x = new Query(basicTable);
            const specialIdx = new Index('special-index-name', 'new-pk', 'new-sk');
            x.using(specialIdx);

            expect(x.toDynamo()).toEqual({
                TableName: 'some-table-name',
                IndexName: 'special-index-name',
                Limit: 25,
            });
        });

        it('should scan index forward, when specified "true"', async () => {
            const x = new Query(basicTable);
            const specialIndex = new Index('special-index-name', 'new-pk', 'new-sk');
            x.using(specialIndex, true);

            expect(x.toDynamo()).toEqual({
                TableName: 'some-table-name',
                IndexName: 'special-index-name',
                ScanIndexForward: true,
                Limit: 25,
            });
        });

        it('should scan index backward, when specified "false"', async () => {
            const x = new Query(basicTable);
            const specialIndex = new Index('special-index-name', 'new-pk', 'new-sk');
            x.using(specialIndex, false);

            expect(x.toDynamo()).toEqual({
                TableName: 'some-table-name',
                IndexName: 'special-index-name',
                ScanIndexForward: false,
                Limit: 25,
            });
        });

        it('should return correct query for using index with hash key', async () => {
            const x = new Query(basicTable);
            const specialIdx = new Index('special-index-name', 'type');

            x.using(specialIdx)
                .where.hash.eq('pizza');

            expect(x.toDynamo()).toEqual({
                TableName: 'some-table-name',
                IndexName: 'special-index-name',
                KeyConditionExpression: "#type = :type",
                ExpressionAttributeNames: {
                    "#type": "type",
                },
                ExpressionAttributeValues: {
                    ":type": 'pizza',
                },
                Limit: 25,
            });
        });

        it('should return correct query for using index with hash key and range key', async () => {
            const x = new Query(basicTable);
            const specialIndex = new Index('special-index-name', 'type', 'size');

            x.using(specialIndex)
                .where.hash.eq('pizza')
                .where.range.eq('9inch:');

            expect(x.toDynamo()).toEqual({
                TableName: 'some-table-name',
                IndexName: 'special-index-name',
                KeyConditionExpression: "#type = :type and #size = :size",
                ExpressionAttributeNames: {
                    "#type": "type",
                    "#size": "size",
                },
                ExpressionAttributeValues: {
                    ":type": 'pizza',
                    ":size": '9inch:',
                },
                Limit: 25,
            });
        });

        it('should throw if scanForward is not a boolean', async () => {
            const x = new Query(basicTable);

            expect(() => {
                x.using(new Index('special-index-name', 'new-pk', 'new-sk'), 1);
            }).toThrow('Query.using(): scanForward must be a boolean or undefined');
        });
    });

    describe('Counts', () => {
        it('should return correct count query', async () => {
            const x = new Query(basicTable);

            x.count();

            expect(x.toDynamo()).toEqual({
                TableName: 'some-table-name',
                Select: 'COUNT',
                Limit: 25,
            });
        });

        it('should return correct count query with index', async () => {
            const x = new Query(basicTable);
            const specialIdx = new Index('special-index-name', 'new-pk');
            x.count().using(specialIdx);

            expect(x.toDynamo()).toEqual({
                TableName: 'some-table-name',
                Select: 'COUNT',
                IndexName: 'special-index-name',
                Limit: 25,
            });
        });

        it('should throw if count and select are used together', async () => {
            const x = new Query(basicTable);
            expect(() => {
                x.count().select(['asdf', 'pqrs']);
            }).toThrow('Query: Cannot use more than one mode (select, count, scan) at the same time.');
        });

        it('should return correct query for count, index, where, filters', async () => {
            const x = new Query(basicTable);
            const specialIdx = new Index('special-index-name', 'new-pk');
            x.count().using(specialIdx)
                .where.hash.eq('sai.jonnala')
                .filter.eq('flower', 'rose');

            expect(x.toDynamo()).toEqual({
                TableName: 'some-table-name',
                Select: 'COUNT',
                IndexName: 'special-index-name',
                KeyConditionExpression: "new-pk = :new-pk",
                FilterExpression: "flower = :flower",
                ExpressionAttributeValues: {
                    ":new-pk": 'sai.jonnala',
                    ":flower": 'rose',
                },
                Limit: 25,
            });
        });
    });

    describe('Pagination', () => {
        it('should return correct query for pagination', async () => {
            const x = new Query(basicTable);
            x.select().where.hash.eq('asdf').startAfter('iufh984h3f8hsdof');
            expect(x.toDynamo()).toEqual({
                TableName: 'some-table-name',
                KeyConditionExpression: "pk = :pk",
                ExpressionAttributeValues: {
                    ":pk": 'asdf',
                },
                ExclusiveStartKey: 'iufh984h3f8hsdof',
                Limit: 25,
            });
        });
    });

    describe('Consumed Capacity', () => {
        it('should throw if invalid capacity type is specified', async () => {
            const x = new Query(basicTable);
            expect(() => {
                x.select().withConsumedCapacity('INVALID');
            }).toThrow('Query.withConsumedCapacity(): capacity type must be INDEXES, TOTAL, or NONE');
        });

        it('should return correct query for consumed capacity TOTAL', async () => {
            const x = new Query(basicTable);
            x.select().withConsumedCapacity('TOTAL');

            expect(x.toDynamo()).toEqual({
                TableName: 'some-table-name',
                ReturnConsumedCapacity: 'TOTAL',
                Limit: 25,
            });
        });

        it('should return correct query for consumed capacity INDEXES', async () => {
            const x = new Query(basicTable);
            x.select().withConsumedCapacity('INDEXES');

            expect(x.toDynamo()).toEqual({
                TableName: 'some-table-name',
                ReturnConsumedCapacity: 'INDEXES',
                Limit: 25,
            });
        });

        it('should default to TOTAL if no type is specified', async () => {
            const x = new Query(basicTable);
            x.select().withConsumedCapacity();

            expect(x.toDynamo()).toEqual({
                TableName: 'some-table-name',
                ReturnConsumedCapacity: 'TOTAL',
                Limit: 25,
            });
        });

        it('should return correct query for consumed capacity NONE', async () => {
            const x = new Query(basicTable);
            x.select().withConsumedCapacity('NONE');

            expect(x.toDynamo()).toEqual({
                TableName: 'some-table-name',
                Limit: 25,
            });
        });
    });
});

describe('Scan', () => {
    const basicTable = new Table('some-table-name', 'pk', 'sk');

    it('should return correct scan query', async () => {
        const x = new Query(basicTable);
        x.scan();

        expect(x.toDynamo()).toEqual({
            TableName: 'some-table-name',
            Limit: 25,
        });
    });

    it('should return correct query for scan with specific columns', async () => {
        const x = new Query(basicTable);
        x.scan(['asdf', 'pqrs']);

        expect(x.toDynamo()).toEqual({
            TableName: 'some-table-name',
            Limit: 25,
            ProjectionExpression: 'asdf, pqrs',
        });
    });

    it('should throw if where clause is used with scan', async () => {
        const x = new Query(basicTable);

        expect(() => {
            x.scan()
                .where.hash.eq('sai.jonnala');
        }).toThrow('Query.where: Cannot use "where" clause with scan(), use "filter" instead.');
    });
});

describe('Modes', () => {
    const basicTable = new Table('some-table-name', 'pk', 'sk');

    it('should not throw if no mode is used', async () => {
        const x = new Query(basicTable);
        expect(() => {
            x.toDynamo();
        }).not.toThrow();
        expect(x.toDynamo()).toEqual({
            TableName: 'some-table-name',
            Limit: 25,
        });
        expect(x.state).toEqual({
            tableName: 'some-table-name',
            hashKey: 'pk',
            rangeKey: 'sk',

            mode: undefined,

            selections: [],
            keys: [],
            filters: [],

            index: undefined,
            scanForward: undefined,
            limit: 25,
            count: false,
            startAfter: undefined,
            consumedCapacity: undefined,
        });
    });

    it('should not throw if one mode is used', async () => {
        const x = new Query(basicTable);
        expect(() => {
            x.select();
        }).not.toThrow();
        expect(x.toDynamo()).toEqual({
            TableName: 'some-table-name',
            Limit: 25,
        });
        expect(x.state).toEqual({
            tableName: 'some-table-name',
            hashKey: 'pk',
            rangeKey: 'sk',

            mode: 'select',

            selections: undefined,
            keys: [],
            filters: [],

            index: undefined,
            scanForward: undefined,
            limit: 25,
            count: false,
            startAfter: undefined,
            consumedCapacity: undefined,
        });
    });

    it('should throw if more than one mode is used, 1', async () => {
        const x = new Query(basicTable);
        expect(() => {
            x.select().count();
        }).toThrow('Query: Cannot use more than one mode (select, count, scan) at the same time.');
    });

    it('should throw if more than one mode is used, 2', async () => {
        const x = new Query(basicTable);
        expect(() => {
            x.scan().count();
        }).toThrow('Query: Cannot use more than one mode (select, count, scan) at the same time.');
    });

    it('should throw if more than one mode is used, 3', async () => {
        const x = new Query(basicTable);
        expect(() => {
            x.select().scan();
        }).toThrow('Query: Cannot use more than one mode (select, count, scan) at the same time.');
    });

    it('should throw if more than one mode is used, 3', async () => {
        const x = new Query(basicTable);
        expect(() => {
            x.select().scan().count();
        }).toThrow('Query: Cannot use more than one mode (select, count, scan) at the same time.');
    });
});
