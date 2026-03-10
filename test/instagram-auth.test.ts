import { describe, it, expect } from 'vitest';
import { extractInstagramHeaders } from '../src/background/instagram-auth';

describe('instagram-auth', () => {
  describe('extractInstagramHeaders', () => {
    it('extracts all Instagram headers from request', () => {
      const headers: chrome.webRequest.HttpHeader[] = [
        { name: 'Cookie', value: 'sessionid=abc; csrftoken=xyz' },
        { name: 'X-CSRFToken', value: 'csrf123' },
        { name: 'X-IG-App-ID', value: '936619743392459' },
        { name: 'Content-Type', value: 'application/json' },
      ];

      expect(extractInstagramHeaders(headers)).toEqual({
        cookie: 'sessionid=abc; csrftoken=xyz',
        csrf: 'csrf123',
        igAppId: '936619743392459',
      });
    });

    it('is case-insensitive for header names', () => {
      const headers: chrome.webRequest.HttpHeader[] = [
        { name: 'cookie', value: 'sid=123' },
        { name: 'x-csrftoken', value: 'csrf' },
        { name: 'x-ig-app-id', value: 'appid' },
      ];

      expect(extractInstagramHeaders(headers)).toEqual({
        cookie: 'sid=123',
        csrf: 'csrf',
        igAppId: 'appid',
      });
    });

    it('returns empty strings for missing headers', () => {
      expect(extractInstagramHeaders([])).toEqual({
        cookie: '',
        csrf: '',
        igAppId: '',
      });
    });
  });
});
