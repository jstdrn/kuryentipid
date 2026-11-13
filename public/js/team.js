/* The names, credits, and portraits come from the original project’s About screen. */
window.TeamPage = (() => {
  const members = [
    { name: 'Dan Josef R. Francisco', role: 'Main UI/UX Developer', portrait: 'dan-josef-francisco' },
    { name: 'Jonathan F. Fusin', role: 'Lead UI/UX Developer', portrait: 'jonathan-fusin' },
    { name: 'Justin Adrian M. Garcia', role: 'UI/UX Developer', portrait: 'justin-adrian-garcia' },
    { name: 'Rafael Johann N. Galura', role: 'UI/UX Developer', portrait: 'rafael-johann-galura' },
  ];

  function memberCard({ name, role, portrait }) {
    return `<li class="team-member">
      <div class="team-portrait"><img src="assets/team/${portrait}.png" alt="" loading="eager"></div>
      <div class="team-member-credit"><h3>${name}</h3><p>${role}</p></div>
    </li>`;
  }

  function render() {
    return `<article class="team-page">
      <header class="team-heading">
        <a class="team-return" href="#profile">${window.icon('back', 16)} Profile</a>
        <h1>About us</h1>
      </header>
      <section class="team-panel" aria-labelledby="team-name">
        <header class="team-panel-title">
          <img src="assets/brandmark.svg" width="38" height="38" alt="">
          <h2 id="team-name">AMIS U</h2>
        </header>
        <ul class="team-roster">${members.map(memberCard).join('')}</ul>
      </section>
      <details class="team-app-info">
        <summary>Kuryentipid <span aria-hidden="true">${window.icon('down', 17)}</span></summary>
        <p>Kuryentipid estimates household electricity use from appliance wattage, schedules, and your local electricity rate. Use the savings calculator to see how a change in daily use affects your estimated bill.</p>
      </details>
      <p class="team-copyright">© 2026, AMIS U. All rights reserved.</p>
    </article>`;
  }

  return Object.freeze({ render });
})();
