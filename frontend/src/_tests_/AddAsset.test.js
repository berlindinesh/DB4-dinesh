import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AddAsset from '../screens/templates/Assets/AddAsset';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios;

// Mock process.env
const originalEnv = process.env;
beforeAll(() => {
  process.env = {
    ...originalEnv,
    REACT_APP_API_URL: 'http://localhost:5002'
  };
});

afterAll(() => {
  process.env = originalEnv;
});

describe('AddAsset Component', () => {
  const mockProps = {
    onClose: jest.fn(),
    refreshAssets: jest.fn(),
    editAsset: null
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders add asset form', () => {
    render(<AddAsset {...mockProps} />);
    
    expect(screen.getByText('Add Asset')).toBeInTheDocument();
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/current employee/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/previous employees/i)).toBeInTheDocument();
    expect(screen.getByText('Save Asset')).toBeInTheDocument();
  });

  test('renders edit asset form when editAsset is provided', () => {
    const editAsset = {
      _id: '123',
      name: 'Test Asset',
      category: 'Computer',
      status: 'In Use',
      currentEmployee: 'John Doe',
      previousEmployees: ['Jane Doe', 'Bob Smith']
    };

    render(<AddAsset {...mockProps} editAsset={editAsset} />);
    
    expect(screen.getByText('Edit Asset')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Asset')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Computer')).toBeInTheDocument();
    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Jane Doe, Bob Smith')).toBeInTheDocument();
  });

  test('calls onClose when close button is clicked', () => {
    render(<AddAsset {...mockProps} />);
    
    const closeButton = screen.getByRole('button', { name: '' });
    fireEvent.click(closeButton);
    
    expect(mockProps.onClose).toHaveBeenCalledTimes(1);
  });

  test('transforms input to sentence case', async () => {
    render(<AddAsset {...mockProps} />);
    
    const nameInput = screen.getByLabelText(/name/i);
    fireEvent.change(nameInput, { target: { value: 'test asset name' } });
    
    await waitFor(() => {
      expect(nameInput.value).toBe('Test Asset Name');
    });
  });

  test('does not transform status field', async () => {
    render(<AddAsset {...mockProps} />);
    
    // Status should remain as selected from dropdown
    const statusSelect = screen.getByLabelText(/status/i);
    fireEvent.mouseDown(statusSelect);
    
    const inUseOption = screen.getByText('In Use');
    fireEvent.click(inUseOption);
    
    expect(statusSelect.textContent).toBe('In Use');
  });

  test('submits form and creates new asset', async () => {
    mockedAxios.post.mockResolvedValue({ data: { success: true } });
    
    render(<AddAsset {...mockProps} />);
    
    // Fill form
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'laptop' } });
    fireEvent.change(screen.getByLabelText(/category/i), { target: { value: 'computer' } });
    fireEvent.change(screen.getByLabelText(/current employee/i), { target: { value: 'john doe' } });
    
    // Select status
    const statusSelect = screen.getByLabelText(/status/i);
    fireEvent.mouseDown(statusSelect);
    fireEvent.click(screen.getByText('In Use'));
    
    // Submit
    const submitButton = screen.getByText('Save Asset');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:5002/api/assets',
        expect.objectContaining({
          name: 'Laptop',
          category: 'Computer',
          currentEmployee: 'John Doe',
          status: 'In Use',
          previousEmployees: []
        })
      );
    });
    
    expect(mockProps.refreshAssets).toHaveBeenCalledTimes(1);
    expect(mockProps.onClose).toHaveBeenCalledTimes(1);
  });

  test('submits form and updates existing asset', async () => {
    mockedAxios.put.mockResolvedValue({ data: { success: true } });
    
    const editAsset = {
      _id: '123',
      name: 'Test Asset',
      category: 'Computer',
      status: 'Available',
      currentEmployee: 'Jane Doe',
      previousEmployees: ['John Doe']
    };

    render(<AddAsset {...mockProps} editAsset={editAsset} />);
    
    // Submit
    const submitButton = screen.getByText('Save Asset');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockedAxios.put).toHaveBeenCalledWith(
        'http://localhost:5002/api/assets/123',
        expect.objectContaining({
          name: 'Test Asset',
          category: 'Computer',
          currentEmployee: 'Jane Doe',
          status: 'Available',
          previousEmployees: ['John Doe']
        })
      );
    });
  });

  test('handles form submission error', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    mockedAxios.post.mockRejectedValue(new Error('API Error'));
    
    render(<AddAsset {...mockProps} />);
    
    // Fill minimum required fields
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'test' } });
    fireEvent.change(screen.getByLabelText(/category/i), { target: { value: 'test' } });
    fireEvent.change(screen.getByLabelText(/current employee/i), { target: { value: 'test' } });
    
    const statusSelect = screen.getByLabelText(/status/i);
    fireEvent.mouseDown(statusSelect);
    fireEvent.click(screen.getByText('Available'));
    
    const submitButton = screen.getByText('Save Asset');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error:', expect.any(Error));
    });
    
    consoleSpy.mockRestore();
  });

  test('processes previous employees correctly', async () => {
    mockedAxios.post.mockResolvedValue({ data: { success: true } });
    
    render(<AddAsset {...mockProps} />);
    
    // Fill form including previous employees
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'test asset' } });
    fireEvent.change(screen.getByLabelText(/category/i), { target: { value: 'computer' } });
    fireEvent.change(screen.getByLabelText(/current employee/i), { target: { value: 'current user' } });
    fireEvent.change(screen.getByLabelText(/previous employees/i), { target: { value: 'john doe, jane smith, bob jones' } });
    
    const statusSelect = screen.getByLabelText(/status/i);
    fireEvent.mouseDown(statusSelect);
    fireEvent.click(screen.getByText('In Use'));
    
    const submitButton = screen.getByText('Save Asset');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:5002/api/assets',
        expect.objectContaining({
          previousEmployees: ['John Doe', 'Jane Smith', 'Bob Jones']
        })
      );
    });
  });

  test('shows all status options', () => {
    render(<AddAsset {...mockProps} />);
    
    const statusSelect = screen.getByLabelText(/status/i);
    fireEvent.mouseDown(statusSelect);
    
    expect(screen.getByText('In Use')).toBeInTheDocument();
    expect(screen.getByText('Available')).toBeInTheDocument();
    expect(screen.getByText('Under Maintenance')).toBeInTheDocument();
    expect(screen.getByText('Returned')).toBeInTheDocument();
  });
});
