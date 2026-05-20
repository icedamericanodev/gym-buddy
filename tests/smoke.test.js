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

  check('five tab buttons render', () => {
    assert.strictEqual(document.querySelectorAll('.tab-btn').length, 5);
  });

  check('version pill in header matches CHANGELOG top entry', () => {
    const versionEl = document.querySelector('header .version');
    assert.ok(versionEl, 'expected a .version pill in the header');
    const shown = versionEl.textContent.trim();
    assert.ok(/^v\d+\.\d+\.\d+$/.test(shown),
      `expected vN.N.N format, got "${shown}"`);

    const changelog = fs.readFileSync(path.join(__dirname, '..', 'CHANGELOG.md'), 'utf8');
    const m = changelog.match(/^##\s+(v\d+\.\d+\.\d+)/m);
    assert.ok(m, 'expected at least one ## vN.N.N heading in CHANGELOG.md');
    assert.strictEqual(shown, m[1],
      `header pill (${shown}) should match top CHANGELOG entry (${m[1]})`);
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

  check('every info icon is a button with a non-trivial data-tip', () => {
    const icons = document.querySelectorAll('button.info');
    assert.ok(icons.length >= 8, `expected ≥8 info icons, got ${icons.length}`);
    icons.forEach((b, idx) => {
      const tip = b.getAttribute('data-tip') || '';
      assert.ok(tip.length >= 30,
        `info icon #${idx} should have a descriptive data-tip, got "${tip}"`);
    });
  });

  check('absurd-but-positive profile inputs surface a hint and hide results', () => {
    document.getElementById('p-age').value = '200';
    document.getElementById('p-sex').value = 'male';
    document.getElementById('p-height').value = '175';
    document.getElementById('p-weight').value = '75';
    document.getElementById('p-save').click();
    const hint = document.getElementById('p-input-hint');
    assert.strictEqual(hint.style.display, 'block', 'expected hint visible for age=200');
    assert.ok(hint.textContent.includes('double-check'),
      `expected double-check copy, got "${hint.textContent}"`);
    assert.strictEqual(document.getElementById('p-results').style.display, 'none',
      'results card should stay hidden for absurd inputs');
  });

  check('build-a-session label adapts to filtered pool', () => {
    // Reset to "all" filter to see the 5-exercise label
    document.querySelectorAll('#loc-filter button').forEach(b => {
      if (b.dataset.loc === 'all') b.click();
    });
    document.querySelectorAll('#muscle-filter button').forEach(b => {
      if (b.dataset.muscle === 'all') b.click();
    });
    let label = document.getElementById('w-plan').textContent;
    assert.ok(label.includes('5 exercises'),
      `expected "5 exercises" in label, got "${label}"`);

    // Filter to chest (only ~2 chest exercises) → label should reflect smaller pool
    document.querySelectorAll('#muscle-filter button').forEach(b => {
      if (b.dataset.muscle === 'chest') b.click();
    });
    label = document.getElementById('w-plan').textContent;
    assert.ok(label.includes('only') || label.includes('No exercises'),
      `expected restricted-pool copy, got "${label}"`);
  });

  check('legacy gymBuddyProfile key migrates to herlyftProfile on load', () => {
    // Simulate a user who upgraded from v0.7 (or earlier) — their data is
    // under the old key. Loading the page should transparently copy it
    // forward; subsequent saves write only to the new key.
    dom.window.localStorage.removeItem('herlyftProfile');
    dom.window.localStorage.setItem('gymBuddyProfile', JSON.stringify({
      name: 'Legacy', age: '35', sex: 'female', height: '165',
      weight: '60', activity: '1.55', goal: '0', style: 'mixed',
    }));
    // Manually invoke loadProfile via the global scope.
    dom.window.loadProfile && dom.window.loadProfile();
    // After loadProfile, the new key should now contain the data too.
    const newRaw = dom.window.localStorage.getItem('herlyftProfile');
    assert.ok(newRaw, 'expected legacy profile migrated to herlyftProfile');
    const newP = JSON.parse(newRaw);
    assert.strictEqual(newP.name, 'Legacy', 'migrated profile should retain name');
  });

  check('corrupt profile JSON does not crash and is discarded', () => {
    dom.window.localStorage.removeItem('herlyftProfile');
    dom.window.localStorage.removeItem('gymBuddyProfile');
    dom.window.localStorage.setItem('herlyftProfile', '{this is not json');
    dom.window.loadProfile && dom.window.loadProfile();
    // Should have been removed by the defensive try/catch.
    assert.strictEqual(dom.window.localStorage.getItem('herlyftProfile'), null,
      'expected corrupt herlyftProfile to be cleared after a failed parse');
  });

  check('dashboard logs weight on profile save and shows the chart', () => {
    // Clear any prior weight log.
    dom.window.localStorage.removeItem('herlyftWeights');

    document.getElementById('p-age').value = '30';
    document.getElementById('p-sex').value = 'male';
    document.getElementById('p-height').value = '175';
    document.getElementById('p-weight').value = '78.4';
    document.getElementById('p-activity').value = '1.55';
    document.getElementById('p-goal').value = '0';
    document.getElementById('p-save').click();

    const dashBtn = Array.from(document.querySelectorAll('.tab-btn'))
      .find(b => b.dataset.tab === 'dashboard');
    dashBtn.click();

    assert.strictEqual(document.getElementById('dash-empty').style.display, 'none',
      'expected dash-empty hidden once a weight is logged');
    assert.strictEqual(document.getElementById('dash-current').textContent, '78.4',
      `expected current weight 78.4, got ${document.getElementById('dash-current').textContent}`);

    const svg = document.getElementById('dash-svg');
    assert.ok(svg.innerHTML.length > 0, 'expected the chart SVG to be populated');
  });

  check('backup builds a JSON object covering profile + weights + hydration', () => {
    // Seed some data.
    dom.window.localStorage.setItem('herlyftProfile', JSON.stringify({ name: 'Test', weight: '72' }));
    dom.window.localStorage.setItem('herlyftWeights', JSON.stringify([{ date: '2026-05-19', kg: 72 }]));
    dom.window.localStorage.setItem('herlyftHydro:2026-05-20', JSON.stringify([{ ml: 500, t: 'x' }]));
    const backup = dom.window.buildBackup();
    assert.strictEqual(backup.app, 'herlyft', 'backup.app should identify the source app');
    assert.ok(backup.profile && backup.profile.name === 'Test', 'backup should include profile');
    assert.ok(Array.isArray(backup.weights) && backup.weights.length >= 1, 'backup should include weights');
    assert.ok(backup.hydration['2026-05-20'], 'backup should include today\'s hydration');
  });

  check('restore from a backup overwrites localStorage', () => {
    dom.window.localStorage.removeItem('herlyftProfile');
    dom.window.localStorage.removeItem('herlyftWeights');
    const data = {
      app: 'herlyft',
      schema: 1,
      profile: { name: 'Restored', weight: '69' },
      weights: [{ date: '2026-01-01', kg: 70 }],
      hydration: { '2026-05-20': [{ ml: 1000 }] },
    };
    dom.window.applyBackup(data);
    const p = JSON.parse(dom.window.localStorage.getItem('herlyftProfile'));
    assert.strictEqual(p.name, 'Restored', 'profile should be restored from backup');
    const w = JSON.parse(dom.window.localStorage.getItem('herlyftWeights'));
    assert.strictEqual(w[0].kg, 70, 'weights should be restored from backup');
  });

  check('hydration tracker shows once profile is saved and quick-add works', () => {
    // Clear any prior hydration state from earlier tests in this run.
    Object.keys(dom.window.localStorage).forEach(k => {
      if (k.startsWith('herlyftHydro:')) dom.window.localStorage.removeItem(k);
    });

    // Ensure profile is saved so the water target exists.
    document.getElementById('p-age').value = '30';
    document.getElementById('p-sex').value = 'male';
    document.getElementById('p-height').value = '175';
    document.getElementById('p-weight').value = '75';
    document.getElementById('p-activity').value = '1.55';
    document.getElementById('p-goal').value = '0';
    document.getElementById('p-save').click();

    const card = document.getElementById('h-card');
    assert.notStrictEqual(card.style.display, 'none',
      'expected hydration card visible after profile saved');
    assert.strictEqual(document.getElementById('h-current').textContent, '0.0',
      'expected initial intake 0.0 L');

    // +Cup (250 ml) twice → 0.5 L
    const cupBtn = document.querySelector('.hydro-btn[data-ml="250"]');
    cupBtn.click(); cupBtn.click();
    assert.strictEqual(document.getElementById('h-current').textContent, '0.5',
      `expected 0.5 L after two cups, got ${document.getElementById('h-current').textContent}`);

    // +Bottle (500 ml) → 1.0 L total
    document.querySelector('.hydro-btn[data-ml="500"]').click();
    assert.strictEqual(document.getElementById('h-current').textContent, '1.0',
      `expected 1.0 L after a bottle, got ${document.getElementById('h-current').textContent}`);

    // Undo → 0.5 L
    document.getElementById('h-undo').click();
    assert.strictEqual(document.getElementById('h-current').textContent, '0.5',
      `expected 0.5 L after undo, got ${document.getElementById('h-current').textContent}`);
  });

  check('flexibility muscle filter and 8 stretches are present', () => {
    // Click the Flexibility filter and verify ≥6 stretches show up.
    const flexBtn = Array.from(document.querySelectorAll('#muscle-filter button'))
      .find(b => b.dataset.muscle === 'flexibility');
    assert.ok(flexBtn, 'expected a Flexibility muscle filter button');
    flexBtn.click();
    const stretches = document.querySelectorAll('#w-results .exercise');
    assert.ok(stretches.length >= 6,
      `expected ≥6 stretches under Flexibility, got ${stretches.length}`);

    // Reset to "all" so later tests don't inherit this filter.
    document.querySelectorAll('#muscle-filter button').forEach(b => {
      if (b.dataset.muscle === 'all') b.click();
    });
  });

  check('summary recommendations adapt to BMI and preferred style', () => {
    // Healthy-BMI profile → balanced meal range; preferred style 'bodyweight'.
    document.getElementById('p-name').value = 'RecsCheck';
    document.getElementById('p-age').value = '30';
    document.getElementById('p-sex').value = 'male';
    document.getElementById('p-height').value = '175';
    document.getElementById('p-weight').value = '75';
    document.getElementById('p-activity').value = '1.55';
    document.getElementById('p-goal').value = '0';
    document.getElementById('p-style').value = 'bodyweight';
    document.getElementById('p-save').click();

    const summaryBtn = Array.from(document.querySelectorAll('.tab-btn'))
      .find(b => b.dataset.tab === 'summary');
    summaryBtn.click();

    const mealsHtml = document.getElementById('s-rec-meals').textContent;
    assert.ok(mealsHtml.length > 0, 'expected recommended meals to render');
    const exHtml = document.getElementById('s-rec-exercises').textContent;
    assert.ok(exHtml.length > 0, 'expected recommended exercises to render');
    // Bodyweight style → no gym-only entries like "Bench press"
    assert.ok(!exHtml.includes('Bench press'),
      'bodyweight style should not surface gym-only exercises');
  });

  check('summary tab shows empty state with no profile, populated once filled', () => {
    // Activate Summary tab (force renderSummary to run)
    const summaryBtn = Array.from(document.querySelectorAll('.tab-btn'))
      .find(b => b.dataset.tab === 'summary');
    assert.ok(summaryBtn, 'expected a Summary tab button');

    // Fill a valid profile first (other tests may have set absurd values).
    document.getElementById('p-name').value = 'Test User';
    document.getElementById('p-age').value = '30';
    document.getElementById('p-sex').value = 'male';
    document.getElementById('p-height').value = '175';
    document.getElementById('p-weight').value = '75';
    document.getElementById('p-activity').value = '1.55';
    document.getElementById('p-goal').value = '0';
    document.getElementById('p-save').click();

    summaryBtn.click();

    assert.strictEqual(document.getElementById('s-empty').style.display, 'none',
      'empty state should be hidden when profile is filled');
    assert.ok(document.getElementById('s-name').textContent.includes('Test User'),
      `expected name "Test User" in summary, got "${document.getElementById('s-name').textContent}"`);
    assert.strictEqual(document.getElementById('s-c-bmi').textContent,
      document.getElementById('r-bmi').textContent,
      'summary BMI should match profile-tab BMI');

    const exportBtn = document.getElementById('s-export');
    assert.ok(exportBtn, 'expected an Export to PDF button');
    assert.ok(exportBtn.textContent.toLowerCase().includes('pdf'),
      `export button should mention PDF, got "${exportBtn.textContent}"`);
  });

  check('every exercise card has a demo toggle (button or search link)', () => {
    const cards = document.querySelectorAll('#w-results .exercise');
    assert.ok(cards.length > 0, 'expected exercises rendered');
    cards.forEach((card, i) => {
      const toggle = card.querySelector('.demo-toggle');
      assert.ok(toggle, `card #${i} should have a .demo-toggle element`);
    });
  });

  check('clicking a demo button with a videoId embeds a YouTube iframe', () => {
    // Find a card whose toggle is a real button (videoId present).
    const btn = document.querySelector('button.demo-toggle[data-vid]');
    if (!btn) {
      // No videoIds yet — that's a valid state at v0.4.0 launch. Skip.
      console.log('     (skipped — no videoId entries to test against)');
      return;
    }
    const card = btn.closest('.exercise');
    assert.ok(!card.querySelector('.demo-frame'), 'demo frame should start hidden');
    btn.click();
    const iframe = card.querySelector('.demo-frame iframe');
    assert.ok(iframe, 'expected iframe after click');
    assert.ok(iframe.getAttribute('src').includes('youtube-nocookie.com/embed/'),
      `iframe src should use youtube-nocookie embed, got ${iframe.getAttribute('src')}`);
    // Toggle again hides it.
    btn.click();
    assert.ok(!card.querySelector('.demo-frame'), 'demo frame should be removed on second click');
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
