# Projects

Four, all adopted.

| project | what it is | arrived by | docs |
|---|---|---|---|
| [raylib-jlt](https://github.com/jlt-commons/raylib-jlt) | 119 [raylib](https://www.raylib.com) examples, calling the system `libraylib` over its C ABI through `jolt.ffi` | adoption | [jlt-commons.github.io/raylib-jlt](https://jlt-commons.github.io/raylib-jlt/) |
| [raygui-jlt](https://github.com/jlt-commons/raygui-jlt) | 24 examples of raygui, raylib's immediate-mode GUI library, bound the same way | adoption | [jlt-commons.github.io/raygui-jlt](https://jlt-commons.github.io/raygui-jlt/) |
| [glitter](https://github.com/jlt-commons/glitter) | A [Replicant](https://github.com/cjohansen/replicant)-style GTK4 renderer: one state atom, a pure `state -> hiccup` view, event handlers as data | adoption | [jlt-commons.github.io/glitter](https://jlt-commons.github.io/glitter/) |
| [glitter-gl](https://github.com/jlt-commons/glitter-gl) | OpenGL geometry, matrices and shaders for glitter, plus a `:gl-area` widget to draw them in | adoption | [jlt-commons.github.io/glitter-gl](https://jlt-commons.github.io/glitter-gl/) |

All four were transferred rather than forked, so their stars, issues and history came
with them, and the old URLs still redirect. Each keeps its original maintainer.

The two GTK projects arrived more recently and are already on the shared engine, so
all four sites now live at `jlt-commons.github.io/<repo>/`.

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

So this is not a splinter. It is the other half of an arrangement the language's
author suggested, and some [jolt-lang](https://github.com/jolt-lang) projects are
expected to move here on that basis. These two are the first test of it, and the
reason the adoption track leads rather than incubation.

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

That is the leading part, and it is deliberate. This organization is not a
parking lot for projects whose authors lost interest. It sets a floor for what a
Jolt library looks like and then helps projects reach it, which is a job someone
has to do while the language is this young.

It is also the job the official organization should not have to do. A language
team's attention belongs on the language. Keeping the ecosystem's libraries
somewhere adjacent, with their own conventions and their own release cadence, is
how clj-commons has served Clojure for years, and the same split looks right
here.

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
