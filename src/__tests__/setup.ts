import '@testing-library/jest-dom';
import { vi } from 'vitest';

// eslint-disable-next-line @typescript-eslint/no-var-requires
declare const require: (module: string) => any;

// Mock @wix/forms
vi.mock('@wix/forms', () => ({
  submissions: {
    querySubmissionsByNamespace: vi.fn(() => ({
      eq: vi.fn().mockReturnThis(),
      descending: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      find: vi.fn().mockResolvedValue({ items: [] }),
    })),
    getSubmission: vi.fn(),
    updateSubmission: vi.fn(),
    deleteSubmission: vi.fn(),
  },
}));

// Mock @wix/data
vi.mock('@wix/data', () => ({
  items: {
    query: vi.fn(() => ({
      eq: vi.fn().mockReturnThis(),
      hasSome: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      find: vi.fn().mockResolvedValue({ items: [] }),
    })),
    insert: vi.fn(),
    update: vi.fn(),
  },
}));

// Mock @wix/dashboard
vi.mock('@wix/dashboard', () => ({
  dashboard: {
    showToast: vi.fn(),
  },
}));

// Mock @wix/web-methods
vi.mock('@wix/web-methods', () => ({
  webMethod: vi.fn((_perm: any, fn: Function) => fn),
  Permissions: {
    Anyone: 'Anyone',
    Admin: 'Admin',
    SiteMember: 'SiteMember',
  },
}));

// Mock @wix/essentials
vi.mock('@wix/essentials', () => ({
  auth: {
    elevate: vi.fn((fn: Function) => fn),
  },
}));

// Mock @wix/media
vi.mock('@wix/media', () => ({
  files: {
    generateFileDownloadUrl: vi.fn(),
  },
}));

// Mock @wix/app-management
vi.mock('@wix/app-management', () => ({
  appInstances: {
    getAppInstance: vi.fn().mockResolvedValue({ instance: { appVersion: '1.0.0' } }),
  },
}));

// Mock @wix/sdk
vi.mock('@wix/sdk', () => ({}));

// Mock @wix/design-system
vi.mock('@wix/design-system', () => {
  const React = require('react');
  const createComponent = (name: string) =>
    React.forwardRef((props: any, ref: any) =>
      React.createElement('div', { ...props, ref, 'data-testid': name })
    );

  return {
    WixDesignSystemProvider: ({ children }: any) => children,
    Page: Object.assign(createComponent('Page'), {
      Header: createComponent('Page.Header'),
      Content: createComponent('Page.Content'),
    }),
    Box: createComponent('Box'),
    Text: createComponent('Text'),
    Heading: createComponent('Heading'),
    Button: createComponent('Button'),
    Card: Object.assign(createComponent('Card'), {
      Content: createComponent('Card.Content'),
    }),
    Badge: createComponent('Badge'),
    Avatar: createComponent('Avatar'),
    Loader: createComponent('Loader'),
    Layout: createComponent('Layout'),
    Cell: createComponent('Cell'),
    Modal: createComponent('Modal'),
    Search: createComponent('Search'),
    Input: Object.assign(createComponent('Input'), {
      IconAffix: createComponent('Input.IconAffix'),
    }),
    IconButton: createComponent('IconButton'),
    TextButton: createComponent('TextButton'),
    Divider: createComponent('Divider'),
    Tooltip: createComponent('Tooltip'),
    Checkbox: createComponent('Checkbox'),
    Dropdown: createComponent('Dropdown'),
    Pagination: createComponent('Pagination'),
    PopoverMenu: Object.assign(createComponent('PopoverMenu'), {
      MenuItem: createComponent('PopoverMenu.MenuItem'),
      Divider: createComponent('PopoverMenu.Divider'),
    }),
    MessageModalLayout: createComponent('MessageModalLayout'),
    CustomModalLayout: createComponent('CustomModalLayout'),
    TableToolbar: Object.assign(createComponent('TableToolbar'), {
      ItemGroup: createComponent('TableToolbar.ItemGroup'),
      Item: createComponent('TableToolbar.Item'),
      Label: createComponent('TableToolbar.Label'),
    }),
    TableActionCell: createComponent('TableActionCell'),
    Table: createComponent('Table'),
    TableListHeader: createComponent('TableListHeader'),
    InputArea: createComponent('InputArea'),
    FormField: createComponent('FormField'),
    EmptyState: createComponent('EmptyState'),
  };
});

// Mock @wix/wix-ui-icons-common
vi.mock('@wix/wix-ui-icons-common', () => {
  return new Proxy(
    {},
    {
      get: (_target, prop) => {
        if (prop === '__esModule') return true;
        const React = require('react');
        return (props: any) => React.createElement('span', { 'data-icon': prop, ...props });
      },
    }
  );
});
