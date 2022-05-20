import SmartList from './smart-list.vue';

describe('SmartList input', () => {
  const options = {
      propsData: {
        name: 'foo',
        data: null,
        schema: {},
        args: {}
      }
    },
    items = [
      { text: 'test1', count: 1 },
      { text: 'test2', count: 2 }
    ];

  let wrapper;

  beforeEach(() => {
    wrapper = shallowMount(SmartList, options);
  });

  test('Should decrease count when there is a removedItem', () => {
    wrapper.vm.removedItem = { text: 'test2' };

    // since it exists, it decreases count
    expect(wrapper.vm.handleRemoveItem(items)).toStrictEqual({
      add: [{ text: 'test2', count: 1 }],
      remove: [{ text: 'test2', count: 2 }]
    });
  });

  test("Should return undefined removedItem doesn't exist", () => {
    wrapper.vm.removedItem = { text: 'something else' };

    expect(wrapper.vm.handleRemoveItem(items)).toStrictEqual(undefined);
  });

  test('Should return undefined if removedItem is null', () => {
    wrapper.vm.removedItem = null;

    expect(wrapper.vm.handleRemoveItem(items)).toStrictEqual(undefined);
  });
});
