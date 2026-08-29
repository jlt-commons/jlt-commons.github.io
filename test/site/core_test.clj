(ns site.core-test
  (:require [babashka.fs :as fs]
            [clojure.java.io :as io]
            [clojure.string :as str]
            [clojure.test :refer [deftest is testing]]
            [site.core :as core]))

(deftest base-path-normalizes-every-accepted-form
  (testing "root-hosted sites collapse to the empty string"
    (is (= "" (core/base-path nil)))
    (is (= "" (core/base-path "")))
    (is (= "" (core/base-path "   ")))
    (is (= "" (core/base-path "/")))
    (is (= "" (core/base-path "///"))))
  (testing "a project path always gains a leading slash and loses trailing ones"
    (is (= "/some-lib" (core/base-path "some-lib")))
    (is (= "/some-lib" (core/base-path "/some-lib")))
    (is (= "/some-lib" (core/base-path "/some-lib/")))
    (is (= "/some-lib" (core/base-path "/some-lib///")))))

(deftest site-context-exposes-the-base-path-to-templates
  (is (= "" (:site-base (core/site-context {:title "t" :description "d" :base-path ""}))))
  (is (= "/some-lib"
         (:site-base (core/site-context {:title "t" :description "d" :base-path "some-lib"})))))

(deftest nav-items-prefix-the-base-path
  (let [rendered {"intro.md" {:title "Intro" :slug "intro"}}
        ids      ["intro.md"]]
    (testing "root-hosted site is unchanged from the original engine"
      (is (= [{:href "/guide/intro.html" :title "Intro"}]
             (core/nav-items rendered ids ""))))
    (testing "project site is served under its own prefix"
      (is (= [{:href "/some-lib/guide/intro.html" :title "Intro"}]
             (core/nav-items rendered ids "/some-lib"))))))

(deftest docs-href-prefixes-the-base-path
  (let [dir (io/file "test" "fixtures" "bp-guide")]
    (fs/create-dirs dir)
    (spit (io/file dir "index.md") "# Index")
    (try
      (is (= "/guide/index.html" (core/docs-href {:guide-dir dir} "")))
      (is (= "/some-lib/guide/index.html" (core/docs-href {:guide-dir dir} "/some-lib")))
      (finally (fs/delete-tree dir)))))

(defn- build-fixture-site!
  "Builds a complete site into a temp dir at the given base path and
   returns {:out <dir> :doc <html string> :home <html string>}."
  [base]
  (let [tmp   (fs/create-temp-dir {:prefix "jltc-site"})
        guide (io/file (str tmp) "content" "guide")]
    (fs/create-dirs guide)
    (spit (io/file guide "index.md") "# Intro\n\nHello.\n")
    (let [site {:title "jlt-commons" :description "d" :github-url "https://example.invalid"
                :base-path base
                :guide-dir guide
                :output-dir (io/file (str tmp) "_site")
                :home-template "home.html"}]
      (core/generate! site)
      {:out  (:output-dir site)
       :doc  (slurp (io/file (:output-dir site) "guide" "index.html"))
       :home (slurp (io/file (:output-dir site) "index.html"))})))

(deftest root-hosted-build-uses-root-relative-asset-urls
  (let [{:keys [doc]} (build-fixture-site! "")]
    (is (str/includes? doc "href=\"/css/screen.css\""))
    (is (str/includes? doc "href=\"/guide/index.html\""))))

(deftest project-hosted-build-prefixes-every-url
  (let [{:keys [doc home]} (build-fixture-site! "/some-lib")]
    (testing "stylesheets resolve inside the project, not against the org site"
      (is (str/includes? doc "href=\"/some-lib/css/screen.css\""))
      (is (not (str/includes? doc "href=\"/css/screen.css\""))))
    (testing "nav links stay inside the project site"
      (is (str/includes? doc "href=\"/some-lib/guide/index.html\""))
      (is (str/includes? doc "href=\"/some-lib/\"")))
    (testing "the home page gets the same treatment"
      (is (str/includes? home "href=\"/some-lib/css/screen.css\"")))))

(deftest selected-nav-item-still-matches-after-prefixing
  ;; write-doc-page! computes active-href separately from nav-items. If the two
  ;; drift, every nav item silently renders unselected and the bug is cosmetic
  ;; enough to ship.
  (let [{:keys [doc]} (build-fixture-site! "/some-lib")]
    (is (str/includes? doc "class=\"selected\""))))
