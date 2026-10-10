(() => {
  const endpointMeta = document.querySelector('meta[name="leaderboard-api-url"]');
  const statusElement = document.getElementById('leaderboard-status');
  const entriesElement = document.getElementById('leaderboard-entries');
  const submitPanel = document.getElementById('leaderboard-submit');
  const qualifyingCopy = document.getElementById('leaderboard-qualifying-copy');
  const form = document.getElementById('leaderboard-form');
  const nicknameInput = document.getElementById('leaderboard-nickname');
  const formStatus = document.getElementById('leaderboard-form-status');

  if (!endpointMeta || !statusElement || !entriesElement || !submitPanel || !form ||
      !nicknameInput || !qualifyingCopy || !formStatus) return;

  const endpointValue = endpointMeta.content.trim().replace(/\/+$/, '');
  let endpoint = '';
  if (endpointValue) {
    try {
      const url = new URL(endpointValue);
      if (url.protocol === 'https:') endpoint = url.toString().replace(/\/+$/, '');
    } catch {
      endpoint = '';
    }
  }

  const NICKNAME_STORAGE_KEY = 'teds-flappy-nickname';
  let entries = [];
  let leaderboardLoaded = false;
  let latestScore = null;
  let submittedThisRun = false;

  const readNickname = () => {
    try {
      return window.localStorage.getItem(NICKNAME_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  };

  const isQualifyingScore = (score) => {
    if (!Number.isSafeInteger(score) || score < 1) return false;
    return entries.length < 5 || score > entries[entries.length - 1].score;
  };

  const renderEntries = (emptyMessage) => {
    entriesElement.replaceChildren();
    if (!entries.length) {
      const row = document.createElement('tr');
      const cell = document.createElement('td');
      cell.colSpan = 3;
      cell.className = 'leaderboard-empty';
      cell.textContent = emptyMessage || (!endpoint
        ? 'Leaderboard is not connected yet.'
        : leaderboardLoaded
          ? 'No scores yet. Be the first Top Dog!'
          : 'Loading scores…');
      row.append(cell);
      entriesElement.append(row);
      return;
    }

    entries.forEach((entry, index) => {
      const row = document.createElement('tr');
      const rank = document.createElement('td');
      const nickname = document.createElement('td');
      const score = document.createElement('td');
      rank.textContent = String(index + 1);
      nickname.textContent = entry.nickname;
      score.textContent = String(entry.score);
      row.append(rank, nickname, score);
      entriesElement.append(row);
    });
  };

  const updateSubmitPanel = () => {
    const qualifies = leaderboardLoaded && latestScore !== null &&
      isQualifyingScore(latestScore) && !submittedThisRun;
    submitPanel.hidden = !qualifies;
    if (qualifies) {
      qualifyingCopy.textContent = `Your score of ${latestScore} can make the top five. Add a nickname to share it, or leave it out.`;
      if (!nicknameInput.value) nicknameInput.value = readNickname();
    }
  };

  const readResponse = async (response) => {
    let body;
    try {
      body = await response.json();
    } catch {
      throw new Error('The leaderboard returned an unreadable response.');
    }
    if (!response.ok) {
      const error = new Error(typeof body.error === 'string' ? body.error : 'The leaderboard request failed.');
      error.status = response.status;
      error.body = body;
      throw error;
    }
    return body;
  };

  const loadLeaderboard = async () => {
    if (!endpoint) {
      statusElement.textContent = 'Ted’s Top Dogs is not connected yet.';
      return;
    }

    statusElement.textContent = 'Loading the leaderboard…';
    try {
      const response = await fetch(`${endpoint}/scores`, { headers: { Accept: 'application/json' } });
      const result = await readResponse(response);
      if (!Array.isArray(result.entries)) throw new Error('The leaderboard returned invalid entries.');
      entries = result.entries;
      leaderboardLoaded = true;
      renderEntries();
      statusElement.textContent = entries.length ? '' : 'The leaderboard is ready for its first score.';
      updateSubmitPanel();
    } catch (error) {
      renderEntries('Scores could not be loaded.');
      statusElement.textContent = `Could not load the leaderboard: ${error.message}`;
    }
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const nickname = nicknameInput.value.trim();
    if (!nickname || [...nickname].length > 24 || /[\u0000-\u001f\u007f]/u.test(nickname)) {
      formStatus.textContent = 'Choose a nickname of 1 to 24 characters without control characters.';
      return;
    }
    if (!endpoint || latestScore === null || !isQualifyingScore(latestScore)) {
      formStatus.textContent = 'This score can no longer be submitted to the top five.';
      return;
    }

    let nicknameRemembered = true;
    try {
      window.localStorage.setItem(NICKNAME_STORAGE_KEY, nickname);
    } catch {
      nicknameRemembered = false;
    }

    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    formStatus.textContent = 'Submitting your score…';
    try {
      const response = await fetch(`${endpoint}/scores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ nickname, score: latestScore })
      });
      const result = await readResponse(response);
      if (!Array.isArray(result.entries)) throw new Error('The leaderboard returned invalid entries.');
      entries = result.entries;
      renderEntries();
      submittedThisRun = true;
      nicknameInput.disabled = true;
      formStatus.textContent = nicknameRemembered
        ? 'Your score is on the leaderboard!'
        : 'Your score is on the leaderboard, but this browser could not remember your nickname.';
    } catch (error) {
      if (error.status === 409 && Array.isArray(error.body.entries)) {
        entries = error.body.entries;
        renderEntries();
        submittedThisRun = true;
        submitPanel.hidden = true;
        statusElement.textContent = error.message;
      }
      formStatus.textContent = error.message;
    } finally {
      submitButton.disabled = submittedThisRun;
    }
  });

  window.addEventListener('flappy-ted:game-start', () => {
    latestScore = null;
    submittedThisRun = false;
    formStatus.textContent = '';
    nicknameInput.disabled = false;
    form.querySelector('button[type="submit"]').disabled = false;
    submitPanel.hidden = true;
  });

  window.addEventListener('flappy-ted:game-over', (event) => {
    latestScore = event.detail.score;
    submittedThisRun = false;
    formStatus.textContent = '';
    updateSubmitPanel();
  });

  renderEntries();
  loadLeaderboard();
})();
