import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import api from './api';
import { toast } from 'react-hot-toast';

// Mock dependencies
jest.mock('axios');
jest.mock('react-hot-toast', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('API Service', () => {
  let localStorageMock: Record<string, string>;
  let locationMock: { href: string };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    localStorageMock = {};
    locationMock = { href: '' };

    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn((key: string) => localStorageMock[key] || null),
        setItem: jest.fn((key: string, value: string) => {
          localStorageMock[key] = value;
        }),
        removeItem: jest.fn((key: string) => {
          delete localStorageMock[key];
        }),
        clear: jest.fn(() => {
          localStorageMock = {};
        }),
      },
      writable: true,
    });

    // Mock window.location
    delete (window as any).location;
    window.location = locationMock as any;
  });

  describe('API Instance Creation', () => {
    it('creates axios instance with correct baseURL', () => {
      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: expect.any(String),
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );
    });

    it('uses default API URL when env variable is not set', () => {
      const originalEnv = process.env.NEXT_PUBLIC_API_URL;
      delete process.env.NEXT_PUBLIC_API_URL;

      // Re-import to test default value
      jest.resetModules();
      require('./api');

      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'http://localhost:3001/api',
        })
      );

      process.env.NEXT_PUBLIC_API_URL = originalEnv;
    });

    it('sets Content-Type header to application/json', () => {
      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );
    });
  });

  describe('Request Interceptor', () => {
    let requestInterceptor: any;

    beforeEach(() => {
      // Get the request interceptor function
      const mockInstance = {
        interceptors: {
          request: {
            use: jest.fn((fulfilled, rejected) => {
              requestInterceptor = { fulfilled, rejected };
            }),
          },
          response: {
            use: jest.fn(),
          },
        },
      };

      mockedAxios.create.mockReturnValue(mockInstance as any);
      jest.resetModules();
      require('./api');
    });

    it('adds authorization token from localStorage', () => {
      localStorageMock['token'] = 'mock-token-123';

      const config: Partial<InternalAxiosRequestConfig> = {
        headers: {} as any,
      };

      const result = requestInterceptor.fulfilled(config);

      expect(result.headers.Authorization).toBe('Bearer mock-token-123');
    });

    it('does not add authorization header if token is not present', () => {
      const config: Partial<InternalAxiosRequestConfig> = {
        headers: {} as any,
      };

      const result = requestInterceptor.fulfilled(config);

      expect(result.headers.Authorization).toBeUndefined();
    });

    it('returns config unchanged if headers are missing', () => {
      localStorageMock['token'] = 'mock-token-123';

      const config: Partial<InternalAxiosRequestConfig> = {};

      const result = requestInterceptor.fulfilled(config);

      // Should not crash, should return config
      expect(result).toBeDefined();
    });

    it('handles request error', async () => {
      const error = new Error('Request setup failed');

      try {
        await requestInterceptor.rejected(error);
      } catch (e) {
        expect(e).toBe(error);
      }
    });
  });

  describe('Response Interceptor - Success', () => {
    let responseInterceptor: any;

    beforeEach(() => {
      const mockInstance = {
        interceptors: {
          request: {
            use: jest.fn(),
          },
          response: {
            use: jest.fn((fulfilled, rejected) => {
              responseInterceptor = { fulfilled, rejected };
            }),
          },
        },
      };

      mockedAxios.create.mockReturnValue(mockInstance as any);
      jest.resetModules();
      require('./api');
    });

    it('returns response on successful request', () => {
      const mockResponse = {
        data: { success: true, data: { id: 1, name: 'Test' } },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      const result = responseInterceptor.fulfilled(mockResponse);

      expect(result).toBe(mockResponse);
      expect(toast.error).not.toHaveBeenCalled();
    });
  });

  describe('Response Interceptor - 401 Unauthorized', () => {
    let responseInterceptor: any;

    beforeEach(() => {
      const mockInstance = {
        interceptors: {
          request: {
            use: jest.fn(),
          },
          response: {
            use: jest.fn((fulfilled, rejected) => {
              responseInterceptor = { fulfilled, rejected };
            }),
          },
        },
      };

      mockedAxios.create.mockReturnValue(mockInstance as any);
      jest.resetModules();
      require('./api');
    });

    it('removes token from localStorage on 401', async () => {
      localStorageMock['token'] = 'expired-token';

      const error: Partial<AxiosError> = {
        response: {
          status: 401,
          data: {},
          statusText: 'Unauthorized',
          headers: {},
          config: {} as any,
        },
      };

      try {
        await responseInterceptor.rejected(error);
      } catch (e) {
        expect(window.localStorage.removeItem).toHaveBeenCalledWith('token');
      }
    });

    it('redirects to /login on 401', async () => {
      const error: Partial<AxiosError> = {
        response: {
          status: 401,
          data: {},
          statusText: 'Unauthorized',
          headers: {},
          config: {} as any,
        },
      };

      try {
        await responseInterceptor.rejected(error);
      } catch (e) {
        expect(window.location.href).toBe('/login');
      }
    });

    it('shows session expired toast on 401', async () => {
      const error: Partial<AxiosError> = {
        response: {
          status: 401,
          data: {},
          statusText: 'Unauthorized',
          headers: {},
          config: {} as any,
        },
      };

      try {
        await responseInterceptor.rejected(error);
      } catch (e) {
        expect(toast.error).toHaveBeenCalledWith('Session expired. Please login again.');
      }
    });

    it('rejects promise with error on 401', async () => {
      const error: Partial<AxiosError> = {
        response: {
          status: 401,
          data: {},
          statusText: 'Unauthorized',
          headers: {},
          config: {} as any,
        },
      };

      await expect(responseInterceptor.rejected(error)).rejects.toBe(error);
    });
  });

  describe('Response Interceptor - 403 Forbidden', () => {
    let responseInterceptor: any;

    beforeEach(() => {
      const mockInstance = {
        interceptors: {
          request: { use: jest.fn() },
          response: {
            use: jest.fn((fulfilled, rejected) => {
              responseInterceptor = { fulfilled, rejected };
            }),
          },
        },
      };

      mockedAxios.create.mockReturnValue(mockInstance as any);
      jest.resetModules();
      require('./api');
    });

    it('shows permission error toast on 403', async () => {
      const error: Partial<AxiosError> = {
        response: {
          status: 403,
          data: {},
          statusText: 'Forbidden',
          headers: {},
          config: {} as any,
        },
      };

      try {
        await responseInterceptor.rejected(error);
      } catch (e) {
        expect(toast.error).toHaveBeenCalledWith(
          'You do not have permission to perform this action.'
        );
      }
    });

    it('does not redirect on 403', async () => {
      const error: Partial<AxiosError> = {
        response: {
          status: 403,
          data: {},
          statusText: 'Forbidden',
          headers: {},
          config: {} as any,
        },
      };

      try {
        await responseInterceptor.rejected(error);
      } catch (e) {
        expect(window.location.href).toBe('');
      }
    });
  });

  describe('Response Interceptor - 404 Not Found', () => {
    let responseInterceptor: any;

    beforeEach(() => {
      const mockInstance = {
        interceptors: {
          request: { use: jest.fn() },
          response: {
            use: jest.fn((fulfilled, rejected) => {
              responseInterceptor = { fulfilled, rejected };
            }),
          },
        },
      };

      mockedAxios.create.mockReturnValue(mockInstance as any);
      jest.resetModules();
      require('./api');
    });

    it('shows not found error toast on 404', async () => {
      const error: Partial<AxiosError> = {
        response: {
          status: 404,
          data: {},
          statusText: 'Not Found',
          headers: {},
          config: {} as any,
        },
      };

      try {
        await responseInterceptor.rejected(error);
      } catch (e) {
        expect(toast.error).toHaveBeenCalledWith('Resource not found.');
      }
    });
  });

  describe('Response Interceptor - 500 Server Error', () => {
    let responseInterceptor: any;

    beforeEach(() => {
      const mockInstance = {
        interceptors: {
          request: { use: jest.fn() },
          response: {
            use: jest.fn((fulfilled, rejected) => {
              responseInterceptor = { fulfilled, rejected };
            }),
          },
        },
      };

      mockedAxios.create.mockReturnValue(mockInstance as any);
      jest.resetModules();
      require('./api');
    });

    it('shows server error toast on 500', async () => {
      const error: Partial<AxiosError> = {
        response: {
          status: 500,
          data: {},
          statusText: 'Internal Server Error',
          headers: {},
          config: {} as any,
        },
      };

      try {
        await responseInterceptor.rejected(error);
      } catch (e) {
        expect(toast.error).toHaveBeenCalledWith('Server error. Please try again later.');
      }
    });
  });

  describe('Response Interceptor - Other Errors', () => {
    let responseInterceptor: any;

    beforeEach(() => {
      const mockInstance = {
        interceptors: {
          request: { use: jest.fn() },
          response: {
            use: jest.fn((fulfilled, rejected) => {
              responseInterceptor = { fulfilled, rejected };
            }),
          },
        },
      };

      mockedAxios.create.mockReturnValue(mockInstance as any);
      jest.resetModules();
      require('./api');
    });

    it('does not show toast for other status codes', async () => {
      const error: Partial<AxiosError> = {
        response: {
          status: 400,
          data: {},
          statusText: 'Bad Request',
          headers: {},
          config: {} as any,
        },
      };

      try {
        await responseInterceptor.rejected(error);
      } catch (e) {
        expect(toast.error).not.toHaveBeenCalled();
      }
    });

    it('handles network errors without response', async () => {
      const error: Partial<AxiosError> = {
        message: 'Network Error',
        code: 'ERR_NETWORK',
      };

      try {
        await responseInterceptor.rejected(error);
      } catch (e) {
        expect(toast.error).not.toHaveBeenCalled();
        expect(e).toBe(error);
      }
    });
  });

  describe('API Methods Integration', () => {
    it('exports axios instance with interceptors', () => {
      expect(api).toBeDefined();
      expect(typeof api.get).toBe('function');
      expect(typeof api.post).toBe('function');
      expect(typeof api.put).toBe('function');
      expect(typeof api.delete).toBe('function');
      expect(typeof api.patch).toBe('function');
    });
  });

  describe('Edge Cases', () => {
    let responseInterceptor: any;

    beforeEach(() => {
      const mockInstance = {
        interceptors: {
          request: { use: jest.fn() },
          response: {
            use: jest.fn((fulfilled, rejected) => {
              responseInterceptor = { fulfilled, rejected };
            }),
          },
        },
      };

      mockedAxios.create.mockReturnValue(mockInstance as any);
      jest.resetModules();
      require('./api');
    });

    it('handles error without response object', async () => {
      const error = new Error('Unknown error');

      try {
        await responseInterceptor.rejected(error);
      } catch (e) {
        expect(toast.error).not.toHaveBeenCalled();
        expect(e).toBe(error);
      }
    });

    it('handles multiple 401 errors sequentially', async () => {
      const error: Partial<AxiosError> = {
        response: {
          status: 401,
          data: {},
          statusText: 'Unauthorized',
          headers: {},
          config: {} as any,
        },
      };

      try {
        await responseInterceptor.rejected(error);
      } catch (e) {
        // First 401
      }

      try {
        await responseInterceptor.rejected(error);
      } catch (e) {
        // Second 401 should also work
        expect(toast.error).toHaveBeenCalledTimes(2);
      }
    });
  });
});
