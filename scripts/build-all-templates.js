const { buildItineraryTemplate } = require('./build-itinerary-template');
const { buildIntroTemplates } = require('./build-intro-templates');
const { buildExplanationTemplate } = require('./build-explanation-template');
const { buildSponsorshipTemplate } = require('./build-sponsorship-template');

function buildAllTemplates() {
  console.log('--- Building All Visa Document Templates ---');
  buildItineraryTemplate();
  buildIntroTemplates();
  buildExplanationTemplate();
  buildSponsorshipTemplate();
  console.log('SUCCESS: All 4 visa document templates built successfully!');
}

if (require.main === module) {
  buildAllTemplates();
}

module.exports = { buildAllTemplates };
