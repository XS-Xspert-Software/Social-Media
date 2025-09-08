import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import FriendsChat from '../FriendsChat.vue';

describe('FriendsChat.vue', () => {
  it('renders friends chat', () => {
    const wrapper = mount(FriendsChat);
    expect(wrapper.exists()).toBe(true);
  });
});
