import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import App from '../App.vue';

const mockRoute = { name: 'Home', path: '/' };
const mockRouter = { push: vi.fn(), replace: vi.fn() };
const pinia = createPinia();
setActivePinia(pinia);

describe('App.vue', () => {
  it('renders header and login prompt for guest', () => {
    // Simulate guest user
    window.localStorage.setItem('username', 'Guest');
    const wrapper = mount(App, {
      global: {
        stubs: ['router-view', 'Notification', 'LoginPrompt', 'RightSidebar', 'Float', 'Alert'],
        mocks: { $route: mockRoute, $router: mockRouter },
        plugins: [pinia]
      }
    });
    expect(wrapper.text()).toContain('Sync');
    expect(wrapper.findComponent({ name: 'LoginPrompt' }).exists()).toBe(true);
  });

  it('hides login prompt for signed-in user', () => {
    window.localStorage.setItem('username', 'alice');
    const wrapper = mount(App, {
      global: {
        stubs: ['router-view', 'Notification', 'LoginPrompt', 'RightSidebar', 'Float', 'Alert'],
        mocks: { $route: { ...mockRoute, name: 'Chat' }, $router: mockRouter },
        plugins: [pinia]
      }
    });
    expect(wrapper.findComponent({ name: 'LoginPrompt' }).exists()).toBe(false);
  });

  it('emits login event and redirects', async () => {
    window.localStorage.setItem('username', 'Guest');
    const wrapper = mount(App, {
      global: {
        stubs: ['router-view', 'Notification', 'LoginPrompt', 'RightSidebar', 'Float', 'Alert'],
        mocks: { $route: mockRoute, $router: mockRouter },
        plugins: [pinia]
      }
    });
    const loginPrompt = wrapper.findComponent({ name: 'LoginPrompt' });
    await loginPrompt.vm.$emit('login');
    // Should set postLoginRedirect in localStorage
    expect(window.localStorage.getItem('postLoginRedirect')).toBeDefined();
  });
});
