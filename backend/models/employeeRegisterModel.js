// import mongoose from 'mongoose';

// const onboardingFormSchema = new mongoose.Schema({

//   userId: {
//     type: String,
//     ref: 'User',
//     required: true,
//     unique: true
//   },
//     Emp_ID: { 
//     type: String,
//     unique: true,
//     },
//   registrationComplete: { type: Boolean, default: false },
//   personalInfo: {
//     prefix: String,
//     firstName: String,
//     lastName: String,
//     dob: Date,
//     gender: String,
//     maritalStatus: String,
//     bloodGroup: String,
//     nationality: String,
//     aadharNumber: { type: String, unique: true, spares:true },
//     panNumber: { type: String, unique: true, spares:true },
//     mobileNumber: { type: String, unique: true, spares:true },
//     email: { type: String, unique: true , spares:true },
//     employeeImage: String
//   },
//   addressDetails: {
//     presentAddress: {
//       address: String,  // Changed from { type: String, default: null }
//       city: String,
//       district: String,
//       state: String,
//       pinCode: String,
//       country: String
//     },
//     permanentAddress: {
//       address: String,
//       city: String,
//       district: String,
//       state: String,
//       pinCode: String,
//       country: String
//     }
//   },
//   joiningDetails: {
//     dateOfAppointment: Date,
//     dateOfJoining: Date,
//     department: String,
//     initialDesignation: String,
//     modeOfRecruitment: String,
//     employeeType: String,
//     shiftType: String, 
//     workType: String,
//     uanNumber: String,
//     pfNumber: String,
//     // shiftType: {
//     //   type: String,
//     //   enum: ['Morning Shift', 'Day Shift', 'Night Shift'],
//     //   default: 'Day Shift'
//     // },
//     // workType: {
//     //   type: String,
//     //   enum: ['Full Time', 'Part Time', 'Contract', 'Freelance', 'Remote', 'Work From Home'],
//     //   default: 'Full Time'
//     // }
  
//   },
//   educationDetails: {
//     basic: [{
//       education: {
//         type: String,
//         enum: ['10th', '12th']
//       },
//       institute: String,
//       board: String,
//       marks: Number,
//       year: Number,
//       grade: String,
//       stream: String
//     }],
//     professional: [{
//       education: {
//         type: String,
//         enum: ['UG', 'PG', 'Doctorate']
//       },
//       institute: String,
//       board: String,
//       marks: Number,
//       year: Number,
//       grade: String,
//       stream: String
//     }]
//   },
//   trainingStatus: {
//     type: String,
//     enum: ['yes', 'no'],
//     default: 'no'
//   },
//   trainingDetails: {
//     trainingInIndia: [{
//       type: {
//         type: String,
//         required: true
//       },
//       topic: {
//         type: String,
//         required: true
//       },
//       institute: {
//         type: String,
//         required: true
//       },
//       country: {
//         type: String,
//         required: true
//       },
//       sponsor: {
//         type: String,
//         required: true
//       },
//       from: {
//         type: Date,
//         required: true
//       },
//       to: {
//         type: Date,
//         required: true
//       }
//     }]
//   }
// ,  
//   familyDetails: [{
//     name: {
//       type: String,
//       required: true
//     },
//     relation: {
//       type: String,
//       required: true
//     },
//     dob: {
//       type: Date,
//       required: true
//     },
//     dependent: {
//       type: String,
//       enum: ['Yes', 'No'],
//       default: 'No'
//     },
//     employed: {
//       type: String,
//       enum: ['employed', 'unemployed'],
//       default: 'unemployed'
//     },
//     sameCompany: {
//       type: Boolean,
//       default: false
//     },
//     empCode: String,
//     department: String
//   }],
  
//   serviceHistory: [{
//     organization: String,
//     dateOfJoining: Date,
//     lastWorkingDay: Date,
//     totalExperience: String,
//     department: String
//   }],
//   nominationDetails: [{
//     name: String,
//     relation: String,
//     nominationPercentage: Number,
//     presentAddress: String,
//     city: String,
//     district: String,
//     state: String,
//     pinCode: String,
//     phoneNumber: String
//   }],

//   bankInfo: ({
//     accountNumber: String,
//     ifscCode: String,
//     bankName: String,
//     branchName: String,
//     accountType: String
//   }),
// }, { timestamps: true });

// // Define the static method
// onboardingFormSchema.statics.generateEmployeeNumber = async function() {
//   const latestEmployee = await this.findOne().sort({ Emp_ID: -1 });
  
//   if (!latestEmployee) {
//     return 'DB-0001';
//   }

//   const currentNumber = parseInt(latestEmployee.Emp_ID.split('-')[1]);
//   const nextNumber = (currentNumber + 1).toString().padStart(4, '0');
//   return `DB-${nextNumber}`;
// };

