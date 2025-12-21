import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import HashTagItem from '../HashTagItem.vue';

describe('HashTagItem.vue', () => {
  it('renders hashtag item', () => {
    const wrapper = mount(HashTagItem, {
      props: {
        hashtag: { hashtag: 'vue', trending_score: 10, unique_user_count: 5 }
      }
    });
    expect(wrapper.exists()).toBe(true);
  });
});
