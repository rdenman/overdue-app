import React from 'react';
import { render, fireEvent, screen, waitFor } from '../helpers/test-utils';
import { EmailVerificationBanner } from '@/components/email-verification-banner';
import { useAuth } from '@/lib/hooks/use-auth';
import { resendVerificationEmail } from '@/lib/services/auth-service';

jest.mock('@/lib/services/auth-service', () => ({
  resendVerificationEmail: jest.fn().mockResolvedValue(undefined),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('EmailVerificationBanner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null when user is null', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false, isAuthenticated: false });
    const { toJSON } = render(<EmailVerificationBanner />);
    expect(toJSON()).toBeNull();
  });

  it('returns null when user email is verified', () => {
    mockUseAuth.mockReturnValue({
      user: { emailVerified: true } as any,
      loading: false,
      isAuthenticated: true,
    });
    const { toJSON } = render(<EmailVerificationBanner />);
    expect(toJSON()).toBeNull();
  });

  it('renders banner when user email is not verified', () => {
    mockUseAuth.mockReturnValue({
      user: { emailVerified: false } as any,
      loading: false,
      isAuthenticated: true,
    });
    render(<EmailVerificationBanner />);
    expect(screen.getByText(/verify your email/i)).toBeTruthy();
  });

  it('renders Resend Email button', () => {
    mockUseAuth.mockReturnValue({
      user: { emailVerified: false } as any,
      loading: false,
      isAuthenticated: true,
    });
    render(<EmailVerificationBanner />);
    expect(screen.getByText('Resend Email')).toBeTruthy();
  });

  it('calls resendVerificationEmail when button is pressed', async () => {
    mockUseAuth.mockReturnValue({
      user: { emailVerified: false } as any,
      loading: false,
      isAuthenticated: true,
    });
    render(<EmailVerificationBanner />);

    fireEvent.press(screen.getByText('Resend Email'));

    await waitFor(() => {
      expect(resendVerificationEmail).toHaveBeenCalledTimes(1);
    });
  });
});
