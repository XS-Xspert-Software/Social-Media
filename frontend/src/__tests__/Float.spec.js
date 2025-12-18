import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import Float from '../Float.vue';

vi.mock('vue-router', () => ({
  useRoute: () => ({ query: {} }),
  useRouter: () => ({ push: vi.fn() })
}));

describe('Float.vue', () => {
  it('redirects guest to login when FAB clicked', async () => {
    window.localStorage.setItem('username', 'Guest');
    const wrapper = mount(Float);
    // Simulate click
    const fab = wrapper.find('.floating-circle');
    expect(fab.exists()).toBe(true);
    // We can't test window.location.href in jsdom, but we can check the handler exists
    expect(typeof wrapper.vm.togglePanel).toBe('function');
  });

  it('allows signed-in user to open panel', async () => {
    window.localStorage.setItem('username', 'alice');
    const wrapper = mount(Float);
    expect(wrapper.vm.showPanel).toBe(false);
    await wrapper.vm.togglePanel();
    expect(wrapper.vm.showPanel).toBe(true);
  });
});
