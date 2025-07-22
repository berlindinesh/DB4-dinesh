// Debug utility to check image URL construction
export const debugImageUrl = (imagePath) => {
  console.log('=== Image URL Debug ===');
  console.log('Original path:', imagePath);
  console.log('REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
  console.log('REACT_APP_API_BASE_URL:', process.env.REACT_APP_API_BASE_URL);
  
  // Import the function here to test
  import('../api/axiosInstance').then(({ getAssetUrl }) => {
    const finalUrl = getAssetUrl(imagePath);
    console.log('Final URL:', finalUrl);
    console.log('======================');
  });
};

// Call this function with a sample path to debug
if (process.env.NODE_ENV === 'development') {
  window.debugImageUrl = debugImageUrl;
}
