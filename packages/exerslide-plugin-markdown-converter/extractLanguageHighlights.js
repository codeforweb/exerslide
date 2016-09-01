/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

'use strict';

const path = require('path');

const codeFenceRegex = /^\s*[`~]{3} *([a-z]+)/mig;
const helperPath = JSON.stringify(
  path.resolve(__dirname, './utils/registerLanguage.js')
);

module.exports = function(config) {
  const languagePaths = config.languagePaths || {};

  return function(transformHelper) {
    return {
      before(source, next) {
        codeFenceRegex.lastIndex = 0;
        const actions = [];
        const languages = new Set();
        let error = null;

        let match;
        while (match = codeFenceRegex.exec(source)) { // eslint-disable-line no-cond-assign
          if (match[1]) {
            languages.add(match[1].toLowerCase());
          }
        }
        const foundLanguages = Array.from(languages).reduce(
          (list, name) => {
            if (languagePaths[name]) {
              list[name] = languagePaths[name];
            }
            return list;
          },
          {}
        );
        const missingLanguages = Array.from(languages).filter(
          name => !foundLanguages[name]
        );
        if (missingLanguages.length > 0) {
          error =
            `SyntaxHighlighter: Missing languages (${missingLanguages.join()}).`;
        }
        if (Object.keys(foundLanguages).length > 0) {
          const obj = Object.keys(foundLanguages).map(
            name => `${JSON.stringify(name)}: ` +
              `require(${JSON.stringify(foundLanguages[name])})`
          ).join(',\n');
          actions.push(
            transformHelper.getPrefixAction(`require(${helperPath})({${obj}});`)
          );
        }
        next(error, source, actions);
      },
    };
  };
};
