# MCKL mapped approach — 22 October 2026

MCKL is selectable as either trip endpoint. The label explicitly says **mapped
approach**: node `osm_11443497173`, latitude `3.1318006`, longitude `101.6906217`,
on existing sidewalk way [1323590725](https://www.openstreetmap.org/way/1323590725).
The source sidewalk has no name; its catalogue `osm_name` is null. The college
identity and nearby entrance reference come from the team's supplied location.

The supplied entrance coordinate snaps 0.66 m from gate `osm_7045518924`, tagged
`access=private`. Its incident driveway segment is closed to routing. The selected
sidewalk approach is about 4.1 m from that coordinate, outside the gate. No college
entrance, permission to enter, or final access connection is field verified.

## General routing correction

During route calculation, carriageway ways explicitly tagged with separately
mapped sidewalks on **both** sides are avoided when a connected alternative exists
in the profile/access/preference-filtered directed graph. Side-specific tags take
precedence over `sidewalk:both`, then `sidewalk`. Roads without that mapping, roads
with only one separately mapped side, and carriageways required to reach an
endpoint or disconnected sidepath remain available under existing restrictions.
The rule changes no source edges, geometry, crossing connectivity or walking speed.
It does not establish safety or legal access beyond the available OSM records.

## Crossing and calculated trips

The corrected NU Sentral → MCKL Fastest route naturally uses both consecutive
segments of way [1264710459](https://www.openstreetmap.org/way/1264710459):

`osm_11749673973 → osm_4619870919 → osm_6148809817`

Backend tests check those actual edges and their OSM way IDs, not proximity.
The cached way says `crossing=uncontrolled`; the central node says
`crossing=traffic_signals`. Signal control is therefore not independently verified.

| Start | MCKL approach distance | Model walking time |
| --- | ---: | ---: |
| Existing NU Sentral main entrance | 468.77 m | 6.25 min (UI rounds up to 7 min) |
| Team NU coordinate | 453.89 m | 6.05 min (UI rounds up to 7 min) |
| Existing KL Sentral south entrance | 578.68 m | 7.72 min |
| Team alternative KL coordinate | 740.61 m | 9.87 min |

The existing KL Sentral → NU Sentral trip remains 316.41 m / 4.22 min.
The model still uses 1.25 m/s and excludes signal waiting and unmapped endpoint
gaps. The team's approximately seven-minute field observation, including waiting,
is separate evidence. Do not compare different KL/NU origins as identical trips.

The cached extract is dated 19 October 2026. No graph regeneration or download was
needed. The importer reproduces both identical destination catalogues from that
extract. No crossing reference point is a selectable landmark. Safer at Night
still reports insufficient environmental evidence; Step-Free still reports missing
critical accessibility data. Neither substitutes Fastest or promises accessibility.
