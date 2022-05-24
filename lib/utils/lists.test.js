import {
  getKeys,
  localItemFromRemote,
  remoteItemFromLocal,
  addRemoteItemToLocalList,
  removeRemoteItemFromLocalList
} from './lists';
import { sortBy } from 'lodash';

function expectArrayMatch(a, b, sortFields) {
  expect(sortBy(a, sortFields)).toEqual(sortBy(b, sortFields));
}

describe('Get key definitions', () => {
  test('With primary key mapping', () => {
    const itemKeys = [{text: 'value'}, 'count'];
    const {localPrimaryKey, remotePrimaryKey, keys} = getKeys(itemKeys);
    expect(localPrimaryKey).toBe('text');
    expect(remotePrimaryKey).toBe('value');
    expect(keys).toEqual(['count']);
  });
  test('Without primary key mapping', () => {
    const itemKeys = ['text', 'count'];
    const {localPrimaryKey, remotePrimaryKey, keys} = getKeys(itemKeys);
    expect(localPrimaryKey).toBe('text');
    expect(remotePrimaryKey).toBe('text');
    expect(keys).toEqual(['count']);
  });
});

describe('Convert between local and remote smart list items', () => {
  test('Local to remote', () => {
    const itemKeys = [{text: 'value'}, 'count'];
    expect(remoteItemFromLocal({text: 'one'}, itemKeys)).toEqual({value: 'one'});
    expect(remoteItemFromLocal({text: 'one', count: 1}, itemKeys)).toEqual({value: 'one', count: 1});
    expect(remoteItemFromLocal({text: 'one', count: 1, extra: true}, itemKeys)).toEqual({value: 'one', count: 1});
  });
  test('Remote to local', () => {
    const itemKeys = [{text: 'value'}, 'count'];
    expect(localItemFromRemote({value: 'one'}, itemKeys)).toEqual({text: 'one'});
    expect(localItemFromRemote({value: 'one', count: 1}, itemKeys)).toEqual({text: 'one', count: 1});
    expect(localItemFromRemote({value: 'one', count: 1, extra: true}, itemKeys)).toEqual({text: 'one', count: 1});
  });
});

describe('Modify existing list', () => {
  test('Update item', () => {
    const itemKeys = [{text: 'value'}, 'count'];
    const localList = [{text: 'one', count: 1}, {text: 'two', count: 1}];
    const result = addRemoteItemToLocalList(localList, {value: 'one', count: 2}, itemKeys);
    expectArrayMatch(result, [{text: 'one', count: 2}, {text: 'two', count: 1}], ['text', 'count']);
  });
  test('Add item', () => {
    const itemKeys = [{text: 'value'}, 'count'];
    const localList = [{text: 'two', count: 1}];
    const result = addRemoteItemToLocalList(localList, {value: 'one', count: 1}, itemKeys);
    expectArrayMatch(result, [{text: 'one', count: 1}, {text: 'two', count: 1}], ['text', 'count']);
  });
  test('Remove item', () => {
    const itemKeys = [{text: 'value'}, 'count'];
    const localList = [
      {text: 'one', count: 1},
      {text: 'two', count: 1},
    ];
    const result = removeRemoteItemFromLocalList(localList, {value: 'one'}, itemKeys);
    expectArrayMatch(result, [{text: 'two', count: 1}], ['text', 'count']);
  });
})