import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useWebRTC } from '../useWebRTC.js';

describe('useWebRTC', () => {
  const originalAlert = global.alert;

  beforeEach(() => {
    vi.clearAllMocks();
    global.alert = vi.fn();
  });

  afterEach(() => {
    global.alert = originalAlert;
  });

  it('initializes ids and stays disconnected until WebSocket is provided', async () => {
    const rtc = useWebRTC();
    await rtc.init('user-1', 'user-2');

    expect(rtc.connectionStatus.value).toBe('disconnected');
    expect(rtc.getConnectionStatus()).toBe('disconnected');
    expect(rtc.sendChatMessage({ text: 'hello' })).toBe(false);
  });

  it('handles basic message helpers when socket is absent', () => {
    const rtc = useWebRTC();
    expect(rtc.sendWebSocketMessage({ type: 'noop' })).toBe(false);
    expect(rtc.sendTypingIndicator()).toBe(false);
  });

  it('cleans up state', () => {
    const rtc = useWebRTC();
    rtc.inCall.value = true;
    rtc.incomingCall.value = true;

    rtc.cleanup();

    expect(rtc.inCall.value).toBe(false);
    expect(rtc.connectionStatus.value).toBe('disconnected');
    expect(rtc.incomingCall.value).toBe(false);
  });
});
