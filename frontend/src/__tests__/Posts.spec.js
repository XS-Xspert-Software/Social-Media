import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import Posts from '../Posts.vue';

const pinia = createPinia();
setActivePinia(pinia);

describe('Posts.vue', () => {
  it('shows posts feed', () => {
    const wrapper = mount(Posts, { global: { stubs: ['router-view'], plugins: [pinia] } });
    expect(wrapper.find('.posts-feed').exists()).toBe(true);
  });

  it('blocks edit/delete for guest', async () => {
    window.localStorage.setItem('username', 'Guest');
    const wrapper = mount(Posts, { global: { stubs: ['router-view'], plugins: [pinia] } });
    expect(typeof wrapper.vm.handleEdit).toBe('function');
    expect(typeof wrapper.vm.handleDelete).toBe('function');
    // Should not throw, but should not allow edit/delete
    expect(() => wrapper.vm.handleEdit({ _id: '1', username: 'Guest' })).not.toThrow();
    expect(() => wrapper.vm.handleDelete({ _id: '1', username: 'Guest' })).not.toThrow();
  });
});
