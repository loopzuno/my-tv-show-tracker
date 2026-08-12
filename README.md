# My Personal TV Tracker v4 Fast

Performance update:
- first successful load caches show + episode data in the browser
- future homepage visits render immediately from cache
- TVMaze IDs are reused, so the tracker skips repeated title searches
- TVMaze refresh happens after cached cards are already visible
- existing checkmarks, sorting, manual order, and startSeason behavior are preserved

The first visit after installing v4 will still need to build the cache once.
