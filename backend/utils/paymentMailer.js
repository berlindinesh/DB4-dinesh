import nodemailer from 'nodemailer';
import { PAYMENT_CONFIG } from '../config/payment.js';

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
      user: process.env.USER,
      pass: process.env.PASS
    }
  });
};

// Send payment success email to company
export const sendPaymentSuccessEmail = async (recipientEmail, paymentDetails) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"HRMS Support" <${process.env.USER}>`,
      to: recipientEmail,
      subject: '🎉 Payment Successful - HRMS Plan Activated',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <div style="text-align: center; background: linear-gradient(45deg, #4a90e2 30%, #42a5f5 90%); color: white; padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">🎉 Payment Successful!</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">Your HRMS plan has been activated</p>
          </div>
          
          <div style="padding: 30px; background-color: #f9f9f9;">
            <h2 style="color: #333; margin-bottom: 20px;">Dear ${paymentDetails.companyName} Team,</h2>
            
            <p style="color: #666; line-height: 1.6; font-size: 16px;">
              Congratulations! Your payment has been successfully processed, and your HRMS plan is now active.
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4a90e2;">
              <h3 style="color: #4a90e2; margin-top: 0;">Payment Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #333;">Amount Paid:</td>
                  <td style="padding: 8px 0; color: #666;">₹${paymentDetails.amount}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #333;">Payment ID:</td>
                  <td style="padding: 8px 0; color: #666; font-family: monospace;">${paymentDetails.paymentId}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #333;">Plan Start Date:</td>
                  <td style="padding: 8px 0; color: #666;">${new Date(paymentDetails.planStartDate).toLocaleDateString('en-IN')}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #333;">Plan End Date:</td>
                  <td style="padding: 8px 0; color: #666;">${new Date(paymentDetails.planEndDate).toLocaleDateString('en-IN')}</td>
                </tr>
              </table>
            </div>
            
            <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #2e7d32; margin-top: 0;">✅ What's Next?</h3>
              <ul style="color: #2e7d32; line-height: 1.8;">
                <li>Your company account is now fully activated</li>
                <li>All users can now access the HRMS system</li>
                <li>Your plan is valid until ${new Date(paymentDetails.planEndDate).toLocaleDateString('en-IN')}</li>
                <li>You'll receive reminder notifications before plan expiry</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" 
                 style="background: #4a90e2; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                Access HRMS Dashboard
              </a>
            </div>
            
            <p style="color: #666; line-height: 1.6; font-size: 14px; margin-top: 30px;">
              If you have any questions or need assistance, please don't hesitate to contact our support team.
            </p>
            
            <div style="text-align: center; padding: 20px 0; border-top: 1px solid #ddd; margin-top: 30px;">
              <p style="margin: 0; color: #999; font-size: 12px;">
                This is an automated email. Please do not reply to this email.
              </p>
              <p style="margin: 5px 0 0 0; color: #999; font-size: 12px;">
                © ${new Date().getFullYear()} HRMS. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Payment success email sent to: ${recipientEmail}`);
    
  } catch (error) {
    console.error('Error sending payment success email:', error);
    throw error;
  }
};

