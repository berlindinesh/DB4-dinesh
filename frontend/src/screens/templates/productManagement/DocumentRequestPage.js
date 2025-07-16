import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DocumentCard from './DocumentCard';
import './DocumentRequestPage.css';

const DocumentRequestPage = () => {
  const [documentData, setDocumentData] = useState([]);
  const [newDocument, setNewDocument] = useState({
    title: '',
    employee: '',
    format: '',
    maxSize: '',
    description: '',
    status: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState(null);
  const [filters, setFilters] = useState({
    all: true,
    pending: false,
    approved: false,
    rejected: false
  });

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/documents`);
      setDocumentData(response.data);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (editingDocument) {
      setEditingDocument(prev => ({
        ...prev,
        [name]: value
      }));
    } else {
      setNewDocument(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleFilterChange = (filterName) => {
    if (filterName === 'all') {
      setFilters({
        all: true,
        pending: false,
        approved: false,
        rejected: false
      });
    } else {
      setFilters(prev => ({
        ...prev,
        all: false,
        [filterName]: !prev[filterName]
      }));
    }
  };

  const applyFilters = (docs) => {
    if (filters.all) {
      return docs;
    }
    return docs.filter(doc => {
      if (filters.pending && doc.status === 'pending') return true;
      if (filters.approved && doc.status === 'approved') return true;
      if (filters.rejected && doc.status === 'rejected') return true;
      return false;
    });
  };

  const handleEdit = (document) => {
    const documentToEdit = {
      ...document,
      status: document.status || 'pending'
    };
    setEditingDocument(documentToEdit);
    setIsCreateModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/documents/${id}`);
      setDocumentData(prev => prev.filter(doc => doc._id !== id));
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  }; 

  
  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingDocument) {
        const response = await axios.put(
          `${process.env.REACT_APP_API_URL}/api/documents/${editingDocument._id}`, 
          editingDocument
        );
        setDocumentData(prev => prev.map(doc => 
          doc._id === editingDocument._id ? response.data : doc
        ));
      } else {
        const documentToCreate = {
          title: newDocument.title,
          employee: newDocument.employee,
          format: newDocument.format,
          maxSize: newDocument.maxSize,
          description: newDocument.description || '',
          status: newDocument.status,
          current: 0,
          total: 1,
          details: [newDocument.employee]
        };
  
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/documents`, documentToCreate);
        setDocumentData(prev => [...prev, response.data]);
      }
      closeCreateModal();
      resetForm();
    } catch (error) {
      console.error('Error saving document:', error.response?.data);
    }
  };
  
  // Continuing from Part 1...

  const resetForm = () => {
    setNewDocument({
      title: '',
      employee: '',
      format: '',
      maxSize: '',
      description: '',
      status: 'pending'
    });
    setEditingDocument(null);
  };

  const openFilterModal = () => setIsFilterModalOpen(true);
  const closeFilterModal = () => setIsFilterModalOpen(false);
  const openCreateModal = () => setIsCreateModalOpen(true);
  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    resetForm();
  };

  const filteredData = applyFilters(
    documentData.filter(doc =>
      doc.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="document-request-page">
      <header className="header">
        <h2>Document Requests</h2>
        <div className="document-request-search-bar">
          <input
            type="text"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="header-buttons">
          <button className="filter-button" onClick={openFilterModal}>
            Filter {!filters.all && Object.values(filters).some(v => v) && '(Active)'}
          </button>
          <button className="create-button" onClick={openCreateModal}>+ Create</button>
        </div>
      </header>

      <div className="document-list">
        {filteredData.map((doc) => (
          <DocumentCard
            key={doc._id}
            id={doc._id}
            title={doc.title}
            current={doc.current}
            total={doc.total}
            details={doc.details}
            status={doc.status}
            onEdit={() => handleEdit(doc)}
            onDelete={() => handleDelete(doc._id)}
          />
        ))}
      </div>

      {isFilterModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <button className="close-button" onClick={closeFilterModal}>×</button>
            <h3 style={{
              backgroundColor: '#28a745',
              color: '#ffffff',
              padding: '10px',
              borderRadius: '4px'
            }}>Filter Options</h3>
                        <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={filters.all}
                  onChange={() => handleFilterChange('all')}
                  style={{ marginRight: '8px' }}
                /> 
                All Status
              </label>
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={filters.pending}
                  onChange={() => handleFilterChange('pending')}
                  style={{ marginRight: '8px' }}
                /> 
                Pending
              </label>
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={filters.approved}
                  onChange={() => handleFilterChange('approved')}
                  style={{ marginRight: '8px' }}
                /> 
                Approved
              </label>
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={filters.rejected}
                  onChange={() => handleFilterChange('rejected')}
                  style={{ marginRight: '8px' }}
                /> 
                Rejected
              </label>
            </div>
            <button 
              onClick={closeFilterModal}
              style={{
                backgroundColor: '#007bff',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                width: '100%'
              }}
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {isCreateModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            width: '600px',
            maxHeight: '80vh',
            overflowY: 'auto',
            position: 'relative',
          }}>
            <button 
              onClick={closeCreateModal}
              style={{
                position: 'absolute',
                right: '10px',
                top: '10px',
               borderRadius: 'green',
                boder:'50px',
                color: "white",
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer'
              }}
            >
              ×
            </button>

            <h3 style={{
              backgroundColor: 'green',  
              borderRadius: '4px',
              padding:'16px',
              color: 'white',
              margin: '10px 0',
              fontsize:'1.5rem',
              margintop: '60px',


            }}>
              {editingDocument ? 'Edit Document Request' : 'Create Document Request'}
            </h3>
                        
            <form onSubmit={handleSave}>
              {['title', 'employee', 'format', 'maxSize', 'status', 'description'].map((field) => (
                <div key={field} style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>
                    {field.charAt(0).toUpperCase() + field.slice(1)}:
                  </label>
                  {field === 'description' ? (
                    <textarea
                      name={field}
                      value={editingDocument ? editingDocument[field] : newDocument[field]}
                      onChange={handleInputChange}
                      style={{ width: '100%', padding: '8px' }}
                    />
                  ) : field === 'status' ? (
                    <select
                      name={field}
                      value={editingDocument ? editingDocument[field] : newDocument[field]}
                      onChange={handleInputChange}
                      style={{ width: '100%', padding: '8px', border: '1px solid #111'}}
                      required
                    >
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      name={field}
                      value={editingDocument ? editingDocument[field] : newDocument[field]}
                      onChange={handleInputChange}
                      style={{ width: '100%', padding: '8px', border: '1px solid #111'}}
                      required={field !== 'description'}
                    />
                  )}
                </div>
              ))}

              <div style={{ display: 'flex', justifyContent: 'flex-start', gap: '10px', marginTop: '20px' }}>
                <button 
                  type="button" 
                  onClick={closeCreateModal}
                  style={{ backgroundColor: '#007bff', color: 'white', padding: '8px 16px', borderRadius: '4px', border: 'none',
                }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  style={{ backgroundColor: '#007bff', color: 'white', padding: '8px 16px', borderRadius: '4px',border: 'none',
                }}
                >
                  {editingDocument ? 'Update' : 'Save'}
                </button>
              </div>
              

            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentRequestPage;
