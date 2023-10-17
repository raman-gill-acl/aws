// -----------------------------------------------------
// Lists out all certificates using email validation
//
// Usage:
// aws-vault exec ACCOUNTNAME -- node list-acm-certs-with-email-validation.js
// aws-vault exec ACCOUNTNAME -- node list-acm-certs-with-email-validation.js --regions="us-west-2 us-east-1"
// aws-vault exec ACCOUNTNAME -- node list-acm-certs-with-email-validation.js --regions="us-gov-west-1"
// -----------------------------------------------------
const AWS = require('aws-sdk');
const args = require('yargs').argv;

async function listCertificates() {
  const certificates = [];
  let NextToken = null;

  do {
    const result = await new AWS.ACM().listCertificates({ NextToken }).promise();
    certificates.push(...result.CertificateSummaryList);
    NextToken = result.NextToken;
  } while (NextToken);

  return certificates;
}

async function listCertificatesWithEmailValidation(certificates) {
  const output = [];

  for (const item of certificates) {
    const certificate = await new AWS.ACM().describeCertificate({ CertificateArn: item.CertificateArn }).promise();
    const validationMethods = certificate?.Certificate?.DomainValidationOptions?.map(item => item.ValidationMethod) || [];

    if (!validationMethods.includes('EMAIL')) {
      continue;
    }

    output.push({
      DomainName: certificate?.Certificate?.DomainName,
      CertificateArn: certificate?.Certificate?.CertificateArn,
      Status: certificate?.Certificate?.Status,
      Expires: certificate?.Certificate?.NotAfter,
      ValidationMethod: validationMethods,
      ValidationEmails: certificate?.Certificate?.DomainValidationOptions?.map(item => item.ValidationEmails),
    });
  }

  return output;
}

(async() => {
  const awsRegions = args?.region?.split(' ') || [
    'us-west-2',
    'us-east-1',
    'af-south-1',
    'ap-southeast-1',
    'ap-southeast-2',
    'ap-northeast-1',
    'ca-central-1',
    'eu-central-1',
    'sa-east-1',
  ];

  for (const region of awsRegions) {
    AWS.config.update({ region });
    const certificates = await listCertificates();
    const output = await listCertificatesWithEmailValidation(certificates);

    console.log(`Region: ${region} has ${output.length} of ${certificates.length} certificates with email validation`);
    console.log(output);
  }
})();
