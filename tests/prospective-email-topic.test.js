import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun } from '../src/engine/state.js';
import { email } from '../src/engine/apply.js';
import { setAppLanguage } from '../src/i18n/apply.js';

for (const [language, topicName] of [['en', 'Human–computer interaction'], ['zh', '人机交互']]) {
  for (const template of ['generic', 'specific']) {
    test(`${language}: ${template} email names the contacted professor's field`, () => {
      setAppLanguage(language);
      try {
        const s = createRun(4252220302, { background: 'undergrad', topic: 'theory' });
        const advisor = s.advisors.find(a => a.schoolId === 'udub' && a.topic === 'hci');
        assert.ok(advisor, 'the second Washingtown professor researches HCI, unlike the school primary area and applicant');

        const thread = email(s, advisor.id, template);
        const outgoing = thread.messages[0];
        assert.equal(outgoing.from, 'you');
        assert.ok(outgoing.text.includes(topicName), outgoing.text);
        assert.doesNotMatch(outgoing.text, /\bnlp\b|\bhci\b|Natural language processing|自然语言处理|\btheory\b|理论/);
      } finally {
        setAppLanguage('en');
      }
    });
  }
}
