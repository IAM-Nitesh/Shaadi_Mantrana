const { User } = require('../models');

// Middleware to ensure user's profile is 100% complete before accessing certain routes
async function ensureProfileComplete(req, res, next) {
  try {
    const userId = req.user && req.user.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const user = await User.findById(userId).select('profile profileCompleted isFirstLogin hasSeenOnboardingMessage');
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const completeness = user.profile?.profileCompleteness || 0;

    // If profile completeness is 100% mark profileCompleted flag if not already
    if (completeness >= 100 && !user.profileCompleted) {
      try {
        user.profileCompleted = true;
        user.isFirstLogin = false;
        await user.save();
      } catch (e) {
        // log and continue
        console.error('Error setting profileCompleted flags:', e);
      }
    }

    if (completeness < 100) {
      return res.status(302).json({ success: false, redirect: '/profile', error: 'Profile incomplete', profileCompleteness: completeness });
    }

    // All good
    next();
  } catch (error) {
    console.error('ensureProfileComplete error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

module.exports = { ensureProfileComplete };
