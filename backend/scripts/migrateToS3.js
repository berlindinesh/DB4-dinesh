import fs from 'fs';
import path from 'path';
import s3Service from '../services/s3Service.js';
import { connectMainDB } from '../config/db.js';
import { getCompanyModel } from '../utils/getCompanyModel.js';
import dotenv from 'dotenv';

dotenv.config();

// Migration script to move existing local images to S3
class S3Migration {
  constructor() {
    this.migratedCount = 0;
    this.failedCount = 0;
    this.errors = [];
  }

  // Get all employee records from all companies
  async getAllEmployees() {
    const employees = [];
    const companyRegex = /^hrms_/;
    
    try {
      // Connect to main DB to get company list
      await connectMainDB();
      
      // Get all databases that match company pattern
      const admin = mongoose.connection.db.admin();
      const result = await admin.listDatabases();
      const companyDbs = result.databases
        .filter(db => companyRegex.test(db.name))
        .map(db => db.name.replace('hrms_', ''));

      console.log(`Found ${companyDbs.length} company databases`);

      // Get employees from each company
      for (const companyCode of companyDbs) {
        try {
          const Employee = await getCompanyModel('Employee', companyCode);
          const companyEmployees = await Employee.find({
            'personalInfo.employeeImage': { $exists: true, $ne: '' }
          }).lean();

          companyEmployees.forEach(emp => {
            if (emp.personalInfo?.employeeImage) {
              employees.push({
                _id: emp._id,
                companyCode,
                employeeImage: emp.personalInfo.employeeImage,
                firstName: emp.personalInfo?.firstName || 'Unknown',
                lastName: emp.personalInfo?.lastName || ''
              });
            }
          });

          console.log(`Found ${companyEmployees.length} employees with images in ${companyCode}`);
        } catch (error) {
          console.error(`Error getting employees from ${companyCode}:`, error.message);
        }
      }

      return employees;
    } catch (error) {
      console.error('Error getting employee data:', error);
      throw error;
    }
  }

  // Migrate a single employee's image
  async migrateEmployeeImage(employee) {
    try {
      const { _id, companyCode, employeeImage, firstName, lastName } = employee;
      
      // Skip if already an S3 URL
      if (employeeImage.includes('amazonaws.com')) {
        console.log(`✅ ${firstName} ${lastName} - Already on S3`);
        return { success: true, skipped: true };
      }

      // Extract filename from path
      const filename = path.basename(employeeImage);
      const localPath = employeeImage.startsWith('/uploads/') 
        ? employeeImage.replace('/uploads/', '') 
        : filename;

      // Check if local file exists
      const fullLocalPath = path.join(process.cwd(), 'uploads', localPath);
      if (!fs.existsSync(fullLocalPath)) {
        console.log(`❌ ${firstName} ${lastName} - Local file not found: ${localPath}`);
        return { success: false, error: 'Local file not found' };
      }

      // Generate S3 key
      const fileExtension = path.extname(filename);
      const s3Key = `employees/${companyCode}/${_id}/profile${fileExtension}`;

      // Migrate to S3
      const result = await s3Service.migrateLocalFileToS3(localPath, s3Key);

      if (result.success) {
        // Update employee record with S3 URL
        const Employee = await getCompanyModel('Employee', companyCode);
        await Employee.updateOne(
          { _id: _id },
          { 'personalInfo.employeeImage': result.url }
        );

        console.log(`✅ ${firstName} ${lastName} - Migrated to S3: ${result.url}`);
        this.migratedCount++;
        return { success: true, s3Url: result.url };
      } else {
        throw new Error('S3 upload failed');
      }
    } catch (error) {
      console.error(`❌ ${employee.firstName} ${employee.lastName} - Migration failed:`, error.message);
      this.failedCount++;
      this.errors.push({
        employee: `${employee.firstName} ${employee.lastName}`,
        error: error.message
      });
      return { success: false, error: error.message };
    }
  }

  // Run the complete migration
  async runMigration() {
    console.log('🚀 Starting S3 migration process...');
    
    try {
      // Test S3 connection first
      const connectionTest = await s3Service.testConnection();
      if (!connectionTest.success) {
        throw new Error(`S3 connection failed: ${connectionTest.message}`);
      }
      console.log('✅ S3 connection test passed');

      // Get all employees
      const employees = await this.getAllEmployees();
      console.log(`📋 Found ${employees.length} employees with images to migrate`);

      if (employees.length === 0) {
        console.log('No employees found with images to migrate');
        return;
      }

      // Migrate each employee's image
      for (let i = 0; i < employees.length; i++) {
        const employee = employees[i];
        console.log(`\n📸 [${i + 1}/${employees.length}] Processing ${employee.firstName} ${employee.lastName}...`);
        
        await this.migrateEmployeeImage(employee);
        
        // Add small delay to avoid overwhelming S3
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Print summary
      this.printSummary();

    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }

  // Print migration summary
  printSummary() {
    console.log('\n' + '='.repeat(50));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Successfully migrated: ${this.migratedCount}`);
    console.log(`❌ Failed migrations: ${this.failedCount}`);
    
    if (this.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      this.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.employee}: ${error.error}`);
      });
    }
    
    console.log('\n🎉 Migration completed!');
  }
}

// Run migration if script is called directly
if (process.argv[2] === 'run') {
  const migration = new S3Migration();
  migration.runMigration()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

export default S3Migration;
