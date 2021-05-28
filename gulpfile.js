const gulp = require('gulp');
const browserSync = require('browser-sync').create();
const sass = require('gulp-sass');
const sourcemaps = require('gulp-sourcemaps');
const postcss = require('gulp-postcss');
const cssnano = require('cssnano');
const autoprefixer = require('autoprefixer');
const terser = require('gulp-terser');
const imagemin = require('gulp-imagemin');
const htmlmin = require('gulp-htmlmin');
const rename = require("gulp-rename");
const del = require("del");
const cached = require('gulp-cached');
const plumber = require('gulp-plumber');
const babel = require('gulp-babel');
const handlebars = require('gulp-compile-handlebars'); // or just gulp-include

// Linter: gulp-eslint, gulp-stylelint

require('dotenv').config()

const buildDest = "dist";
const styleFolder = "css";
const scriptFolder = "js";
const imageFolder = "assets/img"

const imageRegex = ['assets/img/*'];
const handlebarsRegex = ['app/**/*.handlebars', '!app/partials/*.handlebars'];
const handlebarsPartials = ['./partials'];
const styleRegex = "scss/**/*.scss";
const scriptRegex = 'js/**/*.js';

const handlebarsDest = buildDest;
const styleDest = buildDest + "/" + styleFolder;
const scriptDest = buildDest + "/" + scriptFolder;
const imageDest = buildDest + "/" + imageFolder;

const handlebarsHelpers = {
    uppercase : function(str){
        return str.toUpperCase();
    }
}

const handlebarsData = {
    styleFolder,
    scriptFolder,
    imageFolder,
    siteName: 'Site name',
};

gulp.task('clean', () => del([buildDest]));

gulp.task('handlebars', function() {
    const options = {
        ignorePartials: true,
        batch: handlebarsPartials,
        helpers: handlebarsHelpers,
    }

    return gulp.src(handlebarsRegex)
        .pipe(cached('handlebars'))
        .pipe(plumber())
        .pipe(handlebars(handlebarsData, options))
        .pipe(htmlmin())
        .pipe(rename({
            extname: '.html'
        }))
        .pipe(gulp.dest(handlebarsDest));
});

gulp.task('style', function() {
    return gulp.src(styleRegex)
        .pipe(cached('style'))
        .pipe(plumber())
        .pipe(sourcemaps.init())
        .pipe(sass({ outputStyle: 'compressed' }))
        .pipe(postcss([cssnano(), autoprefixer()]))
        .pipe(rename({suffix: '.min'}))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(styleDest))
});

gulp.task('script', function() {
    return gulp.src(scriptRegex)
        .pipe(cached('script'))
        .pipe(plumber())
        .pipe(sourcemaps.init())
        .pipe(babel({
            presets: ['@babel/env']
        }))
        .pipe(terser())
        .pipe(rename({suffix: '.min'}))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(scriptDest))
});

gulp.task('image', function() {
    return gulp.src(imageRegex)
        .pipe(cached('image'))
        .pipe(plumber())
        .pipe(imagemin())
        .pipe(gulp.dest(imageDest))
});

gulp.task('serve', function() {
    browserSync.init({
        server: {
            baseDir: buildDest,
        }
    });

    gulp.watch(styleRegex).on('all',  gulp.series('style', browserSync.reload));
    gulp.watch(scriptRegex).on('all', gulp.series('script', browserSync.reload));
    gulp.watch(handlebarsRegex).on('all', gulp.series('handlebars', browserSync.reload));
});

gulp.task('build', gulp.series('clean', gulp.parallel('handlebars', 'script', 'style', 'image')));
gulp.task('default', gulp.series('build', 'serve'));
