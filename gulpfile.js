var fs = require('fs');
var gulp = require('gulp');
var gutil = require('gulp-util');
var mocha = require('gulp-mocha');
var docco = require('gulp-docco');
var concat = require('gulp-concat');
var jshint = require('gulp-jshint');
var istanbul = require('gulp-istanbul');
var clean = require('gulp-clean');
var exampleToTest = require('gulp-example-to-test');
var replace = require('gulp-replace');
var insert = require('gulp-insert');
var runSequence = require('run-sequence');

function onError(error) {
    gutil.log(error);
    process.exit(1);
}

// Help module
require('gulp-help')(gulp);

var newConcordiaRegex = /^(.*Concordia\()(.*)(\).*)$/m;
var exampleTestHeader = fs.readFileSync('./helpers/example-test-header.js');

gulp.task('test', function(callback) {
    runSequence(
        'unit-tests',
        'example-tests',
        callback
    );
});

gulp.task('example-tests', function(callback) {
    runSequence(
        'clean-example-tests',
        'generate-example-tests',
        'run-example-tests',
        callback
    );
});

gulp.task('run-example-tests', function() {
    return gulp.src('./example-tests/*.js')
        .pipe(mocha({
            ui: 'qunit',
            reporter: 'spec'
        }));
});

gulp.task('generate-example-tests', function() {
    return gulp.src('./examples/*.js')
        .pipe(exampleToTest())
        .pipe(insert.prepend(exampleTestHeader))
        .pipe(replace(/Concordia\(\)/, 'Concordia({})'))
        .pipe(replace(newConcordiaRegex, '$1_.extend(loggerConfig, $2)$3'))
        .on('error', onError)
        .pipe(gulp.dest('./example-tests'));
});

gulp.task('clean-example-tests', function() {
    return gulp.src('./example-tests', { read: false })
        .pipe(clean());
});

gulp.task('unit-tests', function() {
    // Modules used in tests must be loaded in this task
    require('must');
    return gulp.src(['./tests/**/*.test.js'])
        .pipe(mocha({
            reporter: 'spec'
        }));
});

// gulp.task('coverage', 'Create istanbul code coverage report form tests',
//             function(callback) {
//     gulp.src(['lib/**/*.js', 'index.js'])
//         .pipe(istanbul())
//         .on('finish', function () {
//             require('must');
//             gulp.src(['./tests/**/*.test.js'])
//                 .pipe(mocha())
//                 .pipe(istanbul.writeReports())
//                 .on('end', callback);
//         });
// });

gulp.task('coverage', function(callback) {
    runSequence(
        'setup-istanbul',
        'test',
        'report-istanbul',
        callback
    );
});

gulp.task('setup-istanbul', function(callback) {
    gulp.src(['lib/**/*.js', 'index.js'])
        .pipe(istanbul())
        .on('finish', callback);
});

gulp.task('report-istanbul', function() {
    return gulp.src(['lib/**/*.js', 'index.js'])
        .pipe(istanbul.writeReports());
});

gulp.task('docs', 'Build the documentation', function() {
    gulp.src('lib/concordia.js')
        .pipe(docco())
        .pipe(gulp.dest('./documentation'));
});

gulp.task('lint', 'Execute JSHint checks on the code', function () {
    gulp.src(['lib/**/*.js', 'examples/**/*.js'])
        .pipe(jshint('.jshintrc'))
        .pipe(jshint.reporter('jshint-stylish'));
});
