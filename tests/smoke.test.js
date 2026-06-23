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

  check('six tab buttons render with Today as the default-active landing', () => {
    const btns = document.querySelectorAll('.tab-btn');
    assert.strictEqual(btns.length, 6);
    assert.strictEqual(btns[0].dataset.tab, 'today', 'Today is the first tab');
    assert.ok(btns[0].classList.contains('active'),
      'Today must be the default-active tab on load');
    assert.ok(document.querySelector('#today.tab.active'),
      'the #today section must be active by default');
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

  // ---- TODAY (home view) ----
  function seedToday({ name, weights, goalKg, units = 'metric' }) {
    Object.keys(dom.window.localStorage).forEach(k => {
      if (k.startsWith('herlyft')) dom.window.localStorage.removeItem(k);
    });
    if (weights && weights.length) {
      dom.window.localStorage.setItem('herlyftWeights', JSON.stringify(weights));
    }
    if (name || weights || goalKg) {
      const profile = {
        schema: 2, name: name || '', age: '30', sex: 'female', height: 170,
        weight: weights && weights.length ? weights[weights.length - 1].kg : 0,
        units, activity: '1.55', goal: '-500',
        goalWeight: goalKg || 0, style: 'mixed',
      };
      dom.window.localStorage.setItem('herlyftProfile', JSON.stringify(profile));
      dom.window.loadProfile();
    }
    dom.window.renderToday();
  }

  check('today: no profile shows the CTA empty state with a profile button', () => {
    Object.keys(dom.window.localStorage).forEach(k => {
      if (k.startsWith('herlyft')) dom.window.localStorage.removeItem(k);
    });
    dom.window.renderToday();
    assert.strictEqual(document.getElementById('t-content').style.display, 'none',
      'today content hidden with no profile');
    const empty = document.getElementById('t-empty');
    assert.notStrictEqual(empty.style.display, 'none', 'empty state must be visible');
    assert.ok(/set up your profile/i.test(empty.textContent),
      `expected setup CTA copy, got "${empty.textContent}"`);
    assert.ok(document.getElementById('t-go-profile'), 'CTA button must render');
  });

  check('today: profile + weight but no goal shows current + delta, hides goal-mini', () => {
    seedToday({
      name: 'Alex',
      weights: [
        { date: '2026-06-16', kg: 80 },
        { date: '2026-06-23', kg: 78.5 },
      ],
    });
    assert.strictEqual(document.getElementById('t-content').style.display, '');
    assert.strictEqual(document.getElementById('t-goal-mini').style.display, 'none',
      'goal-mini must be hidden with no goal weight set');
    assert.ok(/Hi, Alex/.test(document.getElementById('t-greeting').textContent),
      'greeting must personalise to the profile name');
    const current = document.getElementById('t-current').textContent;
    assert.ok(/78\.5\s*kg/.test(current), `current weight: "${current}"`);
    const delta = document.getElementById('t-delta').textContent;
    assert.ok(/−|-/.test(delta) && /1\.5\s*kg/.test(delta) && /7 days/.test(delta),
      `expected "−1.5 kg vs 7 days ago" pattern, got "${delta}"`);
    assert.ok(document.getElementById('t-delta').classList.contains('down'),
      'down-direction colours the delta');
  });

  check('today: single weigh-in suppresses goal-mini (mirror Dashboard honesty)', () => {
    seedToday({
      weights: [{ date: '2026-06-23', kg: 80 }],
      goalKg: 70,
    });
    // Current weight + delta empty-state still render; goal-mini stays hidden.
    assert.strictEqual(document.getElementById('t-goal-mini').style.display, 'none',
      'goal-mini must hide with arr.length < 2');
    const delta = document.getElementById('t-delta').textContent;
    // The copy invites the next weigh-in instead of just reporting absence,
    // but it MUST stay honest: no fake delta, no "kg vs ... ago" stat.
    assert.ok(/log again/i.test(delta) && /trend/i.test(delta),
      `single-entry delta should invite the next weigh-in, got "${delta}"`);
    assert.ok(!/vs\s+\d+\s+days?\s+ago/i.test(delta),
      `single-entry delta must not imply a delta, got "${delta}"`);
  });

  check('today: profile + weights + goal renders the goal-mini with pct and bar', () => {
    seedToday({
      weights: [
        { date: '2026-05-01', kg: 82 },
        { date: '2026-06-20', kg: 76 },
      ],
      goalKg: 70,
    });
    const mini = document.getElementById('t-goal-mini');
    assert.strictEqual(mini.style.display, '', 'goal-mini must be visible');
    const text = document.getElementById('t-goal-text').textContent;
    assert.ok(/6\.0\s*kg\s*to go/.test(text), `expected "6.0 kg to go", got "${text}"`);
    // Progress = (82-76)/(82-70) = 50%
    assert.strictEqual(document.getElementById('t-goal-pct').textContent, '50%');
    assert.strictEqual(document.getElementById('t-goal-bar-fill').style.width, '50%');
  });

  check('today: goal reached shows celebratory state, 100%', () => {
    seedToday({
      weights: [
        { date: '2026-05-01', kg: 80 },
        { date: '2026-06-20', kg: 68 },
      ],
      goalKg: 70,
    });
    const text = document.getElementById('t-goal-text').textContent;
    assert.ok(/Goal reached/i.test(text), `expected "Goal reached", got "${text}"`);
    assert.strictEqual(document.getElementById('t-goal-pct').textContent, '100%');
    assert.ok(document.getElementById('t-goal-text').classList.contains('reached'),
      'reached class must be applied to the goal text');
  });

  check('today: imperial profile renders weight and delta in lbs', () => {
    seedToday({
      weights: [
        { date: '2026-06-16', kg: 80 },
        { date: '2026-06-23', kg: 78.5 },
      ],
      units: 'imperial',
    });
    assert.ok(/lbs/.test(document.getElementById('t-current').textContent));
    assert.ok(/lbs/.test(document.getElementById('t-delta').textContent));
  });

  check('today: dynamic "vs N days ago" label when prior is much older than 7 days', () => {
    const today = new Date();
    const old = new Date(today); old.setDate(today.getDate() - 30);
    seedToday({
      weights: [
        { date: old.toISOString().slice(0,10), kg: 82 },
        { date: today.toISOString().slice(0,10), kg: 79 },
      ],
    });
    const delta = document.getElementById('t-delta').textContent;
    assert.ok(/vs 30 days ago|vs 29 days ago|vs 31 days ago/.test(delta),
      `expected "vs ~30 days ago", got "${delta}"`);
    assert.ok(!/vs 7 days ago/.test(delta),
      `must NOT mislabel a month-old prior as "7 days ago": "${delta}"`);
  });

  check('today: delta colour respects goal direction (gain goal: weight-up is good)', () => {
    Object.keys(dom.window.localStorage).forEach(k => {
      if (k.startsWith('herlyft')) dom.window.localStorage.removeItem(k);
    });
    dom.window.localStorage.setItem('herlyftWeights', JSON.stringify([
      { date: '2026-06-16', kg: 70 },
      { date: '2026-06-23', kg: 71.5 },
    ]));
    // goal "+300" = gain muscle. A +1.5 kg gain should NOT colour as "bad".
    dom.window.localStorage.setItem('herlyftProfile', JSON.stringify({
      schema: 2, name: '', age: '30', sex: 'male', height: 175,
      weight: 71.5, units: 'metric', activity: '1.55', goal: '300',
      goalWeight: 0, style: 'mixed',
    }));
    dom.window.loadProfile();
    dom.window.renderToday();
    const delta = document.getElementById('t-delta');
    assert.ok(/\+1\.5/.test(delta.textContent), `expected "+1.5", got "${delta.textContent}"`);
    assert.ok(!delta.classList.contains('up'),
      'gain goal + weight-up should NOT use the .up (red/bad) class');
    assert.ok(delta.classList.contains('down'),
      'gain goal + weight-up should reuse the .down (teal/good) class');
  });

  check('today: maintain goal renders neutral delta colour', () => {
    Object.keys(dom.window.localStorage).forEach(k => {
      if (k.startsWith('herlyft')) dom.window.localStorage.removeItem(k);
    });
    dom.window.localStorage.setItem('herlyftWeights', JSON.stringify([
      { date: '2026-06-16', kg: 75 },
      { date: '2026-06-23', kg: 76 },
    ]));
    dom.window.localStorage.setItem('herlyftProfile', JSON.stringify({
      schema: 2, name: '', age: '30', sex: 'male', height: 175,
      weight: 76, units: 'metric', activity: '1.55', goal: '0',
      goalWeight: 0, style: 'mixed',
    }));
    dom.window.loadProfile();
    dom.window.renderToday();
    const delta = document.getElementById('t-delta');
    assert.ok(!delta.classList.contains('up') && !delta.classList.contains('down'),
      'maintain goal should leave the delta neutral (no colour class)');
  });

  check('today: wrong-direction shows "from goal" wording, suppresses fake pct', () => {
    seedToday({
      weights: [
        { date: '2026-05-01', kg: 80 },
        { date: '2026-06-20', kg: 82 },
      ],
      goalKg: 70,
    });
    const text = document.getElementById('t-goal-text').textContent;
    assert.ok(/from goal/i.test(text), `expected "from goal" wording, got "${text}"`);
    assert.ok(!/to go/i.test(text),
      `wrong-direction must NOT use motion verb "to go": "${text}"`);
    assert.strictEqual(document.getElementById('t-goal-pct').textContent, '',
      'fake 0% must be suppressed in wrong-direction state');
  });

  check('today: "started at goal" edge case hides the goal-mini', () => {
    seedToday({
      weights: [
        { date: '2026-05-01', kg: 70 },
        { date: '2026-06-20', kg: 71 },
      ],
      goalKg: 70,
    });
    assert.strictEqual(document.getElementById('t-goal-mini').style.display, 'none',
      'totalKg === 0 && !reached must hide the mini (deep advice lives on Dashboard)');
  });

  // ---- COMPUTE_GOAL_PROGRESS (shared helper) ----
  check('computeGoalProgress: shared helper returns ready=false for thin data', () => {
    const f = dom.window.computeGoalProgress;
    assert.strictEqual(f([], 70).ready, false);
    assert.strictEqual(f([{date:'x', kg: 80}], 70).ready, false, 'arr.length < 2');
    assert.strictEqual(f([{date:'a',kg:80},{date:'b',kg:78}], 0).ready, false, 'no goal');
  });

  check('computeGoalProgress: signedProgress distinguishes flat-line from wrong-direction', () => {
    const f = dom.window.computeGoalProgress;
    const flat = f([{date:'a',kg:80},{date:'b',kg:80}], 70);
    assert.strictEqual(flat.signedProgress, 0, 'flat line: signedProgress = 0');
    assert.strictEqual(flat.pct, 0);
    const wrongWay = f([{date:'a',kg:80},{date:'b',kg:82}], 70);
    assert.ok(wrongWay.signedProgress < 0, 'wrong direction: signedProgress < 0');
    assert.strictEqual(wrongWay.pct, 0, 'still clamped to 0% in display');
  });

  // ---- DASHBOARD DELTA: arr.length < 2 guard ----
  check('dashboard: single weigh-in renders "—" deltas (not fake 0.0)', () => {
    Object.keys(dom.window.localStorage).forEach(k => {
      if (k.startsWith('herlyft')) dom.window.localStorage.removeItem(k);
    });
    // Single entry, dated >7 days ago — findClosestPriorWeight would return it
    // as "prior" and the old code wrote "0.0". Guard expects "—".
    const old = new Date(); old.setDate(old.getDate() - 30);
    dom.window.localStorage.setItem('herlyftWeights', JSON.stringify([
      { date: old.toISOString().slice(0,10), kg: 80 },
    ]));
    dom.window.localStorage.setItem('herlyftProfile', JSON.stringify({
      schema: 2, name: '', age: '30', sex: 'female', height: 170,
      weight: 80, units: 'metric', activity: '1.55', goal: '-500',
      goalWeight: 0, style: 'mixed',
    }));
    dom.window.loadProfile();
    dom.window.renderDashboard();
    assert.strictEqual(document.getElementById('dash-7d').textContent, '—',
      'single weigh-in must show "—" for 7d delta, not fake 0.0');
    assert.strictEqual(document.getElementById('dash-30d').textContent, '—');
  });

  // ---- GOAL PROGRESS (Dashboard goal card + chart goal line) ----
  // Helper that seeds a clean goal-progress scenario from kg inputs.
  function seedGoalScenario({ weights, goalKg, units = 'metric' }) {
    Object.keys(dom.window.localStorage).forEach(k => {
      if (k.startsWith('herlyft')) dom.window.localStorage.removeItem(k);
    });
    if (weights && weights.length) {
      dom.window.localStorage.setItem('herlyftWeights', JSON.stringify(weights));
    }
    const profile = {
      schema: 2, name: 'g', age: '30', sex: 'female', height: 170,
      weight: weights && weights.length ? weights[weights.length - 1].kg : 0,
      units, activity: '1.55', goal: '-500',
      goalWeight: goalKg || 0, style: 'mixed',
    };
    dom.window.localStorage.setItem('herlyftProfile', JSON.stringify(profile));
    dom.window.loadProfile();
    dom.window.renderDashboard();
  }

  check('goal progress: halfway scenario renders bar, %, and stops', () => {
    seedGoalScenario({
      weights: [{ date: '2026-05-01', kg: 80 }, { date: '2026-06-20', kg: 75 }],
      goalKg: 70,
    });
    const card = document.getElementById('goal-card');
    assert.notStrictEqual(card.style.display, 'none', 'goal card should be visible');
    assert.strictEqual(document.getElementById('goal-body').style.display, '',
      'goal body should be visible when goal + history exist');
    const head = document.getElementById('goal-headline').textContent;
    assert.ok(/5\.0\s*kg\s*to go/i.test(head), `expected "5.0 kg to go", got "${head}"`);
    assert.strictEqual(document.getElementById('goal-pct').textContent, '50%');
    assert.strictEqual(document.getElementById('goal-bar-fill').style.width, '50%');
    assert.strictEqual(document.getElementById('goal-bar').getAttribute('aria-valuenow'), '50');
    assert.strictEqual(document.getElementById('goal-start').textContent, '80.0 kg');
    assert.strictEqual(document.getElementById('goal-now').textContent, '75.0 kg');
    assert.strictEqual(document.getElementById('goal-target').textContent, '70.0 kg');
  });

  check('goal progress: no goal set surfaces a nudge, not numbers', () => {
    seedGoalScenario({
      weights: [{ date: '2026-06-20', kg: 75 }],
      goalKg: 0,
    });
    const card = document.getElementById('goal-card');
    assert.notStrictEqual(card.style.display, 'none',
      'card should still show — we have history, just no goal');
    const hint = document.getElementById('goal-hint');
    assert.strictEqual(hint.style.display, '', 'nudge hint should be visible');
    assert.ok(/set a goal weight/i.test(hint.textContent),
      `expected a "set a goal weight" nudge, got "${hint.textContent}"`);
    assert.strictEqual(document.getElementById('goal-body').style.display, 'none',
      'body should be hidden when no goal is set');
  });

  check('goal progress: brand-new profile (no goal, no history) keeps the card hidden', () => {
    Object.keys(dom.window.localStorage).forEach(k => {
      if (k.startsWith('herlyft')) dom.window.localStorage.removeItem(k);
    });
    dom.window.renderDashboard();
    assert.strictEqual(document.getElementById('goal-card').style.display, 'none',
      'no goal and no weights should hide the goal card entirely');
  });

  check('goal progress: single weigh-in suppresses progress UI and shows honest hint', () => {
    seedGoalScenario({
      weights: [{ date: '2026-06-20', kg: 80 }],
      goalKg: 70,
    });
    // Single reading isn't a journey yet — body (headline/pct/bar/stops) hidden,
    // hint explains why and asks for another weigh-in.
    assert.strictEqual(document.getElementById('goal-body').style.display, 'none',
      'goal body should be hidden with a single weigh-in');
    const hint = document.getElementById('goal-hint').textContent;
    assert.ok(/one weigh-in|water alone|save your weight again|few days/i.test(hint),
      `expected single-entry honest hint, got "${hint}"`);
  });

  check('goal progress: wrong-direction clamps at 0% with encouraging copy (not negative)', () => {
    // Loss goal (start 80, goal 70) but current 82 — drifted away from start.
    seedGoalScenario({
      weights: [{ date: '2026-05-01', kg: 80 }, { date: '2026-06-20', kg: 82 }],
      goalKg: 70,
    });
    const pct = document.getElementById('goal-pct').textContent;
    assert.ok(/^0%$/.test(pct), `expected 0% (clamped, not negative), got "${pct}"`);
    assert.strictEqual(document.getElementById('goal-bar-fill').style.width, '0%');
    const note = document.getElementById('goal-note').textContent;
    // With only 2 entries we deliberately stay neutral — "not much movement
    // yet" rather than telling the user they've "drifted" from 2-point noise.
    assert.ok(/not much movement|few more weigh-ins|trend/i.test(note),
      `expected neutral low-data wrong-direction copy, got "${note}"`);
    assert.ok(!/-\d|negative|−/.test(document.getElementById('goal-headline').textContent),
      'headline must not show a negative number');
  });

  check('goal progress: no-movement and wrong-direction get different notes (not conflated)', () => {
    // Same clamped 0% — but very different stories. Bug guard from code review:
    // earlier copy said "drifted from where you started" for BOTH cases.
    seedGoalScenario({
      weights: [{ date: '2026-05-01', kg: 80 }, { date: '2026-06-20', kg: 80 }],
      goalKg: 70,
    });
    const noMoveNote = document.getElementById('goal-note').textContent;
    assert.ok(/no change|keep going/i.test(noMoveNote),
      `flat-line should say "no change yet", got "${noMoveNote}"`);
    assert.ok(!/above where you started|not much movement/i.test(noMoveNote),
      `flat-line must NOT use wrong-direction copy: "${noMoveNote}"`);

    // Wrong direction with the same clamped 0% pct — different note.
    seedGoalScenario({
      weights: [
        { date: '2026-03-01', kg: 80 }, { date: '2026-04-01', kg: 81 },
        { date: '2026-05-01', kg: 81 }, { date: '2026-06-20', kg: 82 },
      ],
      goalKg: 70,
    });
    const wrongWayNote = document.getElementById('goal-note').textContent;
    assert.ok(/above where you started|chart trend/i.test(wrongWayNote),
      `4+ entries wrong-way should mention being above start, got "${wrongWayNote}"`);
  });

  check('goal progress: write-time clamp drops negative goal weights', () => {
    // The form would block this, but a tampered backup or stale localStorage
    // could carry one in. saveProfile() must zero it out rather than persist.
    dom.window.document.getElementById('p-age').value = '30';
    dom.window.document.getElementById('p-sex').value = 'female';
    dom.window.document.getElementById('p-height').value = '170';
    dom.window.document.getElementById('p-weight').value = '70';
    dom.window.document.getElementById('p-goal-weight').value = '-50';
    dom.window.document.getElementById('p-save').click();
    const saved = JSON.parse(dom.window.localStorage.getItem('herlyftProfile'));
    assert.strictEqual(saved.goalWeight, 0,
      `negative goal-weight must persist as 0, got ${saved.goalWeight}`);
  });

  // ---- GOAL-WEIGHT SUGGESTION (BMI 18.5–24.9 range + BMI 22 midpoint) ----
  // currentUnits is a script-closure `let`, not reachable via dom.window — flip
  // it through the real <select> change event the same way the app does.
  function setUnits(next) {
    const sel = document.getElementById('p-units');
    if (sel.value === next) return;
    sel.value = next;
    sel.dispatchEvent(new dom.window.Event('change'));
  }

  check('goal suggestion: hidden until a plausible height is entered', () => {
    setUnits('metric');
    const hEl = document.getElementById('p-height');
    const sEl = document.getElementById('p-goal-suggest');
    hEl.value = '';
    dom.window.renderGoalSuggestion();
    assert.strictEqual(sEl.style.display, 'none', 'no height → suggestion hidden');
    hEl.value = '10'; // below the 80cm sanity floor
    dom.window.renderGoalSuggestion();
    assert.strictEqual(sEl.style.display, 'none', 'implausible height → still hidden');
  });

  check('goal suggestion: shows mid-range (BMI 23) + 18.5–24.9 range for a valid height (metric)', () => {
    setUnits('metric');
    const sEl = document.getElementById('p-goal-suggest');
    document.getElementById('p-height').value = '170'; // 1.7m → m²=2.89
    dom.window.renderGoalSuggestion();
    assert.notStrictEqual(sEl.style.display, 'none', 'valid height → suggestion shown');
    // mid = round(23*2.89=66.5)=66; low=floor(18.5*2.89=53.4)=53; high=ceil(24.9*2.89=71.96)=72
    const btn = document.getElementById('p-goal-use');
    assert.ok(btn, 'Use button must render');
    assert.strictEqual(btn.dataset.mid, '66', `mid should be 66 kg (BMI 23), got ${btn.dataset.mid}`);
    assert.ok(/53–72 kg/.test(sEl.textContent), `expected "53–72 kg" range, got "${sEl.textContent}"`);
    assert.ok(/mid-range/i.test(btn.textContent), 'button should say "mid-range", not "ideal"');
    // Dietitian must-fix: name the muscle limitation for a strength-app audience.
    assert.ok(/muscle/i.test(sEl.textContent), 'copy must name the muscle-mass caveat');
    assert.ok(/rough guide|yours to set/i.test(sEl.textContent),
      'copy must frame it as a guide, not a mandate');
    // Progress-analyst: keep the clinical BMI numbers out of the visible line.
    assert.ok(!/BMI/.test(sEl.textContent),
      'visible copy should not lead with clinical BMI numbers');
  });

  check('goal suggestion: "Use" button fills the field + shows an authorship note', () => {
    setUnits('metric');
    document.getElementById('p-height').value = '170';
    document.getElementById('p-goal-weight').value = '';
    dom.window.renderGoalSuggestion();
    document.getElementById('p-goal-use').click();
    assert.strictEqual(document.getElementById('p-goal-weight').value, '66',
      'clicking Use should fill the goal-weight input with the mid-range value');
    const note = document.getElementById('p-goal-use-note');
    assert.notStrictEqual(note.style.display, 'none', 'authorship note should appear after Use');
    assert.ok(/your goal|change it anytime/i.test(note.textContent),
      `note should affirm authorship, got "${note.textContent}"`);
  });

  check('goal suggestion: renders in lbs under imperial units', () => {
    setUnits('metric');
    document.getElementById('p-height').value = '170'; // set in cm first
    setUnits('imperial'); // change handler converts 170cm → ~67in
    const sEl = document.getElementById('p-goal-suggest');
    dom.window.renderGoalSuggestion();
    assert.ok(/lbs/.test(sEl.textContent), `imperial suggestion must use lbs, got "${sEl.textContent}"`);
    const btn = document.getElementById('p-goal-use');
    // mid ~ 23 * 1.7² = 66.5 kg → ~147 lb
    assert.ok(/^1(46|47|48)$/.test(btn.dataset.mid), `expected ~147 lb, got ${btn.dataset.mid}`);
    setUnits('metric'); // reset so later tests are unaffected
  });

  check('goal progress: overshoot triggers reached state with overshoot copy', () => {
    seedGoalScenario({
      weights: [{ date: '2026-05-01', kg: 80 }, { date: '2026-06-20', kg: 68 }],
      goalKg: 70,
    });
    assert.ok(/Goal reached/i.test(document.getElementById('goal-headline').textContent),
      'expected "Goal reached" headline');
    assert.strictEqual(document.getElementById('goal-pct').textContent, '100%');
    assert.strictEqual(document.getElementById('goal-bar-fill').style.width, '100%');
    assert.ok(document.getElementById('goal-bar').classList.contains('reached'),
      'bar should carry the .reached class');
    const note = document.getElementById('goal-note').textContent;
    // No praise for overshooting — neutral framing that points to maintenance.
    // Also explicitly assert NO "nice work" / "great job" / "well done" copy.
    assert.ok(/below your goal/i.test(note),
      `expected loss-overshoot copy "below your goal", got "${note}"`);
    assert.ok(/maintain/i.test(note),
      `expected maintenance suggestion in overshoot copy, got "${note}"`);
    assert.ok(!/nice work|great job|well done|amazing/i.test(note),
      `overshoot copy must not praise — got "${note}"`);
    assert.ok(/2\.0\s*kg/.test(note), `expected the "2.0 kg" delta, got "${note}"`);
  });

  check('goal progress: exactly at goal uses the "lock in maintenance" copy', () => {
    seedGoalScenario({
      weights: [{ date: '2026-05-01', kg: 80 }, { date: '2026-06-20', kg: 70 }],
      goalKg: 70,
    });
    assert.ok(/Goal reached/i.test(document.getElementById('goal-headline').textContent));
    assert.ok(/Maintain/.test(document.getElementById('goal-note').textContent),
      'at-goal copy should suggest switching to Maintain');
  });

  check('goal progress: backup carries goalWeight and restore brings it back', () => {
    Object.keys(dom.window.localStorage).forEach(k => {
      if (k.startsWith('herlyft')) dom.window.localStorage.removeItem(k);
    });
    dom.window.applyBackup({
      app: 'herlyft', schema: 2,
      profile: {
        schema: 2, name: 'R', age: '30', sex: 'female',
        height: 170, weight: 75, units: 'metric',
        activity: '1.55', goal: '-500', goalWeight: 65, style: 'mixed',
      },
      weights: [{ date: '2026-01-01', kg: 80 }, { date: '2026-06-20', kg: 75 }],
      hydration: {},
    });
    dom.window.loadProfile();
    dom.window.renderDashboard();
    assert.strictEqual(document.getElementById('p-goal-weight').value, '65',
      'restore must repopulate the goal-weight input');
    const stored = JSON.parse(dom.window.localStorage.getItem('herlyftProfile'));
    assert.strictEqual(stored.goalWeight, 65, 'restored profile should carry goalWeight=65');
    assert.strictEqual(document.getElementById('goal-target').textContent, '65.0 kg');
  });

  check('goal progress: switching to imperial converts the goal-weight input and dashboard stops', () => {
    seedGoalScenario({
      weights: [{ date: '2026-05-01', kg: 80 }, { date: '2026-06-20', kg: 75 }],
      goalKg: 70,
    });
    // Sanity: starting in metric.
    assert.strictEqual(document.getElementById('goal-target').textContent, '70.0 kg');
    document.getElementById('p-units').value = 'imperial';
    document.getElementById('p-units').dispatchEvent(new dom.window.Event('change'));
    // Goal-weight input should convert without losing data.
    const lb = parseFloat(document.getElementById('p-goal-weight').value);
    assert.ok(Math.abs(lb - 154.3) < 0.5,
      `70 kg should display as ~154.3 lb in the input, got ${lb}`);
    assert.ok(/lbs/.test(document.getElementById('p-goal-weight-label').textContent),
      'goal-weight label should switch to lbs');
    // Dashboard goal card must reflect the unit change (regression: used to stay in kg).
    assert.ok(/lbs/.test(document.getElementById('goal-target').textContent),
      `goal-target stop should switch to lbs, got "${document.getElementById('goal-target').textContent}"`);
    assert.ok(/lbs/.test(document.getElementById('goal-now').textContent),
      `goal-now stop should switch to lbs, got "${document.getElementById('goal-now').textContent}"`);
    assert.ok(/lbs/.test(document.getElementById('goal-start').textContent),
      `goal-start stop should switch to lbs, got "${document.getElementById('goal-start').textContent}"`);
    assert.strictEqual(document.getElementById('dash-current-label').textContent, 'Current (lbs)',
      'dashboard "Current" label should switch to lbs after unit flip');
  });

  check('goal progress: stored goalWeight survives a kg -> lb -> kg round trip', () => {
    // Mounting metric first.
    document.getElementById('p-units').value = 'metric';
    document.getElementById('p-units').dispatchEvent(new dom.window.Event('change'));
    document.getElementById('p-goal-weight').value = '70.5';
    document.getElementById('p-units').value = 'imperial';
    document.getElementById('p-units').dispatchEvent(new dom.window.Event('change'));
    document.getElementById('p-units').value = 'metric';
    document.getElementById('p-units').dispatchEvent(new dom.window.Event('change'));
    const back = parseFloat(document.getElementById('p-goal-weight').value);
    assert.ok(Math.abs(back - 70.5) < 0.1,
      `goal-weight should round-trip 70.5 kg -> lb -> kg without drift, got ${back}`);
  });

  check('chart goal line: visible when goal is inside the y-range, hidden when far below', () => {
    // Goal 78 sits inside the 75–80 chart band — line should render.
    seedGoalScenario({
      weights: [{ date: '2026-06-15', kg: 80 }, { date: '2026-06-20', kg: 75 }],
      goalKg: 78,
    });
    const svgNear = document.getElementById('dash-svg').innerHTML;
    assert.ok(svgNear.includes('dash-goal-line'),
      'goal line should render when goal is inside the visible chart range');
    assert.ok(svgNear.includes('goal 78'),
      'goal label should accompany the dashed line');

    // Goal 40 sits way below the 75–80 band — line must NOT render
    // (the goal card carries that story; we don't want to squash the chart).
    seedGoalScenario({
      weights: [{ date: '2026-06-15', kg: 80 }, { date: '2026-06-20', kg: 75 }],
      goalKg: 40,
    });
    const svgFar = document.getElementById('dash-svg').innerHTML;
    assert.ok(!svgFar.includes('dash-goal-line'),
      'goal line should be omitted when the goal is far outside the chart range');
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
