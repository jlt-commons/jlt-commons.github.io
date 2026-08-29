# jlt-commons.github.io

The [jlt-commons](https://github.com/jlt-commons) website, and the small static-site
generator that builds it.

Live at **https://jlt-commons.github.io**.

## Building it

You need [babashka](https://babashka.org). Nothing else; the only external dependency is
`markdown-clj`, fetched on first run.

```bash
bb test      # run the test suite
bb build     # generate the site into _site/
bb serve     # build, then serve at http://localhost:3000
bb clean     # delete _site/
```

`_site/` is generated and is not committed. GitHub Actions builds and deploys on every
push to `main`, and runs the tests on every pull request.

## Editing content

Pages are markdown under `content/guide/`. Add a file and it appears in the nav
automatically, with `index.md` pinned first. The homepage is a hand-written template at
`resources/templates/home.html`.

Governance text is deliberately **not** duplicated here. This site links to the canonical
documents in [`meta`](https://github.com/jlt-commons/meta), because two copies of a rule
become two different rules.

Mermaid fences are not supported. `markdown.clj` still rewrites ```` ```mermaid ```` blocks
into `<pre class="mermaid">`, but the mermaid.js bundle that would render them isn't
vendored in this site, so a diagram renders as plain, unstyled source text.

## Using this generator for your own project

Any jlt-commons project is welcome to. Copy `src/`, `resources/`, `test/` and `bb.edn`,
then set `:base-path` in `src/site/config.clj` to your repo name:

```clojure
:base-path "/your-repo"
```

That matters. A project site is served at `jlt-commons.github.io/your-repo/`, and without
a base path every stylesheet and nav link resolves against the organization site instead
of yours. The page still renders, which is what makes the bug easy to miss, so
`site.core-test` covers it.

Leave `:base-path` as `""` only for a site served at a domain root.

## Credit

The generator is a trimmed port of a private engine by the same author, reduced to a
single site and extended with base-path support.
