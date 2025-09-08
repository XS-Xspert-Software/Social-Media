import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import HashTagItem from '../HashTagItem.vue';

describe('HashTagItem.vue', () => {
  it('renders hashtag item', () => {
    const wrapper = mount(HashTagItem);
    expect(wrapper.exists()).toBe(true);
  });
});
