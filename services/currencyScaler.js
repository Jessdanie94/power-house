const scaleCurrency = (amount, currency) => (amount * (currency === 'USD' ? 0.73 : 0.68)).toFixed(2);
module.exports = { scaleCurrency };
