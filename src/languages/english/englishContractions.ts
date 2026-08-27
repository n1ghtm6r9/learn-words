import type { ContractionRule } from '../contractionRule.type';

const NOT_FORMS: Record<string, string> = {
  are: "aren't",
  could: "couldn't",
  dare: "daren't",
  did: "didn't",
  do: "don't",
  does: "doesn't",
  had: "hadn't",
  has: "hasn't",
  have: "haven't",
  is: "isn't",
  may: "mayn't",
  might: "mightn't",
  must: "mustn't",
  need: "needn't",
  ought: "oughtn't",
  shall: "shan't",
  should: "shouldn't",
  used: "usedn't",
  was: "wasn't",
  were: "weren't",
  will: "won't",
  would: "wouldn't",
};

const NEGATED_CLITICS: Record<string, string> = {
  "'s": "isn't",
  "'re": "aren't",
  "'ve": "haven't",
  "'ll": "won't",
  "'d": "wouldn't",
};

const CLITICS: Record<string, string> = {
  am: "'m",
  are: "'re",
  had: "'d",
  has: "'s",
  have: "'ve",
  is: "'s",
  will: "'ll",
  would: "'d",
};

function negationRule([auxiliary, contracted]: [string, string]): ContractionRule {
  return [new RegExp(`\\b${auxiliary}\\s+not\\b`, 'gi'), contracted];
}

function negatedCliticRule([clitic, contracted]: [string, string]): ContractionRule {
  return [new RegExp(`\\b(\\w+)${clitic}\\s+not\\b`, 'gi'), `$1 ${contracted}`];
}

function cliticRule([word, clitic]: [string, string]): ContractionRule {
  return [new RegExp(`\\b(\\w+)\\s+${word}\\b`, 'gi'), `$1${clitic}`];
}

export const ENGLISH_CONTRACTIONS: readonly ContractionRule[] = [
  [/\bcan\s*not\b/gi, "can't"],
  ...Object.entries(NOT_FORMS).map(negationRule),
  ...Object.entries(NEGATED_CLITICS).map(negatedCliticRule),
  [/\blet\s+us\b/gi, "let's"],
  ...Object.entries(CLITICS).map(cliticRule),
];
