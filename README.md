# jlt-commons.github.io

The [jlt-commons](https://github.com/jlt-commons) website.

Live at **https://jlt-commons.github.io**.

## What's here

Content, and nothing else. The generator moved out to
[jlt-commons/docs-engine](https://github.com/jlt-commons/docs-engine), which is
shared with every project site in the organization.

```
docs/
  site.edn            # configuration
  guide/              # pages, in markdown
  templates/home.html # the homepage
  img/                # the mark
```

## Editing content

Pages are markdown under `docs/guide/`. Add a file and it appears in the nav
automatically, with `index.md` pinned first. The homepage is a hand-written
template at `docs/templates/home.html`.

Governance text is deliberately **not** duplicated here. This site links to the
canonical documents in [`meta`](https://github.com/jlt-commons/meta), because two
copies of a rule become two different rules.

## Building it

CI builds the site on every pull request and deploys it from `main`, so a merged
change goes live without anyone running anything. That is the authority.

To preview locally, clone the engine alongside this repo:

```bash
git clone https://github.com/jlt-commons/docs-engine ../docs-engine
bb site:serve    # build, then serve at http://localhost:3000
bb site:build    # build into _site/ without serving
bb site:clean    # delete _site/
```

`_site/` is generated and is not committed. The tasks print the clone command if
they cannot find an engine checkout; CI needs none of this, because it checks the
engine out itself at a pinned tag.

## Mermaid

Supported. A ```` ```mermaid ```` fence in a guide page renders as a diagram,
themed to match the reader's light or dark setting. The engine loads the bundle
only on pages that actually have one, since it is 3.4 MB against a typical page
of a few kilobytes.

This site currently has no diagrams, and its build checks that the bundle stays
absent. Adding one means updating that check, deliberately, in
`.github/workflows/site.yml`.

## Using the engine for your own project

Any jlt-commons project can. See the
[engine's README](https://github.com/jlt-commons/docs-engine#onboarding-a-project);
[`raylib-jlt`](https://github.com/jlt-commons/raylib-jlt) is a working example
with a bespoke homepage and an image gallery.

The one thing to get right is `:base-path`. This site sets `""` because it is
served at the domain root. A project site is served at
`jlt-commons.github.io/<repo>/` and sets `:base-path "/<repo>"`; without it every
stylesheet and nav link resolves against this site instead. The page still
renders, wearing the wrong clothes, which is what makes the bug easy to ship.
