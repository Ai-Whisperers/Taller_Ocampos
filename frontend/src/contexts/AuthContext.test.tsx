import { renderHook, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';
import { ReactNode } from 'react';

// Mock next/navigation
const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}));

// Mock api
jest.mock('@/lib/api');

// Mock toast
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('AuthContext - API Calls', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    mockPush.mockClear();
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  describe('checkAuth - GET /auth/me', () => {
    it('should check authentication on mount when token exists', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
      };

      localStorageMock.setItem('token', 'mock-token');
      (api.get as jest.Mock).mockResolvedValueOnce({
        data: { data: mockUser },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(api.get).toHaveBeenCalledWith('/auth/me');
      expect(result.current.user).toEqual(mockUser);
    });

    it('should not check authentication when no token exists', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(api.get).not.toHaveBeenCalled();
      expect(result.current.user).toBeNull();
    });

    it('should remove token when checkAuth fails', async () => {
      localStorageMock.setItem('token', 'invalid-token');
      (api.get as jest.Mock).mockRejectedValueOnce(new Error('Unauthorized'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(localStorageMock.getItem('token')).toBeNull();
      expect(result.current.user).toBeNull();
    });

    it('should handle network errors during checkAuth', async () => {
      localStorageMock.setItem('token', 'mock-token');
      (api.get as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toBeNull();
    });
  });

  describe('login - POST /auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const mockResponse = {
        data: {
          data: {
            user: {
              id: '1',
              email: 'admin@test.com',
              name: 'Admin User',
              role: 'admin',
            },
            token: 'mock-jwt-token',
          },
        },
      };

      (api.post as jest.Mock).mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.login('admin@test.com', 'password123');
      });

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/auth/login', {
          email: 'admin@test.com',
          password: 'password123',
        });
      });

      expect(localStorageMock.getItem('token')).toBe('mock-jwt-token');
      expect(result.current.user).toEqual(mockResponse.data.data.user);
      expect(toast.success).toHaveBeenCalledWith('Login successful!');
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });

    it('should handle login failure with invalid credentials', async () => {
      const mockError = {
        response: {
          data: {
            message: 'Invalid email or password',
          },
        },
      };

      (api.post as jest.Mock).mockRejectedValueOnce(mockError);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await expect(
          result.current.login('wrong@test.com', 'wrongpassword')
        ).rejects.toEqual(mockError);
      });

      expect(toast.error).toHaveBeenCalledWith('Invalid email or password');
      expect(localStorageMock.getItem('token')).toBeNull();
      expect(result.current.user).toBeNull();
    });

    it('should handle login with network error', async () => {
      const mockError = new Error('Network error');

      (api.post as jest.Mock).mockRejectedValueOnce(mockError);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await expect(
          result.current.login('admin@test.com', 'password123')
        ).rejects.toEqual(mockError);
      });

      expect(toast.error).toHaveBeenCalledWith('Login failed');
      expect(result.current.user).toBeNull();
    });

    it('should handle login with custom error message', async () => {
      const mockError = {
        response: {
          data: {
            message: 'Account is locked',
          },
        },
      };

      (api.post as jest.Mock).mockRejectedValueOnce(mockError);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await expect(
          result.current.login('admin@test.com', 'password123')
        ).rejects.toEqual(mockError);
      });

      expect(toast.error).toHaveBeenCalledWith('Account is locked');
    });

    it('should store token and user data after successful login', async () => {
      const mockResponse = {
        data: {
          data: {
            user: {
              id: '2',
              email: 'user@test.com',
              name: 'Regular User',
              role: 'user',
              phone: '0991234567',
            },
            token: 'user-jwt-token',
          },
        },
      };

      (api.post as jest.Mock).mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.login('user@test.com', 'password123');
      });

      await waitFor(() => {
        expect(localStorageMock.getItem('token')).toBe('user-jwt-token');
        expect(result.current.user).toEqual(mockResponse.data.data.user);
      });
    });
  });

  describe('register - POST /auth/register', () => {
    it('should register successfully with valid data', async () => {
      const mockResponse = {
        data: {
          data: {
            user: {
              id: '3',
              email: 'newuser@test.com',
              name: 'New User',
              role: 'user',
              phone: '0991234567',
            },
            token: 'new-user-jwt-token',
          },
        },
      };

      (api.post as jest.Mock).mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const registerData = {
        email: 'newuser@test.com',
        password: 'password123',
        name: 'New User',
        phone: '0991234567',
      };

      await act(async () => {
        await result.current.register(registerData);
      });

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/auth/register', registerData);
      });

      expect(localStorageMock.getItem('token')).toBe('new-user-jwt-token');
      expect(result.current.user).toEqual(mockResponse.data.data.user);
      expect(toast.success).toHaveBeenCalledWith('Registration successful!');
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });

    it('should handle registration failure with existing email', async () => {
      const mockError = {
        response: {
          data: {
            message: 'Email already exists',
          },
        },
      };

      (api.post as jest.Mock).mockRejectedValueOnce(mockError);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const registerData = {
        email: 'existing@test.com',
        password: 'password123',
        name: 'Test User',
      };

      await act(async () => {
        await expect(result.current.register(registerData)).rejects.toEqual(mockError);
      });

      expect(toast.error).toHaveBeenCalledWith('Email already exists');
      expect(localStorageMock.getItem('token')).toBeNull();
      expect(result.current.user).toBeNull();
    });

    it('should handle registration with network error', async () => {
      const mockError = new Error('Network error');

      (api.post as jest.Mock).mockRejectedValueOnce(mockError);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const registerData = {
        email: 'newuser@test.com',
        password: 'password123',
        name: 'New User',
      };

      await act(async () => {
        await expect(result.current.register(registerData)).rejects.toEqual(mockError);
      });

      expect(toast.error).toHaveBeenCalledWith('Registration failed');
      expect(result.current.user).toBeNull();
    });

    it('should register with optional phone number', async () => {
      const mockResponse = {
        data: {
          data: {
            user: {
              id: '4',
              email: 'user@test.com',
              name: 'User Without Phone',
              role: 'user',
            },
            token: 'user-token',
          },
        },
      };

      (api.post as jest.Mock).mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const registerData = {
        email: 'user@test.com',
        password: 'password123',
        name: 'User Without Phone',
      };

      await act(async () => {
        await result.current.register(registerData);
      });

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/auth/register', registerData);
        expect(result.current.user).toEqual(mockResponse.data.data.user);
      });
    });
  });

  describe('logout', () => {
    it('should logout and clear user data', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
      };

      localStorageMock.setItem('token', 'mock-token');
      (api.get as jest.Mock).mockResolvedValueOnce({
        data: { data: mockUser },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      act(() => {
        result.current.logout();
      });

      expect(localStorageMock.getItem('token')).toBeNull();
      expect(result.current.user).toBeNull();
      expect(mockPush).toHaveBeenCalledWith('/login');
      expect(toast.success).toHaveBeenCalledWith('Logged out successfully');
    });

    it('should handle logout when not logged in', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      act(() => {
        result.current.logout();
      });

      expect(localStorageMock.getItem('token')).toBeNull();
      expect(result.current.user).toBeNull();
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  describe('updateUser', () => {
    it('should update user data', async () => {
      const initialUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
      };

      localStorageMock.setItem('token', 'mock-token');
      (api.get as jest.Mock).mockResolvedValueOnce({
        data: { data: initialUser },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.user).toEqual(initialUser);
      });

      const updatedUser = {
        ...initialUser,
        name: 'Updated Name',
        phone: '0991234567',
      };

      act(() => {
        result.current.updateUser(updatedUser);
      });

      expect(result.current.user).toEqual(updatedUser);
    });

    it('should handle updating user with partial data', async () => {
      const initialUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
      };

      localStorageMock.setItem('token', 'mock-token');
      (api.get as jest.Mock).mockResolvedValueOnce({
        data: { data: initialUser },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.user).toEqual(initialUser);
      });

      const updatedUser = {
        ...initialUser,
        phone: '0991234567',
      };

      act(() => {
        result.current.updateUser(updatedUser);
      });

      expect(result.current.user).toEqual(updatedUser);
      expect(result.current.user?.phone).toBe('0991234567');
    });
  });

  describe('Context provider', () => {
    it('should throw error when useAuth is used outside AuthProvider', () => {
      // Suppress console.error for this test
      const originalError = console.error;
      console.error = jest.fn();

      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');

      console.error = originalError;
    });
  });

  describe('Loading state', () => {
    it('should set loading to true during initial authentication check', () => {
      localStorageMock.setItem('token', 'mock-token');
      (api.get as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.loading).toBe(true);
    });

    it('should set loading to false after authentication check completes', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
      };

      localStorageMock.setItem('token', 'mock-token');
      (api.get as jest.Mock).mockResolvedValueOnce({
        data: { data: mockUser },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should set loading to false when no token exists', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('Edge Cases - Malformed Responses', () => {
    it('should handle login response with missing user data gracefully', async () => {
      const mockResponse = {
        data: {
          data: {
            token: 'mock-jwt-token',
            // Missing user object
          },
        },
      };

      (api.post as jest.Mock).mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.login('admin@test.com', 'password123');
      });

      await waitFor(() => {
        // Should still redirect even if user is undefined
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('should handle error with empty response data', async () => {
      const mockError = {
        response: {
          data: {},
        },
      };

      (api.post as jest.Mock).mockRejectedValueOnce(mockError);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await expect(
          result.current.register({
            email: 'user@test.com',
            password: 'password123',
            name: 'Test User',
          })
        ).rejects.toEqual(mockError);
      });

      expect(toast.error).toHaveBeenCalledWith('Registration failed');
    });
  });

  describe('Role-Based User Scenarios', () => {
    it('should handle admin user login', async () => {
      const mockResponse = {
        data: {
          data: {
            user: {
              id: '1',
              email: 'admin@test.com',
              name: 'Admin User',
              role: 'admin',
            },
            token: 'admin-jwt-token',
          },
        },
      };

      (api.post as jest.Mock).mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.login('admin@test.com', 'password123');
      });

      expect(result.current.user?.role).toBe('admin');
    });

    it('should handle mechanic user login', async () => {
      const mockResponse = {
        data: {
          data: {
            user: {
              id: '2',
              email: 'mechanic@test.com',
              name: 'Mechanic User',
              role: 'mechanic',
            },
            token: 'mechanic-jwt-token',
          },
        },
      };

      (api.post as jest.Mock).mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.login('mechanic@test.com', 'password123');
      });

      expect(result.current.user?.role).toBe('mechanic');
    });

    it('should handle receptionist user login', async () => {
      const mockResponse = {
        data: {
          data: {
            user: {
              id: '3',
              email: 'receptionist@test.com',
              name: 'Receptionist User',
              role: 'receptionist',
            },
            token: 'receptionist-jwt-token',
          },
        },
      };

      (api.post as jest.Mock).mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.login('receptionist@test.com', 'password123');
      });

      expect(result.current.user?.role).toBe('receptionist');
    });

    it('should handle user with all optional fields', async () => {
      const mockResponse = {
        data: {
          data: {
            user: {
              id: '4',
              email: 'fulluser@test.com',
              name: 'Full User',
              role: 'user',
              phone: '0991234567',
            },
            token: 'full-user-jwt-token',
          },
        },
      };

      (api.post as jest.Mock).mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.login('fulluser@test.com', 'password123');
      });

      expect(result.current.user).toEqual(mockResponse.data.data.user);
      expect(result.current.user?.phone).toBe('0991234567');
    });
  });

  describe('Integration Flows', () => {
    it('should handle failed login followed by successful login', async () => {
      const mockError = {
        response: {
          data: {
            message: 'Invalid credentials',
          },
        },
      };

      const mockSuccess = {
        data: {
          data: {
            user: {
              id: '1',
              email: 'user@test.com',
              name: 'Test User',
              role: 'user',
            },
            token: 'jwt-token',
          },
        },
      };

      (api.post as jest.Mock)
        .mockRejectedValueOnce(mockError)
        .mockResolvedValueOnce(mockSuccess);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => expect(result.current.loading).toBe(false));

      // Failed login
      await act(async () => {
        await expect(
          result.current.login('user@test.com', 'wrongpassword')
        ).rejects.toEqual(mockError);
      });

      expect(result.current.user).toBeNull();
      expect(toast.error).toHaveBeenCalledWith('Invalid credentials');

      // Successful login
      await act(async () => {
        await result.current.login('user@test.com', 'password123');
      });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockSuccess.data.data.user);
      });
      expect(toast.success).toHaveBeenCalledWith('Login successful!');
    });
  });
});