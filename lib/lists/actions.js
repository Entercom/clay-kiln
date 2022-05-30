import _ from 'lodash';
import { LIST_LOAD_PENDING, LIST_LOAD_SUCCESS, LIST_LOAD_FAIL } from './mutationTypes';
import {
  getList as getListFromAPI,
  getSmartList as getSmartListFromAPI,
  saveList,
  patchList as patchListAPI,
  addSmartListItem as addSmartListItemAPI,
  removeSmartListItem as removeSmartListItemAPI
} from '../core-data/api';
import { remoteItemFromLocal } from '../utils/lists';

/**
 * @module lists
 */

export function getList(store, listName) {
  const prefix = _.get(store, 'state.site.prefix');

  store.commit(LIST_LOAD_PENDING, { listName });

  return getListFromAPI(prefix, listName)
    .then(listItems => store.commit(LIST_LOAD_SUCCESS, { listName, listItems }))
    .catch(error => store.commit(LIST_LOAD_FAIL, { listName, error }));
}

export function getSmartList(store, { listName, query }) {
  const prefix = _.get(store, 'state.site.prefix');

  store.commit(LIST_LOAD_PENDING, { listName });

  return getSmartListFromAPI(prefix, listName, query)
    .then(listItems => store.commit(LIST_LOAD_SUCCESS, { listName, listItems }))
    .catch(error => store.commit(LIST_LOAD_FAIL, { listName, error }));
}

/**
 * if a list doesn't exist, creates the empty list
 * @param {Object} store
 * @param {string} listName
 * @returns {Array<Object>}
 */
function getOrStartList(store, listName) {
  const prefix = _.get(store, 'state.site.prefix');

  store.commit(LIST_LOAD_PENDING, { listName });

  return getListFromAPI(prefix, listName)
    .catch(error => {
      // if it's a 404, that means the list doesn't exist and we need to create it
      if (error && error.response && error.response.status === 404) {
        return saveList(prefix, listName, []);
      } else {
        throw error;
      }
    });
}

export function updateList(store, { listName, fn }) {
  const prefix = _.get(store, 'state.site.prefix');

  return getOrStartList(store, listName)
    .then(listItems => fn(_.cloneDeep(listItems)))
    .then(listItems => saveList(prefix, listName, listItems))
    .then(listItems => store.commit(LIST_LOAD_SUCCESS, { listName, listItems }))
    .catch(error => store.commit(LIST_LOAD_FAIL, { listName, error }));
}

export function patchList(store, { listName, fn }) {
  const prefix = _.get(store, 'state.site.prefix');

  // get the list
  return getOrStartList(store, listName)
    // pass list to fn
    .then(list => {
      const patch = fn(list);

      // fn needs to return a patch `{ remove: [], add: [] }`
      return patch && (patch.add || patch.remove) ? patchListAPI(prefix, listName, patch) : list;
    })
    // patch api returns full list
    .then(listItems => store.commit(LIST_LOAD_SUCCESS, { listName, listItems }))
    // catch and log errors
    .catch(error => store.commit(LIST_LOAD_FAIL, { listName, error }));
}

export function addSmartListItem(store, { listName, item, itemKeys }) {
  const prefix = _.get(store, 'state.site.prefix');
  const remoteItem = remoteItemFromLocal(item, _.take(itemKeys, 1));

  return addSmartListItemAPI(prefix, listName, remoteItem)
    // smart list api only returns the added item
    .then(itemAdded => store.commit(LIST_LOAD_SUCCESS, { listName, itemAdded, itemKeys }))
    // catch and log errors
    .catch(error => store.commit(LIST_LOAD_FAIL, { listName, error }));
}

export function removeSmartListItem(store, { listName, item, itemKeys }) {
  const prefix = _.get(store, 'state.site.prefix');
  const remoteItem = remoteItemFromLocal(item, _.take(itemKeys, 1));

  return removeSmartListItemAPI(prefix, listName, remoteItem)
    // smart list api only returns the removed item
    .then(itemRemoved => store.commit(LIST_LOAD_SUCCESS, { listName, itemRemoved, itemKeys }))
    // catch and log errors
    .catch(error => store.commit(LIST_LOAD_FAIL, { listName, error }));
}
