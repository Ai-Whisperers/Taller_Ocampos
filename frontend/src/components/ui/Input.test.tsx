import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from './input';

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
});
