(ns site.smoke-test
  (:require [clojure.test :refer [deftest is]]))

(deftest harness-runs
  (is (= 4 (+ 2 2))))
