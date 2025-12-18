import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import LoginPrompt from '../LoginPrompt.vue';

describe('LoginPrompt.vue', () => {
  it('renders default message and button', () => {
    const wrapper = mount(LoginPrompt);
    expect(wrapper.text()).toContain('Log in to chat, post, and get notifications.');
    expect(wrapper.find('button').exists()).toBe(true);
    expect(wrapper.find('button').text()).toBe('Login');
  });

  it('renders custom message and ctaLabel', () => {
    const wrapper = mount(LoginPrompt, {
      props: { message: 'Custom login required', ctaLabel: 'Sign In' }
    });
    expect(wrapper.text()).toContain('Custom login required');
    expect(wrapper.find('button').text()).toBe('Sign In');
  });

  it('emits login event on button click', async () => {
    const wrapper = mount(LoginPrompt);
    await wrapper.find('button').trigger('click');
    expect(wrapper.emitted('login')).toBeTruthy();
  });

  it('renders inline variant', () => {
    const wrapper = mount(LoginPrompt, {
      props: { inline: true, message: 'Inline login needed' }
    });
    expect(wrapper.text()).toContain('Inline login needed');
    expect(wrapper.find('.login-inline').exists()).toBe(true);
  });
});
