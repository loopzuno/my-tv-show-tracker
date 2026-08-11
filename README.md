# My Personal TV Tracker v2

Adds support for tracking a show beginning with a specific season.

Example:
`{ query:"The Simpsons", display:"The Simpsons", startSeason:37 },`

For shows with `startSeason`, older seasons:
- do not appear on the show's tracker page
- do not count toward progress
- do not count toward remaining watch time
- do not affect the Random Show button

New additions in this version:
- The Simpsons — Season 37 onward
- Bob's Burgers — Season 16 onward
- One Piece — Netflix live-action series
- Malcolm in the Middle
- Ted Lasso
- Class of '07
- The Movies That Made Us
- Dark Side of the Ring

Your existing progress storage key is unchanged, so replacing the site files does
not erase existing browser checkmarks.

TV data provided by TVMaze.


## v3 sorting

The homepage now includes:
- My order
- Closest to finished
- Least watched
- Fewest episodes left
- Most episodes left
- A–Z

Sorting is temporary and does not change the order in `shared.js`.
