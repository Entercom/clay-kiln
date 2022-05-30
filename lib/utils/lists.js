import {
  findIndex,
  isObject,
  pick,
  pullAt
} from 'lodash';

export function getKeys(itemKeys) {
  let [primaryKey, ...keys] = itemKeys;
  let localPrimaryKey;
  let remotePrimaryKey;

  if (isObject(primaryKey)) {
    [localPrimaryKey] = Object.keys(primaryKey);
    [remotePrimaryKey] = Object.values(primaryKey);
  } else {
    localPrimaryKey = remotePrimaryKey = primaryKey;
  }
  return { localPrimaryKey, remotePrimaryKey, keys };
}

export function localItemFromRemote(remoteItem, itemKeys) {
  const { localPrimaryKey, remotePrimaryKey, keys } = getKeys(itemKeys);

  return { [localPrimaryKey]: remoteItem[remotePrimaryKey], ...pick(remoteItem, keys) };
}

export function remoteItemFromLocal(localItem, itemKeys) {
  const { localPrimaryKey, remotePrimaryKey, keys } = getKeys(itemKeys);

  return { [remotePrimaryKey]: localItem[localPrimaryKey], ...pick(localItem, keys) };
}

export function addRemoteItemToLocalList(list, remoteItem, itemKeys) {
  const { localPrimaryKey, remotePrimaryKey, keys } = getKeys(itemKeys);
  const existingIndex = findIndex(list, localItem => localItem[localPrimaryKey] === remoteItem[remotePrimaryKey]);
  const localItem = { [localPrimaryKey]: remoteItem[remotePrimaryKey], ...pick(remoteItem, keys) };

  if (existingIndex === -1) {
    list.push(localItem);
  } else {
    list[existingIndex] = localItem;
  }
  return list;
}

export function removeRemoteItemFromLocalList(list, remoteItem, itemKeys) {
  const { localPrimaryKey, remotePrimaryKey, keys } = getKeys(itemKeys);
  const existingIndex = findIndex(list, localItem => localItem[localPrimaryKey] === remoteItem[remotePrimaryKey]);
  const localItem = { [localPrimaryKey]: remoteItem[remotePrimaryKey], ...pick(remoteItem, keys) };

  if (existingIndex !== -1) {
    if (remoteItem.count) {
      list[existingIndex] = localItem;
    } else {
      pullAt(list, existingIndex);
    }
  }
  return list;
}
