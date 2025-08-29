const admin = require('firebase-admin');

// Initialize Firebase Admin SDK with default credentials
admin.initializeApp({
  projectId: 'esports-53611'
});

async function listUsers() {
  try {
    console.log('🔍 Fetching all users...');
    
    // Get all users
    const listUsersResult = await admin.auth().listUsers();
    const users = listUsersResult.users;
    
    console.log(`\n📊 Found ${users.length} users total:\n`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email}`);
      console.log(`   UID: ${user.uid}`);
      console.log(`   Created: ${user.metadata.creationTime}`);
      console.log(`   Last Sign In: ${user.metadata.lastSignInTime}`);
      console.log(`   Provider: ${user.providerData[0]?.providerId || 'email'}`);
      console.log('---');
    });
    
    console.log('\n💡 To delete users:');
    console.log('1. Go to Firebase Console > Authentication > Users');
    console.log('2. Select users you want to delete');
    console.log('3. Click "Delete" button');
    console.log('4. Keep your admin account!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

// Run the function
listUsers();
