const User = require('../model/User');
const bcrypt = require('bcrypt');

const handleNewUser = async (req, res) => {
    const { username, password, firstname, lastname } = req.body;
    if (!username || !password || !firstname || !lastname) return res.status(400).json({ 'message': 'Username and password are required.' });
    
    //check for duplicates
    const duplicate = await User.findOne({ username: username }).exec();
    if(duplicate) return res.sendStatus(409);

    try {
        const hashedPwd = await bcrypt.hash(password, 10);
        const result = await User.create({
            'username': username,
            'password': hashedPwd,
            'firstname': firstname,
            'lastname': lastname
        });

        res.status(201).json({ 'success': `New user ${username} created` });
    } catch (error) {
        res.status(500).json({ 'message': error.message });
    }
}

module.exports = { handleNewUser };