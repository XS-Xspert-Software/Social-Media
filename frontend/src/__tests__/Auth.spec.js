import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import Auth from '../Auth.vue';
import { nodeAPI } from '../config/api.js';

vi.mock('../config/api.js', () => ({
  nodeAPI: {
    login: vi.fn(),
    register: vi.fn()
  }
}));

describe('Auth.vue', () => {
  const originalLocalStorage = global.localStorage;

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
    global.localStorage = originalLocalStorage;
  });

  it('toggles between login and register modes', async () => {
    const wrapper = mount(Auth);
    expect(wrapper.vm.isLogin).toBe(true);
    await wrapper.find('.toggle-btn').trigger('click');
    expect(wrapper.vm.isLogin).toBe(false);
    await wrapper.find('.toggle-btn').trigger('click');
    expect(wrapper.vm.isLogin).toBe(true);
  });

  it('handles login flow and emits auth-success', async () => {
    nodeAPI.login.mockResolvedValue({ token: 't1', user: { id: '1', username: 'alice' } });
    const wrapper = mount(Auth);
    wrapper.vm.form.email = 'alice@mail.com';
    wrapper.vm.form.password = 'secret';

    await wrapper.vm.handleSubmit();

    const events = wrapper.emitted('auth-success');
    expect(events?.[0]?.[0]?.user.username).toBe('alice');
    expect(localStorage.getItem('username')).toBe('alice');
  });

  it('handles register flow when in register mode', async () => {
    nodeAPI.register.mockResolvedValue({ token: 't2', user: { id: '2', username: 'bob' } });
    const wrapper = mount(Auth);
    wrapper.vm.isLogin = false;
    wrapper.vm.form.username = 'bob';
    wrapper.vm.form.email = 'bob@mail.com';
    wrapper.vm.form.password = 'pw';

    await wrapper.vm.handleSubmit();

    expect(nodeAPI.register).toHaveBeenCalledWith({ username: 'bob', email: 'bob@mail.com', password: 'pw' });
    expect(wrapper.emitted('auth-success')).toBeTruthy();
  });

  it('surfaces API errors', async () => {
    nodeAPI.login.mockRejectedValue(new Error('Authentication failed'));
    const wrapper = mount(Auth);
    wrapper.vm.form.email = 'bad@mail.com';
    wrapper.vm.form.password = 'wrong';

    await wrapper.vm.handleSubmit();
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('Authentication failed');
  });
});
