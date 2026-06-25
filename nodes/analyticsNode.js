const User = require('../models/User');
const Order = require('../models/Order');

/**
 * JDV Analytics Node: Calculates Growth Node ROI and Vault Funding accumulation.
 */
const getMissionTelemetry = async () => {
    try {
        const totalSignals = await User.countDocuments();
        const activeReferrals = await User.countDocuments({ referralCount: { $gt: 0 } });
        
        // Aggregate Total Vault Funding
        const salesData = await Order.aggregate([
            { $group: { _id: null, totalFunding: { $sum: "$totalAmount" } } }
        ]);
        const totalFunding = salesData.length > 0 ? salesData[0].totalFunding : 0;
        const conversions = await Order.countDocuments();
        
        const viralCoefficient = totalSignals > 0 ? (activeReferrals / totalSignals).toFixed(2) : 0;
        
        return {
            signals: totalSignals,
            conversions,
            totalFunding: parseFloat(totalFunding.toFixed(2)),
            viral_coefficient: viralCoefficient,
            status: 'HYPER-GROWTH'
        };
    } catch (e) {
        return { error: e.message };
    }
};

module.exports = { getMissionTelemetry };
