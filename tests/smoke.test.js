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
dom.window.addEventListener('load', async () => {
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

  check('PWA: manifest is linked, valid JSON, and its icons exist on disk', () => {
    const link = document.querySelector('link[rel="manifest"]');
    assert.ok(link, 'expected a <link rel="manifest"> in the head');
    const themeColor = document.querySelector('meta[name="theme-color"]');
    assert.ok(themeColor, 'expected a theme-color meta tag');

    const root = path.join(__dirname, '..');
    const manifest = JSON.parse(
      fs.readFileSync(path.join(root, link.getAttribute('href')), 'utf8'));
    assert.strictEqual(manifest.display, 'standalone', 'manifest should be standalone');
    assert.ok(Array.isArray(manifest.icons) && manifest.icons.length >= 2,
      'manifest should declare at least two icons');
    assert.ok(manifest.icons.some((i) => /maskable/.test(i.purpose || '')),
      'manifest should include a maskable icon for Android');
    manifest.icons.forEach((icon) => {
      assert.ok(fs.existsSync(path.join(root, icon.src)),
        `manifest icon ${icon.src} should exist on disk`);
    });
  });

  check('PWA: service worker is registered behind an http(s) guard', () => {
    assert.ok(fs.existsSync(path.join(__dirname, '..', 'sw.js')),
      'expected sw.js to exist');
    assert.ok(/serviceWorker['"\]]?\s*in\s*navigator/.test(html),
      'SW registration should be feature-detected');
    assert.ok(/location\.protocol\.startsWith\(['"]http/.test(html),
      'SW registration should be guarded so file:// does not throw');
  });

  check('PWA: service worker cache version tracks the app version (deploys must reach users)', () => {
    const sw = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');
    const swVer = (sw.match(/herlyft-v([0-9]+\.[0-9]+\.[0-9]+)/) || [])[1];
    const appVer = (html.match(/class="version">v([0-9]+\.[0-9]+\.[0-9]+)</) || [])[1];
    assert.ok(swVer, 'sw.js should define a versioned cache name (herlyft-vX.Y.Z)');
    assert.strictEqual(swVer, appVer,
      `sw.js CACHE (${swVer}) must match the app version pill (${appVer}) so old caches are cleaned up on activate`);
  });

  check('PWA: install button is present and hidden until the browser offers a prompt', () => {
    const btn = document.getElementById('install-btn');
    assert.ok(btn, 'expected an #install-btn in the header');
    assert.ok(btn.hidden, 'install button should start hidden');
    assert.ok(btn.getAttribute('aria-label'), 'install button should have an accessible name');
  });

  check('PWA: CI deploy stages the manifest, service worker, and icons', () => {
    const ci = fs.readFileSync(
      path.join(__dirname, '..', '.github', 'workflows', 'ci.yml'), 'utf8');
    ['manifest.webmanifest', 'sw.js', 'icons'].forEach((f) => {
      assert.ok(ci.includes(f), `CI deploy step should stage ${f} to _site`);
    });
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

  check('tapping the wordmark spawns a lowkey love note 💛', () => {
    // Clear any prior pops left by other interactions.
    document.querySelectorAll('.love-pop').forEach(p => p.remove());

    const h1 = document.querySelector('header h1');
    assert.ok(h1, 'expected the Herlyft wordmark in the header');
    h1.click();

    const pop = document.querySelector('.love-pop');
    assert.ok(pop, 'expected a .love-pop after tapping the wordmark');
    assert.ok(pop.textContent.includes('💛'),
      `expected a heart in the love note, got "${pop.textContent}"`);

    // Rate-limit: a second immediate click should NOT spawn a second pop.
    h1.click();
    const pops = document.querySelectorAll('.love-pop');
    assert.strictEqual(pops.length, 1,
      `expected the cooldown to suppress the second pop, got ${pops.length}`);
  });

  check('switching to imperial converts displayed values and updates labels', () => {
    // Start clean.
    dom.window.localStorage.removeItem('herlyftProfile');
    dom.window.localStorage.removeItem('herlyftWeights');

    // Type a known metric profile.
    document.getElementById('p-units').value = 'metric';
    document.getElementById('p-units').dispatchEvent(new dom.window.Event('change'));
    document.getElementById('p-age').value = '30';
    document.getElementById('p-sex').value = 'male';
    document.getElementById('p-height').value = '175';
    document.getElementById('p-weight').value = '75';
    document.getElementById('p-activity').value = '1.55';
    document.getElementById('p-goal').value = '0';

    // Flip to imperial — the displayed numbers should auto-convert.
    document.getElementById('p-units').value = 'imperial';
    document.getElementById('p-units').dispatchEvent(new dom.window.Event('change'));

    assert.strictEqual(document.getElementById('p-height-label').textContent, 'Height (in)',
      'expected height label to switch to in');
    assert.strictEqual(document.getElementById('p-weight-label').textContent, 'Weight (lbs)',
      'expected weight label to switch to lbs');

    const inches = parseInt(document.getElementById('p-height').value, 10);
    assert.ok(Math.abs(inches - 69) <= 1,
      `175 cm should display as ~69 in, got ${inches}`);
    const pounds = parseFloat(document.getElementById('p-weight').value);
    assert.ok(Math.abs(pounds - 165.3) < 0.5,
      `75 kg should display as ~165.3 lbs, got ${pounds}`);
  });

  check('profile saved while in imperial mode stores values in metric', () => {
    // Continuing from the previous test — we're still in imperial mode.
    document.getElementById('p-save').click();
    const saved = JSON.parse(dom.window.localStorage.getItem('herlyftProfile'));
    // height was ~69 in (round-trip from 175 cm), saved should be ~175 cm.
    assert.ok(Math.abs(saved.height - 175) <= 3,
      `expected stored height ≈175 cm, got ${saved.height}`);
    assert.ok(Math.abs(saved.weight - 75) <= 0.5,
      `expected stored weight ≈75 kg, got ${saved.weight}`);
    assert.strictEqual(saved.units, 'imperial',
      `expected stored units 'imperial', got ${saved.units}`);
    assert.strictEqual(saved.schema, 2,
      `expected schema 2, got ${saved.schema}`);
  });

  check('legacy schema-1 profile loads with metric default', () => {
    // Old profile (no units field, no schema field, metric values).
    dom.window.localStorage.setItem('herlyftProfile', JSON.stringify({
      name: 'Old', age: '30', sex: 'male',
      height: '170', weight: '70',
      activity: '1.55', goal: '0', style: 'mixed',
    }));
    dom.window.loadProfile && dom.window.loadProfile();
    assert.strictEqual(document.getElementById('p-units').value, 'metric',
      'legacy profile (no units) should default to metric');
    assert.strictEqual(document.getElementById('p-height-label').textContent, 'Height (cm)',
      'labels should reflect metric default');
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

  check('progress photos: card, add control, privacy note, and empty state render', () => {
    assert.ok(document.getElementById('photos-card'), 'expected a #photos-card on the Dashboard');
    assert.ok(document.getElementById('pp-add'), 'expected an "Add progress photo" button');
    const empty = document.getElementById('pp-empty');
    assert.ok(empty && empty.style.display !== 'none', 'photo gallery should start in its empty state');
    const card = document.getElementById('photos-card');
    assert.ok(/device only/i.test(card.textContent), 'card should state photos stay on the device only');
  });

  check('progress photos: hero delta math is honest (down, no zero-line on tie, no-weight fallback)', () => {
    const ppHero = dom.window.ppHero;
    assert.strictEqual(typeof ppHero, 'function', 'ppHero should be defined');
    // Heaviest 90.0 -> now 76.5 => "13.5 kg down", anchored on the max-weight photo.
    const loss = ppHero([
      { id: 'a', date: '2026-01-01', kg: 90 },
      { id: 'b', date: '2026-06-01', kg: 76.5 },
    ]);
    assert.strictEqual(loss.heaviest.id, 'a', 'heaviest = max-weight photo');
    assert.strictEqual(loss.now.id, 'b', 'now = latest by date');
    assert.ok(/13\.5 kg down/.test(loss.deltaHtml), `expected "13.5 kg down", got: ${loss.deltaHtml}`);
    assert.ok(!/\bup\b/.test(loss.deltaHtml), 'a loss must never read "up"');
    // Weight tie between two different photos must not render a "0.0 down" line.
    const tie = ppHero([
      { id: 'a', date: '2026-01-01', kg: 80 },
      { id: 'b', date: '2026-06-01', kg: 80 },
    ]);
    assert.ok(!/0\.0/.test(tie.deltaHtml), `tie must not show a 0.0 delta, got: ${tie.deltaHtml}`);
    assert.ok(!/\bdown\b|\bup\b/.test(tie.deltaHtml), 'tie must not claim a direction');
    // No weights attached => earliest-vs-latest by date, and no number.
    const noKg = ppHero([
      { id: 'a', date: '2026-01-01' },
      { id: 'b', date: '2026-06-01' },
    ]);
    assert.strictEqual(noKg.heaviest.id, 'a', 'no-weight fallback: heaviest = earliest by date');
    assert.strictEqual(noKg.now.id, 'b', 'no-weight fallback: now = latest by date');
    assert.strictEqual(noKg.deltaHtml, '', 'no-weight fallback must show no delta number');
  });

  // Async: the photo layer must degrade gracefully where IndexedDB is absent
  // (jsdom has none), so a backup still builds and carries a photos array.
  await (async () => {
    const name = 'progress photos: backup builds with a photos array even without IndexedDB';
    try {
      const backup = await dom.window.buildBackupWithPhotos();
      assert.ok(backup && backup.app === 'herlyft', 'should still produce a valid Herlyft backup');
      assert.ok(Array.isArray(backup.photos), 'backup should include a photos array');
      console.log(`  ok  ${name}`);
    } catch (err) {
      console.error(`  FAIL  ${name}`);
      console.error(`        ${err.message}`);
      process.exitCode = 1;
    }
  })();

  if (process.exitCode) {
    console.error('\nSome smoke tests FAILED.');
  } else {
    console.log('\nAll smoke tests passed.');
  }
});
