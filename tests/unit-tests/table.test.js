import { Table } from '../../src/table';

describe('class: Table', () => {
    it('should initialize with values', async () => {
        const x = new Table('some-table-name', 'pk', 'sk');
        expect(x.name).toBe('some-table-name');
        expect(x.hashKey).toBe('pk');
        expect(x.rangeKey).toBe('sk');
    });
});