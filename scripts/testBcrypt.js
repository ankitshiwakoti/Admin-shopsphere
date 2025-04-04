import bcrypt from 'bcryptjs';

const testBcrypt = async () => {
    try {
        const password = process.argv[2] || 'Aa123456';
        console.log('Testing with password:', password);
        
        // Generate salt and hash
        console.log('\nGenerating salt and hash...');
        const salt = await bcrypt.genSalt(10);
        console.log('Salt:', salt);
        
        const hash = await bcrypt.hash(password, salt);
        console.log('Hash:', hash);
        console.log('Hash length:', hash.length);
        
        // Test comparison with correct password
        console.log('\nTesting comparison with correct password...');
        const correctMatch = await bcrypt.compare(password, hash);
        console.log('Correct password match:', correctMatch);
        
        // Test comparison with wrong password
        console.log('\nTesting comparison with wrong password...');
        const wrongMatch = await bcrypt.compare('wrongpassword', hash);
        console.log('Wrong password match:', wrongMatch);
        
        // Test direct hash comparison
        console.log('\nTesting direct hash comparison...');
        const directHash = await bcrypt.hash(password, salt);
        console.log('Direct hash:', directHash);
        console.log('Original hash:', hash);
        console.log('Hashes match:', directHash === hash);
        
        // Test comparison with direct hash
        console.log('\nTesting comparison with direct hash...');
        const directMatch = await bcrypt.compare(password, directHash);
        console.log('Direct hash match:', directMatch);
        
    } catch (error) {
        console.error('Error testing bcrypt:', error);
    }
};

testBcrypt(); 