import _ from 'lodash';
import { reserved } from './dynamo_reserved_words';
import assert from 'assert';
import { Index, Table } from './Structure';

/**
 * Type of attributes accepted by dynamo db.
 */
export enum DdbType {
    String = 'S',
    StringSet = 'SS',
    Number = 'N',
    NumberSet = 'NS',
    Binary = 'B',
    BinarySet = 'BS',
    Boolean = 'BOOL',
    Null = 'NULL',
    List = 'L',
    Map = 'M',
}

type DynamoValue = string | number | boolean;
type BetweenValues = {
    start: DynamoValue,
    end: DynamoValue,
};
export enum Operation {
    Eq = '=',
    NotEq = '<>',
    Gt = '>',
    GtEq = '>=',
    Lt = '<',
    LtEq = '<=',
}
type SizeValue = {
    val: DynamoValue,
    op: Operation,
};

type Condition = {
    key: string;
    val?: DynamoValue | BetweenValues | DdbType | SizeValue;
    type: string;
    actualName?: string,
};

export class Query {
    static DEFAULT_LIMIT = 25;

    private _tableName: string;
    private _hashKey: string;
    private _rangeKey: string | undefined;

    private _selections: string[];
    private _keys: Array<Condition>;
    private _filters: Array<Condition>;
    // TODO: Implement index usage.
    private _index: Index | undefined;
    private _scanForward: boolean | undefined;
    private _limit: number = Query.DEFAULT_LIMIT;
    private _count: boolean = false;
    private _startAfter: any | undefined;

    get state() {
        return {
            tableName: this._tableName,
            hashKey: this._hashKey,
            rangeKey: this._rangeKey,
            selections: this._selections,
            keys: this._keys,
            filters: this._filters,
            index: this._index,
            scanForward: this._scanForward,
            limit: this._limit,
            count: this._count,
            startAfter: this._startAfter,
        };
    }

    constructor(table: Table) {
        this._tableName = table.name;
        this._hashKey = table.hashKey;
        this._rangeKey = table.rangeKey;

        // initialize here so that each query obj has its own filter list.
        this._filters = [];
        this._keys = [];
        this._selections = [];
    }

    select(cols: string[]) {
        this._selections = cols;
        return this;
    }

    count() {
        this._count = true;
        return this;
    }

    startAfter(key: any) {
        this._startAfter = key;
        return this;
    }

    get where() {
        const pushRangeKey = (val: Condition['val'], type: string) => {
            if (_.isNil(this._index)) {
                assert(
                    _.isString(this._rangeKey) && _.size(this._rangeKey) > 0,
                    'Query.where.range: Table does not have a rangeKey',
                );
                this._keys.push({ key: this._rangeKey, val: val, type: type });
                return;
            }
            assert(
                _.isString(this._index.rangeKey) && _.size(this._index.rangeKey) > 0,
                'Query.where.range: Provided Index does not have a rangeKey',
            );
            this._keys.push({ key: this._index.rangeKey, val: val, type: type });
        };
        const whereSelectors = {
            hash: {
                eq: (val: string): Query => {
                    if (_.isNil(this._index)) {
                        this._keys.push({ key: this._hashKey, val: val, type: 'hash-eq' });
                        return this;
                    }
                    assert(
                        _.isString(this._index?.hashKey) && _.size(this._index.hashKey) > 0,
                        'Query.where.hash: Provided Index does not have a hashKey',
                    );
                    this._keys.push({ key: this._index.hashKey, val: val, type: 'hash-eq' });
                    return this;
                }
            },
            range: {
                eq: (val: DynamoValue): Query => {
                    pushRangeKey(val, 'eq');
                    return this;
                },
                beginsWith: (val: DynamoValue): Query => {
                    pushRangeKey(val, 'begins_with');
                    return this;
                },
                gt: (val: DynamoValue): Query => {
                    pushRangeKey(val, 'gt');
                    return this;
                },
                gtEq: (val: DynamoValue): Query => {
                    pushRangeKey(val, 'gtEq');
                    return this;
                },
                lt: (val: DynamoValue): Query => {
                    pushRangeKey(val, 'lt');
                    return this;
                },
                ltEq: (val: DynamoValue): Query => {
                    pushRangeKey(val, 'ltEq');
                    return this;
                },
                between: (start: DynamoValue, end: DynamoValue): Query => {
                    pushRangeKey({ start, end }, 'between');
                    return this;
                },
            },
        };
        return whereSelectors;
    }

