import express from 'express';
import jwt from 'jsonwebtoken';
import axios from 'axios';

const router = express.Router();

const DISCORD_API_BASE = 'https://discord.com/api/v10';
const REQUIRED_GUILD_ID = process.env.REQUIRED_GUILD_ID;
const ALLOWED_ROLE_IDS = process.env.ALLOWED_ROLE_IDS?.split(',') || [];

// Discord OAuth2 login endpoint
router.get('/discord', (req, res) => {
    const params = new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID,
        redirect_uri: process.env.DISCORD_REDIRECT_URI,
        response_type: 'code',
        scope: 'identify guilds guilds.members.read'
    });

    res.redirect(`https://discord.com/api/oauth2/authorize?${params}`);
});

// Discord OAuth2 callback endpoint
router.get('/discord/callback', async (req, res) => {
    const { code } = req.query;

    if (!code) {
        return res.redirect('http://localhost:5173?error=no_code');
    }

    try {
        // Exchange code for access token
        const tokenData = new URLSearchParams({
            client_id: process.env.DISCORD_CLIENT_ID,
            client_secret: process.env.DISCORD_CLIENT_SECRET,
            grant_type: 'authorization_code',
            code,
            redirect_uri: process.env.DISCORD_REDIRECT_URI
        });
        
        const tokenResponse = await axios.post(`${DISCORD_API_BASE}/oauth2/token`, tokenData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        const { access_token, token_type } = tokenResponse.data;

        // Get user information
        const userResponse = await axios.get(`${DISCORD_API_BASE}/users/@me`, {
            headers: {
                Authorization: `${token_type} ${access_token}`
            }
        });

        const user = userResponse.data;

        // Check if user is in the required guild (if configured)
        let member = null;
        let userRoles = [];
        
        if (REQUIRED_GUILD_ID) {
            try {
                const guildMemberResponse = await axios.get(
                    `${DISCORD_API_BASE}/users/@me/guilds/${REQUIRED_GUILD_ID}/member`,
                    {
                        headers: {
                            Authorization: `${token_type} ${access_token}`
                        }
                    }
                );

                if (!guildMemberResponse || !guildMemberResponse.data) {
                    console.log(`User ${user.username} (${user.id}) not found in required guild`);
                    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}?error=not_in_server`);
                }

                member = guildMemberResponse.data;
                userRoles = member.roles || [];

                // Check if user has required roles (if configured)
                if (ALLOWED_ROLE_IDS.length > 0) {
                    const hasRequiredRole = ALLOWED_ROLE_IDS.some(roleId => 
                        userRoles.includes(roleId)
                    );

                    if (!hasRequiredRole) {
                        console.log(`User ${user.username} (${user.id}) lacks required roles`);
                        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}?error=insufficient_permissions`);
                    }
                }
                
                console.log(`User ${user.username} (${user.id}) authenticated successfully`);
            } catch (error) {
                console.error('Error checking guild membership:', error);
                return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}?error=guild_check_failed`);
            }
        } else {
            console.log('⚠️ No REQUIRED_GUILD_ID configured - allowing all Discord users');
        }

        // Create JWT token
        const jwtToken = jwt.sign({
            id: user.id,
            username: user.username,
            discriminator: user.discriminator,
            avatar: user.avatar,
            roles: userRoles,
            guildId: REQUIRED_GUILD_ID
        }, process.env.JWT_SECRET, { expiresIn: '7d' });

        // Set JWT as HTTP-only cookie
        res.cookie('auth_token', jwtToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        // Redirect to frontend
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}?auth=success`);

    } catch (error) {
        console.error('Discord OAuth error:', error);
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}?error=auth_failed`);
    }
});

// Get current user endpoint
router.get('/me', authenticateToken, (req, res) => {
    res.json({
        user: req.user,
        authenticated: true
    });
});

// Logout endpoint
router.post('/logout', (req, res) => {
    res.clearCookie('auth_token');
    res.json({ success: true });
});

// Authentication middleware
export function authenticateToken(req, res, next) {
    const token = req.cookies?.auth_token;

    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
}

// Verify user still has permissions (can be called periodically)
router.get('/verify', authenticateToken, async (req, res) => {
    try {
        // In a real implementation, you'd want to check with Discord API
        // to ensure user still has the required roles
        res.json({ valid: true, user: req.user });
    } catch (error) {
        res.status(401).json({ error: 'Verification failed' });
    }
});

export default router;