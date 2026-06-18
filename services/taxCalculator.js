/**
 * Determines exact regional Canadian tax liabilities based on Place-of-Supply laws
 */
const calculateRegionalTaxNode = (provinceCode, subtotal) => {
  const targetProvince = (provinceCode || 'SK').toUpperCase().trim();
  let gstRate = 0.05, pstRate = 0.00, hstRate = 0.00;
  let taxType = 'GST_ONLY';

  switch (targetProvince) {
    case 'SK':
      pstRate = 0.06;
      taxType = 'GST_AND_PST';
      break;
    case 'ON':
      gstRate = 0.00; hstRate = 0.13;
      taxType = 'HST';
      break;
    case 'NS': case 'NB': case 'NL': case 'PE':
      gstRate = 0.00; hstRate = 0.15;
      taxType = 'HST';
      break;
    case 'BC': case 'MB': case 'QC': 
      taxType = 'GST_ONLY_OUT_OF_PROVINCE';
      break;
    default:
      taxType = 'GST_ONLY';
      break;
  }

  const calculatedGst = subtotal * gstRate;
  const calculatedPst = subtotal * pstRate;
  const calculatedHst = subtotal * hstRate;
  const totalTaxAmount = calculatedGst + calculatedPst + calculatedHst;

  return {
    subtotal: parseFloat(subtotal.toFixed(2)),
    gstWithheld: parseFloat(calculatedGst.toFixed(2)),
    pstWithheld: parseFloat(calculatedPst.toFixed(2)),
    hstWithheld: parseFloat(calculatedHst.toFixed(2)),
    combinedTaxTotal: parseFloat(totalTaxAmount.toFixed(2)),
    finalGrossTotal: parseFloat((subtotal + totalTaxAmount).toFixed(2)),
    complianceClassification: taxType,
    timestamp: new Date()
  };
};
module.exports = { calculateRegionalTaxNode };
