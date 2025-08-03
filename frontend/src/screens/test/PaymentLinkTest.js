import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Alert,
  Paper,
  Divider,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Chip
} from '@mui/material';
import { Send as SendIcon, Link as LinkIcon, Email as EmailIcon } from '@mui/icons-material';
import authService from '../api/auth';

const PaymentLinkTest = () => {
  const [companyCode, setCompanyCode] = useState('TCS');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const testGetPaymentLink = async () => {
    try {
      setLoading(true);
      setError('');
      setResult(null);
      
      const response = await authService.getPaymentLink(companyCode);
      setResult({
        type: 'get',
        success: true,
        data: response
      });
      
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      setResult({
        type: 'get',
        success: false,
        error: err.response?.data || err.message
      });
    } finally {
      setLoading(false);
    }
  };

  const testSendPaymentLink = async () => {
    try {
      setLoading(true);
      setError('');
      setResult(null);
      
      const response = await authService.sendPaymentLink(companyCode);
      setResult({
        type: 'send',
        success: true,
        data: response
      });
      
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      setResult({
        type: 'send',
        success: false,
        error: err.response?.data || err.message
      });
    } finally {
      setLoading(false);
    }
  };

  const testGetPendingPayments = async () => {
    try {
      setLoading(true);
      setError('');
      setResult(null);
      
      const response = await authService.getPendingPayments();
      setResult({
        type: 'pending',
        success: true,
        data: response
      });
      
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      setResult({
        type: 'pending',
        success: false,
        error: err.response?.data || err.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" fontWeight="bold" color="primary" gutterBottom>
        Payment Link System Test
      </Typography>
      
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Test Company Code
        </Typography>
        <TextField
          fullWidth
          label="Company Code"
          value={companyCode}
          onChange={(e) => setCompanyCode(e.target.value.toUpperCase())}
          sx={{ mb: 2 }}
          placeholder="Enter company code (e.g., TCS)"
        />
        
        <Box display="flex" gap={2} flexWrap="wrap">
          <Button
            variant="contained"
            startIcon={<LinkIcon />}
            onClick={testGetPaymentLink}
            disabled={loading || !companyCode}
          >
            Get Payment Link
          </Button>
          
          <Button
            variant="contained"
            startIcon={<EmailIcon />}
            onClick={testSendPaymentLink}
            disabled={loading || !companyCode}
            color="secondary"
          >
            Send Payment Link Email
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<SendIcon />}
            onClick={testGetPendingPayments}
            disabled={loading}
          >
            Get All Pending Payments
          </Button>
        </Box>
      </Paper>

      {loading && (
        <Box display="flex" justifyContent="center" my={3}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {result && (
        <Paper elevation={3} sx={{ p: 3 }}>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Typography variant="h6">
              Test Result: {result.type.toUpperCase()}
            </Typography>
            <Chip 
              label={result.success ? 'SUCCESS' : 'ERROR'} 
              color={result.success ? 'success' : 'error'}
            />
          </Box>
          
          <Divider sx={{ mb: 2 }} />
          
          {result.success ? (
            <Box>
              {result.type === 'get' && (
                <List>
                  <ListItem>
                    <ListItemText
                      primary="Company Name"
                      secondary={result.data.company?.name}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Company Code"
                      secondary={result.data.company?.companyCode}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Contact Email"
                      secondary={result.data.company?.contactEmail}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Payment Link"
                      secondary={
                        <Box sx={{ wordBreak: 'break-all', fontFamily: 'monospace', mt: 1 }}>
                          {result.data.paymentLink}
                        </Box>
                      }
                    />
                  </ListItem>
                </List>
              )}
              
              {result.type === 'send' && (
                <List>
                  <ListItem>
                    <ListItemText
                      primary="Message"
                      secondary={result.data.message}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Email Sent To"
                      secondary={result.data.company?.contactEmail}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Payment Link"
                      secondary={
                        <Box sx={{ wordBreak: 'break-all', fontFamily: 'monospace', mt: 1 }}>
                          {result.data.paymentLink}
                        </Box>
                      }
                    />
                  </ListItem>
                </List>
              )}
              
              {result.type === 'pending' && (
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Found {result.data.count} companies with pending payments:
                  </Typography>
                  <List>
                    {result.data.companies?.map((company, index) => (
                      <ListItem key={index} divider>
                        <ListItemText
                          primary={`${company.name} (${company.companyCode})`}
                          secondary={
                            <Box>
                              <Box>Email: {company.contactEmail}</Box>
                              <Box>Days since registration: {company.daysSinceRegistration}</Box>
                              <Box sx={{ mt: 1 }}>
                                <Chip 
                                  label={company.paymentLinkShared ? 'Link Shared' : 'Not Contacted'} 
                                  color={company.paymentLinkShared ? 'primary' : 'warning'}
                                  size="small"
                                />
                              </Box>
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
              
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Raw Response:
                </Typography>
                <pre style={{ fontSize: '12px', overflow: 'auto', marginTop: '8px' }}>
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </Box>
            </Box>
          ) : (
            <Alert severity="error">
              <Typography variant="subtitle2">Error Details:</Typography>
              <pre style={{ fontSize: '12px', marginTop: '8px' }}>
                {JSON.stringify(result.error, null, 2)}
              </pre>
            </Alert>
          )}
        </Paper>
      )}
      
      <Paper elevation={1} sx={{ p: 2, mt: 3, bgcolor: 'grey.50' }}>
        <Typography variant="caption" color="text.secondary">
          <strong>Instructions:</strong><br/>
          1. Enter a company code that has completed registration but not payment<br/>
          2. Test "Get Payment Link" to verify the link generation works<br/>
          3. Test "Send Payment Link Email" to send the payment link via email<br/>
          4. Test "Get All Pending Payments" to see all companies needing payment
        </Typography>
      </Paper>
    </Container>
  );
};

export default PaymentLinkTest;
