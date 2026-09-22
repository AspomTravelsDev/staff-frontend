const { buildItineraryTemplate } = require('./build-itinerary-template');
const { buildIntroTemplates } = require('./build-intro-templates');
const { buildExplanationTemplate } = require('./build-explanation-template');
const { buildSponsorshipTemplate } = require('./build-sponsorship-template');
const { buildBudgetTemplate } = require('./build-budget-template');
const { buildSelfIntroTemplate } = require('./build-self-intro-template');

function buildAllTemplates() {
  console.log('--- Building All Visa Document Templates ---');
  buildItineraryTemplate();
  buildIntroTemplates();
  buildExplanationTemplate();
  buildSponsorshipTemplate();
  buildBudgetTemplate();
  buildSelfIntroTemplate();
  console.log('SUCCESS: All visa document templates built successfully!');
}

if (require.main === module) {
  buildAllTemplates();
}

module.exports = { buildAllTemplates };
