var gulp = require('gulp'),
    gutil = require('gulp-util'),
    jshint = require('gulp-jshint'),
    concat = require('gulp-concat'),
    less = require('gulp-less'),
    uglify = require('gulp-uglify'),
    sourcemaps = require('gulp-sourcemaps');

gulp.task('default', ['watch']);

// Lints javascript and builds less on file changes
gulp.task('watch', function() {
  gulp.watch('app/js/**/*.js', ['jshint']);
  gulp.watch('app/less/**/*.less', ['build-less']);
})

// Lints javascript
gulp.task('jshint', function() {
  return gulp.src('app/js/**/*.js')
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'));
})

// Builds all scripts to the public directory
gulp.task('build-scripts', function() {
  return gulp.src('app/js/**/*.js')
    .pipe(sourcemaps.init())
    .pipe(concat('app.js'))
    .pipe(gutil.env.env === 'production' ? uglify() : gutil.noop())
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('public/js'));
})

// Builds all less to the public directory
gulp.task('build-less', function() {
  return gulp.src('app/less/**/*.less')
    .pipe(sourcemaps.init())
    .pipe(less())
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('public/css'));
})

// Builds both scripts and less to the public directory
gulp.task('build', ['build-scripts', 'build-less']);