// Send payment notification to super admin
export const sendPaymentNotificationToSuperAdmin = async (paymentInfo) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"HRMS System" <${process.env.USER}>`,
      to: PAYMENT_CONFIG.SUPER_ADMIN_EMAIL,
      subject: `💰 New Payment Received - ${paymentInfo.companyName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <div style="text-align: center; background: linear-gradient(45deg, #2e7d32 30%, #4caf50 90%); color: white; padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">💰 Payment Received</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">New company activation</p>
          </div>
          
          <div style="padding: 30px; background-color: #f9f9f9;">
            <h2 style="color: #333; margin-bottom: 20px;">Payment Notification</h2>
            
            <p style="color: #666; line-height: 1.6; font-size: 16px;">
              A new company has successfully completed their HRMS registration payment.
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2e7d32;">
              <h3 style="color: #2e7d32; margin-top: 0;">Company & Payment Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #333;">Company Name:</td>
                  <td style="padding: 8px 0; color: #666;">${paymentInfo.companyName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #333;">Company Code:</td>
                  <td style="padding: 8px 0; color: #666; font-family: monospace;">${paymentInfo.companyCode}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #333;">Contact Email:</td>
                  <td style="padding: 8px 0; color: #666;">${paymentInfo.contactEmail}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #333;">Amount Paid:</td>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">₹${paymentInfo.amount}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #333;">Payment ID:</td>
                  <td style="padding: 8px 0; color: #666; font-family: monospace;">${paymentInfo.paymentId}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #333;">Plan Period:</td>
                  <td style="padding: 8px 0; color: #666;">
                    ${new Date(paymentInfo.planStartDate).toLocaleDateString('en-IN')} to 
                    ${new Date(paymentInfo.planEndDate).toLocaleDateString('en-IN')}
                  </td>
                </tr>
              </table>
            </div>
            
            <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1976d2; margin-top: 0;">📊 System Status</h3>
              <ul style="color: #1976d2; line-height: 1.8;">
                <li>Company account activated successfully</li>
                <li>Plan duration: ${PAYMENT_CONFIG.PLAN_DURATION_DAYS} days</li>
                <li>Payment verified and processed</li>
                <li>Automatic reminders scheduled</li>
              </ul>
            </div>
            
            <div style="text-align: center; padding: 20px 0; border-top: 1px solid #ddd; margin-top: 30px;">
              <p style="margin: 0; color: #999; font-size: 12px;">
                This is an automated system notification.
              </p>
              <p style="margin: 5px 0 0 0; color: #999; font-size: 12px;">
                Generated on: ${new Date().toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Payment notification sent to super admin: ${PAYMENT_CONFIG.SUPER_ADMIN_EMAIL}`);
    
  } catch (error) {
    console.error('Error sending payment notification to super admin:', error);
    throw error;
  }
};

// Send plan expiry reminder
export const sendPlanExpiryReminder = async (company, daysLeft) => {
  try {
    const transporter = createTransporter();
    
    let subject, urgencyClass, urgencyText;
    
    if (daysLeft <= 0) {
      subject = '🚨 URGENT: Your HRMS Plan Has Expired';
      urgencyClass = '#d32f2f';
      urgencyText = 'EXPIRED';
    } else if (daysLeft === 1) {
      subject = '⚠️ URGENT: Your HRMS Plan Expires Tomorrow';
      urgencyClass = '#f57c00';
      urgencyText = 'EXPIRES TOMORROW';
    } else {
      subject = `⏰ Reminder: Your HRMS Plan Expires in ${daysLeft} Days`;
      urgencyClass = '#1976d2';
      urgencyText = `${daysLeft} DAYS LEFT`;
    }
    
    const mailOptions = {
      from: `"HRMS Support" <${process.env.USER}>`,
      to: company.contactEmail,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <div style="text-align: center; background: ${urgencyClass}; color: white; padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">⏰ Plan Expiry Reminder</h1>
            <p style="margin: 10px 0 0 0; font-size: 18px; font-weight: bold;">${urgencyText}</p>
          </div>
          
          <div style="padding: 30px; background-color: #f9f9f9;">
            <h2 style="color: #333; margin-bottom: 20px;">Dear ${company.name} Team,</h2>
            
            <p style="color: #666; line-height: 1.6; font-size: 16px;">
              ${daysLeft <= 0 ? 
                'Your HRMS plan has expired. Please renew immediately to continue using the system.' :
                `This is a friendly reminder that your HRMS plan will expire in ${daysLeft} day${daysLeft === 1 ? '' : 's'}.`
              }
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${urgencyClass};">
              <h3 style="color: ${urgencyClass}; margin-top: 0;">Plan Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #333;">Company:</td>
                  <td style="padding: 8px 0; color: #666;">${company.name}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #333;">Current Plan End Date:</td>
                  <td style="padding: 8px 0; color: #666;">${new Date(company.planEndDate).toLocaleDateString('en-IN')}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #333;">Days Remaining:</td>
                  <td style="padding: 8px 0; color: ${urgencyClass}; font-weight: bold;">${daysLeft > 0 ? daysLeft : 0} days</td>
                </tr>
              </table>
            </div>
            
            ${daysLeft <= 0 ? `
              <div style="background: #ffebee; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #d32f2f;">
                <h3 style="color: #d32f2f; margin-top: 0;">🚨 Immediate Action Required</h3>
                <ul style="color: #d32f2f; line-height: 1.8;">
                  <li>Your account has been temporarily suspended</li>
                  <li>Users cannot access the system until renewal</li>
                  <li>Data is safe but access is restricted</li>
                  <li>Renew now to restore full access</li>
                </ul>
              </div>
            ` : `
              <div style="background: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #f57c00; margin-top: 0;">📝 Action Required</h3>
                <ul style="color: #f57c00; line-height: 1.8;">
                  <li>Plan renewal is required to continue service</li>
                  <li>Contact support to renew your subscription</li>
                  <li>Avoid service interruption by renewing early</li>
                  <li>Your data will remain safe during transition</li>
                </ul>
              </div>
            `}
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="mailto:${process.env.USER}?subject=HRMS Plan Renewal - ${company.companyCode}" 
                 style="background: ${urgencyClass}; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                Contact Support for Renewal
              </a>
            </div>
            
            <p style="color: #666; line-height: 1.6; font-size: 14px; margin-top: 30px;">
              For immediate assistance, please contact our support team. We're here to help ensure continuity of your HRMS services.
            </p>
            
            <div style="text-align: center; padding: 20px 0; border-top: 1px solid #ddd; margin-top: 30px;">
              <p style="margin: 0; color: #999; font-size: 12px;">
                This is an automated reminder. Please contact support for any questions.
              </p>
              <p style="margin: 5px 0 0 0; color: #999; font-size: 12px;">
                © ${new Date().getFullYear()} HRMS. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Plan expiry reminder sent to: ${company.contactEmail} (${daysLeft} days left)`);
    
  } catch (error) {
    console.error('Error sending plan expiry reminder:', error);
    throw error;
  }
};

