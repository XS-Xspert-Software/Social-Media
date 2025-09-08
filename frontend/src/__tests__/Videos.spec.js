import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import Videos from '../Videos.vue';

describe('Videos.vue', () => {
  it('renders videos component', () => {
    const wrapper = mount(Videos);
    expect(wrapper.exists()).toBe(true);
  });
});
