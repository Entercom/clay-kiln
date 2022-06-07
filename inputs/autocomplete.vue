<template>
  <ol class="autocomplete" v-if="showMatches && !disabled">
    <li v-for="(match, index) in matches">
      <item
        :index="index"
        :focusIndex="activeIndex"
        :value="match"
        :select="select"
        :allowRemove="args.allowRemove"
        :remove="removeFromList"
        ></item>
    </li>
  </ol>
</template>

<script>
  import _ from 'lodash';
  import item from './autocomplete-item.vue';
  import { getItemIndex, getProp } from '../lib/lists/helpers';

  const MINIMUM_LENGTH_TO_MATCH = 2;
  const MAXIMUM_MATCHES = 20;
  const SMART_LIST_FETCH_DEBOUNCE = 500;

  export default {
    props: ['args', 'select', 'query', 'focusIndex', 'updateFocusIndex', 'updateMatches', 'unselect', 'disabled'],
    data() {
      return {
        localIndex: null,
        prevFocusIndex: null,
        listItems: [],
        additionalPixels: 0
      };
    },
    computed: {
      showMatches() {
        return this.query.length >= MINIMUM_LENGTH_TO_MATCH && this.matches.length;
      },
      matches() {
        let matches;

        if (this.args.smartList) {
          matches = _.take(this.listItems, MAXIMUM_MATCHES);
        } else {
          const query = this.query || '';

          matches = _.take(_.filter(this.listItems, (option) => {
            return _.includes(option.toLowerCase(), query.toLowerCase());
          }), MAXIMUM_MATCHES);
        }

        this.updateMatches(matches);

        return matches;
      },
      activeIndex() {
        var activeIndex,
          matchesLength = this.matches.length;

        if (_.isNumber(this.focusIndex)) {
          if (this.focusIndex < 0) {
            activeIndex = matchesLength - 1;
          } else {
            activeIndex = this.focusIndex % matchesLength;
          }
        } else if (this.prevFocusIndex && !this.focusIndex) {
          this.matches = [];
        }

        // Update parent with new focus value
        this.updateFocusIndex(activeIndex);
        // Cache the previous to know the direction
        this.prevFocusIndex = this.focusIndex;
        // Return the active index
        return activeIndex;
      }
    },
    watch: {
      matches(val) {
        let pixelLength = val ? val.length * 40 : 0;

        // only rachet up the size, never make the size smaller
        if (val && this.showMatches && pixelLength > this.additionalPixels) {
          this.additionalPixels = pixelLength;
          // when matches change, potentially resize the form
          this.$root.$emit('resize-form', pixelLength);
        }
      },
      query() {
        if (this.args.smartList) {
          this.listItems = [];
          this.debouncedFetchListItems();
        }
      }
    },
    methods: {
      fetchListItems() {
        const listName = this.args.list,
          lists = this.$store.state.lists,
          smartList = this.args.smartList,
          items = _.get(lists, `${listName}.items`);
        let promise;

        if (smartList) {
          if ((this.query || '').length < MINIMUM_LENGTH_TO_MATCH) {
            return;
          }
          promise = this.$store.dispatch('getSmartList', { listName, query: this.query, size: MAXIMUM_MATCHES }).then(() => _.get(lists, `${listName}.items`));
        } else if (items) {
          promise = Promise.resolve(items);
        } else {
          promise = this.$store.dispatch('getList', listName).then(() => _.get(lists, `${listName}.items`));
        }

        return promise.then((listItems) => {
          this.listItems = _.map(listItems, item => _.isObject(item) ? item.text : item);
        });
      },
      removeFromList(item) {
        const listName = this.args.list;

        this.unselect();

        return this.$store.dispatch('patchList', {
          listName: listName,
          fn: (items) => {
            const stringProperty = getProp(items, 'text'),
              index = getItemIndex(items, item, stringProperty);

            if (index !== -1) {
              return { remove: [items[index]] };
            }
          }
        }).then(list => this.listItems = _.map(list, item => _.isObject(item) ? item.text : item));
      }
    },
    created() {
      this.debouncedFetchListItems = _.debounce(() => this.fetchListItems(), SMART_LIST_FETCH_DEBOUNCE);
    },
    mounted() {
      if (!this.args.smartList) {
        this.fetchListItems();
      }
    },
    components: {
      item
    }
  };
</script>

<style lang="sass">
  @import '../styleguide/colors';

  .autocomplete {
    background-color: $card-bg-color;
    box-shadow: 1px 2px 8px $md-grey-600;
    display: block;
    list-style: none;
    margin: 0 0 8px;
    padding: 0;
    position: absolute;
    top: 100%;
    width: 100%;
    z-index: 1;
  }
</style>
