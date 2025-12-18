import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import WorldChat from '../WorldChat.vue';

const pinia = createPinia();
setActivePinia(pinia);

describe('WorldChat.vue', () => {
  it('renders world chat', () => {
    const wrapper = mount(WorldChat, { global: { plugins: [pinia] } });
    expect(wrapper.exists()).toBe(true);
  });
});
