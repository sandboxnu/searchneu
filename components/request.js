/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import retry from 'async-retry';
import macros from './macros';

// All the requests from the frontend to the backend go through this file.
// There used to be a lot of logic in here for loading the term dump from the service worker cache/IDB, etc

// Some background on different storage options in the browser:
// localstorage
//  -- limit of 5MB
// filesystem api
//  -- depreciated, chrome only. https://www.html5rocks.com/en/tutorials/file/filesystem/
//  -- requestFileSystem
// WebSQL
//  - also depreciated, last updated in 2010
// IndexedDB
// - Looked good, but is slow and blocks the DOM.
// - Takes about 3-5 seconds to load everything on desktop, more on mobile
// - Could theoretically access it from a webworker to stop it from blocking the DOM
// - but in that case it might just be better to use Service Worker Cache

// One thing that would be cool is if the entire search could happen offline
// Which is totally possible as long as we are using elasticlunr
// But would need a bunch of seconds to download all of the term data
// and a couple seconds to load the data when the page was opened.

// Prefix to store keys in localstorage

class Request {
  async getFromInternet(config) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const xmlhttp = new XMLHttpRequest();
      xmlhttp.onreadystatechange = function onreadystatechange() {
        if (xmlhttp.readyState !== 4) {
          return;
        }

        const requestTime = Date.now() - startTime;
        macros.log('Downloading took ', requestTime, 'for url', config.url);

        if (xmlhttp.status !== 200) {
          let err;
          if (xmlhttp.statusText) {
            err = xmlhttp.statusText;
          } else if (xmlhttp.response) {
            err = xmlhttp.response;
          } else {
            err = `unknown ajax error${String(xmlhttp.status)}`;
          }

          err += `config = ${JSON.stringify(config.url)}`;

          macros.warn(
            'error, bad code recievied',
            xmlhttp.status,
            err,
            config.url
          );

          reject(err);
          return;
        }

        const startParse = Date.now();
        const response = JSON.parse(xmlhttp.response);
        const parsingTime = Date.now() - startParse;
        macros.log('Parsing took ', parsingTime, 'for url', config.url);

        if (response.error) {
          macros.warn('ERROR networking error bad reqeust?', config.url);
        }

        resolve(response);
      };

      if (config.progressCallback) {
        xmlhttp.addEventListener(
          'progress',
          (evt) => {
            if (evt.lengthComputable) {
              config.progressCallback(evt.loaded, evt.total);
            }
          },
          false
        );
      }

      // Add the session token to the request.
      const url = new URL(config.url);
      xmlhttp.open(config.method, url.toString(), true);

      if (config.method === 'POST') {
        xmlhttp.setRequestHeader('Content-Type', 'application/json');
        xmlhttp.send(JSON.stringify(config.body));
      } else {
        xmlhttp.send();
      }
    });
  }

  async getFromInternetWithRetry(config) {
    let times = 3;
    if (config.retryTimes !== undefined) {
      times = config.retryTimes;
    }

    return retry(
      async () => {
        return this.getFromInternet(config);
      },
      {
        retries: times,
        minTimeout: 500,
        maxTimeout: 500,
      }
    );
  }

  async get(config) {
    if (typeof config === 'string') {
      config = {
        url: config,
      };
    } else if (Object.keys(config).length > 1 || !config.url) {
      macros.error(
        'Nothing is supported except JSON GET requests to a url.',
        config
      );
    }

    config.method = 'GET';

    return this.getFromInternetWithRetry(config);
  }

  async post(config) {
    if (
      typeof config === 'string' ||
      Object.keys(config).length > 2 ||
      !config.url ||
      !config.body
    ) {
      macros.error(
        'Nothing is supported except JSON POST requests to a url.',
        config
      );
    }

    config.method = 'POST';

    return this.getFromInternetWithRetry(config);
  }
}

export default new Request();
