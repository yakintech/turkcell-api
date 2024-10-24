const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const authenticateToken = require('./middleware/auth');
const products  = require('./data/products');
const categories = require('./data/categories');

require('dotenv').config()

let refreshTokens = [];

const app = express();
const port = 8080;

app.use(cors());
app.use(express.json());

app.post('/login', (req, res) => {
    const { email, password } = req.body;
    if (email === 'cagatay@mail.com' && password === '123') {
        const token = jwt.sign({ email }, process.env.SECRET_KEY, { expiresIn: '10s' }); // Access token süresi 10 saniye
        const refreshToken = crypto.randomBytes(64).toString('hex'); // Rastgele oluşturulmuş refresh token
        const refreshTokenExpiry = Date.now() + 7 * 24 * 60 * 60 * 1000; // Refresh token süresi 7 gün
        refreshTokens.push({ token: refreshToken, expiry: refreshTokenExpiry });
        return res.json({
            token,
            refreshToken
        });
    } else {
        return res.status(404).send('Invalid email or password');
    }
});

// Refresh token endpoint
app.post('/token', (req, res) => {

    const { refreshToken: token } = req.body;
    if (token == null) return res.sendStatus(401);

    const storedToken = refreshTokens.find(t => t.token === token);
    if (!storedToken) return res.sendStatus(403);
    if (storedToken.expiry < Date.now()) {
        refreshTokens = refreshTokens.filter(t => t.token !== token); // Expired token'ı kaldır
        return res.sendStatus(403);
    }

    //yeni bir access token oluştur
    const accessToken = jwt.sign({ email: req.body.email }, process.env.SECRET_KEY, { expiresIn: '10s' }); // Access token süresi 10 saniye
    return res.json({ accessToken });
});

// Logout endpoint to invalidate refresh token
app.post('/logout', (req, res) => {
    const { token } = req.body;
    refreshTokens = refreshTokens.filter(t => t.token !== token);
    res.sendStatus(204);
});

// Check endpoint
app.get('/check', authenticateToken, (req, res) => {
    return res.send('You are authenticated');
});

app.get('/api/products', authenticateToken, (req, res) => {
    return res.json(products);
});

app.get('/api/products/:id', authenticateToken, (req, res) => {
    const id = req.params.id;
    const product = products.find(p => p.id == id);
    if (product) {
        return res.json(product);
    } else {
        return res.status(404).send('Product not found');
    }
});

app.get('/api/categories', authenticateToken, (req, res) => {
    return res.json(categories);
});

app.get('/api/categories/:id', authenticateToken, (req, res) => {
    const id = req.params.id;
    const category = categories.find(c => c.id == id);
    if (category) {
        return res.json(category);
    } else {
        return res.status(404).send('Category not found');
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});