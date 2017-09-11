# Libsyn Browser Podcast Exporter

Script which results in a JSON file download for your podcast data. Needs to run in-browser.

Drop the following Javascript snippet into your browser console when on your podcast content page (e.g. [https://four.libsyn.com/content/previously-published](https://four.libsyn.com/content/previously-published)):

```js
!function(t,e,r){var s=t.createElement(e),n=t.getElementsByTagName(e)[0];
s.async=1,s.src=r,n.parentNode.insertBefore(s,n)}(document,"script"
,'https://cdn.rawgit.com/zao-web/libsyn-browser-podcast-exporter/v0.1.1/libsyn-browser-podcast-exporter.js?v='+Date.now() );
```

Once the script is running, you can stop it, by adding `libsynBrowserMigrator.stop();` to your browser console.

This has been tested in Chrome only. Use other browsers at your own risk.

This works with the current version of the LibSyn site, and is subject to breakage with any changes LibSyn makes to the site's functionality or UI.
