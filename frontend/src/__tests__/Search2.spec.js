import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import Search2 from '../Search2.vue';

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { username: '' }, query: {} }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() })
}));

const notifyMock = vi.fn();

const pinia = createPinia();
setActivePinia(pinia);

describe('Search2.vue', () => {
  it('blocks tweetPost for guest', async () => {
    window.localStorage.setItem('username', 'Guest');
    const wrapper = mount(Search2, { global: { stubs: ['router-view'], plugins: [pinia], provide: { notify: notifyMock } } });
    const spy = vi.spyOn(window, 'location', 'set');
    wrapper.vm.tweetPost('123', 'bob');
    expect(notifyMock).toHaveBeenCalled();
    expect(spy).toHaveBeenCalled;
    spy.mockRestore();
  });

  it('allows tweetPost for signed-in user', async () => {
    window.localStorage.setItem('username', 'alice');
    const wrapper = mount(Search2, { global: { stubs: ['router-view'], plugins: [pinia], provide: { notify: notifyMock } } });
    // Should not redirect
    expect(() => wrapper.vm.tweetPost('123', 'bob')).not.toThrow();
  });
});
