import { describe, it, expect } from 'vitest';
import { resolveOrg } from '@/lib/orgResolution';

describe('resolveOrg', () => {
  describe('default-org hosts', () => {
    it('adalegallink.com root → adall', () => {
      expect(resolveOrg('adalegallink.com', '/')).toEqual({
        orgCode: 'adall',
        notFound: false,
      });
    });

    it('adalegallink.com with any path → adall', () => {
      expect(resolveOrg('adalegallink.com', '/class-actions')).toEqual({
        orgCode: 'adall',
        notFound: false,
      });
      expect(resolveOrg('adalegallink.com', '/admin')).toEqual({
        orgCode: 'adall',
        notFound: false,
      });
      expect(resolveOrg('adalegallink.com', '/guide/restrooms')).toEqual({
        orgCode: 'adall',
        notFound: false,
      });
    });

    it('vercel.app preview URL → adall', () => {
      expect(
        resolveOrg('ada-legal-git-main-rttg123-6107s-projects.vercel.app', '/'),
      ).toEqual({ orgCode: 'adall', notFound: false });
    });

    it('localhost → adall', () => {
      expect(resolveOrg('localhost:5173', '/')).toEqual({
        orgCode: 'adall',
        notFound: false,
      });
    });

    it('case-insensitive host', () => {
      expect(resolveOrg('AdaLegalLink.COM', '/')).toEqual({
        orgCode: 'adall',
        notFound: false,
      });
    });
  });

  describe('gov subdomain', () => {
    it('gov.adalegallink.com root → 404', () => {
      expect(resolveOrg('gov.adalegallink.com', '/')).toEqual({
        orgCode: null,
        notFound: true,
      });
    });

    it('gov.adalegallink.com/az-ag → az-ag', () => {
      expect(resolveOrg('gov.adalegallink.com', '/az-ag')).toEqual({
        orgCode: 'az-ag',
        notFound: false,
      });
    });

    it('gov.adalegallink.com/az-ag/anything → az-ag (only first segment matters)', () => {
      expect(resolveOrg('gov.adalegallink.com', '/az-ag/intake')).toEqual({
        orgCode: 'az-ag',
        notFound: false,
      });
    });

    it('gov.adalegallink.com/api → 404 (api is reserved)', () => {
      expect(resolveOrg('gov.adalegallink.com', '/api/health')).toEqual({
        orgCode: null,
        notFound: true,
      });
    });

    it('handles query strings and fragments', () => {
      expect(resolveOrg('gov.adalegallink.com', '/az-ag?foo=bar')).toEqual({
        orgCode: 'az-ag',
        notFound: false,
      });
      expect(resolveOrg('gov.adalegallink.com', '/az-ag#section')).toEqual({
        orgCode: 'az-ag',
        notFound: false,
      });
    });
  });
});
