import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import Chatbox from '../Chatbox.vue';

describe('Chatbox.vue', () => {
  it('renders chatbox', () => {
    const wrapper = mount(Chatbox);
    expect(wrapper.exists()).toBe(true);
  });
});
