(ns site.config
  (:require [clojure.java.io :as io]))

(defn site
  "The single site this repo builds.

   :base-path is \"\" because the jlt-commons org site is served at the
   domain root, https://jlt-commons.github.io. A member project reusing
   this generator is served at https://jlt-commons.github.io/<repo>/ and
   sets :base-path \"/<repo>\" instead. See site.core/base-path."
  []
  {:title         "jlt-commons"
   :description   "A community-led home for Jolt libraries and tooling."
   :github-url    "https://github.com/jlt-commons"
   :base-path     ""
   :guide-dir     (io/file "content" "guide")
   :output-dir    (io/file "_site")
   :home-template "home.html"})
