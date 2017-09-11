/**
 * The migrator object.
 *
 * @version 0.1.1
 *
 * @type {Object}
 */
 window.libsynBrowserMigrator = window.libsynBrowserMigrator || {};

( function( window, document, $, app, undefined ) {
	'use strict';

	/*
	 * App Configuration Parameters.
	 */

	/**
	 * Exported file name.
	 *
	 * @type {String}
	 */
	app.fileName = 'podcast.json';

	/**
	 * Whether to autostart app when running.
	 *
	 * @type {Boolean}
	 */
	app.autostart = true;

	/**
	 * Whether to stop the script once it is running.
	 *
	 * @version 0.1.1
	 *
	 * @type {Boolean}
	 */
	app.stopScript = false;

	/**
	 * The jQuery selector string for the podcast rows.
	 *
	 * @type {String}
	 */
	app.tableRowSelector = '#previously-published-table tr';

	/**
	 * The jQuery selector string for the row's podcast title element.
	 *
	 * @type {String}
	 */
	app.rowPodcastTitleSelector = '.item-title';

	/**
	 * The jQuery element index for the row's podcast category cell.
	 *
	 * @type {Number}
	 */
	app.categoryCellIndex = 2;

	/**
	 * The jQuery podcast row cell selector
	 *
	 * @type {String}
	 */
	app.rowCellSelector = 'td';

	/**
	 * The jQuery element index for the row's podcast date cell.
	 *
	 * @type {Number}
	 */
	app.dateCellIndex = 3;

	/**
	 * The jQuery data key for the podcast date value.
	 *
	 * @type {String}
	 */
	app.dateDataKey = 'sort-val';

	/**
	 * The jQuery selector string for the row's podcast ID input element.
	 *
	 * @type {String}
	 */
	app.rowPodcastIdSelector = '.change-handler-added';

	/**
	 * The jQuery selector string for fetching the next page of podcasts.
	 *
	 * @type {String}
	 */
	app.nextPageSelector = '.libsyn-table-next-page-button';

	/**
	 * The jQuery selector string for the input holding the current page number.
	 *
	 * @type {String}
	 */
	app.currPageInputSelector = '#previously-published-table_page_field';

	/**
	 * The jQuery selector string for the input holding the ID of the podcast which should open its embed-code modal.
	 * Replace `%d` with app.currentPodcastId.
	 *
	 * @type {String}
	 */
	app.currPodcastIdInputSelector = '#previously-published-table #item_id_%d';

	/**
	 * The jQuery selector string for the button which opens the emebed code modal.
	 *
	 * @type {String}
	 */
	app.embedCodeLinkSelector = 'a[href^="/content/embed-code/item_id/"]';

	/**
	 * The jQuery selector string for the input holding the ID of the podcast being displayed in the modal.
	 *
	 * @type {String}
	 */
	app.embedCodeModalIdInputSelector = '#item_id';

	/**
	 * The jQuery selector string for the input label for the Direct Download URL field.
	 *
	 * @type {String}
	 */
	app.directDownloadURLlabelSelector = '.ui-dialog-content .label-faker:contains(Direct Download URL)';

	/**
	 * The jQuery selector string for the input label for the Direct Download URL field.
	 *
	 * @type {String}
	 */
	app.directPermalinkURLlabelSelector = '.ui-dialog-content .label-faker:contains(Permalink URL)';

	/**
	 * The jQuery selector string for the embed-code modal close button.
	 *
	 * @type {String}
	 */
	app.embedCodeModalCloseButtonSelector = '.ui-dialog .ui-dialog-titlebar-close';

	app.podcasts            = {};
	app.podcastsToFetchURL  = [];
	app.currentPodcastId    = null;
	app.podcastObjectParams = {
		id          : '',
		title       : '',
		// description : '', // TODO: Add description. Requires opening the Info modal.
		date        : '',
		category    : '',
		url         : '',
		permalink   : ''
	};

	/**
	 * Pluck an id from the list of ids and fetch it's download URL from the embed-code modal.
	 *
	 * @since  0.1.0
	 */
	app.fetchPodcastURLs = function () {
		if ( app.checkStop() ) {
			return;
		}

		app.currentPodcastId = app.podcastsToFetchURL.shift();

		if ( ! app.currentPodcastId ) {
			// Ok, we're done with this page, so proceed to the next.
			return app.thisPageFetchingCompleted();
		}

		// Get the input with the current podcast ID in order to get the embed-code modal opened.
		var $input = $( app.currPodcastIdInputSelector.replace( '%d', app.currentPodcastId ) );

		if ( $input.length ) {
			// Ok, get this input's row.
			var $row = $input.parents( 'tr' );
			// Then get the button from the row for opening the embed code modal.
			var $btn = $row.find( app.embedCodeLinkSelector ).click();

			// Now,
			setTimeout( app.updatePodcastURL, 200 );
		}
	};

	/**
	 * Once we're done fetching podcast URLs on this page, we proceed to the next page if applicable,
	 * or else download the podcast objects as JSON.
	 *
	 * @since  0.1.0
	 */
	app.thisPageFetchingCompleted = function() {
		if ( app.checkStop() ) {
			return;
		}

		// Get the next page button.
		var $next = $( app.nextPageSelector );

		if ( ! $next.length ) {
			// oops.
			throw 'NO NEXT BUTTON!';
		}

		// Let's output a status count to the console.
		console.warn( 'Found podcasts:', Object.keys( app.podcasts ).length );

		// If we've reached the end...
		if ( $next.hasClass( 'ui-state-disabled' ) ) {

			// Then download our file.
			console.warn( 'podcasts DONE. Downloading JSON file.' );

			app.download( JSON.stringify( Object.values( app.podcasts ) ) );

		} else {

			var page = $( app.currPageInputSelector ).val();

			// Otherwise, proceed to the next page.
			console.warn( 'Next page....', page ? ( ++page ) : null );

			// Go to next page...
			$next.click();

			// Then start looping the table rows again.
			setTimeout( app.loopTableRows, 500 );
		}
	};

	/**
	 * Loops through the table rows of podcast episodes, and generates a podcast object,
	 * then triggers the fetching of the corresponding podcast URLs.
	 *
	 * @since  0.1.0
	 */
	app.loopTableRows = function() {
		if ( app.checkStop() ) {
			return;
		}

		// Loop the table row elements...
		$( app.tableRowSelector ).each( function() {
			if ( app.checkStop() ) {
				return false;
			}

			var $this = $( this );

			var podcast = {
				id       : $this.find( app.rowPodcastIdSelector ).val(),
				title    : $this.find( app.rowPodcastTitleSelector ).html(),
				date     : $this.find( app.rowCellSelector ).eq( app.dateCellIndex ).data( app.dateDataKey ),
				category : $this.find( app.rowCellSelector ).eq( app.categoryCellIndex ).text(),
			};

			// If row found an ID and a title, then we havea podcast object.
			if ( podcast.id && podcast.title ) {
				app.podcasts[ podcast.id ] = $.extend( {}, app.podcastObjectParams, podcast );

				// Queue this id for fetching the podcast URL.
				app.podcastsToFetchURL.push( podcast.id );
			}
		} );

		// Ok, start fetching.
		app.fetchPodcastURLs();
	};

	/**
	 * Update's the current podcast object's URL field with the Download URL from the embed-code modal.
	 *
	 * @since  0.1.0
	 */
	app.updatePodcastURL = function( again ) {
		if ( app.checkStop() ) {
			return;
		}

		again = again || 0;
		again++;

		var $input = $( app.embedCodeModalIdInputSelector );

		if ( ! $input.length ) {

			// If $input isn't found, the modal hasn't quite opened, so try again shortly.
			return app.retryUpdatePodcastURL( again );
		}

		// Get the modal's id.
		var id = $input.val();

		// Ensure modal's id matches the current podcast ID we are trying to update.
		if ( id != app.currentPodcastId ) {

			// Whoops.
			return console.error( { 'currentPodcastId' : app.currentPodcastId, 'id' : id } );
		}

		var $urlInput       = $( app.directDownloadURLlabelSelector ).next().find( 'input' );
		var $permalinkInput = $( app.directPermalinkURLlabelSelector ).next().find( 'input' );

		if ( ! $urlInput.length ) {
			// Try again.
			return app.retryUpdatePodcastURL( again );
		}

		app.podcasts[ id ].url = $urlInput.val();

		if ( $urlInput.length ) {
			// Update the current podcast object's URL.
			app.podcasts[ id ].url = $urlInput.val();
		}

		if ( $permalinkInput.length ) {
			// Update the current podcast object's permalink.
			app.podcasts[ id ].permalink = $permalinkInput.val();
		}

		if ( ! app.podcasts[ id ].url ) {
			console.warn( 'Cannot find podcast download url.', app.podcasts );
		}

		if ( ! app.podcasts[ id ].permalink ) {
			console.warn( 'Cannot find podcast permalink.', app.podcasts );
		}

		app.fetchNextPodcastURL();
	};

	/**
	 * If the update failed, retry it.
	 *
	 * @since  0.1.1
	 *
	 * @param  {int} again Number of tries.
	 */
	app.retryUpdatePodcastURL = function( again ) {
		if ( app.checkStop() ) {
			return;
		}

		var timeout = 200;
		if ( again ) {
			timeout = 500;
		}

		if ( again > 3 ) {
			// If we can't find the URL input...
			console.error( 'cannot retry update podcast url. Moving on.', app.podcasts[ app.currentPodcastId ] );
			return app.fetchNextPodcastURL();
		}

		// Try again.
		setTimeout( function() {
			app.updatePodcastURL( again );
		}, timeout );
	};

	/**
	 * Close the embed-code modal and open the next row's.
	 *
	 * @since  0.1.1
	 */
	app.fetchNextPodcastURL = function() {
		if ( app.checkStop() ) {
			return;
		}

		// Close the modal.
		$( app.embedCodeModalCloseButtonSelector ).click();

		// Continue fetching.
		setTimeout( app.fetchPodcastURLs, 200 );
	};

	/**
	 * Download a file.
	 *
	 * @since  0.1.0
	 *
	 * @param  {string} content File content (JSON)
	 * @param  {string} name    File name. Default to 'podcast.json'.
	 * @param  {string} type    File type. Default: text/plain.
	 */
	app.download = function( content, name, type ) {
		name = name || app.fileName;
		type = type || 'text/plain';
		var a = document.createElement( 'a' );
		var file = new Blob( [content], { type: type } );
		a.href = URL.createObjectURL( file );
		a.download = name;
		a.click();
	};

	/**
	 * Check if the script should stop.
	 *
	 * @since  0.1.1
	 *
	 * @return {bool} Whether script is stopping.
	 */
	app.checkStop = function() {
		if ( app.stopScript ) {
			app.stopScript = false;
			return true;
		}

		return false;
	};

	/**
	 * Stope the script when it it is running.
	 *
	 * @since  0.1.0
	 */
	app.stop = function() {
		console.warn('Stopping...');
		app.stopScript = true;
	};

	/**
	 * Kickoff the script. Simply a wrapper for app.loopTableRows().
	 *
	 * @since  0.1.0
	 */
	app.begin = function() {
		app.loopTableRows();
	};

	/**
	 * Initiate the App.
	 *
	 * @since  0.1.0
	 */
	app.init = function() {
		if ( app.autostart ) {
			app.begin();
		}
	};

	$( app.init );

} )( window, document, jQuery, window.libsynBrowserMigrator );
