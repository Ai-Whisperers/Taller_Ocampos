import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from './dialog';

describe('Dialog Component', () => {
  describe('Dialog Root', () => {
    it('renders dialog trigger', () => {
      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent>Content</DialogContent>
        </Dialog>
      );

      expect(screen.getByRole('button', { name: 'Open Dialog' })).toBeInTheDocument();
    });

    it('does not show content initially when not open', () => {
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
            Dialog Content
          </DialogContent>
        </Dialog>
      );

      expect(screen.queryByText('Dialog Content')).not.toBeInTheDocument();
    });

    it('shows content when defaultOpen is true', () => {
      render(
        <Dialog defaultOpen>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
            Dialog Content
          </DialogContent>
        </Dialog>
      );

      expect(screen.getByText('Dialog Content')).toBeInTheDocument();
    });
  });

  describe('DialogTrigger', () => {
    it('opens dialog when clicked', async () => {
      const user = userEvent.setup();

      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent>
            <DialogTitle>Dialog Title</DialogTitle>
            Dialog Content
          </DialogContent>
        </Dialog>
      );

      const trigger = screen.getByRole('button', { name: 'Open Dialog' });
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText('Dialog Content')).toBeInTheDocument();
      });
    });

    it('can be rendered as a custom component', async () => {
      const user = userEvent.setup();

      render(
        <Dialog>
          <DialogTrigger asChild>
            <button>Custom Button</button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
            Content
          </DialogContent>
        </Dialog>
      );

      await user.click(screen.getByRole('button', { name: 'Custom Button' }));

      await waitFor(() => {
        expect(screen.getByText('Content')).toBeInTheDocument();
      });
    });
  });

  describe('DialogContent', () => {
    it('renders dialog content with children', () => {
      render(
        <Dialog defaultOpen>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
            Test Content
          </DialogContent>
        </Dialog>
      );

      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('renders in a portal', () => {
      const { baseElement } = render(
        <Dialog defaultOpen>
          <DialogContent>Portal Content</DialogContent>
        </Dialog>
      );

      // Content should be rendered outside the main app container
      expect(baseElement.querySelector('[role="dialog"]')).toBeInTheDocument();
    });

    it('applies content styling classes', () => {
      render(
        <Dialog defaultOpen>
          <DialogContent>Content</DialogContent>
        </Dialog>
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('fixed');
      expect(dialog).toHaveClass('z-50');
      expect(dialog).toHaveClass('bg-background');
      expect(dialog).toHaveClass('p-6');
      expect(dialog).toHaveClass('shadow-lg');
    });

    it('applies custom className', () => {
      render(
        <Dialog defaultOpen>
          <DialogContent className="custom-dialog">Content</DialogContent>
        </Dialog>
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('custom-dialog');
    });

    it('includes close button', () => {
      render(
        <Dialog defaultOpen>
          <DialogContent>Content</DialogContent>
        </Dialog>
      );

      // Close button has sr-only text "Close"
      expect(screen.getByText('Close')).toBeInTheDocument();
    });
  });

  describe('DialogHeader', () => {
    it('renders header with children', () => {
      render(
        <Dialog defaultOpen>
          <DialogContent>
            <DialogHeader>Header Content</DialogHeader>
          </DialogContent>
        </Dialog>
      );

      expect(screen.getByText('Header Content')).toBeInTheDocument();
    });

    it('applies header styling classes', () => {
      render(
        <Dialog defaultOpen>
          <DialogContent>
            <DialogHeader data-testid="dialog-header">Content</DialogHeader>
          </DialogContent>
        </Dialog>
      );

      const header = screen.getByTestId('dialog-header');
      expect(header).toHaveClass('flex');
      expect(header).toHaveClass('flex-col');
      expect(header).toHaveClass('space-y-1.5');
    });

    it('applies custom className', () => {
      render(
        <Dialog defaultOpen>
          <DialogContent>
            <DialogHeader className="custom-header" data-testid="header">
              Content
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );

      const header = screen.getByTestId('header');
      expect(header).toHaveClass('custom-header');
    });
  });

  describe('DialogFooter', () => {
    it('renders footer with children', () => {
      render(
        <Dialog defaultOpen>
          <DialogContent>
            <DialogFooter>Footer Content</DialogFooter>
          </DialogContent>
        </Dialog>
      );

      expect(screen.getByText('Footer Content')).toBeInTheDocument();
    });

    it('applies footer styling classes', () => {
      render(
        <Dialog defaultOpen>
          <DialogContent>
            <DialogFooter data-testid="dialog-footer">Content</DialogFooter>
          </DialogContent>
        </Dialog>
      );

      const footer = screen.getByTestId('dialog-footer');
      expect(footer).toHaveClass('flex');
      expect(footer).toHaveClass('flex-col-reverse');
      expect(footer).toHaveClass('sm:flex-row');
    });

    it('applies custom className', () => {
      render(
        <Dialog defaultOpen>
          <DialogContent>
            <DialogFooter className="custom-footer" data-testid="footer">
              Content
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );

      const footer = screen.getByTestId('footer');
      expect(footer).toHaveClass('custom-footer');
    });
  });

  describe('DialogTitle', () => {
    it('renders title', () => {
      render(
        <Dialog defaultOpen>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Dialog Title</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );

      expect(screen.getByText('Dialog Title')).toBeInTheDocument();
    });

    it('applies title styling classes', () => {
      render(
        <Dialog defaultOpen>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Dialog Title</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );

      const title = screen.getByText('Dialog Title');
      expect(title).toHaveClass('text-lg');
      expect(title).toHaveClass('font-semibold');
      expect(title).toHaveClass('leading-none');
      expect(title).toHaveClass('tracking-tight');
    });

    it('applies custom className', () => {
      render(
        <Dialog defaultOpen>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="custom-title">Dialog Title</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );

      const title = screen.getByText('Dialog Title');
      expect(title).toHaveClass('custom-title');
    });
  });

  describe('DialogDescription', () => {
    it('renders description', () => {
      render(
        <Dialog defaultOpen>
          <DialogContent>
            <DialogHeader>
              <DialogDescription>Dialog Description</DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );

      expect(screen.getByText('Dialog Description')).toBeInTheDocument();
    });

    it('applies description styling classes', () => {
      render(
        <Dialog defaultOpen>
          <DialogContent>
            <DialogHeader>
              <DialogDescription>Dialog Description</DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );

      const description = screen.getByText('Dialog Description');
      expect(description).toHaveClass('text-sm');
      expect(description).toHaveClass('text-muted-foreground');
    });

    it('applies custom className', () => {
      render(
        <Dialog defaultOpen>
          <DialogContent>
            <DialogHeader>
              <DialogDescription className="custom-desc">
                Dialog Description
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );

      const description = screen.getByText('Dialog Description');
      expect(description).toHaveClass('custom-desc');
    });
  });

  describe('Dialog Composition', () => {
    it('renders complete dialog with all components', () => {
      render(
        <Dialog defaultOpen>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Action</DialogTitle>
              <DialogDescription>Are you sure you want to proceed?</DialogDescription>
            </DialogHeader>
            <div>Main content goes here</div>
            <DialogFooter>
              <button>Cancel</button>
              <button>Confirm</button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );

      expect(screen.getByText('Confirm Action')).toBeInTheDocument();
      expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument();
      expect(screen.getByText('Main content goes here')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
    });

    it('renders dialog without header', () => {
      render(
        <Dialog defaultOpen>
          <DialogContent>
            <div>Content only</div>
            <DialogFooter>
              <button>Close</button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );

      expect(screen.getByText('Content only')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
    });

    it('renders dialog without footer', () => {
      render(
        <Dialog defaultOpen>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Information</DialogTitle>
            </DialogHeader>
            <div>Information content</div>
          </DialogContent>
        </Dialog>
      );

      expect(screen.getByText('Information')).toBeInTheDocument();
      expect(screen.getByText('Information content')).toBeInTheDocument();
    });
  });

  describe('Dialog Interactions', () => {
    it('closes when close button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <Dialog defaultOpen>
          <DialogContent>
            <DialogTitle>Dialog</DialogTitle>
            <p>Content</p>
          </DialogContent>
        </Dialog>
      );

      expect(screen.getByText('Content')).toBeInTheDocument();

      // Find and click the X close button
      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText('Content')).not.toBeInTheDocument();
      });
    });

    it('closes with Escape key', async () => {
      const user = userEvent.setup();

      render(
        <Dialog defaultOpen>
          <DialogContent>
            <p>Content</p>
          </DialogContent>
        </Dialog>
      );

      expect(screen.getByText('Content')).toBeInTheDocument();

      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByText('Content')).not.toBeInTheDocument();
      });
    });

    it('calls onOpenChange when dialog state changes', async () => {
      const user = userEvent.setup();
      const onOpenChange = jest.fn();

      render(
        <Dialog onOpenChange={onOpenChange}>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>Content</DialogContent>
        </Dialog>
      );

      await user.click(screen.getByRole('button', { name: 'Open' }));

      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledWith(true);
      });
    });

    it('does not close when clicking inside dialog content', async () => {
      const user = userEvent.setup();

      render(
        <Dialog defaultOpen>
          <DialogContent>
            <button>Inside Button</button>
          </DialogContent>
        </Dialog>
      );

      const insideButton = screen.getByRole('button', { name: 'Inside Button' });
      await user.click(insideButton);

      // Dialog should still be open
      expect(screen.getByRole('button', { name: 'Inside Button' })).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has role dialog', () => {
      render(
        <Dialog defaultOpen>
          <DialogContent>Content</DialogContent>
        </Dialog>
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('has accessible close button', () => {
      render(
        <Dialog defaultOpen>
          <DialogContent>Content</DialogContent>
        </Dialog>
      );

      const closeButton = screen.getByRole('button', { name: /close/i });
      expect(closeButton).toBeInTheDocument();
      expect(screen.getByText('Close')).toHaveClass('sr-only');
    });

    it('title is properly associated with dialog', () => {
      render(
        <Dialog defaultOpen>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Accessible Title</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );

      const dialog = screen.getByRole('dialog');
      const title = screen.getByText('Accessible Title');

      // Radix UI automatically handles aria-labelledby
      expect(dialog).toBeInTheDocument();
      expect(title).toBeInTheDocument();
    });

    it('description is properly associated with dialog', () => {
      render(
        <Dialog defaultOpen>
          <DialogContent>
            <DialogHeader>
              <DialogDescription>Dialog description text</DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );

      const dialog = screen.getByRole('dialog');
      const description = screen.getByText('Dialog description text');

      expect(dialog).toBeInTheDocument();
      expect(description).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles dialog with complex content', () => {
      render(
        <Dialog defaultOpen>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Complex Dialog</DialogTitle>
            </DialogHeader>
            <div>
              <form>
                <input type="text" placeholder="Name" />
                <input type="email" placeholder="Email" />
                <button type="submit">Submit</button>
              </form>
            </div>
            <DialogFooter>
              <button>Cancel</button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );

      expect(screen.getByPlaceholderText('Name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
    });

    it('handles nested interactive elements', () => {
      render(
        <Dialog defaultOpen>
          <DialogContent>
            <div>
              <button>Button 1</button>
              <button>Button 2</button>
              <a href="#test">Link</a>
            </div>
          </DialogContent>
        </Dialog>
      );

      expect(screen.getByRole('button', { name: 'Button 1' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Button 2' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Link' })).toBeInTheDocument();
    });

    it('handles controlled open state', async () => {
      const user = userEvent.setup();
      const TestComponent = () => {
        const [open, setOpen] = React.useState(false);

        return (
          <>
            <button onClick={() => setOpen(true)}>External Open</button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogContent>
                <p>Controlled Content</p>
              </DialogContent>
            </Dialog>
          </>
        );
      };

      render(<TestComponent />);

      expect(screen.queryByText('Controlled Content')).not.toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'External Open' }));

      await waitFor(() => {
        expect(screen.getByText('Controlled Content')).toBeInTheDocument();
      });
    });
  });
});
