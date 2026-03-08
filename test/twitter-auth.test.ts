import { describe, it, expect } from 'vitest';
import { extractApiIdFromUrl, extractHeaders } from '../src/background/twitter-auth';

describe('twitter-auth', () => {
  describe('extractApiIdFromUrl', () => {
    it('extracts API ID from bookmarks URL', () => {
      const url = 'https://x.com/i/api/graphql/abc123XYZ/Bookmarks?features=...';
      expect(extractApiIdFromUrl(url)).toBe('abc123XYZ');
    });

    it('returns null for non-bookmarks URL', () => {
      expect(extractApiIdFromUrl('https://x.com/home')).toBeNull();
      expect(extractApiIdFromUrl('https://x.com/i/api/graphql/abc/Timeline')).toBeNull();
    });

    it('returns null for non-x.com URL', () => {
      expect(extractApiIdFromUrl('https://example.com/graphql/abc/Bookmarks?')).toBeNull();
    });

    it('handles complex API IDs', () => {
      const url = 'https://x.com/i/api/graphql/R-nG_k7_VNzo6sR7oVRGWQ/Bookmarks?features=%7B%7D';
      expect(extractApiIdFromUrl(url)).toBe('R-nG_k7_VNzo6sR7oVRGWQ');
    });
  });

  describe('extractHeaders', () => {
    it('extracts auth, cookie, and csrf from request headers', () => {
      const headers: chrome.webRequest.HttpHeader[] = [
        { name: 'Authorization', value: 'Bearer token123' },
        { name: 'Cookie', value: 'session=abc' },
        { name: 'X-Csrf-Token', value: 'csrf456' },
        { name: 'Content-Type', value: 'application/json' },
      ];

      expect(extractHeaders(headers)).toEqual({
        auth: 'Bearer token123',
        cookie: 'session=abc',
        csrf: 'csrf456',
      });
    });

    it('is case-insensitive for header names', () => {
      const headers: chrome.webRequest.HttpHeader[] = [
        { name: 'authorization', value: 'Bearer token' },
        { name: 'cookie', value: 'sid=123' },
        { name: 'x-csrf-token', value: 'csrf789' },
      ];

      expect(extractHeaders(headers)).toEqual({
        auth: 'Bearer token',
        cookie: 'sid=123',
        csrf: 'csrf789',
      });
    });

    it('returns empty strings for missing headers', () => {
      expect(extractHeaders([])).toEqual({
        auth: '',
        cookie: '',
        csrf: '',
      });
    });
  });
});
