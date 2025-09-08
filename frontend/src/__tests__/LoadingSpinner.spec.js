import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import LoadingSpinner from '../LoadingSpinner.vue';

describe('LoadingSpinner.vue', () => {
  it('renders spinner', () => {
    const wrapper = mount(LoadingSpinner);
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.text().toLowerCase()).toContain('loading');
  });
});
