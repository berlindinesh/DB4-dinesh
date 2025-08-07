import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Divider,
  Alert,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  useTheme,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  CreditCard,
  AccountBalance,
  Phone,
  QrCode,
  Security,
  CheckCircle,
  Schedule,
  Payment,
  Receipt
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import authService from '../screens/api/auth';

const PaymentGateway = ({ 
  companyCode, 
  adminEmail, 
  companyName,
  onPaymentSuccess, 
  onPaymentFailure,
  open,
  onClose 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentConfig, setPaymentConfig] = useState(null);
  const [paymentOrder, setPaymentOrder] = useState(null);
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    
    return () => {
      document.body.removeChild(script);
    };
  }, []);
  
  // Fetch payment configuration
  useEffect(() => {
    if (open) {
      fetchPaymentConfig();
    }
  }, [open]);
  
  const fetchPaymentConfig = async () => {
    try {
      setError(''); // Clear any previous errors
      const config = await authService.getPaymentConfig();
      setPaymentConfig(config.config);
    } catch (error) {
      console.error('Failed to fetch payment config:', error);
      
      // Provide specific error messages based on the error type
      let errorMessage = 'Failed to load payment configuration';
      if (error.response?.status === 401) {
        errorMessage = 'Payment service is currently unavailable. Please try again later.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Payment service error. Please contact support if this persists.';
      } else if (error.message === 'Network Error') {
        errorMessage = 'Network connection error. Please check your internet connection and try again.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      setError(errorMessage);
    }
  };
  
  const createPaymentOrder = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Creating payment order:', { companyCode, adminEmail });
      const order = await authService.createPaymentOrder(companyCode, adminEmail);
      
      console.log('Payment order created:', order);
      setPaymentOrder(order);
      setShowPaymentMethods(true);
      
    } catch (error) {
      console.error('Payment order creation failed:', error);
      console.error('Error details:', {
        status: error.response?.status,
        message: error.response?.data?.message,
        data: error.response?.data
      });
      
      // Provide more specific error messages
      let errorMessage = 'Failed to create payment order';
      if (error.response?.status === 402) {
        errorMessage = 'Payment validation failed. Please check company registration status.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Authentication required. Please login again.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  const handlePayment = (paymentMethod) => {
    if (!paymentOrder || !window.Razorpay) {
      setError('Payment system not ready. Please try again.');
      return;
    }
    
    const options = {
      key: paymentOrder.paymentConfig.key,
      amount: paymentOrder.amount,
      currency: paymentOrder.currency,
      name: 'HRMS Registration',
      description: paymentOrder.description,
      order_id: paymentOrder.orderId,
      prefill: paymentOrder.prefill,
      theme: paymentOrder.paymentConfig.theme,
      method: paymentOrder.paymentConfig.method,
      timeout: paymentOrder.paymentConfig.timeout,
      modal: {
        ondismiss: () => {
          setError('Payment was cancelled by user');
        }
      },
      handler: async (response) => {
        try {
          setLoading(true);
          
          const verificationData = {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            companyCode
          };
          
          const result = await authService.verifyPayment(verificationData);
          
          if (result.success) {
            onPaymentSuccess(result.paymentDetails);
          } else {
            throw new Error(result.message || 'Payment verification failed');
          }
          
        } catch (error) {
          console.error('Payment verification failed:', error);
          setError(error.message || 'Payment verification failed');
          onPaymentFailure(error);
        } finally {
          setLoading(false);
        }
      }
    };
    
    const razorpay = new window.Razorpay(options);
    razorpay.open();
  };
  
  const paymentMethods = [
    {
      id: 'card',
      name: 'Credit/Debit Card',
      description: 'Visa, Mastercard, RuPay, Amex',
      icon: CreditCard,
      color: '#1976d2',
      popular: true
    },
    {
      id: 'upi',
      name: 'UPI',
      description: 'Google Pay, PhonePe, Paytm, BHIM',
      icon: QrCode,
      color: '#4caf50',
      popular: true
    },
    {
      id: 'netbanking',
      name: 'Net Banking',
      description: 'All major banks supported',
      icon: AccountBalance,
      color: '#ff9800',
      popular: false
    },
    {
      id: 'wallet',
      name: 'Digital Wallets',
      description: 'Paytm, Amazon Pay, Mobikwik',
      icon: Phone,
      color: '#9c27b0',
      popular: false
    }
  ];
  
  const features = [
    { icon: Security, text: 'SSL Encrypted & Secure' },
    { icon: CheckCircle, text: 'Instant Payment Confirmation' },
    { icon: Schedule, text: 'Available 24/7' },
    { icon: Receipt, text: 'Digital Receipt' }
  ];
  
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: isMobile ? 0 : '16px',
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle sx={{ 
        textAlign: 'center', 
        pb: 1,
        background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
        color: 'white',
        position: 'relative'
      }}>
        <Typography variant="h5" fontWeight="bold">
          Complete Your Registration
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
          Secure payment powered by Razorpay
        </Typography>
      </DialogTitle>
      
      <DialogContent sx={{ p: isMobile ? 2 : 3 }}>
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Alert 
                severity="error" 
                sx={{ mb: 3 }}
                action={
                  !paymentConfig && (
                    <Button 
                      color="inherit" 
                      size="small" 
                      onClick={fetchPaymentConfig}
                      disabled={loading}
                    >
                      Retry
                    </Button>
                  )
                }
              >
                {error}
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>
        
        {!showPaymentMethods ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Payment Summary */}
            <Paper 
              elevation={3} 
              sx={{ 
                p: 3, 
                mb: 3, 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                borderRadius: '16px'
              }}
            >
              <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap">
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    HRMS Registration Fee
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    {companyName}
                  </Typography>
                </Box>
                <Box textAlign="right">
                  <Typography variant="h4" fontWeight="bold">
                    ₹{paymentConfig?.amount || '20,000'}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    One-time payment
                  </Typography>
                </Box>
              </Box>
            </Paper>
            
            {/* Features */}
            <Typography variant="h6" gutterBottom fontWeight="600" color="primary">
              Why Choose Our Payment System?
            </Typography>
            
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {features.map((feature, index) => (
                <Grid item xs={12} sm={6} key={index}>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Box display="flex" alignItems="center" gap={2}>
                      <feature.icon color="primary" />
                      <Typography variant="body2" fontWeight="500">
                        {feature.text}
                      </Typography>
                    </Box>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
            
            <Divider sx={{ my: 3 }} />
            
            {/* Payment Details */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" fontWeight="600" gutterBottom>
                Payment Details
              </Typography>
              <List dense>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText 
                    primary="Registration Fee" 
                    secondary="Complete HRMS setup and activation"
                  />
                  <Typography variant="h6" fontWeight="bold">
                    ₹{paymentConfig?.amount || '20,000'}
                  </Typography>
                </ListItem>
                <Divider />
                <ListItem sx={{ px: 0 }}>
                  <ListItemText 
                    primary={<Typography fontWeight="bold">Total Amount</Typography>}
                  />
                  <Typography variant="h6" fontWeight="bold" color="primary">
                    ₹{paymentConfig?.amount || '20,000'}
                  </Typography>
                </ListItem>
              </List>
            </Box>
            
            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={createPaymentOrder}
              disabled={loading}
              sx={{
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 'bold',
                borderRadius: '12px',
                background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #1565c0 30%, #1976d2 90%)',
                }
              }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                <>
                  <Payment sx={{ mr: 1 }} />
                  Proceed to Payment
                </>
              )}
            </Button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Payment Methods */}
            <Typography variant="h6" gutterBottom fontWeight="600" textAlign="center">
              Choose Your Payment Method
            </Typography>
            
            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 3 }}>
              All payment methods are secure and encrypted
            </Typography>
            
            <Grid container spacing={2}>
              {paymentMethods.map((method) => (
                <Grid item xs={12} sm={6} key={method.id}>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card
                      sx={{
                        cursor: 'pointer',
                        border: '2px solid transparent',
                        transition: 'all 0.3s ease',
                        position: 'relative',
                        '&:hover': {
                          borderColor: method.color,
                          boxShadow: `0 4px 20px ${method.color}30`,
                        }
                      }}
                      onClick={() => handlePayment(method.id)}
                    >
                      {method.popular && (
                        <Chip
                          label="Popular"
                          size="small"
                          sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            bgcolor: '#4caf50',
                            color: 'white',
                            fontWeight: 'bold'
                          }}
                        />
                      )}
                      
                      <CardContent sx={{ textAlign: 'center', py: 3 }}>
                        <method.icon 
                          sx={{ 
                            fontSize: 48, 
                            color: method.color, 
                            mb: 1 
                          }} 
                        />
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                          {method.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {method.description}
                        </Typography>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
            
            <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Typography variant="caption" color="text.secondary" textAlign="center" display="block">
                🔒 Your payment information is secure and encrypted. 
                We do not store your card details.
              </Typography>
            </Box>
          </motion.div>
        )}
      </DialogContent>
      
      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        {showPaymentMethods && (
          <Button 
            onClick={() => setShowPaymentMethods(false)}
            disabled={loading}
          >
            Back
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default PaymentGateway;