// // Make sure the pre-save middleware is properly defined
// onboardingFormSchema.pre('save', async function(next) {
//   try {
//     if (!this.Emp_ID) {
//       this.Emp_ID = await this.constructor.generateEmployeeNumber();
//       console.log('Generated Emp_ID:', this.Emp_ID); // Add logging
//     }
//     next();
//   } catch (error) {
//     console.error('Error in pre-save middleware:', error);
//     next(error);
//   }
// });
// // Add a pre-save middleware to set the Emp_ID
// onboardingFormSchema.pre('save', async function(next) {
//   if (!this.Emp_ID) {
//     // Use await to resolve the promise
//     this.Emp_ID = await this.constructor.generateEmployeeNumber();
//   }
//   next();
// });

// const onboardingForm = mongoose.model('OnboardingForm', onboardingFormSchema);
// export default onboardingForm;

import mongoose from 'mongoose';

const onboardingFormSchema = new mongoose.Schema({
  userId: {
    type: String,
    ref: 'User',
    required: true,
    unique: true
  },
  Emp_ID: { 
    type: String,
    unique: true,
  },
  registrationComplete: { type: Boolean, default: false },
  personalInfo: {
    prefix: String,
    firstName: String,
    lastName: String,
    dob: Date,
    gender: String,
    maritalStatus: String,
    bloodGroup: String,
    nationality: String,
    aadharNumber: { type: String, unique: true, sparse: true },
    panNumber: { type: String, unique: true, sparse: true },
    mobileNumber: { type: String, unique: true, sparse: true },
    email: { type: String, unique: true, sparse: true },
    workemail: { type: String, unique: true, sparse: true },
    employeeImage: String
  },
  addressDetails: {
    presentAddress: {
      address: String,
      city: String,
      district: String,
      state: String,
      pinCode: String,
      country: String
    },
    permanentAddress: {
      address: String,
      city: String,
      district: String,
      state: String,
      pinCode: String,
      country: String
    }
  },
  joiningDetails: {
    dateOfAppointment: Date,
    dateOfJoining: Date,
    department: String,
    initialDesignation: String,
    modeOfRecruitment: String,
    employeeType: String,
    shiftType: String, 
    workType: String,
    uanNumber: String,
    pfNumber: String,
  },
  educationDetails: {
    basic: [{
      education: {
        type: String,
        enum: ['10th', '12th']
      },
      institute: String,
      board: String,
      marks: Number,
      year: Number,
      grade: String,
      stream: String
    }],
    professional: [{
      education: {
        type: String,
        enum: ['UG', 'PG', 'Doctorate']
      },
      institute: String,
      board: String,
      marks: Number,
      year: Number,
      grade: String,
      stream: String
    }]
  },
  trainingStatus: {
    type: String,
    enum: ['yes', 'no'],
    default: 'no'
  },
  trainingDetails: {
    trainingInIndia: [{
      type: {
        type: String,
        required: true
      },
      topic: {
        type: String,
        required: true
      },
      institute: {
        type: String,
        required: true
      },
      country: {
        type: String,
        required: true
      },
      sponsor: {
        type: String,
        required: true
      },
      from: {
        type: Date,
        required: true
      },
      to: {
        type: Date,
        required: true
      }
    }]
  },  
  familyDetails: [{
    name: {
      type: String,
      required: true
    },
    relation: {
      type: String,
      required: true
    },
    dob: {
      type: Date,
      required: true
    },
    dependent: {
      type: String,
      enum: ['Yes', 'No'],
      default: 'No'
    },
    employed: {
      type: String,
      enum: ['employed', 'unemployed'],
      default: 'unemployed'
    },
    sameCompany: {
      type: Boolean,
      default: false
    },
    empCode: String,
    department: String
  }],
  
  serviceHistory: [{
    organization: String,
    dateOfJoining: Date,
    lastWorkingDay: Date,
    totalExperience: String,
    department: String
  }],
  nominationDetails: [{
    name: String,
    relation: String,
    nominationPercentage: Number,
    presentAddress: String,
    city: String,
    district: String,
    state: String,
    pinCode: String,
    phoneNumber: String
  }],

  bankInfo: ({
    accountNumber: String,
    ifscCode: String,
    bankName: String,
    branchName: String,
    accountType: String
  }),
}, { timestamps: true });

// Define the static method
onboardingFormSchema.statics.generateEmployeeNumber = async function() {
  const latestEmployee = await this.findOne().sort({ Emp_ID: -1 });
  
  if (!latestEmployee) {
    return 'DB-0001';
  }

  const currentNumber = parseInt(latestEmployee.Emp_ID.split('-')[1]);
  const nextNumber = (currentNumber + 1).toString().padStart(4, '0');
  return `DB-${nextNumber}`;
};

// Make sure the pre-save middleware is properly defined
onboardingFormSchema.pre('save', async function(next) {
  try {
    if (!this.Emp_ID) {
      this.Emp_ID = await this.constructor.generateEmployeeNumber();
      console.log('Generated Emp_ID:', this.Emp_ID); // Add logging
    }
    next();
  } catch (error) {
    console.error('Error in pre-save middleware:', error);
    next(error);
  }
});

// Create model for OnboardingForm in the main database (for backward compatibility)
const onboardingForm = mongoose.model('OnboardingForm', onboardingFormSchema);

// Export the schema for company-specific models
export { onboardingFormSchema };

// Export the main model as default
export default onboardingForm;

