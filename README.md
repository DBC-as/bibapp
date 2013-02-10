# HTML5 bibliographic/library app prototyping experiments and proof of concepts

This is mainly internal proof-of-concepts and experiments. 

Contact: [Rasmus Erik](http://rasmuserik.com) aka. RJE at DBC.


# Versions 0.2 (in `app.js`)

Rewrite in progress, not usable yet.

# Versions 0.1 (in `bibdata.js`)

Mobile/html5 public library app experiment.

## How to run

Install node.js, check the repository out, and then:

    npm install request zombie express socket.io-client socket.io
    node bibdata.js
    [open localhost:7777 in the browser]

It may also be running on http://bibdata.dk/.

## Prototype/proof-of-concept-features implemented

- static + dynamic site from one codebase
- mobile html5-app (portrait orientation) prototype, with transitions.
- contains static-html semantic marking (RDFa + schema.org). Tryout bibdata.dk with [google webmaster tools](https://www.google.com/webmasters/tools/richsnippets?url=http%3A%2F%2Fbibdata.dk%2Fwork%2F870971%3A73214424) or [w3](http://www.w3.org/2007/08/pyRdfa/extract?uri=http://bibdata.dk/work/710100:44251205) (if bibdata.dk is up running).

# Copyright

    Copyright (C) 2013 Dansk BiblioteksCenter, DBC A/S

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.

# Notes

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

- Current target
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

----

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

[![ci](https://secure.travis-ci.org/rasmuserik/bibdata.png)](http://travis-ci.org/rasmuserik/bibdata)
[![logo](https://ssl.solsort.com/github-solsort.png?dbc-bibapp)](https://ssl.solsort.com/github-solsort.html?dbc-bibapp)
