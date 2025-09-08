import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import WorldChat from '../WorldChat.vue';

describe('WorldChat.vue', () => {
  it('renders world chat', () => {
    const wrapper = mount(WorldChat);
    expect(wrapper.exists()).toBe(true);
  });
});
