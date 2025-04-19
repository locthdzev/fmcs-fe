# PaginationFooter Component

A reusable pagination component that provides a consistent and enhanced pagination UI across the application, with options for displaying total items, page navigation, and a direct "Go to page" input field.

## Features

- Consistent card styling for all pagination sections
- Shows total number of items (optional)
- Standard Ant Design pagination control
- "Go to page" input for direct page navigation (optional)
- Support for page size changing (optional)
- Fully customizable via props

## Usage

```tsx
import PaginationFooter from '@/components/shared/PaginationFooter';

const MyComponent = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const totalItems = 100;

  const handlePageChange = (page: number, newPageSize?: number) => {
    setCurrentPage(page);
    if (newPageSize) setPageSize(newPageSize);
    
    // Add your data fetching logic here
    fetchData(page, newPageSize || pageSize);
  };

  return (
    <div>
      {/* Your table or data display */}
      <Table 
        dataSource={dataSource} 
        columns={columns} 
        pagination={false} 
      />
      
      {/* Pagination footer */}
      <PaginationFooter
        current={currentPage}
        pageSize={pageSize}
        total={totalItems}
        onChange={handlePageChange}
      />
    </div>
  );
};
```

## Props

| Prop | Type | Description | Default |
|------|------|-------------|---------|
| current | number | Current page number | (Required) |
| pageSize | number | Number of items per page | (Required) |
| total | number | Total number of items | (Required) |
| onChange | function | Callback when page or page size changes | (Required) |
| showSizeChanger | boolean | Whether to show the page size changer | false |
| showGoToPage | boolean | Whether to show the "Go to page" input | true |
| showTotal | boolean | Whether to show the total items count | true |
| className | string | Additional CSS class | - |

## Variations

### Standard Pagination (Default)

Includes total items count, pagination controls, and "Go to page" input:

```tsx
<PaginationFooter
  current={currentPage}
  pageSize={pageSize}
  total={totalItems}
  onChange={handlePageChange}
/>
```

### With Page Size Changer

Allows users to change the number of items per page:

```tsx
<PaginationFooter
  current={currentPage}
  pageSize={pageSize}
  total={totalItems}
  onChange={handlePageChange}
  showSizeChanger={true}
/>
```

### Minimal Pagination

Only shows the pagination controls without total items or "Go to page" input:

```tsx
<PaginationFooter
  current={currentPage}
  pageSize={pageSize}
  total={totalItems}
  onChange={handlePageChange}
  showGoToPage={false}
  showTotal={false}
/>
```

## Example

See `PaginationFooterExample.tsx` for a complete example of how to use this component with a table and different variations. 