// Send payment link email to company
export const sendPaymentLinkEmail = async (company, paymentLink) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"HRMS Support" <${process.env.USER}>`,
      to: company.contactEmail,
      subject: '💳 Complete Your HRMS Registration Payment',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <div style="text-align: center; background: linear-gradient(45deg, #ff6b6b 30%, #4ecdc4 90%); color: white; padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">💳 Payment Required</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">Complete your HRMS registration</p>
          </div>
          
          <div style="padding: 30px; background-color: #f9f9f9;">
            <h2 style="color: #333; margin-bottom: 20px;">Dear ${company.name} Team,</h2>
            
            <p style="color: #666; line-height: 1.6; font-size: 16px;">
              Your company registration is almost complete! To activate your HRMS account and start using our services, please complete the payment process.
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff6b6b;">
              <h3 style="color: #ff6b6b; margin-top: 0;">Company Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #333;">Company Name:</td>
                  <td style="padding: 8px 0; color: #666;">${company.name}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #333;">Company Code:</td>
                  <td style="padding: 8px 0; color: #666; font-family: monospace;">${company.companyCode}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #333;">Registration Fee:</td>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">₹20,000</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #333;">Plan Duration:</td>
                  <td style="padding: 8px 0; color: #666;">365 days from payment date</td>
                </tr>
              </table>
            </div>
            
            <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1976d2; margin-top: 0;">🎯 What You'll Get</h3>
              <ul style="color: #1976d2; line-height: 1.8;">
                <li>Complete HRMS system access</li>
                <li>Employee management tools</li>
                <li>Payroll and attendance tracking</li>
                <li>Leave management system</li>
                <li>365 days of full service</li>
                <li>Technical support included</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${paymentLink}" 
                 style="background: linear-gradient(45deg, #ff6b6b 30%, #4ecdc4 90%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; font-size: 18px;">
                Complete Payment Now
              </a>
            </div>
            
            <div style="background: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #f57c00; margin-top: 0;">⚠️ Important</h3>
              <ul style="color: #f57c00; line-height: 1.8;">
                <li>Your account will remain inactive until payment is completed</li>
                <li>Users cannot access the system without payment</li>
                <li>This payment link is valid for 365 days</li>
                <li>Payment is secure and processed by Razorpay</li>
              </ul>
            </div>
            
            <p style="color: #666; line-height: 1.6; font-size: 14px; margin-top: 30px;">
              If you have any questions or need assistance with the payment process, please don't hesitate to contact our support team.
            </p>
            
            <div style="text-align: center; padding: 20px 0; border-top: 1px solid #ddd; margin-top: 30px;">
              <p style="margin: 0; color: #999; font-size: 12px;">
                This payment link is secure and protected. Complete payment to activate your account.
              </p>
              <p style="margin: 5px 0 0 0; color: #999; font-size: 12px;">
                © ${new Date().getFullYear()} HRMS. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Payment link email sent to: ${company.contactEmail}`);
    
  } catch (error) {
    console.error('Error sending payment link email:', error);
    throw error;
  }
};

