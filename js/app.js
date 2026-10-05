// Fallback local memory state in case Firebase is not connected
const defaultCoursePar = [4, 4, 3, 5, 4, 3, 4, 4, 5, 4, 3, 5, 4, 4, 3, 4, 5, 4]; // Total Par 72

let tournamentData = {
  name: "Quail Invitational",
  teams: {
    team1: {
      name: "Team 1",
      players: ["Player 1", "Player 2", "Player 3", "Player 4"],
      scores: Array(18).fill(null)
    },
    team2: {
      name: "Team 2",
      players: ["Player 5", "Player 6", "Player 7", "Player 8"],
      scores: Array(18).fill(null)
    }
  }
};

// Leaderboard Logic
function initLeaderboard() {
  if (typeof firebase !== "undefined" && firebase.apps.length) {
    const dbRef = firebase.database().ref("tournament");
    dbRef.on("value", (snapshot) => {
      const data = snapshot.val();
      if (data) tournamentData = data;
      renderLeaderboard();
    });
  } else {
    renderLeaderboard();
  }
}

function renderLeaderboard() {
  const tbody = document.getElementById("leaderboard-body");
  if (!tbody) return;
  
  tbody.innerHTML = "";
  const totalParSum = defaultCoursePar.reduce((a, b) => a + b, 0);

  const teamList = Object.keys(tournamentData.teams).map(key => {
    const team = tournamentData.teams[key];
    let totalScore = 0;
    let holesPlayed = 0;
    let parPlayed = 0;

    (team.scores || []).forEach((score, index) => {
      if (score !== null && score !== "") {
        const val = parseInt(score, 10);
        if (!isNaN(val)) {
          totalScore += val;
          parPlayed += defaultCoursePar[index];
          holesPlayed++;
        }
      }
    });

    const toPar = holesPlayed > 0 ? totalScore - parPlayed : 0;
    const toParFormatted = toPar === 0 ? "E" : (toPar > 0 ? `+${toPar}` : `${toPar}`);

    return {
      name: team.name,
      thru: holesPlayed === 18 ? "F" : (holesPlayed === 0 ? "-" : holesPlayed),
      totalScore: holesPlayed > 0 ? totalScore : "-",
      toParRaw: toPar,
      toParFormatted: holesPlayed > 0 ? toParFormatted : "E"
    };
  });

  teamList.sort((a, b) => a.toParRaw - b.toParRaw);

  teamList.forEach((team, idx) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${idx + 1}</td>
      <td><strong>${team.name}</strong></td>
      <td>${team.thru}</td>
      <td>${team.totalScore}</td>
      <td><strong>${team.toParFormatted}</strong></td>
    `;
    tbody.appendChild(row);
  });

  renderMVP();
}

function renderMVP() {
  const container = document.getElementById("mvp-highlights");
  if (!container) return;

  container.innerHTML = `
    <div class="mvp-card">
      <h4>Leaderboard Active</h4>
      <p>Tracking shot contributions and individual performance live.</p>
    </div>
  `;
}

// Scorecard Logic
function initScorecardView() {
  loadTeamScorecard("team1");
}

function loadTeamScorecard(teamKey) {
  const container = document.getElementById("scorecard-inputs");
  if (!container) return;

  const team = tournamentData.teams[teamKey] || { scores: Array(18).fill(null) };
  const scores = team.scores || Array(18).fill(null);

  let html = `<tr><th>Score</th>`;
  for (let i = 0; i < 18; i++) {
    const val = scores[i] !== null ? scores[i] : "";
    html += `<td><input type="number" class="scorecard-input" data-hole="${i}" value="${val}" min="1" max="15"></td>`;
    if (i === 8) html += `<td id="out-subtotal">-</td>`;
    if (i === 17) html += `<td id="in-subtotal">-</td>`;
  }
  html += `<td id="grand-total">-</td></tr>`;

  container.innerHTML = html;
}

function saveScorecard() {
  const teamKey = document.getElementById("scorecard-team-select").value;
  const inputs = document.querySelectorAll(".scorecard-input");
  const newScores = Array(18).fill(null);

  inputs.forEach(input => {
    const hole = parseInt(input.dataset.hole, 10);
    const val = parseInt(input.value, 10);
    newScores[hole] = !isNaN(val) ? val : null;
  });

  tournamentData.teams[teamKey].scores = newScores;

  if (typeof firebase !== "undefined" && firebase.apps.length) {
    firebase.database().ref(`tournament/teams/${teamKey}/scores`).set(newScores)
      .then(() => alert("Scores saved and synced successfully!"))
      .catch(err => alert("Error saving scores: " + err.message));
  } else {
    alert("Scores saved locally (Firebase configuration required for remote sync).");
  }
}

// Setup Form Handling
function handleSetupSubmit(e) {
  e.preventDefault();
  const name = document.getElementById("tournament-name").value;
  const team1Name = document.getElementById("team1-name").value;
  const team2Name = document.getElementById("team2-name").value;

  tournamentData.name = name;
  tournamentData.teams.team1.name = team1Name;
  tournamentData.teams.team2.name = team2Name;

  if (typeof firebase !== "undefined" && firebase.apps.length) {
    firebase.database().ref("tournament").set(tournamentData)
      .then(() => alert("Tournament setup updated successfully!"))
      .catch(err => alert("Error updating setup: " + err.message));
  } else {
    alert("Setup saved locally.");
  }
}
