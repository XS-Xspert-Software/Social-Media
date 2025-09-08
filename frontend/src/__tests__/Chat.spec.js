import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import Chat from '../Chat.vue';

describe('Chat.vue', () => {
  it('shows login prompt for guest', () => {
    window.localStorage.setItem('username', 'Guest');
    const wrapper = mount(Chat, { global: { stubs: ['Chatbox', 'FriendsChat', 'LoginPrompt'] } });
    expect(wrapper.findComponent({ name: 'LoginPrompt' }).exists()).toBe(true);
  });

  it('does not show login prompt for signed-in user', () => {
    window.localStorage.setItem('username', 'bob');
    const wrapper = mount(Chat, { global: { stubs: ['Chatbox', 'FriendsChat', 'LoginPrompt'] } });
    expect(wrapper.findComponent({ name: 'LoginPrompt' }).exists()).toBe(false);
  });
});
