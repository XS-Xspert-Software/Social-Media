import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import App from '../App.vue';

describe('App.vue', () => {
  it('renders header and login prompt for guest', () => {
    // Simulate guest user
    window.localStorage.setItem('username', 'Guest');
    const wrapper = mount(App, { global: { stubs: ['router-view', 'Notification', 'LoginPrompt', 'RightSidebar', 'Float', 'Alert'] } });
    expect(wrapper.text()).toContain('Sync');
    expect(wrapper.findComponent({ name: 'LoginPrompt' }).exists()).toBe(true);
  });

  it('hides login prompt for signed-in user', () => {
    window.localStorage.setItem('username', 'alice');
    const wrapper = mount(App, { global: { stubs: ['router-view', 'Notification', 'LoginPrompt', 'RightSidebar', 'Float', 'Alert'] } });
    expect(wrapper.findComponent({ name: 'LoginPrompt' }).exists()).toBe(false);
  });

  it('emits login event and redirects', async () => {
    window.localStorage.setItem('username', 'Guest');
    const wrapper = mount(App, { global: { stubs: ['router-view', 'Notification', 'LoginPrompt', 'RightSidebar', 'Float', 'Alert'] } });
    const loginPrompt = wrapper.findComponent({ name: 'LoginPrompt' });
    await loginPrompt.vm.$emit('login');
    // Should set postLoginRedirect in localStorage
    expect(window.localStorage.getItem('postLoginRedirect')).toBeDefined();
  });
});
