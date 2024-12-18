const User = require('../model/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const handleLogin = async (req, res) => {
    const cookies = req.cookies;
    const { username, password } = req.body;
    if (!username || !password ) return res.status(400).json({ 'message': 'Username and password are required.' })

    const foundUser = await User.findOne({ username: username }).exec();
    if (!foundUser) return res.sendStatus(401);
    
    const match = await bcrypt.compare(password, foundUser.password);

    //check if user in db
    if(match) {
        const roles = Object.values(foundUser.roles);
        
        const accessToken = jwt.sign(
            { 
                'UserInfo': {
                    'userId': foundUser._id,
                    'username': foundUser.username,
                    'firstname': foundUser.firstname,
                    'lastname': foundUser.lastname,
                    'roles': roles
                } 
            },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: '10min' }
        );
        const newRefreshToken = jwt.sign(
            {   
                'userId': foundUser._id,
                'username': foundUser.username,
            },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: '1d' }
        );

        let newRefreshTokenArray = 
            !cookies?.jwt 
                ? foundUser.refreshToken
                : foundUser.refreshToken.filter(rt => rt !== cookies.jwt); //if there is a refresh token, delete it
        
        if (cookies?.jwt) {
            const refreshToken = cookies.jwt;
            const foundToken = await User.findOne({ refreshToken: refreshToken }).exec();

            if(!foundToken) {
                console.log('attempted refresh token reuse at login');
                newRefreshTokenArray = [];
            }
            
            res.clearCookie('jwt', { httpOnly: true, sameSite: 'None', secure: true });
        }

        foundUser.refreshToken = [...newRefreshTokenArray, newRefreshToken];
        const result = await foundUser.save();

        //httpOnly doesn't make data available for JS attacks
        res.cookie('jwt', newRefreshToken, { httpOnly: true, sameSite: 'None',  maxAge: 24 * 60 * 60 * 1000 }); //, secure: true
        res.json({ accessToken });
    
    } else {
        res.sendStatus(401);
    }
}

module.exports = { handleLogin };