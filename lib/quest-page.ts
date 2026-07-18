import type { QuestBuildRequest } from "./quest.ts";

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[character]!,
  );
}

export function renderQuestPage(
  quest: QuestBuildRequest,
  imageUrl: string,
  formUrl: string,
): string {
  const capabilities = quest.requiredCapabilities
    .map((capability) => `<li>${escapeHtml(capability)}</li>`)
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(quest.title)} · QuestLoop</title>
  <style>
    :root{color-scheme:light;--ink:#18201c;--paper:#f4f3ed;--accent:#ef5b36;--line:#d8d8ce}
    *{box-sizing:border-box}body{margin:0;background:radial-gradient(circle at 10% 0,#f7c99f,transparent 28rem),var(--paper);color:var(--ink);font-family:Arial,sans-serif}
    main{width:min(720px,calc(100% - 32px));margin:0 auto;padding:64px 0}.brand{color:var(--accent);font-size:.76rem;font-weight:800;letter-spacing:.14em;text-transform:uppercase}
    article{margin-top:24px;overflow:hidden;border:1px solid var(--line);border-radius:18px;background:#fffdf7}.campaign-image{display:block;width:100%;aspect-ratio:1.35;object-fit:cover}.content{padding:clamp(28px,7vw,56px)}h1{margin:0 0 24px;font:500 clamp(2.8rem,9vw,5rem)/.95 Georgia,serif;letter-spacing:-.04em}
    .description{font-size:1.15rem;line-height:1.55}.reward{display:flex;flex-wrap:wrap;gap:10px;margin:32px 0}.reward span{padding:10px 14px;border:1px solid var(--ink);border-radius:999px;font-weight:700}.post{padding:20px;border-left:4px solid var(--accent);background:#f8eee5;font-size:1.05rem;line-height:1.6;white-space:pre-wrap}
    h2{margin-top:36px;font-size:.78rem;letter-spacing:.12em;text-transform:uppercase}ul{padding-left:20px;line-height:1.8}.cta{display:inline-block;margin-top:14px;padding:14px 20px;border-radius:999px;color:white;background:var(--accent);font-weight:800;text-decoration:none}.identity{margin-top:36px;padding-top:20px;border-top:1px solid var(--line);font-size:.8rem;color:#657069}
  </style>
</head>
<body>
  <main>
    <span class="brand">QuestLoop · ${escapeHtml(quest.tier)}</span>
    <article>
      <img class="campaign-image" src="${escapeHtml(imageUrl)}" alt="Generated restaurant campaign visual">
      <div class="content">
        <h1>${escapeHtml(quest.title)}</h1>
        <p class="description">${escapeHtml(quest.description)}</p>
        <div class="reward"><span>+${quest.xpReward} XP</span><span>${escapeHtml(quest.businessReward)}</span></div>
        <h2>Ready-to-post caption</h2>
        <div class="post">${escapeHtml(quest.socialPost)}</div>
        <h2>Customer choice form</h2>
        <p>Your public form is live with these choices: ${quest.dishChoices.map(escapeHtml).join(", ")}.</p>
        <a class="cta" href="${escapeHtml(formUrl)}" target="_blank" rel="noreferrer">Open the live form</a>
        <h2>Created toolkit</h2>
        <ul>${capabilities}</ul>
        <p class="identity">Quest ${escapeHtml(quest.id)} · Image, copy, form, and hosting were created through Zero.</p>
      </div>
    </article>
  </main>
</body>
</html>`;
}
