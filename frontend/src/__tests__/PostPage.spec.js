import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import PostPage from '../PostPage.vue';

describe('PostPage.vue', () => {
  it('renders post page', () => {
    const wrapper = mount(PostPage);
    expect(wrapper.exists()).toBe(true);
  });
});
