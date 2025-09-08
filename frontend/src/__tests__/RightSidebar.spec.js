import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import RightSidebar from '../RightSidebar.vue';

describe('RightSidebar.vue', () => {
  it('renders sidebar', () => {
    const wrapper = mount(RightSidebar);
    expect(wrapper.exists()).toBe(true);
  });
});
