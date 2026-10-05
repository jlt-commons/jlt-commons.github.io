# Projects

Twenty-four. Six arrived by adoption, four moved over from jolt-lang, and fourteen were
started here.

| project | what it is | arrived by | docs |
|---|---|---|---|
| [raylib-jlt](https://github.com/jlt-commons/raylib-jlt) | [raylib](https://www.raylib.com) bindings that call the system `libraylib` over its C ABI through `jolt.ffi`, with a keyword-argument drawing API on top. Its examples now live in raylib-jolt-demo | adoption | [jlt-commons.github.io/raylib-jlt](https://jlt-commons.github.io/raylib-jlt/) |
| [raylib-jolt-demo](https://github.com/jlt-commons/raylib-jolt-demo) | 187 raylib examples built on raylib-jlt, each one its own small runnable project | started here | [jlt-commons.github.io/raylib-jolt-demo](https://jlt-commons.github.io/raylib-jolt-demo/) |
| [raygui-jlt](https://github.com/jlt-commons/raygui-jlt) | 24 examples of raygui, raylib's immediate-mode GUI library, bound the same way | adoption | [jlt-commons.github.io/raygui-jlt](https://jlt-commons.github.io/raygui-jlt/) |
| [raylib-ios](https://github.com/jlt-commons/raylib-ios) | raylib and SDL2 on a physical iPhone, as portable bytecode with no JIT, since iOS forbids generating code at run time. The platform: host loop, bindings, build and deploy tools | adoption | [jlt-commons.github.io/raylib-ios](https://jlt-commons.github.io/raylib-ios/) |
| [raylib-ios-demo](https://github.com/jlt-commons/raylib-ios-demo) | What runs on raylib-ios: 137 scenes, each a sub-project that builds an iPhone app of its own, plus a gallery app holding them all | started here | [jlt-commons.github.io/raylib-ios-demo](https://jlt-commons.github.io/raylib-ios-demo/) |
| [raylib-android](https://github.com/jlt-commons/raylib-android) | raylib on an Android phone as native arm64 code, with no JVM, Kotlin or Java anywhere in the app. Seventeen scenes under an owner loop of about thirty lines | started here | [jlt-commons.github.io/raylib-android](https://jlt-commons.github.io/raylib-android/) |
| [graviton](https://github.com/jlt-commons/graviton) | A physics game where you place gravitational attractors to steer a ship toward prizes and away from death zones. A Jolt and raylib port of a 2018 ClojureScript game, its field math checked by writ | started here | [the repo](https://github.com/jlt-commons/graviton) |
| [glitter-core](https://github.com/jlt-commons/glitter-core) | The natives-free two-thirds of glitter: the Replicant-style reconciler and `IRender`/`IMemory` protocols, with no toolkit dependency at all. What glitter, glitter-uikit, and uikit-demo all build on | started here | [jlt-commons.github.io/glitter-core](https://jlt-commons.github.io/glitter-core/) |
| [glitter](https://github.com/jlt-commons/glitter) | A [Replicant](https://github.com/cjohansen/replicant)-style GTK4 renderer built on glitter-core: one state atom, a pure `state -> hiccup` view, event handlers as data | adoption | [jlt-commons.github.io/glitter](https://jlt-commons.github.io/glitter/) |
| [glitter-gl](https://github.com/jlt-commons/glitter-gl) | OpenGL geometry, matrices and shaders for glitter, plus a `:gl-area` widget to draw them in | adoption | [jlt-commons.github.io/glitter-gl](https://jlt-commons.github.io/glitter-gl/) |
| [glitter-uikit](https://github.com/jlt-commons/glitter-uikit) | the same renderer model driving native macOS `NSView` widgets through AppKit, rather than GTK4 | adoption | [jlt-commons.github.io/glitter-uikit](https://jlt-commons.github.io/glitter-uikit/) |
| [uikit-demo](https://github.com/jlt-commons/uikit-demo) | A demo of glitter-uikit: a hub of live example windows (counter, currency converter, live FX, particle toy) built as a real macOS app bundle | started here | [jlt-commons.github.io/uikit-demo](https://jlt-commons.github.io/uikit-demo/) |
| [nexus-jolt](https://github.com/jlt-commons/nexus-jolt) | A Jolt port of [nexus](https://github.com/cjohansen/nexus): data-driven action/effect/placeholder dispatch, used today by the glitter family | started here | [jlt-commons.github.io/nexus-jolt](https://jlt-commons.github.io/nexus-jolt/) |
| [ftxui-jolt](https://github.com/jlt-commons/ftxui-jolt) | A reagent-style API over [FTXUI](https://github.com/ArthurSonzogni/FTXUI), the C++ terminal UI library: components as functions returning hiccup, rendered through FTXUI's own event loop, focus handling and mouse support | started here | [the repo](https://github.com/jlt-commons/ftxui-jolt) |
| [ebb](https://github.com/jlt-commons/ebb) | A port of [missionary](https://github.com/leonoel/missionary): composable tasks and flows with real cancellation and glitch-free dataflow, running on Chez fibers | started here | [jlt-commons.github.io/ebb](https://jlt-commons.github.io/ebb/) |
| [ensemble](https://github.com/jlt-commons/ensemble) | Erlang processes and the OTP behaviours on Jolt's native fibers: links, monitors, selective receive, `gen_server`, `gen_statem` and supervisors | started here | [the repo](https://github.com/jlt-commons/ensemble) |
| [tapestry](https://github.com/jlt-commons/tapestry) | Structured concurrency, where a unit of work is a derefable fiber carrying its result, errors, timeouts and cancellation. A port of [teknql/tapestry](https://github.com/teknql/tapestry) onto `core.async` | from jolt-lang | [the repo](https://github.com/jlt-commons/tapestry) |
| [duratom](https://github.com/jlt-commons/duratom) | A durable atom that writes every change through to a pluggable backend. A port of [jimpil/duratom](https://github.com/jimpil/duratom) | from jolt-lang | [the repo](https://github.com/jlt-commons/duratom) |
| [instaparse](https://github.com/jlt-commons/instaparse) | [instaparse](https://github.com/Engelberg/instaparse) on Jolt: parsers from EBNF or ABNF grammars, including left-recursive and ambiguous ones | from jolt-lang | [the repo](https://github.com/jlt-commons/instaparse) |
| [mulog](https://github.com/jlt-commons/mulog) | The published [mulog](https://github.com/BrunoBonacci/mulog) 0.9.0, with the Java classes it bundles supplied by portable Jolt registrations | from jolt-lang | [the repo](https://github.com/jlt-commons/mulog) |
| [aws-api-jolt](https://github.com/jlt-commons/aws-api-jolt) | The unmodified [cognitect aws-api](https://github.com/cognitect-labs/aws-api) Maven release running on Jolt. It supplies an HTTP client and a host-class declaration, and nothing is forked | started here | [the repo](https://github.com/jlt-commons/aws-api-jolt) |
| [clj-to-ys](https://github.com/jlt-commons/clj-to-ys) | Translates Clojure source into idiomatic [YS (YAMLScript)](https://yamlscript.org), built on the instaparse port | started here | [the repo](https://github.com/jlt-commons/clj-to-ys) |
| [writ](https://github.com/jlt-commons/writ) | Checks plain Clojure against a spec of what the code is for: signatures, plus laws run through test.check. Built as a gate for code an LLM writes | started here | [the repo](https://github.com/jlt-commons/writ) |
| [lev](https://github.com/jlt-commons/lev) | A decision engine that answers typed questions about a state with calibrated probabilities, using small encoder models or a GGUF chat model through llama.cpp | started here | [the repo](https://github.com/jlt-commons/lev) |

The six adopted ones were transferred rather than forked, so their stars, issues and
history came with them, and the old URLs still redirect. Each keeps its original
maintainer. All six are on the shared engine, so their sites live at
`jlt-commons.github.io/<repo>/`.

Four came from [jolt-lang](https://github.com/jolt-lang): instaparse, tapestry, duratom
and mulog. They are Jolt ports of established Clojure libraries that Jolt's author made
inside the language organization, then transferred here once the split described below
was agreed. Their `jolt-lang/...` URLs redirect.

Fourteen were started here rather than adopted, by two different people. Jolt's author
started eight of them: raylib-android, ebb, ftxui-jolt, ensemble, writ, lev, clj-to-ys
and graviton. A different maintainer started the other six. glitter-core, uikit-demo and
nexus-jolt were extracted from glitter to fix the "GTK4 required even though it's never
called" limitation glitter-uikit and glitter-gl's own READMEs had named as future work
(see [jlt-commons/meta#1](https://github.com/jlt-commons/meta/issues/1) for the
proposal). raylib-jolt-demo and raylib-ios-demo took the examples out of raylib-jlt and
raylib-ios, so those two repos now hold only the bindings and the platform. aws-api-jolt
is the sixth.

Thirteen of the twenty-four publish through the shared engine. The rest are recent
enough that their documentation is still the repo README.

raylib-ios and raylib-ios-demo each carry a `NOTICE` worth reading before a fork. Both
are EPL 2.0 like the rest of the organization, but three scenes come from
[jasalt/jolt-android-experiment](https://github.com/jasalt/jolt-android-experiment) under
MIT, and the raylib ports keep their zlib terms. The `NOTICE` says which files carry
which licence.

## The wider ecosystem

This table is only what's hosted in this organization. For the official jolt-lang
libraries, JVM and Clojure compatibility, docs and tooling beyond it, see
[awesome-jolt](https://github.com/jlt-commons/awesome-jolt) — a community-maintained
curated list, itself published through docs-engine at
[jlt-commons.github.io/awesome-jolt](https://jlt-commons.github.io/awesome-jolt/).

## Why raylib-jlt and raygui-jlt first

They are the shape the adoption track was written for. Both were personal
projects under one account, both were working and used, and both would have gone
quiet the month their author got busy with something else. Nothing was wrong with
them, which is rather the point: a project does not need to be in trouble to be
better off somewhere it can outlive one person's free time.

Moving them was a community decision rather than a unilateral one. The idea was
put to the Jolt channel first, modelled openly on
[clj-commons](https://github.com/clj-commons), and it had support before any
repository moved.

That includes Jolt's own author, Dmitri Sotnikov, who put the split plainly:

> the official org is already starting to get a bit crowded, and it probably
> would be best to keep bare essentials there like time, and then move the rest
> to the commons

So the two organizations are halves of one arrangement the language's author
suggested, and four [jolt-lang](https://github.com/jolt-lang) projects have since moved
here on that basis. It runs the other way as well. Eight projects were started in this
organization by the same author, beginning with ebb and raylib-android. These two adoptions
were the first test of the arrangement, and the reason the adoption track leads rather
than incubation.

## What this organization does

Hosting is the least of it. Anyone can host a repository.

What a project gets here is a set of decisions already made, so its maintainer
does not have to make them alone:

- **A documentation site, built and published for you.** Write markdown and a
  short config file; [docs-engine](https://github.com/jlt-commons/docs-engine)
  does the rest, and CI deploys on merge. raylib-jlt and raygui-jlt both moved
  onto it and neither maintains a generator.
- **Shared conventions, arrived at once.** How an example is registered, what a
  gate checks, how counts stay honest across a README and a gallery. These are
  small decisions individually and tedious to keep relitigating.
- **Somewhere to put the hard-won specifics.** Jolt is young and its FFI moves
  fast. When someone works out what a struct actually costs across the ABI, that
  belongs where the next person will find it.

That is the leading part, and it is deliberate. This organization sets a floor
for what a Jolt library looks like and then helps projects reach it, which is a
job someone has to do while the language is this young. Projects arriving with a
tired maintainer and projects arriving on their first day both get the same
footing.

It also leaves a language team's attention on the language. Keeping the
ecosystem's libraries somewhere adjacent, with their own conventions and their
own release cadence, is how clj-commons has served Clojure for years, and the
same arrangement looks right here.

## What goes here

Each accepted project gets a row: what it is, who maintains it, and whether it
arrived by adoption or was started here. Each one keeps its own repository and
publishes its own documentation at `jlt-commons.github.io/<repo>/`, so a
project's releases never wait on this site.

## Getting the next one listed

Still the interesting part, and still open to anyone.

- **An existing Jolt library that needs a new home.** See the
  [adoption checklist](https://github.com/jlt-commons/meta/blob/main/PROPOSING.md).
  We ask the current owner first, every time, and prefer a transfer over a fork.
- **A port of a Clojure library that Jolt does not have yet.** The
  [jolt-lang](https://github.com/jolt-lang) organization already ports quite a
  few, so check there first, then propose what is missing.
- **Something new.** A real gap and one willing maintainer is the whole bar.

Adoption is not a takeover. If you maintain something in Jolt and want it to
carry on without you having to, that is exactly the conversation to start.

[Open an issue](https://github.com/jlt-commons/meta/issues) and it gets read.
