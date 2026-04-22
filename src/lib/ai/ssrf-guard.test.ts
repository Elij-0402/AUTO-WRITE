import { describe, it, expect } from 'vitest'
import { validateURLForSSRF, SSRFError } from './ssrf-guard'

describe('ssrf-guard', () => {
  describe('validateURLForSSRF', () => {
    it('allows https://api.anthropic.com', () => {
      expect(() => validateURLForSSRF('https://api.anthropic.com')).not.toThrow()
    })

    it('allows https://api.deepseek.com', () => {
      expect(() => validateURLForSSRF('https://api.deepseek.com')).not.toThrow()
    })

    it('blocks http://localhost', () => {
      expect(() => validateURLForSSRF('http://localhost')).toThrow(SSRFError)
    })

    it('blocks http://127.0.0.1', () => {
      expect(() => validateURLForSSRF('http://127.0.0.1')).toThrow(SSRFError)
    })

    it('blocks http://169.254.169.254 (AWS metadata)', () => {
      expect(() => validateURLForSSRF('http://169.254.169.254/latest/meta-data/')).toThrow(SSRFError)
    })

    it('blocks http://169.254.0.0/16 range', () => {
      expect(() => validateURLForSSRF('http://169.254.12.34')).toThrow(SSRFError)
    })

    it('blocks 10.x.x.x private range', () => {
      expect(() => validateURLForSSRF('http://10.0.0.1')).toThrow(SSRFError)
      expect(() => validateURLForSSRF('http://10.255.255.255')).toThrow(SSRFError)
    })

    it('blocks 172.16-31.x.x private range', () => {
      expect(() => validateURLForSSRF('http://172.16.0.1')).toThrow(SSRFError)
      expect(() => validateURLForSSRF('http://172.31.255.255')).toThrow(SSRFError)
    })

    it('blocks 192.168.x.x private range', () => {
      expect(() => validateURLForSSRF('http://192.168.0.1')).toThrow(SSRFError)
      expect(() => validateURLForSSRF('http://192.168.255.255')).toThrow(SSRFError)
    })

    it('blocks file:// scheme', () => {
      expect(() => validateURLForSSRF('file:///etc/passwd')).toThrow(SSRFError)
    })

    it('blocks ftp:// scheme', () => {
      expect(() => validateURLForSSRF('ftp://ftp.example.com')).toThrow(SSRFError)
    })

    it('throws SSRFError with hostname for blocked URLs', () => {
      try {
        validateURLForSSRF('http://169.254.169.254')
      } catch (e) {
        expect(e).toBeInstanceOf(SSRFError)
        expect((e as SSRFError).message).toContain('169.254.169.254')
      }
    })
  })
})