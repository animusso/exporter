import { describe, it, expect } from 'vitest';
import { buildExportResult, extractPostUrl } from '../src/background/instagram-bookmarks';

describe('instagram-bookmarks', () => {
  describe('extractPostUrl', () => {
    it('builds URL from username and code', () => {
      const item = { media: { code: 'DS2jhe0jrWK', user: { username: 'arielyu.fit' } } };
      expect(extractPostUrl(item)).toBe('arielyu.fit/p/DS2jhe0jrWK');
    });

    it('returns null when code is missing', () => {
      const item = { media: { user: { username: 'testuser' } } };
      expect(extractPostUrl(item)).toBeNull();
    });

    it('returns null when username is missing', () => {
      const item = { media: { code: 'ABC123' } };
      expect(extractPostUrl(item)).toBeNull();
    });

    it('returns null when media is missing', () => {
      expect(extractPostUrl({})).toBeNull();
    });
  });

  describe('buildExportResult', () => {
    it('builds correct flat export format', () => {
      const urls = ['arielyu.fit/p/DS2jhe0jrWK', 'zeemallick/p/DTonFIMjDL3'];

      expect(buildExportResult(urls)).toEqual({
        type: 'instagram',
        items: [
          { url: 'arielyu.fit/p/DS2jhe0jrWK' },
          { url: 'zeemallick/p/DTonFIMjDL3' },
        ],
      });
    });

    it('handles empty list', () => {
      expect(buildExportResult([])).toEqual({
        type: 'instagram',
        items: [],
      });
    });

    it('handles single item', () => {
      expect(buildExportResult(['user/p/CODE'])).toEqual({
        type: 'instagram',
        items: [{ url: 'user/p/CODE' }],
      });
    });
  });
});
