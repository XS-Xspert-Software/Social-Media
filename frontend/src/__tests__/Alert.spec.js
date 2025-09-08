import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import Alert from '../Alert.vue';

describe('Alert.vue', () => {
  it('renders alert component', () => {
    const wrapper = mount(Alert);
    expect(wrapper.exists()).toBe(true);
  });
});
