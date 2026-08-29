(ns site.core
  (:require [babashka.fs :as fs]
            [clojure.java.io :as io]
            [clojure.string :as str]
            [org.httpkit.server :as hk]
            [selmer.parser :as selmer]
            [site.markdown :as md]))

(selmer/set-resource-path! (io/resource "templates"))

(defn base-path
  "Normalizes a configured :base-path to either \"\" (root-hosted) or
   \"/name\" (served under a subdirectory). Accepts nil, \"\", \"name\",
   \"/name\" and \"/name/\".

   This is the one behavioral addition over the b12n-docs engine, which
   assumes every site is root-hosted because all 57 of its sites are. A
   jlt-commons member project is served at /<repo>/, where a root-relative
   \"/css/screen.css\" silently loads the ORG site's stylesheet instead of
   its own. The page still renders, wearing the wrong clothes, which is why
   this needs a test rather than a look."
  [raw]
  (if (str/blank? raw)
    ""
    (let [trimmed (str/replace raw #"/+$" "")]
      (if (str/starts-with? trimmed "/") trimmed (str "/" trimmed)))))

(defn- slug-of [doc-id] (str/replace doc-id #"\.md$" ""))

(defn- pin-index-first
  "Given basenames within one directory, sorted, moves index.md to the
   front if present (that directory's own \"start here\" page), leaving
   everything else in sorted order."
  [basenames]
  (let [sorted (sort basenames)]
    (if (some #{"index.md"} sorted)
      (into ["index.md"] (remove #{"index.md"} sorted))
      (vec sorted))))

(defn discover-doc-ids
  "Auto-discovered nav order: every *.md anywhere under guide-dir (any
   depth), as POSIX-style paths relative to guide-dir (mirrors
   site.infra/discover-infra-ids). Ordered directory-by-directory so it
   reads top-to-bottom like the guide's intended sequence: directories
   themselves in sorted order (guide-dir's own root first, since '' sorts
   before any name), each directory's own files pinning ITS index.md
   first if present, else sorted. Used when a project has no
   projects/<name>/docpages.edn curated-order override.

   For a flat guide-dir (every project before b12n-gamedev-course — zero
   subdirectories under docs/guide/) this reduces to exactly the
   previous flat behavior: one directory group (the root), its files
   sorted with index.md pinned first. Plain alphabetical sort on full
   relative paths would get a nested project's per-directory index.md
   wrong when numbered siblings start above 01 (verified against
   b12n-gamedev-course's phase-3-four-lisps/, whose files are index.md,
   02-port-your-pong.md, 03-closing.md — alphabetical-on-full-path
   would order index.md LAST, after 02/03, since digits sort below the
   letter 'i'); grouping by directory and pinning per-group avoids that."
  [guide-dir]
  (let [root    (.toPath (io/file guide-dir))
        all-rel (->> (file-seq (io/file guide-dir))
                     (filter (fn [f] (and (.isFile f) (str/ends-with? (.getName f) ".md"))))
                     (map (fn [f] (str (.relativize root (.toPath f)))))
                     (map (fn [rel] (str/replace rel java.io.File/separator "/"))))
        dir-of  (fn [rel] (let [i (str/last-index-of rel "/")] (if i (subs rel 0 i) "")))
        base-of (fn [rel] (let [i (str/last-index-of rel "/")] (if i (subs rel (inc i)) rel)))
        by-dir  (group-by dir-of all-rel)]
    (vec (mapcat (fn [dir]
                   (let [bases (pin-index-first (map base-of (get by-dir dir)))]
                     (map (fn [base] (if (= dir "") base (str dir "/" base))) bases)))
                 (sort (keys by-dir))))))

(defn render-all-docs
  "doc-id -> {:title :toc-html :body-html :print-html :slug}, for every doc-id.
   Always renders via md/rewrite-nested-doc-links (built per doc-id,
   from its own path relative to guide-dir) rather than defaulting to
   plain rewrite-doc-links — the nested-aware rewriter produces
   byte-identical output to the flat one for every flat (no-'/') doc-id,
   so this is safe for every existing project, not just nested ones."
  [guide-dir doc-ids]
  (into {}
        (for [doc-id doc-ids]
          (let [raw (slurp (io/file guide-dir doc-id))
                {:keys [title toc-html body-html print-html]}
                (md/render-doc-page raw (md/rewrite-nested-doc-links doc-id))]
            ;; print-html must be carried through: site.infra/render-print-page
            ;; needs the never-collapsed rendering, because a closed <details>
            ;; prints nothing. Dropping it here silently emptied print.html.
            [doc-id {:title title :toc-html toc-html :body-html body-html
                     :print-html print-html :slug (slug-of doc-id)}]))))

(defn nav-items [rendered doc-ids base]
  (mapv (fn [doc-id]
          (let [{:keys [title slug]} (get rendered doc-id)]
            {:href (str base "/guide/" slug ".html") :title title}))
        doc-ids))

(defn docs-href
  "Where the nav's Docs link points: /guide/index.html when content/guide
   has an index.md, else the first page in nav order, so it is never a
   dead link. Prefixed by base for a project-hosted site."
  [{:keys [guide-dir]} base]
  (if (and guide-dir (fs/exists? (io/file guide-dir "index.md")))
    (str base "/guide/index.html")
    (let [doc-ids (when (and guide-dir (fs/exists? guide-dir)) (discover-doc-ids guide-dir))]
      (if (seq doc-ids)
        (str base "/guide/" (slug-of (first doc-ids)) ".html")
        (str base "/guide/index.html")))))

(defn site-context
  "Template variables every page needs. site-base is the empty string for
   a root-hosted site and \"/name\" for a project site; every URL in the
   templates is written as {{site-base}}/... so both cases work."
  [{:keys [title description github-url] :as site}]
  (let [base (base-path (:base-path site))]
    {:site-title      title
     :site-brand      title
     :site-tagline    description
     :site-github-url github-url
     :site-base       base
     :site-docs-href  (docs-href site base)}))

(defn write-doc-page! [output-dir site-ctx page nav base]
  (let [out-path (io/file output-dir "guide" (str (:slug page) ".html"))
        href     (str base "/guide/" (:slug page) ".html")]
    (io/make-parents out-path)
    (spit out-path
          (selmer/render-file "docs.html"
                              (merge site-ctx
                                     {:page "docs"
                                      :title (:title page)
                                      :toc (:toc-html page)
                                      :content (:body-html page)
                                      :nav nav
                                      :active-href href})))))

(defn generate-docs! [{:keys [output-dir guide-dir] :as site}]
  (let [doc-ids  (discover-doc-ids guide-dir)
        rendered (render-all-docs guide-dir doc-ids)
        base     (base-path (:base-path site))
        nav      (nav-items rendered doc-ids base)
        site-ctx (site-context site)]
    (doseq [doc-id doc-ids]
      (write-doc-page! output-dir site-ctx (get rendered doc-id) nav base))))

(defn generate-home! [{:keys [output-dir home-template] :as site}]
  (let [out-path (io/file output-dir "index.html")]
    (io/make-parents out-path)
    (spit out-path
          (selmer/render-file home-template
                              (merge (site-context site) {:page "home"})))))

(defn generate-404! [output-dir site-ctx]
  (let [out-path (io/file output-dir "404.html")]
    (io/make-parents out-path)
    (spit out-path (selmer/render-file "404.html" (merge site-ctx {:page "404"})))))

(defn copy-static!
  "Copies resources/static/** verbatim into output-dir (css, vendored JS)."
  [output-dir]
  (let [src (io/file "resources" "static")]
    (when-not (fs/exists? src)
      (throw (ex-info "resources/static is missing — the engine's own repo is corrupt" {:path (str src)})))
    (fs/create-dirs output-dir)
    (fs/copy-tree src output-dir {:replace-existing true})))

(defn clean! [{:keys [output-dir]}]
  (when (fs/exists? output-dir)
    (fs/delete-tree output-dir)))

(defn generate! [{:keys [output-dir guide-dir] :as site}]
  (when-not (fs/exists? guide-dir)
    (throw (ex-info (str "no guide directory at " guide-dir) {:guide-dir (str guide-dir)})))
  (clean! site)
  (fs/create-dirs output-dir)
  (copy-static! output-dir)
  (generate-home! site)
  (generate-docs! site)
  (generate-404! output-dir (site-context site))
  (println "Site generated in" (str output-dir)))

;; --- local preview server ---

(defn- content-type [path]
  (cond
    (str/ends-with? path ".html")  "text/html; charset=utf-8"
    (str/ends-with? path ".css")   "text/css; charset=utf-8"
    (str/ends-with? path ".js")    "application/javascript; charset=utf-8"
    (str/ends-with? path ".svg")   "image/svg+xml"
    (str/ends-with? path ".woff2") "font/woff2"
    (str/ends-with? path ".json")  "application/json"
    (str/ends-with? path ".ico")   "image/x-icon"
    (str/ends-with? path ".png")   "image/png"
    (str/ends-with? path ".gif")   "image/gif"
    (or (str/ends-with? path ".jpg") (str/ends-with? path ".jpeg")) "image/jpeg"
    (str/ends-with? path ".webp")  "image/webp"
    :else                          "application/octet-stream"))

(defn- within-output-dir?
  "True when f's canonical (symlink/`..`-resolved) path is output-dir
   itself or something under it. Guards the local preview server against
   path traversal (e.g. a request for /../../../etc/passwd)."
  [output-dir f]
  (let [root   (.getCanonicalPath (io/file output-dir))
        target (.getCanonicalPath f)]
    (or (= target root)
        (str/starts-with? target (str root java.io.File/separator)))))

(defn- not-found-response [output-dir]
  {:status 404 :headers {"Content-Type" "text/html"} :body (slurp (io/file output-dir "404.html"))})

(defn- make-static-handler [output-dir]
  (fn [req]
    (let [uri (:uri req)
          uri (if (= uri "/") "/index.html" uri)
          f   (io/file output-dir (subs uri 1))]
      (if (and (fs/exists? f)
               (within-output-dir? output-dir f)
               (not (fs/directory? f)))
        ;; io/input-stream, not slurp: slurp reads as a String, which
        ;; would corrupt a binary asset (images, fonts) via charset
        ;; decode/re-encode.
        {:status 200 :headers {"Content-Type" (content-type uri)} :body (io/input-stream f)}
        (not-found-response output-dir)))))

(defn serve!
  "Builds, then serves output-dir at http://localhost:<port> until interrupted."
  [project port-str]
  (generate! project)
  (let [port       (Integer/parseInt port-str)
        output-dir (:output-dir project)]
    (println "Serving" (str output-dir) "at http://localhost:" port)
    ;; :ip "127.0.0.1" — local-only dev preview server; without an
    ;; explicit :ip, http-kit binds all network interfaces by default.
    (hk/run-server (make-static-handler output-dir) {:port port :ip "127.0.0.1"})
    @(promise)))
