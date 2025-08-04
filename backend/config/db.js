
import mongoose from "mongoose";
import colors from 'colors';
import dotenv from 'dotenv';
dotenv.config();

// Main connection URL
const URL = process.env.MONGO_URI;

// Store connections for each company
const connections = {};

// Connect to main database
const connectMainDB = async () => {
    try {
        //const conn = await mongoose.connect(URL);
        const conn = await mongoose.connect(URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 30000, // 30 seconds
            socketTimeoutMS: 45000,          // 45 seconds
          });
        // Verify connection was successful          
        console.log(`🚀 Main MongoDB Connected: ${conn.connection.host}`.cyan.underline);
        return conn;
    } catch (error) {
        console.log(`Error connecting to MongoDB: ${error.message}`.red.underline.bold);
        process.exit(1);
    }
};

// // Connect to company databases
// const getCompanyConnection = async (companyCode) => {
//     if (!companyCode) {
//         throw new Error('Company code is required');
//     }
    
//     // Normalize company code
//     companyCode = companyCode.toUpperCase();
    
//     // Return existing connection if available
//     if (connections[companyCode]) {
//         console.log(`Using existing connection for company ${companyCode}`);
//         return connections[companyCode];
//     }
    
//     // Create a new connection for this company
//     try {
//         // Create a new connection with a specific database name for this company
//         const dbName = `hrms_${companyCode.toLowerCase()}`;
        
//         // Fix: Properly construct the connection URL
//         const baseUrl = URL.split('?')[0];
//         const queryParams = URL.split('?')[1] || '';
//         const connectionString = `${baseUrl}/${dbName}?${queryParams}`;
        
//         console.log(`Creating new connection to ${dbName} for company ${companyCode}`);
//         console.log(`Connection string: ${connectionString}`);
        
//         const connection = await mongoose.createConnection(connectionString);
        
//         // Verify connection was successful
//         if (!connection) {
//             throw new Error(`Failed to create connection for ${companyCode}`);
//         }
        
//         console.log(`🚀 Company DB Connected: ${connection.name || dbName} for ${companyCode}`.green.underline);
        
//         // Store the connection
//         connections[companyCode] = connection;
//         return connection;
//     } catch (error) {
//         console.log(`Error connecting to company database: ${error.message}`.red.underline.bold);
//         throw error;
//     }
// };

// Get or create a connection for a specific company
const getCompanyConnection = async (companyCode) => {
    if (!companyCode) {
        throw new Error('Company code is required');
    }
    
    // Normalize company code
    companyCode = companyCode.toUpperCase();
    
    // Return existing connection if available
    if (connections[companyCode]) {
        console.log(`Using existing connection for company ${companyCode}`);
        return connections[companyCode];
    }
    
    // Create a new connection for this company
    try {
        // Create a new connection with a specific database name for this company
        const dbName = `hrms_${companyCode.toLowerCase()}`;
        
        // Fix: Properly construct the connection URL
        // Parse the MongoDB connection string correctly
        let connectionString;
        
        if (URL.includes('mongodb+srv://')) {
            // For MongoDB Atlas connections
            // Format: mongodb+srv://username:password@cluster.mongodb.net/dbName?options
            const baseUrl = URL.split('?')[0];
            const queryParams = URL.split('?')[1] || '';
            
            // Remove any trailing slash from baseUrl and ensure no double slash before dbName
            const cleanBaseUrl = baseUrl.replace(/\/$/, '');
            
            // Check if the URL already includes a database name
            if (cleanBaseUrl.includes('/mongodb.net/')) {
                // Replace existing database name
                connectionString = cleanBaseUrl.replace(/\/([^\/]+)$/, `/${dbName}?${queryParams}`);
            } else {
                // Add database name
                connectionString = `${cleanBaseUrl}/${dbName}?${queryParams}`;
            }
        } else {
            // For standard MongoDB connections
            // Format: mongodb://username:password@host:port/dbName?options
            const urlParts = URL.split('?');
            const baseUrl = urlParts[0].replace(/\/$/, '');
            const queryParams = urlParts[1] || '';
            
            // Check if the URL already includes a database name after the host:port
            const hostPart = baseUrl.split('/').slice(0, 3).join('/');
            connectionString = `${hostPart}/${dbName}?${queryParams}`;
        }
        
        console.log(`Creating new connection to ${dbName} for company ${companyCode}`);
        console.log(`Connection string: ${connectionString}`);
        
        //const connection = await mongoose.createConnection(connectionString);

        const connection = mongoose.createConnection(connectionString, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
          });
          
          await new Promise((resolve, reject) => {
            connection.once('open', resolve);
            connection.on('error', reject);
          });
        
        // Verify connection was successful
        if (!connection) {
            throw new Error(`Failed to create connection for ${companyCode}`);
        }
        
        console.log(`🚀 Company DB Connected: ${connection.name || dbName} for ${companyCode}`.green.underline);
        
        // Store the connection
        connections[companyCode] = connection;
        return connection;
    } catch (error) {
        console.log(`Error connecting to company database: ${error.message}`.red.underline.bold);
        throw error;
    }
};



const closeAllConnections = async () => {
    await mongoose.disconnect();
    for (const companyCode in connections) {
        await connections[companyCode].close();
    }
    console.log('All database connections closed'.yellow);
};

export { connectMainDB, getCompanyConnection, closeAllConnections };
export default connectMainDB;