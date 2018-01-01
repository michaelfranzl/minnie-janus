/*jshint esversion: 6 */

const gulp = require('gulp');
const Builder = require('systemjs-builder');
const fs = require('fs');


// gulp.task('readme', function() {
//   const fs = require('fs');
//   const jsdoc2md = require('jsdoc-to-markdown');
// 
//   const output = jsdoc2md.renderSync({
//     files: 'src/*.js',
//     template: fs.readFileSync('README.hbs').toString(),
//   });
//   fs.writeFileSync('README.md', output);
//   
//   var converter = new showdown.Converter({
//     tables: true,
//   });
//   
//   // for debugging only
//   //fs.writeFileSync('README.html', converter.makeHtml(output));
// });

function buildStatic(infile, outfile) {
  let systemBuilder = new Builder('', 'jspm.config.js');
  systemBuilder.buildStatic(
    `src/${infile}.js`,
    `dist/${outfile}.js`,
    {
      minify: false,
      mangle: false,
      uglify: {
        compress: {
          drop_console: false,
          unused: false,
          dead_code: false,
        }
      },
      sourceMaps: true, // would be only useful for developers
      sourceMapContents: false,
      normalize: false,
      format: 'umd',
    }
  );
}


gulp.task('build', function() {
  buildStatic('base-plugin-stamp', 'base-plugin');
  buildStatic('session-stamp', 'session');
});