// Send payment reminder email
export const sendPaymentReminderEmail = async (company, daysLeft) => {
  try {
    const transporter = createTransporter();
    const paymentLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/${company.companyCode}`;
    
    const mailOptions = {
      from: `"HRMS Support" <${process.env.USER}>`,
      to: company.contactEmail,
      subject: `⏰ Payment Reminder - ${daysLeft} Days Left to Complete Registration`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <div style="text-align: center; background: linear-gradient(45deg, #f57c00 30%, #ff9800 90%); color: white; padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">⏰ Payment Reminder</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">${daysLeft} days left to complete payment</p>
          </div>
          
          <div style="padding: 30px; background-color: #f9f9f9;">
            <h2 style="color: #333; margin-bottom: 20px;">Dear ${company.name} Team,</h2>
            
            <p style="color: #666; line-height: 1.6; font-size: 16px;">
              This is a reminder that your HRMS registration payment is still pending. You have <strong>${daysLeft} days</strong> left to complete the payment and activate your account.
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f57c00;">
              <h3 style="color: #f57c00; margin-top: 0;">⚠️ Action Required</h3>
              <ul style="color: #f57c00; line-height: 1.8;">
                <li>Complete payment to activate your HRMS account</li>
                <li>Users cannot access the system until payment is processed</li>
                <li>Don't lose access to your registered account</li>
                <li>Payment amount: ₹20,000 (One-time setup fee)</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${paymentLink}" 
                 style="background: linear-gradient(45deg, #f57c00 30%, #ff9800 90%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; font-size: 18px;">
                Complete Payment Now
              </a>
            </div>
            
            <p style="color: #666; line-height: 1.6; font-size: 14px; margin-top: 30px;">
              If you have any questions about the payment process, please contact our support team immediately.
            </p>
            
            <div style="text-align: center; padding: 20px 0; border-top: 1px solid #ddd; margin-top: 30px;">
              <p style="margin: 0; color: #999; font-size: 12px;">
                This is an automated reminder. Complete payment to avoid account deactivation.
              </p>
              <p style="margin: 5px 0 0 0; color: #999; font-size: 12px;">
                © ${new Date().getFullYear()} HRMS. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Payment reminder email sent to: ${company.contactEmail} (${daysLeft} days left)`);
    
  } catch (error) {
    console.error('Error sending payment reminder email:', error);
    throw error;
  }
};

export default {
  sendPaymentSuccessEmail,
  sendPaymentNotificationToSuperAdmin,
  sendPlanExpiryReminder,
  sendPaymentLinkEmail,
  sendPaymentReminderEmail
};
