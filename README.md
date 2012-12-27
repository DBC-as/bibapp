#BibApp

Mobile/html5 public library app.

## Roadmap

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

### Noter

- AppMap (Home)
    - Forside:
        - Top-bar: 
            - home-icon (grayed)
            - søgefelt
            - søgeikon
        - Bibliotekslogo
        - Nyheds-widget
        - Kalender-widget
        - Åbningstider-button
        - Lånerstatus
    - Søgeresultater
        - Top-bar: 
            - home-icon
            - søgebar (overskrift), søgeikon 
        - Facet-bar (later)
        - Poster
            - Post-short-info+icon
            - Bestil-knap
            - Expanderende post med mere info
    - Info
        - Top-bar: home-icon, _Nyheder_ (overskrift), kalender, åbningstider
        - Nyheder
        - Kalender
        - Åbningstider
    - Lånerstatus
        - Top-bar: home-icon, _Lånerstatus_ (overskrift) Opdateret (??/?? | idag ??:??), Log ud
        - Hjemkomne
        - Lån (forny-alt-knap)
            - afle
        - Bestillinger
            - bestillingsdato (afbestil)
- Login-popup

- Sider
    - Persistent top-bar
        - Always logo/home-icon
    - Forside
        - Topbar
            - Home
            - Søgefelt
            - Søgeikon
        - Biblioteksnavn
        - Lånerstatus-widget
        - Nyheds-widget
        - Arrangements-widget
        - NB: transition to/from to corner button
    - Søgeresultater
        - Topbar
            - Home
            - Søgefelt
            - Søgeikon
        - Liste af bøger
            - Billede
            - Titel/forfatter/teaser
            - Status: hjemme/udlånt/lånt/bestilt...
            - Expanding decription
    - Nyheder
        - Billede, titel, teaser,
    - Arrangementer
        - Titel, tid, sted, teaser, billede
    - Bestillinger / hjemkomne bøger
        - Titel, bestillingsdat
    - Lånerstatus / forny lån
        - Topbar
            - Home
            - Forny alle
        - Hjemkomne bøger, sorteret efter afhentningsdato
        - Lånte bøger, sorteret efter afleveringsdato
        - Bestillinger
    - Min side
        - Indstillinger for bestilling / afhentning / ...
- Komponenter
    - Top-bar
        - Home/library-icon
        - Søgefelt med autocomplete
        - Søge-knap
    - (Uendelig) liste af elementer af fast størrelse
    - Bottom-bar
        - 
        - Settings
    - Side-scrolling page w/back-button when iOS app + dispatch function based on hash.
- Modelnoter
    - BibEntry-object, skabes og vises uden data(Loading), og får update-event når data er hentet


----

     _______
    |⌂_____✍|
    |       |
    | ...   |
    |       |
    |       |
    |       |

