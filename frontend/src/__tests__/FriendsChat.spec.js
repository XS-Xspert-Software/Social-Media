import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import FriendsChat from '../FriendsChat.vue';

const pinia = createPinia();
setActivePinia(pinia);

describe('FriendsChat.vue', () => {
  it('renders friends chat', () => {
    const wrapper = mount(FriendsChat, { global: { plugins: [pinia] } });
    expect(wrapper.exists()).toBe(true);
  });
});
