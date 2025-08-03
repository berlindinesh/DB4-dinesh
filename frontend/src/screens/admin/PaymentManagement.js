import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Snackbar,
  TextField,
  InputAdornment,
  IconButton
} from '@mui/material';
import {
  Send as SendIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Payment as PaymentIcon,
  Email as EmailIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import api from '../../api/axiosInstance';

const PaymentManagement = () => {
  const [pendingCompanies, setPendingCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    fetchPendingPayments();
  }, []);

  const fetchPendingPayments = async () => {
    try {
      setLoading(true);
      const response = await api.get('companies/pending-payments');
      setPendingCompanies(response.data.companies || []);
    } catch (error) {
      console.error('Error fetching pending payments:', error);
      showSnackbar('Failed to fetch pending payments', 'error');
    } finally {
      setLoading(false);
    }
  };

  const sendPaymentLink = async (companyCode) => {
    try {
      setSending(true);
      const response = await api.post(`companies/send-payment-link/${companyCode}`);
      
      showSnackbar(response.data.message, 'success');
      fetchPendingPayments(); // Refresh the list
      
    } catch (error) {
      console.error('Error sending payment link:', error);
      showSnackbar(error.response?.data?.message || 'Failed to send payment link', 'error');
    } finally {
      setSending(false);
    }
  };

  const sendAllPaymentReminders = async () => {
    try {
      setSending(true);
      const response = await api.post('companies/send-payment-reminders');
      
      showSnackbar(response.data.message, 'success');
      fetchPendingPayments(); // Refresh the list
      
    } catch (error) {
      console.error('Error sending payment reminders:', error);
      showSnackbar(error.response?.data?.message || 'Failed to send payment reminders', 'error');
    } finally {
      setSending(false);
    }
  };

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const openCompanyDialog = (company) => {
    setSelectedCompany(company);
    setDialogOpen(true);
  };

  const closeCompanyDialog = () => {
    setSelectedCompany(null);
    setDialogOpen(false);
  };

  const filteredCompanies = pendingCompanies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.companyCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.contactEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusChip = (company) => {
    if (company.paymentLinkShared) {
      return (
        <Chip
          icon={<EmailIcon />}
          label="Link Sent"
          color="primary"
          size="small"
        />
      );
    } else {
      return (
        <Chip
          icon={<ScheduleIcon />}
          label="Pending"
          color="warning"
          size="small"
        />
      );
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" fontWeight="bold" color="primary">
            Payment Management
          </Typography>
          <Box display="flex" gap={2}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchPendingPayments}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<SendIcon />}
              onClick={sendAllPaymentReminders}
              disabled={sending || pendingCompanies.length === 0}
              color="warning"
            >
              Send All Reminders
            </Button>
          </Box>
        </Box>

        {/* Statistics */}
        <Box display="flex" gap={2} mb={3}>
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant="h6" color="text.secondary">
                Total Pending
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="warning.main">
                {pendingCompanies.length}
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant="h6" color="text.secondary">
                Links Sent
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="primary.main">
                {pendingCompanies.filter(c => c.paymentLinkShared).length}
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant="h6" color="text.secondary">
                Never Contacted
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="error.main">
                {pendingCompanies.filter(c => !c.paymentLinkShared).length}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Search */}
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search by company name, code, or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ mb: 3 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />

        {/* Companies Table */}
        {filteredCompanies.length === 0 ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            {pendingCompanies.length === 0 
              ? 'No companies with pending payments found. Great job!' 
              : 'No companies match your search criteria.'}
          </Alert>
        ) : (
          <TableContainer component={Paper} elevation={3}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell><strong>Company</strong></TableCell>
                  <TableCell><strong>Company Code</strong></TableCell>
                  <TableCell><strong>Contact Email</strong></TableCell>
                  <TableCell><strong>Days Since Registration</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredCompanies.map((company) => (
                  <TableRow key={company.companyCode} hover>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {company.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={company.companyCode} 
                        variant="outlined" 
                        size="small"
                        sx={{ fontFamily: 'monospace' }}
                      />
                    </TableCell>
                    <TableCell>{company.contactEmail}</TableCell>
                    <TableCell>
                      <Chip
                        label={`${company.daysSinceRegistration} days`}
                        color={company.daysSinceRegistration > 7 ? 'error' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {getStatusChip(company)}
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<SendIcon />}
                          onClick={() => sendPaymentLink(company.companyCode)}
                          disabled={sending}
                        >
                          Send Link
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => openCompanyDialog(company)}
                        >
                          Details
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Company Details Dialog */}
        <Dialog open={dialogOpen} onClose={closeCompanyDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            Company Payment Details
          </DialogTitle>
          <DialogContent>
            {selectedCompany && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  {selectedCompany.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Company Code: <strong>{selectedCompany.companyCode}</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Contact Email: <strong>{selectedCompany.contactEmail}</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Registration Date: <strong>{new Date(selectedCompany.createdAt).toLocaleDateString()}</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Days Since Registration: <strong>{selectedCompany.daysSinceRegistration} days</strong>
                </Typography>
                
                {selectedCompany.paymentLinkShared && (
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Payment Link Shared: <strong>{new Date(selectedCompany.paymentLinkSharedDate).toLocaleDateString()}</strong>
                  </Typography>
                )}
                
                <Box mt={2} p={2} bgcolor="grey.100" borderRadius={1}>
                  <Typography variant="subtitle2" gutterBottom>
                    Payment Link:
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      wordBreak: 'break-all',
                      fontFamily: 'monospace',
                      backgroundColor: 'white',
                      p: 1,
                      borderRadius: 1
                    }}
                  >
                    {selectedCompany.paymentLink}
                  </Typography>
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={closeCompanyDialog}>Close</Button>
            {selectedCompany && (
              <Button
                variant="contained"
                startIcon={<SendIcon />}
                onClick={() => {
                  sendPaymentLink(selectedCompany.companyCode);
                  closeCompanyDialog();
                }}
                disabled={sending}
              >
                Send Payment Link
              </Button>
            )}
          </DialogActions>
        </Dialog>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
        >
          <Alert 
            onClose={handleCloseSnackbar} 
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </motion.div>
    </Container>
  );
};

export default PaymentManagement;
