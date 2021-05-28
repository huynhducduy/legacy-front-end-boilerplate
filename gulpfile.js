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
const merge = require('merge-stream');
const handlebars = require('gulp-compile-handlebars'); // or just gulp-include
// gulp-rev

const lib = require('./lib.json');

// Linter: gulp-eslint, gulp-stylelint

require('dotenv').config()

const buildDest = "dist";
const styleFolder = "css";
const scriptFolder = "js";
const assetsFolder = "assets"
const libFolder = "lib"

const assetsRegex = ['assets/**/*'];
const handlebarsRegex = ['app/**/*.handlebars', '!app/partials/*.handlebars'];
const handlebarsPartials = ['./partials'];
const styleRegex = "scss/**/*.scss";
const scriptRegex = 'js/**/*.js';
const libRegex = "lib/**/*";

const handlebarsDest = buildDest;
const styleDest = buildDest + "/" + styleFolder;
const scriptDest = buildDest + "/" + scriptFolder;
const assetsDest = buildDest + "/" + assetsFolder;
const libDest = buildDest + "/" + libFolder;

const handlebarsHelpers = {
    uppercase : function(str){
        return str.toUpperCase();
    }
}

const appEnv = {}

for (const key in process.env) {
    if (key.startsWith("APP_")) appEnv[key] = process.env[key]
}

const handlebarsData = {
    styleFolder,
    scriptFolder,
    assetsFolder,
    libFolder,
    siteName: 'Site name',
    ...appEnv
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

gulp.task('vendor', function() {
    var list = [];
    for (const key in lib) {
        list.push(
            gulp.src("node_modules/" + key)
            .pipe(cached('lib/'+ key))
            .pipe(plumber())
            .pipe(gulp.dest('lib/' + lib[key]))
        )
    }
    return merge(...list)
});

gulp.task('lib', gulp.series('vendor', function() {
    return gulp.src(libRegex)
        .pipe(cached('lib'))
        .pipe(plumber())
        .pipe(gulp.dest(libDest));
}));

gulp.task('image', function() {
    return gulp.src(assetsRegex)
        .pipe(plumber())
        .pipe(imagemin())
        .pipe(gulp.dest('.'));
});

gulp.task('assets', function() {
    return gulp.src(assetsRegex)
        .pipe(plumber())
        .pipe(gulp.dest(assetsDest));
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

gulp.task('build', gulp.series('clean', gulp.parallel('handlebars', 'script', 'style', 'assets', 'lib')));
gulp.task('default', gulp.series('build', 'serve'));

