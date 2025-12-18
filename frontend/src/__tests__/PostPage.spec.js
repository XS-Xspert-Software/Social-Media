import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import PostPage from '../PostPage.vue';

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { id: '1' }, path: '/posts/1' }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() })
}));

const pinia = createPinia();
setActivePinia(pinia);

describe('PostPage.vue', () => {
  it('renders post page', () => {
    const wrapper = mount(PostPage, { global: { plugins: [pinia] } });
    expect(wrapper.exists()).toBe(true);
  });
});
