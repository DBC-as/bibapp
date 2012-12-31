[![ci](https://secure.travis-ci.org/rasmuserik/bibapp.png)](http://travis-ci.org/rasmuserik/bibapp)

# BibApp

Mobile/html5 public library app.

# Roadmap

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
