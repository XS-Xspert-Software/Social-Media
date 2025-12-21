import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import GroupChat from '../GroupChat.vue';

let store;
let stateOverrides = {};

const createStore = () => {
  const defaults = {
    loading: false,
    joinedGroups: [{ id: 1, name: 'Joined', userRole: 'Member', member_count: 5, isMember: true }],
    availableGroups: [{ id: 2, name: 'Open Group', member_count: 3, hasPendingRequest: false, membershipStatus: 'not_member', isPrivate: false, isMember: false }],
    joiningGroupId: null,
    cancellingRequestId: null
  };

  const base = { ...defaults, ...stateOverrides };
  return {
    ...base,
    initializeStore: vi.fn().mockResolvedValue(true),
    joinGroup: vi.fn().mockResolvedValue({ success: true, requiresApproval: false, groupName: base.availableGroups[0]?.name || 'Group' }),
    cancelJoinRequest: vi.fn().mockResolvedValue({ success: true, groupName: base.availableGroups[0]?.name || 'Group' }),
    forceRefresh: vi.fn().mockResolvedValue()
  };
};

vi.mock('../stores/grouplist', () => ({
  useGroupsStore: () => {
    store = createStore();
    return store;
  }
}));

describe('GroupChat.vue', () => {
  beforeEach(() => {
    stateOverrides = {};
    vi.clearAllMocks();
  });

  it('initializes store on mount and renders joined groups', async () => {
    const routerPush = vi.fn();
    const wrapper = mount(GroupChat, { global: { mocks: { $router: { push: routerPush } } } });
    await wrapper.vm.$nextTick();

    expect(store.initializeStore).toHaveBeenCalled();
    await wrapper.find('.joined-group').trigger('click');
    expect(routerPush).toHaveBeenCalledWith({ name: 'GroupChatbox', params: { groupId: '1', groupName: 'Joined' } });
  });

  it('calls joinGroup when join button is clicked', async () => {
    const wrapper = mount(GroupChat, { global: { mocks: { $router: { push: vi.fn() } } } });
    await wrapper.vm.$nextTick();

    const joinButton = wrapper.find('.join-button');
    expect(joinButton.exists()).toBe(true);
    await joinButton.trigger('click');

    expect(store.joinGroup).toHaveBeenCalledWith(store.availableGroups[0]);
  });

  it('shows fallback content when no groups exist', async () => {
    stateOverrides = { joinedGroups: [], availableGroups: [], loading: false };
    const wrapper = mount(GroupChat, { global: { mocks: { $router: { push: vi.fn() } } } });
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('Something went wrong');
  });
});
