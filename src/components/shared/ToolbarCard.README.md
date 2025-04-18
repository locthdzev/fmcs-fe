# ToolbarCard Component

A reusable component that creates a standardized toolbar card with consistent styling, header, and layout for filters and action buttons.

## Features

- Standardized card container with shadow and border radius
- Title header with customizable icon
- Divider separating the header from the content
- Flex layout for filter controls (left side) and action buttons (right side)
- Consistent styling across all pages

## Usage

```tsx
import ToolbarCard from '@/components/shared/ToolbarCard';
import { Button, Select } from 'antd';
import { FilterOutlined, FileExcelOutlined } from '@ant-design/icons';

const MyPage = () => {
  // Your state and handlers here
  
  // Define left side content (filters, search, etc.)
  const leftContent = (
    <>
      <Select placeholder="Search Item" />
      <Button icon={<FilterOutlined />}>Filters</Button>
      {/* Other filter controls */}
    </>
  );
  
  // Define right side content (action buttons)
  const rightContent = (
    <Button type="primary" icon={<FileExcelOutlined />}>
      Export
    </Button>
  );

  return (
    <ToolbarCard
      leftContent={leftContent}
      rightContent={rightContent}
      title="My Toolbar"
    />
  );
};
```

## Props

| Prop | Type | Description | Required |
|------|------|-------------|----------|
| leftContent | React.ReactNode | Controls displayed on the left side (filters, search, etc.) | Yes |
| rightContent | React.ReactNode | Controls displayed on the right side (action buttons) | No |
| title | string | The title for the toolbar | No (defaults to "Toolbar") |
| icon | React.ReactNode | Icon to display next to the title | No (defaults to AppstoreOutlined) |
| className | string | Additional CSS classes to apply to the card | No |

## Example Implementation

See `ToolbarCardExample.tsx` for a complete example of how to use this component with various filter controls and action buttons.

## Benefits

- Consistent UI across all pages
- Reduces boilerplate code
- Easier to maintain - style changes only need to be made in one place
- Improves code readability by separating the toolbar structure from the content 