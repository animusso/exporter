import { describe, it, expect } from 'vitest';
import { extractTweetIds, findNextCursor, buildExportResult } from '../src/background/twitter-bookmarks';

describe('twitter-bookmarks', () => {
  describe('extractTweetIds', () => {
    it('extracts IDs from tweet entries', () => {
      const entries = [
        { entryId: 'tweet-1234567890' },
        { entryId: 'tweet-9876543210' },
        { entryId: 'cursor-bottom-abc123', content: { value: 'abc123' } },
      ];

      expect(extractTweetIds(entries)).toEqual(['1234567890', '9876543210']);
    });

    it('returns empty array for no tweet entries', () => {
      const entries = [
        { entryId: 'cursor-bottom-abc', content: { value: 'abc' } },
        { entryId: 'cursor-top-xyz', content: { value: 'xyz' } },
      ];

      expect(extractTweetIds(entries)).toEqual([]);
    });

    it('handles empty entries', () => {
      expect(extractTweetIds([])).toEqual([]);
    });

    it('strips tweet- prefix correctly', () => {
      const entries = [{ entryId: 'tweet-12345' }];
      expect(extractTweetIds(entries)).toEqual(['12345']);
    });
  });

  describe('findNextCursor', () => {
    it('finds cursor-bottom entry value', () => {
      const entries = [
        { entryId: 'tweet-123' },
        { entryId: 'cursor-bottom-HBaWwLLlgfbC9SAAAA', content: { value: 'HBaWwLLlgfbC9SAAAA' } },
        { entryId: 'cursor-top-HBaWwLLlgfbD1SAAAA', content: { value: 'HBaWwLLlgfbD1SAAAA' } },
      ];

      expect(findNextCursor(entries)).toBe('HBaWwLLlgfbC9SAAAA');
    });

    it('returns null when no cursor-bottom entry', () => {
      const entries = [
        { entryId: 'tweet-123' },
        { entryId: 'tweet-456' },
      ];

      expect(findNextCursor(entries)).toBeNull();
    });

    it('returns null for empty entries', () => {
      expect(findNextCursor([])).toBeNull();
    });
  });

  describe('buildExportResult', () => {
    it('builds correct export format', () => {
      const ids = ['123', '456', '789'];
      const result = buildExportResult(ids);

      expect(result).toEqual({
        type: 'twitter',
        items: [
          { id: '123' },
          { id: '456' },
          { id: '789' },
        ],
      });
    });

    it('handles empty IDs', () => {
      expect(buildExportResult([])).toEqual({
        type: 'twitter',
        items: [],
      });
    });

    it('preserves ID strings as-is', () => {
      const result = buildExportResult(['1893456789012345678']);
      expect(result.items[0]?.id).toBe('1893456789012345678');
    });
  });
});
