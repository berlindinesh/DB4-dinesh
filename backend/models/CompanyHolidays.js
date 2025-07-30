import mongoose from 'mongoose';

const companyHolidaySchema = new mongoose.Schema({
    week: {
        type: String,
        required: true,
        enum: ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'All Weeks']
    },
    day: {
        type: String,
        required: true,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    }
});

// Create model for CompanyHoliday in the main database (for backward compatibility)
const CompanyHoliday = mongoose.model('CompanyHoliday', companyHolidaySchema);

// Export the schema for company-specific models
export { companyHolidaySchema };

// Export the main model as default
export default CompanyHoliday;