    get filter() {
        const filterConditions = {
            eq: (key: string, val: DynamoValue): Query => {
                this._filters.push({ key, val, type: 'eq' });
                return this;
            },
            notEq: (key: string, val: DynamoValue): Query => {
                this._filters.push({ key, val: val, type: 'notEq' });
                return this;
            },
            gt: (key: string, val: DynamoValue): Query => {
                this._filters.push({ key, val: val, type: 'gt' });
                return this;
            },
            gtEq: (key: string, val: DynamoValue): Query => {
                this._filters.push({ key, val: val, type: 'gtEq' });
                return this;
            },
            lt: (key: string, val: DynamoValue): Query => {
                this._filters.push({ key, val: val, type: 'lt' });
                return this;
            },
            ltEq: (key: string, val: DynamoValue): Query => {
                this._filters.push({ key, val: val, type: 'ltEq' });
                return this;
            },
            beginsWith: (key: string, val: DynamoValue): Query => {
                this._filters.push({ key, val, type: 'begins_with' });
                return this;
            },
            attributeExists: (key: string): Query => {
                this._filters.push({ key, type: 'attribute_exists' });
                return this;
            },
            attributeNotExists: (key: string): Query => {
                this._filters.push({ key, type: 'attribute_not_exists' });
                return this;
            },
            attributeType: (key: string, val: DdbType): Query => {
                this._filters.push({ key, val, type: 'attribute_type' });
                return this;
            },
            contains: (key: string, val: DynamoValue): Query => {
                this._filters.push({ key, val, type: 'contains' });
                return this;
            },
            size: (key: string, op: Operation, val: DynamoValue): Query => {
                this._filters.push({
                    key,
                    val: {
                        val,
                        op,
                    },
                    type: 'size',
                });
                return this;
            },
            between: (key: string, start: DynamoValue, end: DynamoValue): Query => {
                this._filters.push({ key, val: { start, end }, type: 'between' });
                return this;
            },
        };
        return filterConditions;
    }

    using(index: Index, scanForward: boolean | undefined = undefined): Query {
        assert(
            typeof scanForward === 'boolean' || _.isNil(scanForward),
            'Query.using(): scanForward must be a boolean or undefined',
        );

        this._index = index;
        this._scanForward = scanForward;
        return this;
    }

    limit(l: number): Query {
        this._limit = l ?? Query.DEFAULT_LIMIT;
        return this;
    }

    toDynamo(): object {
        const [keyCond, keyAttribVals, keyAttribNames] = formatKeyCondition(this._keys);
        const [filterCond, filterAttribVals, filterAttribNames] = formatFilterCondition(this._filters);
        const projection = formatProjectionExpression(this._selections);

        const hasCount = this._count;
        const hasSelect = !_.isNil(projection);
        assert(!(hasCount && hasSelect), 'Query.toDynamo(): Cannot use both count() and select()');

        return _.omitBy({
            TableName: this._tableName,
            Select: this._count ? 'COUNT' : undefined,
            ...projection,
            ...keyCond,
            ...filterCond,
            ..._.merge(keyAttribNames, filterAttribNames),
            ..._.merge(keyAttribVals, filterAttribVals),
            Limit: this._limit,
            IndexName: this._index?.name,
            ScanIndexForward: this._scanForward,
            ExclusiveStartKey: this._startAfter,
        }, _.isNil);
    }
}

const isReserved = (name: string): boolean => {
    // Does the upper cased "name" exists in the reserved words list.
    return _.indexOf(reserved, _.toUpper(name)) != -1;
}

const replaceReservedNames = (conditions: Array<Condition>): Array<Condition> => {
    return _.map(conditions, (cond) => {

        if (isReserved(cond.key)) {
            return {
                ...cond,
                key: `#${cond.key}`,
                actualName: cond.key,
            };
        }

        if (_.startsWith(cond.key, "_")) {
            return {
                ...cond,
                key: `#${cond.key}`,
                actualName: cond.key,
            };
        }

        return cond;
    });
};

