const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = {
  // You'll need to download your service account key from Firebase Console
  // Project Settings > Service Accounts > Generate new private key
  type: "service_account",
  project_id: "esports-53611",
  private_key_id: "YOUR_PRIVATE_KEY_ID",
  private_key: "YOUR_PRIVATE_KEY",
  client_email: "YOUR_CLIENT_EMAIL",
  client_id: "YOUR_CLIENT_ID",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "YOUR_CERT_URL"
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function clearUsersExceptAdmin() {
  try {
    console.log('🔍 Fetching all users...');
    
    // Get all users
    const listUsersResult = await admin.auth().listUsers();
    const users = listUsersResult.users;
    
    console.log(`📊 Found ${users.length} users total`);
    
    // Filter out admin users (you can modify this condition)
    const adminEmails = ['admin@esports.com', 'your-admin-email@example.com']; // Add your admin emails
    const usersToDelete = users.filter(user => {
      const isAdmin = adminEmails.includes(user.email);
      if (isAdmin) {
        console.log(`👑 Keeping admin user: ${user.email}`);
      }
      return !isAdmin;
    });
    
    console.log(`🗑️  Users to delete: ${usersToDelete.length}`);
    
    if (usersToDelete.length === 0) {
      console.log('✅ No users to delete!');
      return;
    }
    
    // Delete users in batches (Firebase allows max 1000 per batch)
    const batchSize = 1000;
    for (let i = 0; i < usersToDelete.length; i += batchSize) {
      const batch = usersToDelete.slice(i, i + batchSize);
      const uids = batch.map(user => user.uid);
      
      console.log(`🗑️  Deleting batch ${Math.floor(i / batchSize) + 1} (${batch.length} users)...`);
      
      const deleteUsersResult = await admin.auth().deleteUsers(uids);
      
      console.log(`✅ Successfully deleted ${deleteUsersResult.successCount} users`);
      if (deleteUsersResult.failureCount > 0) {
        console.log(`❌ Failed to delete ${deleteUsersResult.failureCount} users`);
        deleteUsersResult.errors.forEach((err) => {
          console.log(`   Error: ${err.error.toJSON()}`);
        });
      }
    }
    
    console.log('🎉 User cleanup completed!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

// Run the function
clearUsersExceptAdmin();
