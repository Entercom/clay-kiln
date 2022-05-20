<template>
  <div class="smart-list ui-textbox has-label has-floating-label" :class="classes">
    <attached-button class="ui-textbox__icon-wrapper" :name="name" :data="data" :schema="schema" :args="args" @disable="disableInput" @enable="enableInput"></attached-button>

    <div class="ui-textbox__content">
      <label class="ui-textbox__label" @click.prevent>
        <div class="ui-textbox__label-text" :class="labelClasses">{{ label }}</div>
        <div class="smart-list-items ui-textbox__input">
          <transition-group name="list-items" tag="div" class="smart-list-items-wrapper">
            <smart-list-item v-for="(item, index) in items"
              :index="index"
              :data="item"
              :key="`smart-list-${index}`"
              :currentItem="currentItem"
              :propertyName="args.propertyName"
              :badge="args.badge"
              :disabled="isDisabled"
              @remove="removeItem"
              @select="selectItem"
              @dblclick.native="setPrimary(index)"
              v-dynamic-events="customEvents"></smart-list-item>
          </transition-group>
          <smart-list-input
            :items="items"
            :allowRepeatedItems="args.allowRepeatedItems"
            :autocomplete="args.autocomplete"
            :ignoreComma="args.ignoreComma"
            :currentItem="currentItem"
            :disabled="isDisabled || disabled"
            :isInitialFocus="initialFocus === name"
            @add="addItem"
            @select="selectItem"
            @focus="onFocus"
            @blur="onBlur"
            @resize="onResize"
            v-dynamic-events="customEvents"></smart-list-input>
        </div>
      </label>

      <div class="ui-textbox__feedback" v-if="hasFeedback || maxLength">
        <div class="ui-textbox__feedback-text" v-if="showError">{{ error }}</div>
        <div class="ui-textbox__feedback-text" v-else-if="showHelp">{{ args.help }}</div>
        <div class="ui-textbox__counter" v-if="maxLength">
            {{ valueLength + '/' + maxLength }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import _ from 'lodash';
  import { UPDATE_FORMDATA } from '../lib/forms/mutationTypes';
  import { shouldBeRequired, getValidationError } from '../lib/forms/field-helpers';
  import label from '../lib/utils/label';
  import logger from '../lib/utils/log';
  import smartListItem from './smart-list-item.vue';
  import smartListInput from './smart-list-input.vue';
  import attachedButton from './attached-button.vue';
  import { getItemIndex, getProp } from '../lib/lists/helpers';
  import { DynamicEvents } from './mixins';

  const log = logger(__filename);

  export default {
    mixins: [DynamicEvents],
    props: ['name', 'data', 'schema', 'args', 'initialFocus', 'disabled'],
    data() {
      return {
        isActive: false,
        isTouched: false,
        isDisabled: false,
        currentItem: null,
        type: 'strings',
        removedItem: {}
      };
    },
    computed: {
      items() {
        if (!_.isEmpty(this.data) && _.isString(_.head(this.data))) {
          // array of strings! convert to array of objects internally, but save it back to the store as strings
          this.type = 'strings';

          return _.map(this.data, item => item.text);
        } else if (!_.isEmpty(this.data) && _.isObject(_.head(this.data))) {
          // array of objects!
          this.type = 'objects';

          return _.cloneDeep(this.data);
        } else if ((!this.data || _.isEmpty(this.data)) && !!this.args.propertyName) {
          // empty data, but we're using propertyName so we want an array of objects
          this.type = 'objects';

          return [];
        } else if ((!this.data || _.isEmpty(this.data)) && !this.args.propertyName) {
          // empty data, but no propertyName so we want an array of strings
          this.type = 'strings';

          return [];
        } else {
          log.error('Unknown data type!', { action: 'compute items', items: this.data });
        }
      },
      isRequired() {
        return _.get(this.args, 'validate.required') === true || shouldBeRequired(this.args.validate, this.$store, this.name);
      },
      maxLength() {
        return _.get(this.args, 'validate.max') || 0;
      },
      label() {
        return `${label(this.name, this.schema)}${this.isRequired ? '*' : ''}`;
      },
      errorMessage() {
        return this.isTouched && getValidationError(this.items, this.args.validate, this.$store, this.name);
      },
      isInvalid() {
        return !!this.errorMessage;
      },
      isLabelInline() {
        return this.items.length === 0 && !this.isActive;
      },
      hasFeedback() {
        return this.args.help || this.error;
      },
      showError() {
        return this.isInvalid && this.error;
      },
      showHelp() {
        return !this.showError && this.args.help;
      },
      valueLength() {
        return this.items.length;
      },
      classes() {
        return [
          { 'ui-textbox--icon-position-right': this.args.attachedButton },
          { 'is-active': this.isActive },
          { 'is-invalid': this.isInvalid },
          { 'is-touched': this.isTouched },
          { 'has-counter': this.maxLength },
          { 'is-disabled': this.isDisabled }
        ];
      },
      labelClasses() {
        return {
          'is-inline': this.isLabelInline,
          'is-floating': !this.isLabelInline
        };
      }
    },
    methods: {
      update(val) {
        this.$store.commit(UPDATE_FORMDATA, { path: this.name, data: val });
      },
      disableInput() {
        this.isDisabled = true;
      },
      enableInput() {
        this.isDisabled = false;
      },
      onFocus() {
        this.isActive = true;
      },
      onBlur() {
        this.isActive = false;

        if (!this.isTouched) {
          this.isTouched = true;
        }
      },
      onResize(additionalPixels) {
        this.$root.$emit('resize-form', additionalPixels);
      },
      selectItem(index) {
        if (_.isNull(index) || index < 0 || index >= this.data.length) {
          this.currentItem = null; // out of range, select input
        } else {
          if (!this.data.length) {
            this.currentItem = null; // no items, select input
          } else {
            this.currentItem = index;
          }
        }
      },
      removeItem(index) {
        const [removedItem] = this.items.splice(index, 1);

        this.removedItem = removedItem;

        this.update(this.items);

        if (this.items.length) { // you always select before deleting
          this.selectItem(this.currentItem - 1);
        } else {
          this.currentitem = null;
        }

        if (this.args.autocomplete && this.args.autocomplete.allowRemove) {
          const listName = this.args.autocomplete.list;

          return this.$store.dispatch('patchList', {
            listName: listName,
            fn: this.handleRemoveItem
          });
        }
      },
      /**
       * Handles remove item from list
       * @param {Array.<Object>} items
       */
      handleRemoveItem(items = []) {
        // validate that the list has items with these properties
        const stringProperty = getProp(items, 'text'),
          countProperty = getProp(items, 'count');

        if (stringProperty && countProperty) {
          const itemIndex = getItemIndex(items, (this.removedItem || {}).text, 'text');

          if (itemIndex !== -1 && items[itemIndex][countProperty]) {
            // decrease count if the item already exists in the list and count is more than 0

            const old = items[itemIndex],
              updated = _.cloneDeep(old);

            updated[countProperty]--;

            this.removedItem = {};

            return {
              add: [updated],
              remove: [old]
            };
          }
        }
      },
      addItem(newItem) {
        this.items.push(newItem);
        this.update(this.items);

        // only add items to the list if the schema allows it
        if (this.args.autocomplete && this.args.autocomplete.allowCreate) {
          const listName = this.args.autocomplete.list;

          return this.$store.dispatch('patchList', {
            listName: listName,
            fn: (items) => {
              const patch = {
                  add: [],
                  remove: []
                },
                // validate that the list has items with these properties
                stringProperty = getProp(items, 'text'),
                countProperty = getProp(items, 'count');

              if (stringProperty && countProperty) {
                const itemIndex = getItemIndex(items, newItem.text, 'text');

                if (itemIndex !== -1) {
                  // remove the old, add new object with new count
                  const old = items[itemIndex],
                    updated = _.cloneDeep(old);

                  patch.remove.push(old);

                  // increase count if the item already exists in the list
                  updated[countProperty]++;
                  patch.add.push(updated);

                  return patch;
                } else {
                  // add item to the list
                  _.set(newItem, countProperty, 1);

                  patch.add.push(newItem);

                  return patch;
                }
              } else if (_.isString(_.head(items))) {
                // if the list is just an array of strings, just add the string property

                if (getItemIndex(items, newItem.text) === -1) {
                  patch.add.push(newItem.text);

                  return patch;
                }
              } else if (items.length === 0) {
                log.warn('The list is empty, unable to determine data structure. Adding item with default data structure.', { action: 'adding item to a list' });
                _.set(newItem, 'count', 1);

                patch.add.push(newItem);

                return patch;
              }
            }
          });
        }
      },
      setPrimary(index) {
        const property = this.args.propertyName;

        if (property) {
          this.items = _.map(this.items, (item, i) => {
            if (i === index) {
              item[property] = true;
            } else {
              item[property] = false;
            }
          });
          this.update(this.items);
        }
      }
    },
    components: {
      smartListItem,
      smartListInput,
      attachedButton
    }
  };
</script>

<style lang="sass">
  @import '../styleguide/animations';

  .smart-list {
    .smart-list-items {
      align-items: center;
      display: flex;
      flex-flow: row wrap;
      height: auto;
      justify-content: flex-start;
    }

    .smart-list-items-wrapper {
      align-items: flex-start;
      display: inline-flex;
      flex: 0 0 auto;
      flex-flow: row wrap;
      justify-content: flex-start;
      max-width: 100%;
    }

    .list-items-enter,
    .list-items-leave-to {
      opacity: 0;
    }

    .list-items-enter-to,
    .list-items-leave {
      opacity: 1;
    }

    .list-items-enter-active,
    .list-items-leave-active {
      transition: opacity $standard-time $standard-curve;
    }
  }
</style>
