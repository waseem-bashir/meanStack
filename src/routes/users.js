const userModel = require('../models/user')
const jwt = require('jsonwebtoken');
var secret = require('crypto').randomBytes(64).toString('hex');
module.exports = function(router) {
    router.post('/register', function(req, res) {
        if (!req.body.email || !req.body.username) {
            res.json({ success: false, message: 'Please provide all data' });
        } else {
            var user = new userModel();
            user.username = req.body.username;
            user.email = req.body.email;
            user.bio = req.body.bio;
            user.password = req.body.password;
            user.save(function(err) {
                if (err) {
                    res.json({ success: false, message: err });
                } else {
                    res.json({ success: true, message: 'User Created' });
                }
            });
        }
    });
    router.get('/checkEmail/:email', function(req, res) {

        if (!req.params.email) {
            res.json({ success: false, message: 'Please provide Email' });
        } else {
            userModel.findOne({ email: req.params.email }, (err, user) => {
                if (err) {
                    res.json({ success: false, message: err });
                } else if (user) {
                    res.json({ success: false, message: 'Email is already exist' });
                } else {
                    res.json({ success: true, message: 'Email is avaialble' });
                }
            })
        }
    });


    router.post('/login', function(req, res) {
        if (!req.body.email) {
            res.json({ success: false, message: 'Please provide useranme/email' });
        } else if (!req.body.password) {
            res.json({ success: false, message: 'Please provide  password' });
        } else {
            userModel.findOne({ email: req.body.email.toLowerCase() }, (err, user) => {
                if (err) {
                    res.json({ success: false, message: err });
                } else if (user) {
                    const validPassword = user.comparePassword(req.body.password);
                    if (!validPassword) {
                        res.json({ success: false, message: 'Password not matched' });
                    } else {

                        var token = jwt.sign({ userId: user._id }, secret, { expiresIn: '24h' });

                        res.json({ success: true, message: 'User found', token: token, user: { username: user.username, email: user.email } });
                    }
                } else {
                    res.json({ success: false, message: 'User not found' });
                }
            })
        }
    });

    router.use((req, res, next) => {

        const token = req.headers['authorization']; // Create token found in headers
        // Check if token was found in headers
        if (!token) {
            res.json({ success: false, message: 'No token provided' }); // Return error
        } else {
            // Verify the token is valid
            jwt.verify(token, secret, (err, decoded) => {
                // Check if error is expired or invalid
                if (err) {
                    res.json({ success: false, message: 'Token invalid: ' + err }); // Return error for token validation
                } else {
                    req.decoded = decoded; // Create global variable to use in any request beyond
                    next(); // Exit middleware
                }
            });
        }
    });

    router.get('/profile', (req, res) => {

        // Search for user in database
        userModel.findOne({ _id: req.decoded.userId }).select('username email').exec((err, user) => {
            // Check if error connecting
            if (err) {
                res.json({ success: false, message: err }); // Return error
            } else {
                // Check if user was found in database
                if (!user) {
                    res.json({ success: false, message: 'User not found' }); // Return error, user was not found in db
                } else {
                    res.json({ success: true, user: user }); // Return success, send user object to frontend for profile
                }
            }
        });
    });


    return router;
}