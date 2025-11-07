import { render, screen } from '@testing-library/react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from './card';

describe('Card Component', () => {
  describe('Card', () => {
    it('renders card with children', () => {
      render(<Card>Card content</Card>);
      expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(<Card className="custom-class">Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('custom-class');
    });

    it('applies default card styling classes', () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('rounded-lg');
      expect(card).toHaveClass('border');
      expect(card).toHaveClass('bg-card');
      expect(card).toHaveClass('shadow-sm');
    });

    it('renders as div element', () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card.tagName).toBe('DIV');
    });

    it('forwards ref correctly', () => {
      const ref = jest.fn();
      render(<Card ref={ref}>Content</Card>);
      expect(ref).toHaveBeenCalled();
    });

    it('passes through HTML attributes', () => {
      render(
        <Card data-testid="test-card" aria-label="Test card">
          Content
        </Card>
      );
      const card = screen.getByTestId('test-card');
      expect(card).toHaveAttribute('aria-label', 'Test card');
    });
  });

  describe('CardHeader', () => {
    it('renders header with children', () => {
      render(<CardHeader>Header content</CardHeader>);
      expect(screen.getByText('Header content')).toBeInTheDocument();
    });

    it('applies header styling classes', () => {
      const { container } = render(<CardHeader>Content</CardHeader>);
      const header = container.firstChild as HTMLElement;
      expect(header).toHaveClass('flex');
      expect(header).toHaveClass('flex-col');
      expect(header).toHaveClass('space-y-1.5');
      expect(header).toHaveClass('p-6');
    });

    it('applies custom className', () => {
      const { container } = render(
        <CardHeader className="custom-header">Content</CardHeader>
      );
      const header = container.firstChild as HTMLElement;
      expect(header).toHaveClass('custom-header');
    });

    it('forwards ref correctly', () => {
      const ref = jest.fn();
      render(<CardHeader ref={ref}>Content</CardHeader>);
      expect(ref).toHaveBeenCalled();
    });
  });

  describe('CardTitle', () => {
    it('renders title as h3 element', () => {
      render(<CardTitle>Test Title</CardTitle>);
      const title = screen.getByText('Test Title');
      expect(title.tagName).toBe('H3');
    });

    it('applies title styling classes', () => {
      render(<CardTitle>Test Title</CardTitle>);
      const title = screen.getByText('Test Title');
      expect(title).toHaveClass('text-2xl');
      expect(title).toHaveClass('font-semibold');
      expect(title).toHaveClass('leading-none');
      expect(title).toHaveClass('tracking-tight');
    });

    it('applies custom className', () => {
      render(<CardTitle className="custom-title">Test Title</CardTitle>);
      const title = screen.getByText('Test Title');
      expect(title).toHaveClass('custom-title');
    });

    it('forwards ref correctly', () => {
      const ref = jest.fn();
      render(<CardTitle ref={ref}>Content</CardTitle>);
      expect(ref).toHaveBeenCalled();
    });

    it('supports children of different types', () => {
      render(
        <CardTitle>
          <span>Part 1</span>
          <span>Part 2</span>
        </CardTitle>
      );
      expect(screen.getByText('Part 1')).toBeInTheDocument();
      expect(screen.getByText('Part 2')).toBeInTheDocument();
    });
  });

  describe('CardDescription', () => {
    it('renders description as p element', () => {
      render(<CardDescription>Test description</CardDescription>);
      const description = screen.getByText('Test description');
      expect(description.tagName).toBe('P');
    });

    it('applies description styling classes', () => {
      render(<CardDescription>Test description</CardDescription>);
      const description = screen.getByText('Test description');
      expect(description).toHaveClass('text-sm');
      expect(description).toHaveClass('text-muted-foreground');
    });

    it('applies custom className', () => {
      render(
        <CardDescription className="custom-desc">Test description</CardDescription>
      );
      const description = screen.getByText('Test description');
      expect(description).toHaveClass('custom-desc');
    });

    it('forwards ref correctly', () => {
      const ref = jest.fn();
      render(<CardDescription ref={ref}>Content</CardDescription>);
      expect(ref).toHaveBeenCalled();
    });
  });

  describe('CardContent', () => {
    it('renders content with children', () => {
      render(<CardContent>Content body</CardContent>);
      expect(screen.getByText('Content body')).toBeInTheDocument();
    });

    it('applies content styling classes', () => {
      const { container } = render(<CardContent>Content</CardContent>);
      const content = container.firstChild as HTMLElement;
      expect(content).toHaveClass('p-6');
      expect(content).toHaveClass('pt-0');
    });

    it('applies custom className', () => {
      const { container } = render(
        <CardContent className="custom-content">Content</CardContent>
      );
      const content = container.firstChild as HTMLElement;
      expect(content).toHaveClass('custom-content');
    });

    it('forwards ref correctly', () => {
      const ref = jest.fn();
      render(<CardContent ref={ref}>Content</CardContent>);
      expect(ref).toHaveBeenCalled();
    });
  });

  describe('CardFooter', () => {
    it('renders footer with children', () => {
      render(<CardFooter>Footer content</CardFooter>);
      expect(screen.getByText('Footer content')).toBeInTheDocument();
    });

    it('applies footer styling classes', () => {
      const { container } = render(<CardFooter>Content</CardFooter>);
      const footer = container.firstChild as HTMLElement;
      expect(footer).toHaveClass('flex');
      expect(footer).toHaveClass('items-center');
      expect(footer).toHaveClass('p-6');
      expect(footer).toHaveClass('pt-0');
    });

    it('applies custom className', () => {
      const { container } = render(
        <CardFooter className="custom-footer">Content</CardFooter>
      );
      const footer = container.firstChild as HTMLElement;
      expect(footer).toHaveClass('custom-footer');
    });

    it('forwards ref correctly', () => {
      const ref = jest.fn();
      render(<CardFooter ref={ref}>Content</CardFooter>);
      expect(ref).toHaveBeenCalled();
    });
  });

  describe('Card Composition', () => {
    it('renders complete card with all subcomponents', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>Card Description</CardDescription>
          </CardHeader>
          <CardContent>Card main content goes here</CardContent>
          <CardFooter>Card footer</CardFooter>
        </Card>
      );

      expect(screen.getByText('Card Title')).toBeInTheDocument();
      expect(screen.getByText('Card Description')).toBeInTheDocument();
      expect(screen.getByText('Card main content goes here')).toBeInTheDocument();
      expect(screen.getByText('Card footer')).toBeInTheDocument();
    });

    it('renders card without header', () => {
      render(
        <Card>
          <CardContent>Just content</CardContent>
          <CardFooter>Footer</CardFooter>
        </Card>
      );

      expect(screen.getByText('Just content')).toBeInTheDocument();
      expect(screen.getByText('Footer')).toBeInTheDocument();
    });

    it('renders card without footer', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Title</CardTitle>
          </CardHeader>
          <CardContent>Content</CardContent>
        </Card>
      );

      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('renders minimal card with only content', () => {
      render(
        <Card>
          <CardContent>Minimal content</CardContent>
        </Card>
      );

      expect(screen.getByText('Minimal content')).toBeInTheDocument();
    });

    it('maintains proper structure hierarchy', () => {
      const { container } = render(
        <Card data-testid="card">
          <CardHeader data-testid="header">
            <CardTitle>Title</CardTitle>
          </CardHeader>
          <CardContent data-testid="content">Content</CardContent>
        </Card>
      );

      const card = screen.getByTestId('card');
      const header = screen.getByTestId('header');
      const content = screen.getByTestId('content');

      expect(card).toContainElement(header);
      expect(card).toContainElement(content);
    });
  });

  describe('Accessibility', () => {
    it('supports aria attributes', () => {
      render(
        <Card aria-label="Information card" role="region">
          Content
        </Card>
      );

      const card = screen.getByRole('region');
      expect(card).toHaveAttribute('aria-label', 'Information card');
    });

    it('title uses semantic heading element', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Accessible Title</CardTitle>
          </CardHeader>
        </Card>
      );

      const title = screen.getByRole('heading', { name: 'Accessible Title' });
      expect(title).toBeInTheDocument();
    });

    it('description uses semantic paragraph element', () => {
      render(
        <Card>
          <CardHeader>
            <CardDescription>This is a description</CardDescription>
          </CardHeader>
        </Card>
      );

      const description = screen.getByText('This is a description');
      expect(description.tagName).toBe('P');
    });
  });

  describe('Styling and Customization', () => {
    it('allows overriding default classes', () => {
      const { container } = render(
        <Card className="bg-red-500 border-4">Content</Card>
      );
      const card = container.firstChild as HTMLElement;

      expect(card).toHaveClass('bg-red-500');
      expect(card).toHaveClass('border-4');
      // Should still have base classes
      expect(card).toHaveClass('rounded-lg');
    });

    it('supports inline styles', () => {
      const { container } = render(<Card style={{ minHeight: '200px' }}>Content</Card>);
      const card = container.firstChild as HTMLElement;

      expect(card).toHaveStyle({ minHeight: '200px' });
    });

    it('combines multiple custom classes correctly', () => {
      const { container } = render(
        <Card className="dark:bg-slate-800 hover:shadow-lg transition-all">
          Content
        </Card>
      );
      const card = container.firstChild as HTMLElement;

      expect(card).toHaveClass('dark:bg-slate-800');
      expect(card).toHaveClass('hover:shadow-lg');
      expect(card).toHaveClass('transition-all');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty card', () => {
      const { container } = render(<Card />);
      const card = container.firstChild as HTMLElement;
      expect(card).toBeInTheDocument();
      expect(card).toBeEmptyDOMElement();
    });

    it('handles card with only whitespace', () => {
      const { container } = render(<Card>   </Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).toBeInTheDocument();
    });

    it('handles nested cards', () => {
      render(
        <Card data-testid="outer">
          <CardContent>
            <Card data-testid="inner">
              <CardContent>Nested content</CardContent>
            </Card>
          </CardContent>
        </Card>
      );

      expect(screen.getByTestId('outer')).toBeInTheDocument();
      expect(screen.getByTestId('inner')).toBeInTheDocument();
      expect(screen.getByText('Nested content')).toBeInTheDocument();
    });

    it('handles complex children in content', () => {
      render(
        <Card>
          <CardContent>
            <div>
              <p>Paragraph 1</p>
              <ul>
                <li>Item 1</li>
                <li>Item 2</li>
              </ul>
              <button>Action</button>
            </div>
          </CardContent>
        </Card>
      );

      expect(screen.getByText('Paragraph 1')).toBeInTheDocument();
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
    });
  });
});
