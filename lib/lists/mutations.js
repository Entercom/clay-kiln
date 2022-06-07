import Vue from 'vue';
import _ from 'lodash';
import { LIST_LOAD_PENDING, LIST_LOAD_SUCCESS, LIST_LOAD_FAIL } from './mutationTypes';
import { addRemoteItemToLocalList, removeRemoteItemFromLocalList } from '../utils/lists';

export default {
  [LIST_LOAD_PENDING]: (state, { listName }) => {
    // use vue setter for lists, as individual lists won't have objects when the state is preloaded
    Vue.set(state.lists, listName, {
      isLoading: true,
      error: null,
      items: _.get(state.lists, `${listName}.items`, []) // don't clear list items if they already exist
    });

    return state;
  },
  [LIST_LOAD_SUCCESS]: (state, {
    listName, listItems, itemKeys, itemAdded, itemRemoved
  }) => {
    const currentList = _.get(state.lists, `${listName}`);

    if (itemAdded) {
      // Add or update item in existing list
      if (!itemKeys) {
        throw new Error(`need itemKeys to update ${listname} list`);
      }
      listItems = addRemoteItemToLocalList(currentList.items, itemAdded, itemKeys);
    } else if (itemRemoved) {
      // Reduce count or remove item from existing list
      if (!itemKeys) {
        throw new Error(`need itemKeys to update ${listname} list`);
      }
      listItems = removeRemoteItemFromLocalList(currentList.items, itemRemoved, itemKeys);
    }
    Vue.set(state.lists, listName, {
      isLoading: false,
      error: null,
      items: listItems
    });

    return state;
  },
  [LIST_LOAD_FAIL]: (state, { listName, error }) => {
    Vue.set(state.lists, listName, {
      isLoading: false,
      error: error,
      items: []
    });

    return state;
  }
};
