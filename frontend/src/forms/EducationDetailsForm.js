import React, { useState } from 'react';
import api from "../api/axiosInstance";
import './styles.css'

// const API_URL = '/employees';
 
const EducationTrainingDetailsForm = ({ savedEducationDetails, nextStep, prevStep }) => {
const [educationDetails, setEducationDetails] = useState(savedEducationDetails?.educationDetails || {
  basic: [
    { education: '', institute: '', board: '', marks: '', year: '', stream: '', grade: '' },
    { education: '', institute: '', board: '', marks: '', year: '', stream: '', grade: '' }
  ],
  professional: [
    { education: '', institute: '', board: '', marks: '', year: '', stream: '', grade: '' },
    { education: '', institute: '', board: '', marks: '', year: '', stream: '', grade: '' },
    { education: '', institute: '', board: '', marks: '', year: '', stream: '', grade: '' }
  ]
}); 
  // State to manage training details
  const [trainingInIndia, setTrainingInIndia] = useState(savedEducationDetails?.trainingInIndia || [
    { type: '', topic: '', institute: '', country: '', sponsor: '', from: new Date().toISOString().split('T')[0], to: new Date().toISOString().split('T')[0] },
  ]);
 
  
 
  // Validation state
  const [errors, setErrors] = useState({});
 
  // Validate education fields
  const validateEducation = () => {
    const newErrors = {};
    const categories = ['basic', 'professional'];
    
    categories.forEach((category) => {
      if (educationDetails && educationDetails[category]) {
        educationDetails[category].forEach((edu, index) => {
          if (!edu.education) newErrors[`${category}_education_${index}`] = 'Education is required';
          if (!edu.institute) newErrors[`${category}_institute_${index}`] = 'Institute is required';
          if (!edu.board) newErrors[`${category}_board_${index}`] = 'Board is required';
          if (!edu.marks || isNaN(edu.marks)) newErrors[`${category}_marks_${index}`] = 'Valid marks are required';
          if (!edu.year || isNaN(edu.year)) newErrors[`${category}_year_${index}`] = 'Valid year is required';
          if (!edu.stream) newErrors[`${category}_stream_${index}`] = 'Stream is required';
          if (!edu.grade) newErrors[`${category}_grade_${index}`] = 'Grade is required';
        });
      }
    });
    
    return newErrors;
  };
  

  // Handle input change for education
  const handleEducationChange = (category, index, e) => {
    const { name, value } = e.target;
    const newEducationDetails = { ...educationDetails };
    newEducationDetails[category][index][name] = value;
    setEducationDetails(newEducationDetails);
  };
 
  // Handle input change for training in India
  const handleTrainingInIndiaChange = (index, e) => {
    const { name, value } = e.target;
    const newTrainingDetails = [...trainingInIndia];
    newTrainingDetails[index][name] = value;
    setTrainingInIndia(newTrainingDetails);
  };
 
  
 
  
 
  // Add a new training row for Training in India
  const addTrainingInIndiaRow = () => {
    const today = new Date().toISOString().split('T')[0];
    const newRow = { type: '', topic: '', institute: '', country: '', sponsor: '', from: today, to: today };
    setTrainingInIndia(prevRows => [...prevRows, newRow]);
  };
 
  // Remove a training row for Training in India
  const removeTrainingInIndiaRow = (index) => {
    const newRows = trainingInIndia.filter((_, idx) => idx !== index);
    setTrainingInIndia(newRows);
  };
 
   
  // // Handle form submit
  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   console.log('Starting form submission...');
  
  //   const validBasicEducation = educationDetails.basic.map(edu => {
  //     console.log('Processing basic education:', edu);
  //     return {
  //       education: edu.education,
  //       institute: edu.institute,
  //       board: edu.board,
  //       marks: Number(edu.marks),
  //       year: Number(edu.year),
  //       grade: edu.grade,
  //       stream: edu.stream
  //     };
  //   });
  
  //   const validProfessionalEducation = educationDetails.professional.map(edu => {
  //     console.log('Processing professional education:', edu);
  //     return {
  //       education: edu.education,
  //       institute: edu.institute,
  //       board: edu.board,
  //       marks: Number(edu.marks),
  //       year: Number(edu.year),
  //       grade: edu.grade,
  //       stream: edu.stream
  //     };
  //   });
  
  //   console.log('Training status:', hasTraining);
    
  //   const formattedTrainingData = hasTraining === 'yes' ? 
  //   trainingInIndia.map(train => ({
  //   type: train.type.toString(),
  //   topic: train.topic.toString(),
  //   institute: train.institute.toString(),
  //   country: train.country.toString(),
  //   sponsor: train.sponsor.toString(),
  //   from: new Date(train.from).toISOString(),
  //   to: new Date(train.to).toISOString()
  // })) : [];

  
  //   const payload = {
  //     employeeId: localStorage.getItem('Emp_ID'),
  //     educationDetails: {
  //       basic: validBasicEducation,
  //       professional: validProfessionalEducation
  //     },
  //     trainingStatus: hasTraining,
  //     trainingDetails: {
  //       trainingInIndia: formattedTrainingData
  //     }
  //   };
  
  //   console.log('Final payload:', JSON.stringify(payload, null, 2));
  
  //   try {
  //     const response = await axios.post('${process.env.REACT_APP_API_URL}/api/employees/education-details', payload);
  //     console.log('Server response:', response.data);
  //     if (response.data.success) {
  //       console.log('Submission successful, moving to next step');
  //       nextStep();
  //     }
  //   } catch (error) {
  //     console.log('Submission failed');
  //     console.log('Error response:', error.response?.data);
  //     console.log('Error status:', error.response?.status);
  //     console.log('Error details:', error.message);
  //   }
  // };  

 // Update the handleSubmit function
const handleSubmit = async (e) => {
  e.preventDefault();
  console.log('Starting form submission...');

  const validBasicEducation = educationDetails.basic.map(edu => {
    console.log('Processing basic education:', edu);
    return {
      education: edu.education,
      institute: edu.institute,
      board: edu.board,
      marks: Number(edu.marks),
      year: Number(edu.year),
      grade: edu.grade,
      stream: edu.stream
    };
  });

  const validProfessionalEducation = educationDetails.professional.map(edu => {
    console.log('Processing professional education:', edu);
    return {
      education: edu.education,
      institute: edu.institute,
      board: edu.board,
      marks: Number(edu.marks),
      year: Number(edu.year),
      grade: edu.grade,
      stream: edu.stream
    };
  });

  console.log('Training status:', hasTraining);
  
  const formattedTrainingData = hasTraining === 'yes' ? 
  trainingInIndia.map(train => ({
    type: train.type.toString(),
    topic: train.topic.toString(),
    institute: train.institute.toString(),
    country: train.country.toString(),
    sponsor: train.sponsor.toString(),
    from: new Date(train.from).toISOString(),
    to: new Date(train.to).toISOString()
  })) : [];

  const payload = {
    employeeId: localStorage.getItem('Emp_ID'),
    educationDetails: {
      basic: validBasicEducation,
      professional: validProfessionalEducation
    },
    trainingStatus: hasTraining,
    trainingDetails: {
      trainingInIndia: formattedTrainingData
    }
  };

  console.log('Final payload:', JSON.stringify(payload, null, 2));

  try {
    
    const response = await api.post('employees/education-details', 
      payload,
    );
    
    console.log('Server response:', response.data);
    if (response.data.success) {
      console.log('Submission successful, moving to next step');
      nextStep();
    }
  } catch (error) {
    console.log('Submission failed');
    console.log('Error response:', error.response?.data);
    console.log('Error status:', error.response?.status);
    console.log('Error details:', error.message);
  }
};
 

  const [selectedBasicEducation, setSelectedBasicEducation] = useState([]);
  const [selectedProfEducation, setSelectedProfEducation] = useState([]);
  const [hasTraining, setHasTraining] = useState('no');
 
  return (
    <div className="education-training-container">
      <form onSubmit={handleSubmit}>
        {/* Education Details */}
        <div className="form-section">
          <h4 className="form-subtitle">Education Details</h4>
         
          {/* Basic Education */}
         
          <table className="education-table">
  <thead>
    <tr>
      <th colSpan="7" style={{textAlign:"center", fontStyle:"italic"}}>Basic</th>
    </tr>
    <tr>
      <th>Education</th>
      <th>Institute Name</th>
      <th>Name of Board/University</th>
      <th>Marks Obtained (In %)</th>
      <th>Passing Year</th>
      <th>Stream</th>
      <th>Grade</th>
    </tr>
  </thead>
  <tbody>
    {educationDetails.basic.map((edu, index) => (
      <tr key={index}>
        <td>
          <select 
            name="education" 
            value={edu.education}
            onChange={(e) => {
              handleEducationChange('basic', index, e);
              setSelectedBasicEducation([...selectedBasicEducation, e.target.value]);
            }}
          >
            <option value="">Select Education</option>
            <option value="10th" disabled={selectedBasicEducation.includes('10th') && edu.education !== '10th'}>10th</option>
            <option value="12th" disabled={selectedBasicEducation.includes('12th') && edu.education !== '12th'}>12th</option>
          </select>
          {errors[`basic_education_${index}`] && <span className="error">{errors[`basic_education_${index}`]}</span>}
        </td>
        <td>
          <input type="text" name="institute" value={edu.institute} onChange={(e) => handleEducationChange('basic', index, e)} />
        </td>
        <td>
          <input type="text" name="board" value={edu.board} onChange={(e) => handleEducationChange('basic', index, e)} />
        </td>
        <td>
          <input type="text" name="marks" value={edu.marks} onChange={(e) => handleEducationChange('basic', index, e)} />
        </td>
        <td>
          <input type="text" name="year" value={edu.year} onChange={(e) => handleEducationChange('basic', index, e)} />
        </td>
        <td>
          <input type="text" name="stream" value={edu.stream} onChange={(e) => handleEducationChange('basic', index, e)} />
        </td>
        <td>
          <input type="text" name="grade" value={edu.grade} onChange={(e) => handleEducationChange('basic', index, e)} />
        </td>
      </tr>
    ))}
  </tbody>
</table>  
          
          {/* Professional Education */}
         
          <table className="education-table">
  <thead>
    <tr>
      <th colSpan="7" style={{textAlign:"center", fontStyle:"italic"}}>Professional</th>
    </tr>
    <tr>
      <th>Education</th>
      <th>Institute Name</th>
      <th>Name of Board/University</th>
      <th>Marks Obtained (In %)</th>
      <th>Passing Year</th>
      <th>Stream</th>
      <th>Grade</th>
    </tr>
  </thead>
  <tbody>
  {educationDetails.professional.map((edu, index) => (
      <tr key={index}>
        <td>
          <select 
            name="education" 
            value={edu.education}
            onChange={(e) => {
              handleEducationChange('professional', index, e);
              setSelectedProfEducation([...selectedProfEducation, e.target.value]);
            }}
          >
            <option value="">Select Education</option>
            <option value="UG" disabled={selectedProfEducation.includes('UG') && edu.education !== 'UG'}>UG</option>
            <option value="PG" disabled={selectedProfEducation.includes('PG') && edu.education !== 'PG'}>PG</option>
            <option value="Doctorate" disabled={selectedProfEducation.includes('Doctorate') && edu.education !== 'Doctorate'}>Doctorate</option>
          </select>
          {errors[`professional_education_${index}`] && <span className="error">{errors[`professional_education_${index}`]}</span>}
        </td>
        <td>
          <input type="text" name="institute" value={edu.institute} onChange={(e) => handleEducationChange('professional', index, e)} />
        </td>
        <td>
          <input type="text" name="board" value={edu.board} onChange={(e) => handleEducationChange('professional', index, e)} />
        </td>
        <td>
          <input type="text" name="marks" value={edu.marks} onChange={(e) => handleEducationChange('professional', index, e)} />
        </td>
        <td>
          <input type="text" name="year" value={edu.year} onChange={(e) => handleEducationChange('professional', index, e)} />
        </td>
        <td>
          <input type="text" name="stream" value={edu.stream} onChange={(e) => handleEducationChange('professional', index, e)} />
        </td>
        <td>
          <input type="text" name="grade" value={edu.grade} onChange={(e) => handleEducationChange('professional', index, e)} />
        </td>
      </tr>
    ))}
  </tbody>
</table>
</div>

        {/* Training Details */}
        <div className="form-section">
  <h4 className="form-subtitle">Training Details</h4>
  
  <div className="training-radio">
    <label>Have you undergone any training?</label>
    <div>
      <input 
        type="radio" 
        name="hasTraining" 
        value="yes" 
        checked={hasTraining === 'yes'}
        onChange={(e) => setHasTraining(e.target.value)} 
      /> Yes
      <input 
        type="radio" 
        name="hasTraining" 
        value="no" 
        checked={hasTraining === 'no'}
        onChange={(e) => setHasTraining(e.target.value)} 
      /> No
    </div>
  </div>

  {hasTraining === 'yes' && (
    <>
      <table className="training-table">
        <thead>
          <tr>
            <th colSpan="8" style={{textAlign:"center", fontStyle:"italic"}}>Training </th>
          </tr>
          <tr>
            <th>Training Type</th>
            <th>Topic Name</th>
            <th>Name of Institute</th>
            <th>Country</th>
            <th>Sponsored by</th>
            <th>Date From</th>
            <th>Date To</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {trainingInIndia.map((train, index) => (
            <tr key={index}>
              <td>
                <input type="text" name="type" value={train.type} onChange={(e) => handleTrainingInIndiaChange(index, e)} />
              </td>
              <td>
                <input type="text" name="topic" value={train.topic} onChange={(e) => handleTrainingInIndiaChange(index, e)} />
              </td>
              <td>
                <input type="text" name="institute" value={train.institute} onChange={(e) => handleTrainingInIndiaChange(index, e)} />
              </td>
              <td>
                <input type="text" name="country" value={train.country} onChange={(e) => handleTrainingInIndiaChange(index, e)} />
              </td>
              <td>
                <input type="text" name="sponsor" value={train.sponsor} onChange={(e) => handleTrainingInIndiaChange(index, e)} />
              </td>
              <td>
                <input type="date" name="from" value={train.from} onChange={(e) => handleTrainingInIndiaChange(index, e)} />
              </td>
              <td>
                <input type="date" name="to" value={train.to} onChange={(e) => handleTrainingInIndiaChange(index, e)} />
              </td>
              <td>
                <button type="button" className='remvingButton' onClick={() => removeTrainingInIndiaRow(index)}>x</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button type="button" className='addingButton' onClick={addTrainingInIndiaRow}>+Add</button>
    </>
  )}
</div>
 
        <div className="form-actions">
        <button type='button' onClick={prevStep} className="submit-btn" > &lt; Previous </button>
        <button type="submit" className="submit-btn">Next &gt; </button>
        </div>
      </form>
     
    </div>
  );
};
 
export default EducationTrainingDetailsForm;
 
 
