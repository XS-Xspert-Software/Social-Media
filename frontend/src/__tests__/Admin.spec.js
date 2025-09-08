import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import Admin from '../Admin.vue';

describe('Admin.vue', () => {
  it('renders admin component', () => {
    const wrapper = mount(Admin);
    expect(wrapper.exists()).toBe(true);
  });
});
