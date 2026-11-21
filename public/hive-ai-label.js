/**
 * hive-ai-label.js: the one line every public Hive app carries saying how it was made.
 * Wording comes from the ai-label ladder (.claude/skills/ai-label/SKILL.md); the register of
 * labelled things is AI-LABELS.md. Canonical copy lives here; sync.js copies it to each app.
 *
 *   <script src="hive-ai-label.js" data-made-with="Claude"
 *           data-output="Images made here are AI-generated with Grok"
 *           data-checked="2026-11-20" data-guide="1"></script>
 *
 *   data-made-with  the tools that generated the app itself (required: no tools, no label)
 *   data-output     what the app produces for its users, when that is AI-made too
 *   data-checked    the date this app was last audited against the guide
 *   data-guide      the version of the labelling guide it was audited against
 *
 * The tag goes at the end of <body>. No frame guard, on purpose: several apps are normally seen
 * framed inside Stream Control, and a label that hides in a frame is a label nobody reads.
 * Attribute text only ever becomes text. The footer sits below the app, so a page that produces
 * AI output also says so in its own layout, near the top.
 */
(function () {
  'use strict';
  var tag = document.currentScript;
  var attr = function (name) { return ((tag && tag.getAttribute(name)) || '').trim(); };
  var madeWith = attr('data-made-with');
  if (!madeWith || !document.body) {
    console.warn('hive-ai-label: needs data-made-with and a tag inside <body>; no label was drawn');
    return;
  }
  var DOT = ' ' + String.fromCharCode(183) + ' ';

  var el = function (name, text, parent) {
    var node = document.createElement(name);
    if (text) node.textContent = text;
    parent.appendChild(node);
    return node;
  };

  var host = document.createElement('footer');
  host.setAttribute('data-hive-ai-label', '');
  host.setAttribute('aria-label', 'How this app was made');
  var root = host.attachShadow({ mode: 'open' });

  // Spacing lives on the inner box: a page's own `* { padding:0 }` reaches the host and wins there.
  el('style',
    ':host{display:block;background:#0d0d0f;border-top:1px solid hsl(0 0% 18%)}' +
    'div{padding:10px 16px 0;text-align:center;font:12px/1.5 Inter,system-ui,sans-serif;color:hsl(0 0% 72%)}' +
    'p{margin:0}' +
    'a{display:inline-block;padding:13px 8px;color:hsl(37 91% 55%)}' +
    'a:focus-visible{outline:2px solid hsl(37 91% 55%);outline-offset:-2px}' +
    '.ref{color:hsl(0 0% 60%)}', root);
  var box = el('div', '', root);

  var output = attr('data-output');
  if (output) el('p', output, box);
  el('p', 'AI-generated with ' + madeWith + ', directed by King_Cobra74', box);

  var checked = attr('data-checked');
  var guide = attr('data-guide');
  var ref = [];
  if (checked) ref.push('Label checked ' + checked);
  if (guide) ref.push('labelling guide version ' + guide);
  if (ref.length) el('p', ref.join(DOT), box).setAttribute('class', 'ref');

  var link = el('a', 'Use AI thoughtfully' + DOT + 'How this is labelled', el('p', '', box));
  link.setAttribute('href', 'https://responsible-ai.kinghive.online/#labelling');
  link.setAttribute('target', '_blank');
  link.setAttribute('rel', 'noopener noreferrer');

  document.body.appendChild(host);
})();
