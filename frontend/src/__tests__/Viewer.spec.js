import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import Viewer from '../Viewer.vue';

describe('Viewer.vue', () => {
  it('renders viewer', () => {
    const wrapper = mount(Viewer);
    expect(wrapper.exists()).toBe(true);
  });
});
