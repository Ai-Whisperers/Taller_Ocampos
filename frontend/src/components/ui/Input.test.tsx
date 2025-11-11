import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from './input';
import { expectNoA11yViolations } from '../../../tests/utils/accessibility-helpers';

describe('Input Component', () => {
  describe('Basic Rendering', () => {
    it('renders input element', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
      expect(input.tagName).toBe('INPUT');
    });

    it('renders with custom type', () => {
      const { rerender } = render(<Input type="email" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email');

      rerender(<Input type="password" />);
      const passwordInput = document.querySelector('input[type="password"]');
      expect(passwordInput).toBeInTheDocument();

      rerender(<Input type="number" />);
      expect(screen.getByRole('spinbutton')).toBeInTheDocument();
    });

    it('renders with placeholder', () => {
      render(<Input placeholder="Enter your name" />);
      expect(screen.getByPlaceholderText('Enter your name')).toBeInTheDocument();
    });

    it('renders with initial value', () => {
      render(<Input value="Initial value" onChange={() => {}} />);
      expect(screen.getByRole('textbox')).toHaveValue('Initial value');
    });
  });

  describe('User Interactions', () => {
    it('handles value changes via onChange', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();

      render(<Input onChange={handleChange} />);
      const input = screen.getByRole('textbox');

      await user.type(input, 'Hello');

      expect(handleChange).toHaveBeenCalled();
      expect(input).toHaveValue('Hello');
    });

    it('allows text input', async () => {
      const user = userEvent.setup();
      render(<Input />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'Test input');

      expect(input).toHaveValue('Test input');
    });

    it('triggers onFocus handler', async () => {
      const user = userEvent.setup();
      const handleFocus = jest.fn();

      render(<Input onFocus={handleFocus} />);
      const input = screen.getByRole('textbox');

      await user.click(input);

      expect(handleFocus).toHaveBeenCalledTimes(1);
    });

    it('triggers onBlur handler', async () => {
      const user = userEvent.setup();
      const handleBlur = jest.fn();

      render(<Input onBlur={handleBlur} />);
      const input = screen.getByRole('textbox');

      await user.click(input);
      await user.tab(); // Move focus away

      expect(handleBlur).toHaveBeenCalledTimes(1);
    });

    it('allows clearing input', async () => {
      const user = userEvent.setup();
      render(<Input />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'Text to clear');
      await user.clear(input);

      expect(input).toHaveValue('');
    });
  });

  describe('States and Attributes', () => {
    it('can be disabled', () => {
      render(<Input disabled />);
      expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('does not accept input when disabled', async () => {
      const user = userEvent.setup();
      render(<Input disabled />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'Should not type');

      expect(input).toHaveValue('');
    });

    it('can be readonly', () => {
      render(<Input readOnly value="Read only" />);
      const input = screen.getByRole('textbox');

      expect(input).toHaveAttribute('readonly');
      expect(input).toHaveValue('Read only');
    });

    it('can be required', () => {
      render(<Input required />);
      expect(screen.getByRole('textbox')).toBeRequired();
    });

    it('applies custom className', () => {
      render(<Input className="custom-class" />);
      expect(screen.getByRole('textbox')).toHaveClass('custom-class');
    });

    it('supports aria-label for accessibility', () => {
      render(<Input aria-label="Username input" />);
      expect(screen.getByLabelText('Username input')).toBeInTheDocument();
    });

    it('supports aria-describedby for error messages', () => {
      render(
        <>
          <Input aria-describedby="error-message" />
          <span id="error-message">This field is required</span>
        </>
      );

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-describedby', 'error-message');
    });

    it('accepts max length attribute', () => {
      render(<Input maxLength={10} />);
      expect(screen.getByRole('textbox')).toHaveAttribute('maxLength', '10');
    });

    it('accepts min and max for number inputs', () => {
      render(<Input type="number" min={0} max={100} />);
      const input = screen.getByRole('spinbutton');

      expect(input).toHaveAttribute('min', '0');
      expect(input).toHaveAttribute('max', '100');
    });
  });

  describe('Autocomplete and Form Integration', () => {
    it('supports autocomplete attribute', () => {
      render(<Input autoComplete="email" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('autocomplete', 'email');
    });

    it('supports name attribute for form submission', () => {
      render(<Input name="username" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('name', 'username');
    });

    it('supports id attribute', () => {
      render(<Input id="email-input" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('id', 'email-input');
    });
  });

  describe('Error States', () => {
    it('applies error styling when aria-invalid is true', () => {
      render(<Input aria-invalid="true" />);
      const input = screen.getByRole('textbox');

      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('works with form validation', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <form>
          <Input type="email" required />
          <button type="submit">Submit</button>
        </form>
      );

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      // HTML5 validation should prevent submission
      const input = screen.getByRole('textbox');
      expect(input).toBeInvalid();
    });
  });

  describe('Keyboard Navigation', () => {
    it('focuses input via Tab key', async () => {
      const user = userEvent.setup();
      render(
        <>
          <button>Previous</button>
          <Input />
        </>
      );

      await user.tab();
      expect(screen.getByRole('button')).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('textbox')).toHaveFocus();
    });

    it('allows Enter key in form', async () => {
      const user = userEvent.setup();
      const handleSubmit = jest.fn((e) => e.preventDefault());

      render(
        <form onSubmit={handleSubmit}>
          <Input />
          <button type="submit">Submit</button>
        </form>
      );

      const input = screen.getByRole('textbox');
      await user.type(input, 'test{Enter}');

      expect(handleSubmit).toHaveBeenCalled();
    });
  });

  describe('Different Input Types', () => {
    it('renders search input', () => {
      render(<Input type="search" />);
      const input = screen.getByRole('searchbox');
      expect(input).toBeInTheDocument();
    });

    it('renders tel input', () => {
      render(<Input type="tel" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'tel');
    });

    it('renders url input', () => {
      render(<Input type="url" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'url');
    });
  });

  describe('Performance and Edge Cases', () => {
    it('handles rapid input changes', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();

      render(<Input onChange={handleChange} />);
      const input = screen.getByRole('textbox');

      await user.type(input, 'FastTyping', { delay: 1 });

      expect(handleChange).toHaveBeenCalled();
      expect(input).toHaveValue('FastTyping');
    });

    it('handles special characters', async () => {
      const user = userEvent.setup();
      render(<Input />);

      const input = screen.getByRole('textbox');
      // Use paste for special characters to avoid userEvent parsing issues
      await user.click(input);
      await user.paste('!@#$%^&*()_+-=');

      expect(input).toHaveValue('!@#$%^&*()_+-=');
    });

    it('handles emoji input', async () => {
      const user = userEvent.setup();
      render(<Input />);

      const input = screen.getByRole('textbox');
      await user.type(input, '👍🎉🚀');

      expect(input).toHaveValue('👍🎉🚀');
    });
  });

  describe('Accessibility (WCAG 2.1 AA)', () => {
    it('should have no accessibility violations (basic input)', async () => {
      const { container } = render(
        <label>
          Username
          <Input />
        </label>
      );
      await expectNoA11yViolations(container);
    });

    it('should have no accessibility violations with aria-label', async () => {
      const { container } = render(<Input aria-label="Search" />);
      await expectNoA11yViolations(container);
    });

    it('should have no accessibility violations when disabled', async () => {
      const { container } = render(
        <label>
          Disabled Field
          <Input disabled />
        </label>
      );
      await expectNoA11yViolations(container);
    });

    it('should have no accessibility violations when required', async () => {
      const { container } = render(
        <label>
          Email (required)
          <Input type="email" required aria-label="Email address" />
        </label>
      );
      await expectNoA11yViolations(container);
    });

    it('should have no accessibility violations with error state', async () => {
      const { container } = render(
        <>
          <label htmlFor="error-input">Email</label>
          <Input
            id="error-input"
            type="email"
            aria-invalid="true"
            aria-describedby="error-message"
          />
          <span id="error-message">Please enter a valid email</span>
        </>
      );
      await expectNoA11yViolations(container);
    });

    it('should work with associated label element', async () => {
      const { container } = render(
        <>
          <label htmlFor="username-input">Username</label>
          <Input id="username-input" />
        </>
      );

      const input = screen.getByLabelText('Username');
      expect(input).toBeInTheDocument();

      await expectNoA11yViolations(container);
    });

    it('should have no violations for all input types', async () => {
      const types = ['text', 'email', 'password', 'tel', 'url', 'search'] as const;

      for (const type of types) {
        const { container } = render(
          <label>
            {type} input
            <Input type={type} />
          </label>
        );
        await expectNoA11yViolations(container);
      }
    });

    it('should maintain accessibility with placeholder', async () => {
      const { container } = render(
        <label>
          Search
          <Input placeholder="Enter search term..." />
        </label>
      );

      // Placeholder should not be sole accessibility label
      const input = screen.getByPlaceholderText('Enter search term...');
      expect(input).toBeInTheDocument();

      await expectNoA11yViolations(container);
    });

    it('should support screen reader hints with aria-describedby', async () => {
      const { container } = render(
        <>
          <label htmlFor="password-input">Password</label>
          <Input
            id="password-input"
            type="password"
            aria-describedby="password-hint"
          />
          <div id="password-hint">Must be at least 8 characters</div>
        </>
      );

      const input = screen.getByLabelText('Password');
      expect(input).toHaveAttribute('aria-describedby', 'password-hint');

      await expectNoA11yViolations(container);
    });

    it('should be accessible in form context', async () => {
      const { container } = render(
        <form>
          <label htmlFor="name">Name</label>
          <Input id="name" required />

          <label htmlFor="email">Email</label>
          <Input id="email" type="email" required />

          <button type="submit">Submit</button>
        </form>
      );

      await expectNoA11yViolations(container);
    });
  });
});
