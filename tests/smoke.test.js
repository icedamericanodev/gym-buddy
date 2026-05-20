// Smoke test for index.html.
// Loads the page in jsdom, exercises the three tabs, and asserts the
// expected UI updates happen. No browser, no network.

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { JSDOM } = require('jsdom');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

const dom = new JSDOM(html, {
  runScripts: 'dangerously',
  pretendToBeVisual: true,
  url: 'http://localhost/',
});
const { document } = dom.window;

function check(name, fn) {
  try {
    fn();
    console.log(`  ok  ${name}`);
  } catch (err) {
    console.error(`  FAIL  ${name}`);
    console.error(`        ${err.message}`);
    process.exitCode = 1;
  }
}

// Give the inline <script> a moment to register listeners + run startup.
dom.window.addEventListener('load', () => {
  console.log('Running smoke tests...');

  check('three tab buttons render', () => {
    assert.strictEqual(document.querySelectorAll('.tab-btn').length, 3);
  });

  check('profile calculation produces a sane BMI', () => {
    document.getElementById('p-age').value = '30';
    document.getElementById('p-sex').value = 'male';
    document.getElementById('p-height').value = '175';
    document.getElementById('p-weight').value = '75';
    document.getElementById('p-activity').value = '1.55';
    document.getElementById('p-goal').value = '0';
    document.getElementById('p-save').click();

    const bmi = parseFloat(document.getElementById('r-bmi').textContent);
    assert.ok(bmi > 20 && bmi < 30, `expected BMI 20–30, got ${bmi}`);
  });

  check('profile calculation produces non-empty macros', () => {
    const protein = parseInt(document.getElementById('r-protein').textContent, 10);
    const carbs = parseInt(document.getElementById('r-carbs').textContent, 10);
    const fat = parseInt(document.getElementById('r-fat').textContent, 10);
    assert.ok(protein > 0, `protein should be > 0, got ${protein}`);
    assert.ok(carbs > 0, `carbs should be > 0, got ${carbs}`);
    assert.ok(fat > 0, `fat should be > 0, got ${fat}`);
  });

  check('meal finder surfaces a recipe for eggs + bread', () => {
    document.getElementById('m-ingredients').value = 'eggs, bread';
    document.getElementById('m-find').click();
    const text = document.getElementById('m-results').textContent.toLowerCase();
    assert.ok(text.includes('eggs') || text.includes('toast') || text.includes('sandwich'),
      `expected an egg/bread recipe in results, got: ${text.slice(0, 200)}`);
  });

  check('workouts tab renders at least 5 exercises by default', () => {
    const exercises = document.querySelectorAll('#w-results .exercise');
    assert.ok(exercises.length >= 5, `expected ≥5 exercises, got ${exercises.length}`);
  });

  check('sources panel is rendered with citations', () => {
    const sources = document.querySelector('details.sources');
    assert.ok(sources, 'expected a details.sources element');
    const text = sources.textContent;
    assert.ok(text.includes('Mifflin-St Jeor'), 'expected Mifflin-St Jeor citation');
    assert.ok(text.includes('AMDR'), 'expected AMDR citation');
    assert.ok(text.includes('ISSN'), 'expected ISSN citation');
  });

  // Reset profile to a known baseline so subsequent tests don't rely on
  // residual state from earlier tests.
  function setBaselineProfile() {
    document.getElementById('p-age').value = '30';
    document.getElementById('p-sex').value = 'male';
    document.getElementById('p-height').value = '175';
    document.getElementById('p-weight').value = '75';
    document.getElementById('p-activity').value = '1.55';
    document.getElementById('p-goal').value = '0';
  }

  check('protein target adapts to goal (cut > maintain)', () => {
    setBaselineProfile();
    document.getElementById('p-goal').value = '-500';
    document.getElementById('p-save').click();
    const cutProtein = parseInt(document.getElementById('r-protein').textContent, 10);

    setBaselineProfile();
    document.getElementById('p-goal').value = '0';
    document.getElementById('p-save').click();
    const maintainProtein = parseInt(document.getElementById('r-protein').textContent, 10);

    assert.ok(cutProtein > maintainProtein,
      `expected cut protein (${cutProtein}) > maintain protein (${maintainProtein})`);
  });

  check('calorie target shifts with goal', () => {
    setBaselineProfile();
    document.getElementById('p-goal').value = '-500';
    document.getElementById('p-save').click();
    const cutTarget = parseInt(document.getElementById('r-target').textContent, 10);

    setBaselineProfile();
    document.getElementById('p-goal').value = '300';
    document.getElementById('p-save').click();
    const gainTarget = parseInt(document.getElementById('r-target').textContent, 10);

    assert.strictEqual(gainTarget - cutTarget, 800,
      `expected gain − cut to be 800 kcal, got ${gainTarget - cutTarget}`);
  });

  check('safety floor warning surfaces when target drops below the minimum', () => {
    // 50kg sedentary woman on a -500 kcal cut lands well below 1200 kcal.
    document.getElementById('p-age').value = '30';
    document.getElementById('p-sex').value = 'female';
    document.getElementById('p-height').value = '160';
    document.getElementById('p-weight').value = '50';
    document.getElementById('p-activity').value = '1.2';
    document.getElementById('p-goal').value = '-500';
    document.getElementById('p-save').click();

    const sub = document.getElementById('r-goal-sub');
    assert.ok(sub.textContent.toLowerCase().includes('below safe minimum'),
      `expected "below safe minimum" warning, got "${sub.textContent}"`);

    // Maintain at the same body should not trip the warning.
    document.getElementById('p-goal').value = '0';
    document.getElementById('p-save').click();
    assert.ok(!sub.textContent.toLowerCase().includes('below safe minimum'),
      `unexpected warning at maintain: "${sub.textContent}"`);
  });

  check('negative or zero profile inputs hide the results card', () => {
    // First produce a valid result so the card is visible.
    document.getElementById('p-age').value = '30';
    document.getElementById('p-height').value = '175';
    document.getElementById('p-weight').value = '75';
    document.getElementById('p-goal').value = '0';
    document.getElementById('p-save').click();
    assert.notStrictEqual(document.getElementById('p-results').style.display, 'none',
      'expected results visible after valid save');

    // Now plug in a negative weight — must hide (was a bug: negative protein/BMI).
    document.getElementById('p-weight').value = '-50';
    document.getElementById('p-save').click();
    assert.strictEqual(document.getElementById('p-results').style.display, 'none',
      'negative weight should hide the results card, not show negative macros');

    // Same for height and age.
    document.getElementById('p-weight').value = '75';
    document.getElementById('p-height').value = '-10';
    document.getElementById('p-save').click();
    assert.strictEqual(document.getElementById('p-results').style.display, 'none',
      'negative height should hide the results card');

    document.getElementById('p-height').value = '175';
    document.getElementById('p-age').value = '-1';
    document.getElementById('p-save').click();
    assert.strictEqual(document.getElementById('p-results').style.display, 'none',
      'negative age should hide the results card');
  });

  check('every info icon has a non-trivial title', () => {
    const icons = document.querySelectorAll('.info');
    assert.ok(icons.length >= 8, `expected ≥8 info icons, got ${icons.length}`);
    icons.forEach((i, idx) => {
      const title = i.getAttribute('title') || '';
      assert.ok(title.length >= 30,
        `info icon #${idx} should have a descriptive title, got "${title}"`);
    });
  });

  check('build-a-session always returns up to 5 distinct picks across rapid clicks', () => {
    // Reset to "all" filters
    document.querySelectorAll('#loc-filter button').forEach(b => {
      if (b.dataset.loc === 'all') b.click();
    });
    document.querySelectorAll('#muscle-filter button').forEach(b => {
      if (b.dataset.muscle === 'all') b.click();
    });
    for (let i = 0; i < 25; i++) {
      document.getElementById('w-plan').click();
      const cards = document.querySelectorAll('#w-results .exercise');
      const names = Array.from(cards).map(c => c.querySelector('h4').textContent);
      assert.strictEqual(cards.length, 5,
        `click #${i}: expected 5 picks (all filters), got ${cards.length}`);
      const unique = new Set(names);
      assert.strictEqual(unique.size, names.length,
        `click #${i}: expected distinct picks, got duplicates in ${names.join(', ')}`);
    }
  });

  if (process.exitCode) {
    console.error('\nSome smoke tests FAILED.');
  } else {
    console.log('\nAll smoke tests passed.');
  }
});
