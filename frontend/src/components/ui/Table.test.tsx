import { render, screen } from '@testing-library/react';
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from './table';

describe('Table Component', () => {
  describe('Table', () => {
    it('renders table element', () => {
      render(
        <Table>
          <tbody>
            <tr>
              <td>Cell</td>
            </tr>
          </tbody>
        </Table>
      );

      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
    });

    it('applies default table styling classes', () => {
      render(
        <Table>
          <tbody>
            <tr>
              <td>Cell</td>
            </tr>
          </tbody>
        </Table>
      );

      const table = screen.getByRole('table');
      expect(table).toHaveClass('w-full');
      expect(table).toHaveClass('caption-bottom');
      expect(table).toHaveClass('text-sm');
    });

    it('wraps table in scrollable container', () => {
      const { container } = render(
        <Table>
          <tbody>
            <tr>
              <td>Cell</td>
            </tr>
          </tbody>
        </Table>
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('relative');
      expect(wrapper).toHaveClass('w-full');
      expect(wrapper).toHaveClass('overflow-auto');
    });

    it('applies custom className', () => {
      render(
        <Table className="custom-table">
          <tbody>
            <tr>
              <td>Cell</td>
            </tr>
          </tbody>
        </Table>
      );

      const table = screen.getByRole('table');
      expect(table).toHaveClass('custom-table');
    });

    it('forwards ref correctly', () => {
      const ref = jest.fn();
      render(
        <Table ref={ref}>
          <tbody>
            <tr>
              <td>Cell</td>
            </tr>
          </tbody>
        </Table>
      );
      expect(ref).toHaveBeenCalled();
    });
  });

  describe('TableHeader', () => {
    it('renders thead element', () => {
      render(
        <table>
          <TableHeader>
            <tr>
              <th>Header</th>
            </tr>
          </TableHeader>
        </table>
      );

      const thead = screen.getByText('Header').closest('thead');
      expect(thead).toBeInTheDocument();
    });

    it('applies header styling classes', () => {
      render(
        <table>
          <TableHeader>
            <tr>
              <th>Header</th>
            </tr>
          </TableHeader>
        </table>
      );

      const thead = screen.getByText('Header').closest('thead');
      expect(thead).toHaveClass('[&_tr]:border-b');
    });

    it('applies custom className', () => {
      render(
        <table>
          <TableHeader className="custom-header">
            <tr>
              <th>Header</th>
            </tr>
          </TableHeader>
        </table>
      );

      const thead = screen.getByText('Header').closest('thead');
      expect(thead).toHaveClass('custom-header');
    });
  });

  describe('TableBody', () => {
    it('renders tbody element', () => {
      render(
        <table>
          <TableBody>
            <tr>
              <td>Body</td>
            </tr>
          </TableBody>
        </table>
      );

      const tbody = screen.getByText('Body').closest('tbody');
      expect(tbody).toBeInTheDocument();
    });

    it('applies body styling classes', () => {
      render(
        <table>
          <TableBody>
            <tr>
              <td>Body</td>
            </tr>
          </TableBody>
        </table>
      );

      const tbody = screen.getByText('Body').closest('tbody');
      expect(tbody).toHaveClass('[&_tr:last-child]:border-0');
    });

    it('applies custom className', () => {
      render(
        <table>
          <TableBody className="custom-body">
            <tr>
              <td>Body</td>
            </tr>
          </TableBody>
        </table>
      );

      const tbody = screen.getByText('Body').closest('tbody');
      expect(tbody).toHaveClass('custom-body');
    });
  });

  describe('TableFooter', () => {
    it('renders tfoot element', () => {
      render(
        <table>
          <TableFooter>
            <tr>
              <td>Footer</td>
            </tr>
          </TableFooter>
        </table>
      );

      const tfoot = screen.getByText('Footer').closest('tfoot');
      expect(tfoot).toBeInTheDocument();
    });

    it('applies footer styling classes', () => {
      render(
        <table>
          <TableFooter>
            <tr>
              <td>Footer</td>
            </tr>
          </TableFooter>
        </table>
      );

      const tfoot = screen.getByText('Footer').closest('tfoot');
      expect(tfoot).toHaveClass('border-t');
      expect(tfoot).toHaveClass('bg-muted/50');
      expect(tfoot).toHaveClass('font-medium');
    });

    it('applies custom className', () => {
      render(
        <table>
          <TableFooter className="custom-footer">
            <tr>
              <td>Footer</td>
            </tr>
          </TableFooter>
        </table>
      );

      const tfoot = screen.getByText('Footer').closest('tfoot');
      expect(tfoot).toHaveClass('custom-footer');
    });
  });

  describe('TableRow', () => {
    it('renders tr element', () => {
      render(
        <table>
          <tbody>
            <TableRow>
              <td>Cell</td>
            </TableRow>
          </tbody>
        </table>
      );

      const row = screen.getByText('Cell').closest('tr');
      expect(row).toBeInTheDocument();
    });

    it('applies row styling classes', () => {
      render(
        <table>
          <tbody>
            <TableRow>
              <td>Cell</td>
            </TableRow>
          </tbody>
        </table>
      );

      const row = screen.getByText('Cell').closest('tr');
      expect(row).toHaveClass('border-b');
      expect(row).toHaveClass('transition-colors');
      expect(row).toHaveClass('hover:bg-muted/50');
    });

    it('applies custom className', () => {
      render(
        <table>
          <tbody>
            <TableRow className="custom-row">
              <td>Cell</td>
            </TableRow>
          </tbody>
        </table>
      );

      const row = screen.getByText('Cell').closest('tr');
      expect(row).toHaveClass('custom-row');
    });

    it('supports data-state attribute for selection', () => {
      render(
        <table>
          <tbody>
            <TableRow data-state="selected">
              <td>Selected Cell</td>
            </TableRow>
          </tbody>
        </table>
      );

      const row = screen.getByText('Selected Cell').closest('tr');
      expect(row).toHaveAttribute('data-state', 'selected');
    });
  });

  describe('TableHead', () => {
    it('renders th element', () => {
      render(
        <table>
          <thead>
            <tr>
              <TableHead>Column Header</TableHead>
            </tr>
          </thead>
        </table>
      );

      const th = screen.getByText('Column Header');
      expect(th.tagName).toBe('TH');
    });

    it('applies header cell styling classes', () => {
      render(
        <table>
          <thead>
            <tr>
              <TableHead>Column Header</TableHead>
            </tr>
          </thead>
        </table>
      );

      const th = screen.getByText('Column Header');
      expect(th).toHaveClass('h-12');
      expect(th).toHaveClass('px-4');
      expect(th).toHaveClass('text-left');
      expect(th).toHaveClass('align-middle');
      expect(th).toHaveClass('font-medium');
      expect(th).toHaveClass('text-muted-foreground');
    });

    it('applies custom className', () => {
      render(
        <table>
          <thead>
            <tr>
              <TableHead className="custom-head">Column Header</TableHead>
            </tr>
          </thead>
        </table>
      );

      const th = screen.getByText('Column Header');
      expect(th).toHaveClass('custom-head');
    });

    it('supports th-specific attributes', () => {
      render(
        <table>
          <thead>
            <tr>
              <TableHead scope="col" abbr="Name">
                Full Name
              </TableHead>
            </tr>
          </thead>
        </table>
      );

      const th = screen.getByText('Full Name');
      expect(th).toHaveAttribute('scope', 'col');
      expect(th).toHaveAttribute('abbr', 'Name');
    });
  });

  describe('TableCell', () => {
    it('renders td element', () => {
      render(
        <table>
          <tbody>
            <tr>
              <TableCell>Cell Content</TableCell>
            </tr>
          </tbody>
        </table>
      );

      const td = screen.getByText('Cell Content');
      expect(td.tagName).toBe('TD');
    });

    it('applies cell styling classes', () => {
      render(
        <table>
          <tbody>
            <tr>
              <TableCell>Cell Content</TableCell>
            </tr>
          </tbody>
        </table>
      );

      const td = screen.getByText('Cell Content');
      expect(td).toHaveClass('p-4');
      expect(td).toHaveClass('align-middle');
    });

    it('applies custom className', () => {
      render(
        <table>
          <tbody>
            <tr>
              <TableCell className="custom-cell">Cell Content</TableCell>
            </tr>
          </tbody>
        </table>
      );

      const td = screen.getByText('Cell Content');
      expect(td).toHaveClass('custom-cell');
    });

    it('supports td-specific attributes', () => {
      render(
        <table>
          <tbody>
            <tr>
              <TableCell colSpan={2} rowSpan={1}>
                Merged Cell
              </TableCell>
            </tr>
          </tbody>
        </table>
      );

      const td = screen.getByText('Merged Cell');
      expect(td).toHaveAttribute('colSpan', '2');
      expect(td).toHaveAttribute('rowSpan', '1');
    });
  });

  describe('TableCaption', () => {
    it('renders caption element', () => {
      render(
        <table>
          <TableCaption>Table Caption</TableCaption>
          <tbody>
            <tr>
              <td>Cell</td>
            </tr>
          </tbody>
        </table>
      );

      const caption = screen.getByText('Table Caption');
      expect(caption.tagName).toBe('CAPTION');
    });

    it('applies caption styling classes', () => {
      render(
        <table>
          <TableCaption>Table Caption</TableCaption>
          <tbody>
            <tr>
              <td>Cell</td>
            </tr>
          </tbody>
        </table>
      );

      const caption = screen.getByText('Table Caption');
      expect(caption).toHaveClass('mt-4');
      expect(caption).toHaveClass('text-sm');
      expect(caption).toHaveClass('text-muted-foreground');
    });

    it('applies custom className', () => {
      render(
        <table>
          <TableCaption className="custom-caption">Table Caption</TableCaption>
          <tbody>
            <tr>
              <td>Cell</td>
            </tr>
          </tbody>
        </table>
      );

      const caption = screen.getByText('Table Caption');
      expect(caption).toHaveClass('custom-caption');
    });
  });

  describe('Table Composition', () => {
    it('renders complete table with all components', () => {
      render(
        <Table>
          <TableCaption>User List</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>John Doe</TableCell>
              <TableCell>john@example.com</TableCell>
              <TableCell>Active</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Jane Smith</TableCell>
              <TableCell>jane@example.com</TableCell>
              <TableCell>Active</TableCell>
            </TableRow>
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={2}>Total Users</TableCell>
              <TableCell>2</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      );

      expect(screen.getByText('User List')).toBeInTheDocument();
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('jane@example.com')).toBeInTheDocument();
      expect(screen.getByText('Total Users')).toBeInTheDocument();
    });

    it('renders table with only header and body', () => {
      render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Column</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Data</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      expect(screen.getByText('Column')).toBeInTheDocument();
      expect(screen.getByText('Data')).toBeInTheDocument();
    });

    it('handles empty table body', () => {
      render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Column</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>No data available</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      expect(screen.getByText('No data available')).toBeInTheDocument();
    });

    it('renders table with multiple columns and rows', () => {
      render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Age</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>1</TableCell>
              <TableCell>Alice</TableCell>
              <TableCell>25</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>2</TableCell>
              <TableCell>Bob</TableCell>
              <TableCell>30</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>3</TableCell>
              <TableCell>Charlie</TableCell>
              <TableCell>35</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.getByText('Charlie')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('uses semantic HTML table structure', () => {
      render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Header</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Cell</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      const table = screen.getByRole('table');
      expect(table.querySelector('thead')).toBeInTheDocument();
      expect(table.querySelector('tbody')).toBeInTheDocument();
    });

    it('supports table caption for accessibility', () => {
      render(
        <Table>
          <TableCaption>Employee Information</TableCaption>
          <TableBody>
            <TableRow>
              <TableCell>Data</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      const caption = screen.getByText('Employee Information');
      expect(caption).toBeInTheDocument();
    });

    it('supports scope attribute on table headers', () => {
      render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">Name</TableHead>
              <TableHead scope="col">Age</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>John</TableCell>
              <TableCell>30</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      const nameHeader = screen.getByText('Name');
      expect(nameHeader).toHaveAttribute('scope', 'col');
    });

    it('supports aria-label for table', () => {
      render(
        <Table aria-label="User data table">
          <TableBody>
            <TableRow>
              <TableCell>Data</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      const table = screen.getByRole('table', { name: 'User data table' });
      expect(table).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles table with single cell', () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Single Cell</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      expect(screen.getByText('Single Cell')).toBeInTheDocument();
    });

    it('handles complex content in cells', () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>
                <div>
                  <button>Edit</button>
                  <button>Delete</button>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    });

    it('handles nested elements in cells', () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>
                <span>
                  <strong>Bold</strong> and <em>italic</em>
                </span>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      expect(screen.getByText('Bold')).toBeInTheDocument();
      expect(screen.getByText('italic')).toBeInTheDocument();
    });

    it('maintains structure with custom styling', () => {
      render(
        <Table className="custom-table">
          <TableHeader className="custom-header">
            <TableRow className="custom-row">
              <TableHead className="custom-head">Header</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="custom-body">
            <TableRow className="custom-row">
              <TableCell className="custom-cell">Cell</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      const table = screen.getByRole('table');
      expect(table).toHaveClass('custom-table');
      expect(screen.getByText('Header')).toHaveClass('custom-head');
      expect(screen.getByText('Cell')).toHaveClass('custom-cell');
    });
  });
});
