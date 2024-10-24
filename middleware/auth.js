const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (token == null) return res.sendStatus(401); 

        jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
            if (err) return res.sendStatus(403); // Invalid token

            req.user = user;
            next(); 
        });
    } catch (error) {
        return res.status(401).send('Unauthorized');
    }
};

module.exports = authenticateToken;