# PageContainer Component

A reusable component that combines a standard container with a header and back button for consistent page layouts.

## Features

- Standardized container with padding
- Back button with callback functionality
- Title with optional icon
- Optional right content area for actions
- Consistent styling across all pages

## Usage

```tsx
import PageContainer from '@/components/shared/PageContainer';
import { MedicineBoxOutlined } from '@ant-design/icons';
import { Button } from 'antd';

const MyPage = () => {
  const handleBack = () => {
    // Handle back navigation
  };

  const rightContent = (
    <Button type="primary">Action Button</Button>
  );

  return (
    <PageContainer 
      title="Page Title"
      icon={<MedicineBoxOutlined style={{ fontSize: "24px" }} />}
      onBack={handleBack}
      rightContent={rightContent}
    >
      {/* Your page content here */}
      <div>Content goes here</div>
    </PageContainer>
  );
};
```

## Props

| Prop | Type | Description | Required |
|------|------|-------------|----------|
| title | string | The title for the page | Yes |
| icon | React.ReactNode | Icon to display next to the title | No |
| onBack | () => void | Callback function for the back button, if not provided the back button is hidden | No |
| children | React.ReactNode | The content of the page | Yes |
| rightContent | React.ReactNode | Content to display on the right side of the header | No |

## Examples

See `PageContainerExample.tsx` for a complete example of how to use this component. 