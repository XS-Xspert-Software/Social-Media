import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import GroupChatbox from '../GroupChatbox.vue';

describe('GroupChatbox.vue', () => {
  it('renders group chatbox', () => {
    const wrapper = mount(GroupChatbox);
    expect(wrapper.exists()).toBe(true);
  });
});
