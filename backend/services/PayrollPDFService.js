import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import PDFDocument from 'pdfkit';
import https from 'https';
import http from 'http'; // Add HTTP import
import axios from 'axios';
import url from 'url'; // Add URL import for parsing

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a custom axios instance for backend use
const api = axios.create({
  baseURL: process.env.BACKEND_URL || 'http://localhost:5002'
});

export class PayrollPDFService {
  static async fetchCompanyDetails(token, companyCode) {
    try {
      // Use the custom api instance with proper headers
      const response = await api.get('/companies/details', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Company-Code': companyCode
        }
      });
      
      console.log('Company details response:', response.data);
      
      if (response.data && response.data.success && response.data.data) {
        return response.data.data;
      }
      
      // Return default values if API call fails or returns unexpected format
      return {
        name: 'DB4Cloud Technologies Pvt Ltd',
        address: '#24-361, Satyanarayana puram, KongaReddy Palli, Chittor Andhra Pradesh - 517001',
        email: 'info@db4cloud.com',
        phone: '',
        logoUrl: 'https://res.cloudinary.com/dfl9rotoy/image/upload/v1741065300/logo2-removebg-preview_p6juhh.png'
      };
    } catch (error) {
      console.error('Error fetching company details:', error);
      // Return default values if API call fails
      return {
        name: 'DB4Cloud Technologies Pvt Ltd',
        address: '#24-361, Satyanarayana puram, KongaReddy Palli, Chittor Andhra Pradesh - 517001',
        email: 'info@db4cloud.com',
        phone: '',
        logoUrl: 'https://res.cloudinary.com/dfl9rotoy/image/upload/v1741065300/logo2-removebg-preview_p6juhh.png'
      };
    }
  }

  static async generatePayslipPDF(payslipData, token, companyCode) {
    return new Promise(async (resolve, reject) => {
      try {
        console.log('Generating payslip with token and company code:', !!token, companyCode);
        
        // Fetch company details first
        const companyDetails = await this.fetchCompanyDetails(token, companyCode);
        console.log('Fetched company details:', companyDetails);
        
        // Ensure directories exist
        const uploadsDir = path.join(__dirname, '../uploads');
        const payslipsDir = path.join(uploadsDir, 'payslips');
        fs.mkdirSync(payslipsDir, { recursive: true });

        // Create a unique filename for the PDF
        const fileName = `payslip_${payslipData.empId}_${payslipData.month}_${payslipData.year}_${Date.now()}.pdf`;
        const filePath = path.join(payslipsDir, fileName);

        // Create a new PDF document
        const doc = new PDFDocument({ size: 'A4', margin: 40 });
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // Helper function to format currency
        const formatCurrency = (amount) => `Rs ${parseFloat(amount).toFixed(2)}`;

        // Extract values
        const { empId, empName, department, designation, bankDetails, basicPay, allowances, deductions, month, year, pfNo, uanNo, panNo, dateOfJoining } = payslipData;
        
        // Calculate working days and LOP days
        const totalDaysInMonth = new Date(year, month, 0).getDate();
        const workingDays = payslipData.workingDays || totalDaysInMonth;
        const lopDays = payslipData.lopDays || 0;
        const effectiveWorkingDays = workingDays - lopDays;
        
        // Calculate per day salary
        const perDaySalary = parseFloat(basicPay) / workingDays;
        
        // Calculate attendance ratio
        const attendanceRatio = effectiveWorkingDays / workingDays;

        // Helper function to draw a table cell
        const drawTableCell = (x, y, width, height, text, options = {}) => {
          const defaultOptions = {
            fontSize: 10,
            fontColor: '#333333',
            font: 'Helvetica',
            align: 'left',
            valign: 'top',
            padding: 5,
            fillColor: null,
            borderColor: '#cccccc',
            drawBorder: true
          };
          
          const opts = { ...defaultOptions, ...options };
          
          // Draw cell background if specified
          if (opts.fillColor) {
            doc.fillColor(opts.fillColor).rect(x, y, width, height).fill();
          }
          
          // Draw cell border
          if (opts.drawBorder) {
            doc.strokeColor(opts.borderColor).lineWidth(0.5)
              .rect(x, y, width, height).stroke();
          }
          
          // Draw text
          doc.font(opts.font === 'Helvetica-Bold' ? 'Helvetica-Bold' : 'Helvetica')
            .fontSize(opts.fontSize)
            .fillColor(opts.fontColor);
          
          const textX = x + opts.padding;
          const textY = y + opts.padding;
          const textWidth = width - (2 * opts.padding);
          
          doc.text(text || '', textX, textY, {
            width: textWidth,
            align: opts.align
          });
        };

        // Function to fetch and add the logo
        const addLogoAndContinue = () => {
          const logoUrl = companyDetails.logoUrl;
          console.log('Using logo URL:', logoUrl);
          
          // Parse the URL to determine whether to use http or https
          const parsedUrl = url.parse(logoUrl);
          
          // Choose the appropriate protocol
          const protocol = parsedUrl.protocol === 'https:' ? https : http;
          
          // Download the logo image
          protocol.get(logoUrl, (response) => {
            if (response.statusCode !== 200) {
              // If logo can't be fetched, continue without it
              console.error(`Failed to load logo: ${response.statusCode}`);
              continueWithPdfGeneration();
              return;
            }
            
            const chunks = [];
            response.on('data', (chunk) => chunks.push(chunk));
            response.on('end', () => {
              const logoData = Buffer.concat(chunks);
              
              // First add the regular logo at the top
              const logoWidth = 150;
              const logoHeight = 75;
              const logoX = (doc.page.width - logoWidth) / 2;
              const logoY = 40;
              
              doc.image(logoData, logoX, logoY, {
                width: logoWidth,
                height: logoHeight
              });
              
              // Start content after the logo
              doc.y = logoY + logoHeight + 10;
              
              // Continue with the rest of the PDF generation, passing the logo data
              // so we can add the watermark after all content is added
              continueWithPdfGeneration(logoData);
            });
          }).on('error', (err) => {
            console.error('Error downloading logo:', err);
            continueWithPdfGeneration();
          });
        };

        // Function to continue with PDF generation after logo
        const continueWithPdfGeneration = (logoData = null) => {
          /** -------------------- HEADER -------------------- **/
          // Company name and address first, after the logo
          
          doc.fontSize(20).fillColor('#f70505').font('Helvetica-Bold')
            .text(companyDetails.name, { align: 'center' });

          doc.moveDown(0.5)
            .fontSize(10).fillColor('#333333').text(companyDetails.address, { align: 'center' });
          
          // Add company email and phone if available
          if (companyDetails.email || companyDetails.phone) {
            let contactInfo = '';
            if (companyDetails.email) contactInfo += `Email: ${companyDetails.email}`;
            if (companyDetails.email && companyDetails.phone) contactInfo += ' | ';
            if (companyDetails.phone) contactInfo += `Phone: ${companyDetails.phone}`;
            
            doc.moveDown(0.3)
              .fontSize(9).fillColor('#333333').text(contactInfo, { align: 'center' });
          }

          doc.moveDown(0.8)
            .fontSize(14).fillColor('#555555').font('Helvetica-Bold')
            .text(`Payslip for the month of ${new Date(year, month - 1).toLocaleString('default', { month: 'long' })} ${year}`, { align: 'center' });

          doc.moveDown(2);
          
          // Now draw the header box
          doc.rect(40, doc.y, doc.page.width - 80, 30).fillAndStroke('#e6e6e6', '#cccccc');
          doc.fontSize(12).fillColor('#f70505').font('Helvetica-Bold')
            .text('EMPLOYEE DETAILS', 50, doc.y - 25, { align: 'left' });
          
          doc.moveDown(0.5);
          
          // Employee details table
          const startTableY = doc.y;
          const pageWidth = doc.page.width - 80;
          const colWidth = pageWidth / 2;
          
          const employeeDetails = [
            [
              { label: 'Employee ID', value: empId },
              { label: 'Bank Name', value: bankDetails?.bankName }
            ],
            [
              { label: 'Employee Name', value: empName },
              { label: 'Bank A/C No.', value: bankDetails?.accountNo }
            ],
            [
              { label: 'Date of Joining', value: dateOfJoining ? new Date(dateOfJoining).toLocaleDateString() : 'N/A' },
              { label: 'PAN Number', value: panNo }
            ],
            [
              { label: 'Department', value: department },
              { label: 'UAN Number', value: uanNo || 'N/A' }
            ],
            [
              { label: 'Designation', value: designation },
              { label: 'PF Number', value: pfNo }
            ],
            [
              { label: 'Working Days', value: workingDays.toString() },
              { label: 'LOP Days', value: lopDays.toString() }
            ],
            [
              { label: 'Payable Days', value: effectiveWorkingDays.toString() },
              { label: '', value: '' }  // Empty cell to maintain the layout
            ]
          ];
          
          // Draw employee details table
          let currentY = startTableY;
          const rowHeight = 25;
          
          employeeDetails.forEach((row, rowIndex) => {
            row.forEach((cell, colIndex) => {
              const x = 40 + (colIndex * colWidth);
              
              // Draw label cell
              drawTableCell(
                x, currentY, colWidth / 2, rowHeight,
                cell.label + '',
                { 
                  font: 'Helvetica-Bold',
                  fillColor: '#f5f5f5'
                }
              );
              
              // Draw value cell
              drawTableCell(
                x + (colWidth / 2), currentY, colWidth / 2, rowHeight,
                cell.value || 'N/A',
                { fillColor: '#ffffff' }
              );
            });
            
            currentY += rowHeight;
          });
          
          doc.y = currentY + 20;

          /** -------------------- EARNINGS & DEDUCTIONS -------------------- **/
          let earningsY = doc.y;
          let totalEarnings = 0, totalDeductions = 0;
          let totalActualEarnings = 0;

          // Section headers with table-like styling
          doc.rect(40, earningsY, pageWidth / 2, 30).fillAndStroke('#e6e6e6', '#cccccc');
          doc.rect(40 + (pageWidth / 2), earningsY, pageWidth / 2, 30).fillAndStroke('#e6e6e6', '#cccccc');
          
          doc.fontSize(12).fillColor('#f70505').font('Helvetica-Bold')
            .text('EARNINGS', 50, earningsY + 10);
          doc.text('DEDUCTIONS', 50 + (pageWidth / 2), earningsY + 10);

          earningsY += 30;

          // Process earnings - Only include allowances, not the basic pay separately
          // This aligns with the frontend logic where Total Pay is distributed across allowances
          const earnings = [];
          
          // Process allowances
          if (allowances && allowances.length > 0) {
            allowances.forEach(allowance => {
              // Calculate actual amount (before attendance adjustment)
              const actualAmount = parseFloat(basicPay) * (parseFloat(allowance.percentage) / 100);
              // Calculate earned amount (after attendance adjustment)
              const earnedAmount = parseFloat(allowance.amount);
              
              earnings.push({ 
                name: allowance.name, 
                actualAmount: actualAmount,
                earnedAmount: earnedAmount,
                percentage: allowance.percentage
              });
              
              // Add to total earnings
              totalActualEarnings += actualAmount;
              totalEarnings += earnedAmount;
            });
          }
          
          // Use deductions without any adjustment
          const deductionsList = deductions || [];

          const maxRows = Math.max(earnings.length, deductionsList.length);
          
          // Draw column headers for earnings
          drawTableCell(
            40, earningsY, 
            (pageWidth / 2) * 0.4, rowHeight,
            'Component',
            { font: 'Helvetica-Bold', fillColor: '#f0f0f0' }
          );
          
          drawTableCell(
            40 + ((pageWidth / 2) * 0.4), earningsY, 
            (pageWidth / 2) * 0.3, rowHeight,
            'Actual',
            { font: 'Helvetica-Bold', fillColor: '#f0f0f0', align: 'right' }
          );
          
          drawTableCell(
            40 + ((pageWidth / 2) * 0.7), earningsY, 
            (pageWidth / 2) * 0.3, rowHeight,
            'Earned',
            { font: 'Helvetica-Bold', fillColor: '#f0f0f0', align: 'right' }
          );
          
          // Draw column headers for deductions
          drawTableCell(
            40 + (pageWidth / 2), earningsY, 
            (pageWidth / 2) * 0.6, rowHeight,
                        'Deduction',
            { font: 'Helvetica-Bold', fillColor: '#f0f0f0' }
          );
          
          drawTableCell(
            40 + (pageWidth / 2) + ((pageWidth / 2) * 0.6), earningsY, 
            (pageWidth / 2) * 0.4, rowHeight,
            'Amount',
            { font: 'Helvetica-Bold', fillColor: '#f0f0f0', align: 'right' }
          );
          
          earningsY += rowHeight;
          
          // Draw earnings and deductions in table format
          for (let i = 0; i < maxRows; i++) {
            // Earnings column
            if (i < earnings.length) {
              // Component name
              drawTableCell(
                40, earningsY + (i * rowHeight), 
                (pageWidth / 2) * 0.4, rowHeight,
                earnings[i].name,
                { font: 'Helvetica-Bold', fontSize: 9 }
              );
              
              // Actual amount
              drawTableCell(
                40 + ((pageWidth / 2) * 0.4), earningsY + (i * rowHeight), 
                (pageWidth / 2) * 0.3, rowHeight,
                formatCurrency(earnings[i].actualAmount),
                { align: 'right', fontColor: '#555555' }
              );
              
              // Earned amount
              drawTableCell(
                40 + ((pageWidth / 2) * 0.7), earningsY + (i * rowHeight), 
                (pageWidth / 2) * 0.3, rowHeight,
                formatCurrency(earnings[i].earnedAmount),
                { align: 'right', font: 'Helvetica-Bold' }
              );
            } else {
              // Empty cells to maintain table structure
              drawTableCell(
                40, earningsY + (i * rowHeight), 
                (pageWidth / 2) * 0.4, rowHeight, 
                '',
                { fillColor: '#ffffff' }
              );
              
              drawTableCell(
                40 + ((pageWidth / 2) * 0.4), earningsY + (i * rowHeight), 
                (pageWidth / 2) * 0.3, rowHeight, 
                '',
                { fillColor: '#ffffff' }
              );
              
              drawTableCell(
                40 + ((pageWidth / 2) * 0.7), earningsY + (i * rowHeight), 
                (pageWidth / 2) * 0.3, rowHeight, 
                '',
                { fillColor: '#ffffff' }
              );
            }
            
            // Deductions column
            if (i < deductionsList.length) {
              drawTableCell(
                40 + (pageWidth / 2), earningsY + (i * rowHeight), 
                (pageWidth / 2) * 0.6, rowHeight,
                deductionsList[i].name,
                { font: 'Helvetica-Bold' }
              );
              
              drawTableCell(
                40 + (pageWidth / 2) + ((pageWidth / 2) * 0.6), earningsY + (i * rowHeight), 
                (pageWidth / 2) * 0.4, rowHeight,
                formatCurrency(deductionsList[i].amount),
                { align: 'right' }
              );
              
              totalDeductions += parseFloat(deductionsList[i].amount);
            } else {
              // Empty cells to maintain table structure
              drawTableCell(
                40 + (pageWidth / 2), earningsY + (i * rowHeight), 
                (pageWidth / 2) * 0.6, rowHeight, 
                '',
                { fillColor: '#ffffff' }
              );
              
              drawTableCell(
                40 + (pageWidth / 2) + ((pageWidth / 2) * 0.6), earningsY + (i * rowHeight), 
                (pageWidth / 2) * 0.4, rowHeight, 
                '',
                { fillColor: '#ffffff' }
              );
            }
          }

          const totalRowY = earningsY + (maxRows * rowHeight);

          /** -------------------- TOTALS -------------------- **/
          // Total Earnings - Actual
          drawTableCell(
            40, totalRowY, 
            (pageWidth / 2) * 0.4, rowHeight,
            'Total Earnings:',
            { font: 'Helvetica-Bold', fillColor: '#f0f0f0', fontColor: '#f70505' }
          );
          
          // Total Earnings - Actual
          drawTableCell(
            40 + ((pageWidth / 2) * 0.4), totalRowY, 
            (pageWidth / 2) * 0.3, rowHeight,
            formatCurrency(totalActualEarnings),
            { align: 'right', fillColor: '#f0f0f0', fontColor: '#555555' }
          );
          
          // Total Earnings - Earned
          drawTableCell(
            40 + ((pageWidth / 2) * 0.7), totalRowY, 
            (pageWidth / 2) * 0.3, rowHeight,
            formatCurrency(totalEarnings),
            { align: 'right', fillColor: '#f0f0f0', fontColor: '#f70505', font: 'Helvetica-Bold' }
          );
          
          // Total Deductions
          drawTableCell(
            40 + (pageWidth / 2), totalRowY, 
            (pageWidth / 2) * 0.6, rowHeight,
            'Total Deductions:',
            { font: 'Helvetica-Bold', fillColor: '#f0f0f0', fontColor: '#f70505' }
          );
          
          drawTableCell(
            40 + (pageWidth / 2) + ((pageWidth / 2) * 0.6), totalRowY, 
            (pageWidth / 2) * 0.4, rowHeight,
            formatCurrency(totalDeductions),
            { align: 'right', fillColor: '#f0f0f0', fontColor: '#f70505', font: 'Helvetica-Bold' }
          );

          /** -------------------- NET SALARY -------------------- **/
          // Use the netSalary value passed from the controller instead of recalculating it
          const netSalary = payslipData.netSalary || (totalEarnings - totalDeductions);
          const netSalaryY = totalRowY + rowHeight + 20;

          // Net salary box with highlight
          doc.rect(40, netSalaryY, pageWidth, rowHeight + 10)
            .fillAndStroke('#f0f0f0', '#cccccc');

          doc.fontSize(14).fillColor('#f70505').font('Helvetica-Bold')
            .text('NET SALARY:', 50, netSalaryY + 10);

          doc.fontSize(14).fillColor('#f70505').font('Helvetica-Bold')
            .text(formatCurrency(netSalary), 180, netSalaryY + 10);

          /** -------------------- DISCLAIMER -------------------- **/
          // Reduced the gap between net salary and disclaimer
          
          const disclaimerY = netSalaryY + rowHeight + 30;
          
          doc.rect(40, disclaimerY, pageWidth, 50)
            .fillAndStroke('#f9f9f9', '#cccccc');
          
          doc.fontSize(9).fillColor('#555555').font('Helvetica-Bold')
            .text('** Computer generated pay slip & does not require any signature & seal. **', 
                  40, disclaimerY + 15, { align: 'center' });
          
          doc.fontSize(9).fillColor('#555555').font('Helvetica')
            .text('** If you received this in error please destroy it along with any copies and notify the sender immediately **', 
                  40, disclaimerY + 30, { align: 'center' });

          // Add watermark if we have logo data
          if (logoData) {
            // Save the current state of the document
            doc.save();
            
            // Add watermark with higher opacity so it shows through colored elements
            const watermarkWidth = 700;
            const watermarkHeight = 700;
            const watermarkX = (doc.page.width - watermarkWidth) / 2;
            const watermarkY = (doc.page.height - watermarkHeight) / 2;
            
            // Use a higher opacity value (0.15 instead of 0.08)
            doc.opacity(0.15);
            
            // Add the watermark
            doc.image(logoData, watermarkX, watermarkY, {
              width: watermarkWidth,
              height: watermarkHeight,
            });
            
            // Restore the document state
            doc.restore();
          }

          doc.end();
        };

        // Start the PDF generation process by adding the logo first
        addLogoAndContinue();

        stream.on('finish', () => {
          console.log('PDF generation completed:', filePath);
          resolve(filePath);
        });
        stream.on('error', (err) => {
          console.error('Error in PDF stream:', err);
          reject(err);
        });
      } catch (error) {
        console.error('Error in generatePayslipPDF:', error);
        reject(error);
      }
    });
  }
}


            

