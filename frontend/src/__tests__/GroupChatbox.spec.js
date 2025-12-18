import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import GroupChatbox from '../GroupChatbox.vue';

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { groupId: '1', groupName: 'Test Group' } }),
  useRouter: () => ({ push: vi.fn() })
}));

describe('GroupChatbox.vue', () => {
  it('renders group chatbox', () => {
    const wrapper = mount(GroupChatbox);
    expect(wrapper.exists()).toBe(true);
  });
});
