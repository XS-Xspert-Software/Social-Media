import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import Settings from '../Settings.vue';

describe('Settings.vue', () => {
  it('shows login prompt for guest', () => {
    window.localStorage.setItem('username', 'Guest');
    const wrapper = mount(Settings, { global: { stubs: ['LoginPrompt'] } });
    expect(wrapper.findComponent({ name: 'LoginPrompt' }).exists()).toBe(true);
  });

  it('does not show login prompt for signed-in user', () => {
    window.localStorage.setItem('username', 'bob');
    const wrapper = mount(Settings, { global: { stubs: ['LoginPrompt'] } });
    expect(wrapper.findComponent({ name: 'LoginPrompt' }).exists()).toBe(false);
  });
});
