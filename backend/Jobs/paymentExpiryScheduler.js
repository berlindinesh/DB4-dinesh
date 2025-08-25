import cron from 'node-cron';
import Company from '../models/Company.js';
import { sendPlanExpiryReminder } from '../utils/paymentMailer.js';
import { PAYMENT_CONFIG } from '../config/payment.js';

// Run every day at 9:00 AM
const SCHEDULE = '0 9 * * *';

// Helper function to determine reminder type and if it should be sent
const determineReminderType = (daysLeft, company) => {
  if (daysLeft <= 0 && !company.hasReminderBeenSent('expiry_notification')) {
    return { type: 'expiry_notification', shouldSend: true };
  }
  
  if (daysLeft === 1 && !company.hasReminderBeenSent('1_day_reminder')) {
    return { type: '1_day_reminder', shouldSend: true };
  }
  
  if (daysLeft === 5 && !company.hasReminderBeenSent('5_day_reminder')) {
    return { type: '5_day_reminder', shouldSend: true };
  }
  
  return { type: null, shouldSend: false };
};

// Helper function to process a single company's reminders
const processCompanyReminder = async (company) => {
  const daysLeft = company.getDaysUntilExpiry();
  const { type: reminderType, shouldSend } = determineReminderType(daysLeft, company);
  
  if (!shouldSend || !reminderType) {
    return;
  }
  
  await sendPlanExpiryReminder(company, daysLeft);
  await company.addReminderSent(reminderType);
  
  console.log(`✅ Sent ${reminderType} to ${company.name} (${daysLeft} days left)`);
};

// Helper function to process expired companies
const processExpiredCompanies = async () => {
  const expiredCompanies = await Company.getExpiredCompanies();
  console.log(`Found ${expiredCompanies.length} expired companies to process`);
  
  for (const company of expiredCompanies) {
    try {
      await company.checkPaymentExpiry();
      console.log(`✅ Marked ${company.name} as expired`);
    } catch (error) {
      console.error(`❌ Error marking ${company.name} as expired:`, error);
    }
  }
};

// Process plan expiry reminders (Refactored to reduce complexity)
export const processExpiryReminders = async () => {
  try {
    console.log('🔄 Starting plan expiry reminder check...');
    
    const companies = await Company.getCompaniesNeedingReminders();
    console.log(`Found ${companies.length} companies needing reminders`);
    
    for (const company of companies) {
      try {
        await processCompanyReminder(company);
      } catch (error) {
        console.error(`❌ Error processing reminders for ${company.name}:`, error);
      }
    }
    
    await processExpiredCompanies();
    
    console.log('✅ Plan expiry reminder check completed');
    
  } catch (error) {
    console.error('❌ Error in processExpiryReminders:', error);
  }
};

// Start the scheduler
export const startExpiryReminderScheduler = () => {
  // Validate configuration
  if (!PAYMENT_CONFIG.SUPER_ADMIN_EMAIL) {
    console.warn('⚠️  SUPER_ADMIN_EMAIL not configured - plan expiry reminders will not be sent to admin');
  }
  
  console.log(`🕐 Starting plan expiry reminder scheduler (${SCHEDULE})`);
  
  cron.schedule(SCHEDULE, async () => {
    console.log('⏰ Running scheduled plan expiry reminder check...');
    await processExpiryReminders();
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata" // Indian timezone
  });
  
  console.log('✅ Plan expiry reminder scheduler started');
  
  // Run immediately on startup for testing
  if (process.env.NODE_ENV === 'development') {
    console.log('🔄 Running initial expiry check (development mode)...');
    setTimeout(() => {
      processExpiryReminders();
    }, 5000); // Wait 5 seconds after startup
  }
};

// Stop the scheduler (for graceful shutdown)
export const stopExpiryReminderScheduler = () => {
  console.log('🛑 Stopping plan expiry reminder scheduler...');
  // Note: node-cron doesn't provide a direct way to stop all tasks
  // This is more for logging purposes
};

// Manual trigger for testing
export const triggerExpiryCheck = async () => {
  console.log('🔄 Manually triggering plan expiry check...');
  await processExpiryReminders();
};

export default {
  startExpiryReminderScheduler,
  stopExpiryReminderScheduler,
  processExpiryReminders,
  triggerExpiryCheck
};
