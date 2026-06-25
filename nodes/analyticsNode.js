const User = require('../models/User');
const Order = require('../models/Order');

/**
 * JDV Analytics Node: Calculates Growth Node ROI and Conversion Velocity.
 */
const getMissionTelemetry = async () => {
    try {
        const totalSignals = await User.countDocuments();
        const activeReferrals = await User.countDocuments({ referralCount: { $gt: 0 } });
        const conversions = await Order.countDocuments();
        
        const viralCoefficient = totalSignals > 0 ? (activeReferrals / totalSignals).toFixed(2) : 0;
        
        return {
            signals: totalSignals,
            conversions,
            viral_coefficient: viralCoefficient,
            status: 'HYPER-GROWTH'
        };
    } catch (e) {
        return { error: e.message };
    }
};

module.exports = { getMissionTelemetry };