const formatKeyCondition = (conditions: Array<Condition>) => {
    const updatedConditions = replaceReservedNames(conditions);

    const conditionParts: string[] = [];
    const attribVals = {};
    const attribNames = {};

    _.each(updatedConditions, (cond) => {
        const { key, val, type, actualName } = cond;
        const valRef = `:${_.trim(key, '#')}`;

        switch (type) {
            case "hash-eq":
            case "eq":
                conditionParts.push(`${key} = ${valRef}`);
                _.set(attribVals, valRef, val);
                break;

            case "gt":
                conditionParts.push(`${key} > ${valRef}`);
                _.set(attribVals, valRef, val);
                break;

            case "gtEq":
                conditionParts.push(`${key} >= ${valRef}`);
                _.set(attribVals, valRef, val);
                break;

            case "lt":
                conditionParts.push(`${key} < ${valRef}`);
                _.set(attribVals, valRef, val);
                break;

            case "ltEq":
                conditionParts.push(`${key} <= ${valRef}`);
                _.set(attribVals, valRef, val);
                break;

            case "between": {
                const valRefStart = `${valRef}_start`;
                const valRefEnd = `${valRef}_end`;
                const between = val as BetweenValues;
                conditionParts.push(`${key} BETWEEN ${valRefStart} AND ${valRefEnd}`);
                _.set(attribVals, valRefStart, between.start);
                _.set(attribVals, valRefEnd, between.end);
                break;
            }

            case "begins_with":
                conditionParts.push(`begins_with(${key}, ${valRef})`);
                _.set(attribVals, valRef, val);
                break;
        }

        if (actualName) {
            _.set(attribNames, key, actualName);
        }
    });

    return [
        { KeyConditionExpression: _.isEmpty(conditionParts) ? undefined : _.join(conditionParts, " and ") },
        { ExpressionAttributeValues: _.isEmpty(attribVals) ? undefined : attribVals },
        { ExpressionAttributeNames: _.isEmpty(attribNames) ? undefined : attribNames },
    ];
};

const formatFilterCondition = (filters: Array<Condition>) => {
    const updatedFilters = replaceReservedNames(filters);

    const filterParts: string[] = [];
    const attribVals = {};
    const attribNames = {};
    const usedValRefs = new Set<string>();

    _.each(updatedFilters, f => {
        let valRef = `:${_.trim(f.key, '#')}`;
        // Add numeric suffix if valRef is already used
        if (usedValRefs.has(valRef)) {
            let counter = 1;
            while (usedValRefs.has(`${valRef}_${counter}`)) {
                counter++;
            }
            valRef = `${valRef}_${counter}`;
        }
        usedValRefs.add(valRef);

        switch (f.type) {
            case 'eq':
                _.set(attribVals, valRef, f.val);
                filterParts.push(`${f.key} = ${valRef}`);
                break;

            case 'notEq':
                _.set(attribVals, valRef, f.val);
                filterParts.push(`${f.key} <> ${valRef}`);
                break;

            case 'gt':
                _.set(attribVals, valRef, f.val);
                filterParts.push(`${f.key} > ${valRef}`);
                break;

            case 'gtEq':
                _.set(attribVals, valRef, f.val);
                filterParts.push(`${f.key} >= ${valRef}`);
                break;

            case 'lt':
                _.set(attribVals, valRef, f.val);
                filterParts.push(`${f.key} < ${valRef}`);
                break;

            case 'ltEq':
                _.set(attribVals, valRef, f.val);
                filterParts.push(`${f.key} <= ${valRef}`);
                break;

            case 'begins_with':
                _.set(attribVals, valRef, f.val);
                filterParts.push(`begins_with(${f.key}, ${valRef})`);
                break;

            case 'attribute_exists':
                _.set(attribVals, valRef, f.val);
                filterParts.push(`attribute_exists(${f.key})`);
                break;

            case 'attribute_not_exists':
                _.set(attribVals, valRef, f.val);
                filterParts.push(`attribute_not_exists(${f.key})`);
                break;

            case 'attribute_type':
                _.set(attribVals, valRef, f.val);
                filterParts.push(`attribute_type(${f.key}, ${valRef})`);
                break;

            case 'contains':
                _.set(attribVals, valRef, f.val);
                filterParts.push(`contains(${f.key}, ${valRef})`);
                break;

            case 'size': {
                const sizeVal = f.val as SizeValue;
                const newValRef = `:size_${_.trim(valRef, ':')}`;
                _.set(attribVals, newValRef, sizeVal.val);
                filterParts.push(`size(${f.key}) ${sizeVal.op} ${newValRef}`);
                break;
            }

            case 'between': {
                const valRefStart = `${valRef}_start`;
                const valRefEnd = `${valRef}_end`;
                const between = f.val as BetweenValues;
                filterParts.push(`${f.key} BETWEEN ${valRefStart} AND ${valRefEnd}`);
                _.set(attribVals, valRefStart, between.start);
                _.set(attribVals, valRefEnd, between.end);
                break;
            }
        }

        if (f.actualName) {
            _.set(attribNames, f.key, f.actualName);
        }
    });

    const filterExp = _.join(filterParts, ' and ');

    return [
        { FilterExpression: _.isEmpty(filterExp) ? undefined : filterExp },
        { ExpressionAttributeValues: _.isEmpty(attribVals) ? undefined : attribVals },
        { ExpressionAttributeNames: _.isEmpty(attribNames) ? undefined : attribNames },
    ];
};

const formatProjectionExpression = (proj: Array<string>) => {
    if (_.isEmpty(proj)) {
        return;
    }

    return {
        ProjectionExpression: _.join(proj, ", ")
    };
};
