const User = require('../model/User');
const jwt = require('jsonwebtoken');

const handleRefreshToken = async (req, res) => {
    const cookies = req.cookies;
    if (!cookies?.jwt) return res.sendStatus(401);
    const refreshToken = cookies.jwt;
    res.clearCookie('jwt', { httpOnly: true, sameSite: 'None', secure: true });

    const foundUser = await User.findOne({ refreshToken: refreshToken}).exec();

    //detected refresh token reuse
    if (!foundUser) {
        jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET,
            async (error, decoded) => {
                if(error) res.sendStatus(403);
                const hackedUser = await User.findOne({ username: decoded.username }).exec();
                hackedUser.refreshToken = [];
                const result = await hackedUser.save();
            }
        );
        return res.sendStatus(403) 
    }

    const newRefreshTokenArray = foundUser.refreshToken.filter(rt => rt !== refreshToken);
 
    jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET,
        async (error, decoded) => {
            if (error){
                foundUser.refreshToken = [...newRefreshTokenArray];
                const result = await foundUser.save();
            }
            if (error || foundUser.username !== decoded.username) return res.status(403);

            //refresh token was still valid
            const roles = Object.values(foundUser.roles);
            const accessToken = jwt.sign(
                { 
                    'UserInfo' : {
                        'username': decoded.username,
                        'firstname': decoded.firstname,
                        'lastname': decoded.lastname,
                        'roles': roles
                    }
                },
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: '10min' }
            );

            const newRefreshToken = jwt.sign(
                { 'username': foundUser.username },
                process.env.REFRESH_TOKEN_SECRET,
                { expiresIn: '1d' }
            );
    
            foundUser.refreshToken = [...newRefreshTokenArray, newRefreshToken];
            const result = await foundUser.save();

            res.cookie('jwt', newRefreshToken, { httpOnly: true, sameSite: 'None',  maxAge: 24 * 60 * 60 * 1000 });

            res.json({ accessToken, roles });
        }
    )
}

module.exports = { handleRefreshToken };