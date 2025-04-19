# TableControls Component

A reusable component for displaying table controls, including selected items count with bulk actions and rows per page selection.

## Features

- Shows count of selected items when rows are selected
- Displays configurable bulk actions (e.g., delete, restore) with confirmation
- Provides rows per page selector with customizable options
- Supports maximum rows per page limit
- Includes helper functions for common bulk actions

## Usage

```tsx
import TableControls, { createDeleteBulkAction, createRestoreBulkAction } from '@/components/shared/TableControls';

const MyTableComponent = () => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [pageSize, setPageSize] = useState(10);
  const [deletingItems, setDeletingItems] = useState(false);
  const [restoringItems, setRestoringItems] = useState(false);
  
  // Handle bulk delete
  const handleBulkDelete = async () => {
    setDeletingItems(true);
    try {
      await deleteItems(selectedRowKeys);
      // Refresh data or show success message
    } catch (error) {
      // Handle error
    } finally {
      setDeletingItems(false);
    }
  };
  
  // Handle bulk restore
  const handleBulkRestore = async () => {
    setRestoringItems(true);
    try {
      await restoreItems(selectedRowKeys);
      // Refresh data or show success message
    } finally {
      setRestoringItems(false);
    }
  };
  
  // Define bulk actions
  const bulkActions = [
    createDeleteBulkAction(
      selectedRowKeys.length,
      deletingItems,
      handleBulkDelete,
      hasSoftDeletedItems // boolean condition to show/hide this action
    ),
    createRestoreBulkAction(
      selectedRowKeys.length, 
      restoringItems,
      handleBulkRestore,
      hasCompletedItems // boolean condition to show/hide this action
    ),
  ];
  
  return (
    <div>
      <TableControls
        selectedRowKeys={selectedRowKeys}
        pageSize={pageSize}
        onPageSizeChange={(newSize) => {
          setPageSize(newSize);
          // Reset to first page or fetch data with new page size
        }}
        bulkActions={bulkActions}
        maxRowsPerPage={100}
      />
      
      <Table
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
        }}
        // ... other table props
      />
    </div>
  );
};
```

## Props

| Prop | Type | Description | Default |
|------|------|-------------|---------|
| selectedRowKeys | React.Key[] | Array of selected row keys | (Required) |
| pageSize | number | Current page size | (Required) |
| onPageSizeChange | (pageSize: number) => void | Handler for page size change | (Required) |
| bulkActions | BulkAction[] | Array of bulk actions to display | [] |
| className | string | Additional CSS class | '' |
| maxRowsPerPage | number | Maximum rows per page option | 100 |
| pageSizeOptions | number[] | Array of rows per page options | [5, 10, 15, 20, 50, 100] |

## BulkAction Interface

The `BulkAction` interface defines the structure for bulk actions:

```typescript
interface BulkAction {
  key: string;            // Unique identifier for the action
  title: string;          // Title shown in confirmation dialog
  description: string;    // Description shown in confirmation dialog
  icon: React.ReactNode;  // Icon for the action button
  buttonText: string;     // Text for the action button
  buttonType?: 'primary' | 'default' | 'dashed' | 'link' | 'text'; // Button type
  isDanger?: boolean;     // Whether the action is destructive
  tooltip: string;        // Tooltip text for the action button
  isVisible: boolean;     // Whether to show this action button
  isLoading?: boolean;    // Whether the action is in progress
  onConfirm: () => Promise<void>; // Handler when action is confirmed
}
```

## Helper Functions

### createDeleteBulkAction

Creates a delete bulk action with standard styling and confirmation messages.

```typescript
createDeleteBulkAction(
  selectedCount: number,  // Number of selected items
  isLoading: boolean,     // Whether delete is in progress
  onDelete: () => Promise<void>, // Delete handler function
  isVisible: boolean = true // Whether to show this action
)
```

### createRestoreBulkAction

Creates a restore bulk action with standard styling and confirmation messages.

```typescript
createRestoreBulkAction(
  selectedCount: number,  // Number of selected items
  isLoading: boolean,     // Whether restore is in progress
  onRestore: () => Promise<void>, // Restore handler function
  isVisible: boolean = true // Whether to show this action
)
```

## Customization

You can create custom bulk actions by defining objects that match the BulkAction interface:

```typescript
const customAction: BulkAction = {
  key: 'approve',
  title: 'Approve selected items',
  description: `Are you sure you want to approve ${selectedRowKeys.length} selected item(s)?`,
  icon: <CheckOutlined />,
  buttonText: 'Approve',
  buttonType: 'primary',
  tooltip: 'Approve selected items',
  isVisible: hasItemsToApprove,
  isLoading: approvingItems,
  onConfirm: handleBulkApprove
};
``` 