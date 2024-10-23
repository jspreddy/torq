import _ from 'lodash';
import assert from 'assert';

export class Table {
    private _name: string;
    private _hashKey: string;
    private _rangeKey: string | undefined;

    constructor(name: string, hashKey: string, rangeKey: string | undefined = undefined) {
        assert(_.isString(name) && _.size(name) > 0, 'Table.constructor(): name must be provided');
        assert(_.isString(hashKey) && _.size(hashKey) > 0, 'Table.constructor(): hashKey must be provided');
        assert(_.isNil(rangeKey) || (_.isString(rangeKey) && _.size(rangeKey) > 0), 'Table.constructor(): rangeKey is invalid');

        this._name = name;
        this._hashKey = hashKey;
        this._rangeKey = rangeKey;
    }

    get name() {
        return this._name;
    }

    get hashKey() {
        return this._hashKey;
    }

    get rangeKey() {
        return this._rangeKey;
    }
}

export class Index {
    private _name: string;
    private _hashKey: string;
    private _rangeKey: string | undefined;

    constructor(name: string, hashKey: string, rangeKey: string | undefined) {
        assert(_.isString(name) && _.size(name) > 0, 'Index.constructor(): name must be provided');
        assert(_.isString(hashKey) && _.size(hashKey) > 0, 'Index.constructor(): hashKey must be provided');

        this._name = name;
        this._hashKey = hashKey;
        this._rangeKey = rangeKey;
    }

    get name() {
        return this._name;
    }

    get hashKey() {
        return this._hashKey;
    }

    get rangeKey() {
        return this._rangeKey;
    }
}
