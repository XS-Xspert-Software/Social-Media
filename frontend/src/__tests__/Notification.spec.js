import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import Notification from '../Notification.vue';

describe('Notification.vue', () => {
  it('shows no notifications for guest', () => {
    const wrapper = mount(Notification, { props: { loggedInUsername: 'Guest', showUi: true } });
    expect(wrapper.text()).toContain('You have no notifications');
  });

  it('shows notification list for user', () => {
    const wrapper = mount(Notification, { props: { loggedInUsername: 'alice', showUi: true } });
    // Can't test API, but can check section exists
    expect(wrapper.find('.notification-section').exists()).toBe(true);
  });
});
