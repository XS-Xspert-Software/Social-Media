import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import LoadingSpinner from '../LoadingSpinner.vue';

describe('LoadingSpinner.vue', () => {
  it('renders spinner', async () => {
    const wrapper = mount(LoadingSpinner);
    expect(wrapper.exists()).toBe(true);
    wrapper.vm.show();
    await nextTick();
    expect(wrapper.find('.spinner').exists()).toBe(true);
  });
});
