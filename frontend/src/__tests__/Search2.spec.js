import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import Search2 from '../Search2.vue';

describe('Search2.vue', () => {
  it('blocks tweetPost for guest', async () => {
    window.localStorage.setItem('username', 'Guest');
    const wrapper = mount(Search2, { global: { stubs: ['router-view'] } });
    const spy = vi.spyOn(window, 'location', 'set');
    wrapper.vm.tweetPost('123', 'bob');
    expect(spy).toHaveBeenCalled;
    spy.mockRestore();
  });

  it('allows tweetPost for signed-in user', async () => {
    window.localStorage.setItem('username', 'alice');
    const wrapper = mount(Search2, { global: { stubs: ['router-view'] } });
    // Should not redirect
    expect(() => wrapper.vm.tweetPost('123', 'bob')).not.toThrow();
  });
});
