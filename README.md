[![ci](https://secure.travis-ci.org/rasmuserik/bibdata.png)](http://travis-ci.org/rasmuserik/bibdata)

# BibData

Mobile/html5 public library app.

Prototype/proof-of-concept implemented:

- mobile html5-app (portrait orientation) prototype. More layouts to come.
- contains static-html semantic marking (RDFa + schema.org). Tryout bibdata.dk with [google webmaster tools](https://www.google.com/webmasters/tools/richsnippets?url=http%3A%2F%2Fbibdata.dk%2Fwork%2F870971%3A73214424) (if bibdata.dk is up running).

# How to run

Install node.js, check the repository out, and then:

    npm install
    node bibdata.js
    [open localhost:7777 in the browser]

It may also be running on http://bibdata.dk/.

# Roadmap

- calendar-page
- news-page
- styling
- refactor
- extend - dont reinsert-full in result-page
- login
- loading indicator
- collection-handling
- get closure-advanced-mode running
- closure-typing coverage
- test coverage
- search infinite list
- search dropdown hints
- cachable rest instead of socket when applicable

----

- Version 0.1
    - Søg bog
        - søgeresultatliste
        - bestil
        - visning af enkeltresultat
    - Nyheder 
    - Arrangementer
    - Lånerstatus
        - Lån + næste afleveringsdag
        - Forny lån
        - Hjemkomne bøger m. afhentningsnummer
        - Log ud
    - backend only implented as mock
- Later
    - unittest with phantom-js
    - Åbningstider
    - søgefelt med completion
    - bog-lister
    - spørgetjenesten
    - andre der har laant..
    - book-review
    - social - tweet, like, ..., follow library
    - huskeliste
    - bogteaser ala kolding-bib/artesis forside
    - Åbningstider
    - Find nærmeste bibliotek
    - Skan en bog
    - send via email
    - E-bøger
    - seneste søgninger
    - facetbrowser
        - årstalsgraf

# Notes

- backend
    - search-results
    - individual result
        - behind html5-history-api for url.
        - deliver as static html with schema (ie. schema.org )
            - crawlable from google etc.
        - links to
            - http://bibliotek.kk.dk/ting/object/870971%3A85429353
            - http://bibliotek.dk/linkme.php?ccl=lid%3D85429353+og+lok%3D870971
    - lånerstatus
        - auth via openauth or similar
- production stack
    - api.solsort.com - socket.io / node.js server on torqhost w/ssl
        - NB: stats collected via javascript, transferred via socket.io
    - solsort.com - etc. nginx static, behind cloudflare
    - (later) varnish in front to enable websockets
    - couchbase for DB
    - closure compiler for optimisation and library
    - app packaging via cordova

![logo](http://bibdata.dk/bibdata.png?github)
