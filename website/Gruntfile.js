/*
 * Fixed-To-Mobile Number Mapper
 * Copyright (c) 2015 Sebastian Schumann
 * This code is released under the MIT License.
 * The license is available in the LICENSE file distributed with the project.
 */

module.exports = function(grunt) {
  var config = {
    www: './output'
  };

  grunt.initConfig({
    config: config,
    htmlmin: {                        // Task
      multiple: {                     // Target
        files: [{                     // Dictionary of files
          expand: true,
          cwd: './',                  // Project root
          src: '*.html',               // Source
          dest: '<%= config.www %>',                 // Destination
          ext: '.html'                // Extension of new files
        }],
        options: {                    // Target options
          removeComments: true,
          collapseWhitespace: true,
          minifyCSS: true,
          minifyJS: true
        }
      }
    },
    cssmin: {
      target: {
        files: [{
          expand: true,
          cwd: './',
          src: ['*.css'],
          dest: '<%= config.www %>/css',
          ext: '.css'
        }]
      }
    },
    uglify: {
      options: {
        mangle: true,
        compress: true,
        sourceMap: true,
        preserveComments: false
      },
      my_target: {
        files: [{
          expand: true,
          cwd: './',
          src: ['*.js', '!Gruntfile.js'],
          dest: '<%= config.www %>/js',
          ext: '.js'
        }]
      }
    },
    copy: {
      dist: {
       files: [{
         expand: true,
         flatten: true,
         src: 'bower_components/angular/angular.min.*',
         dest: '<%= config.www %>/js'
       },
       {
         expand: true,
         flatten: true,
         src: 'bower_components/bootstrap/dist/css/bootstrap.min.css',
         dest: '<%= config.www %>/css'
       },
       {
         expand: true,
         flatten: true,
         src: 'bower_components/bootstrap/dist/js/bootstrap.min.js',
         dest: '<%= config.www %>/js'
       },
       {
         expand: true,
         flatten: true,
         src: 'bower_components/bootstrap/dist/fonts/*',
         dest: '<%= config.www %>/fonts'
       },
       {
         expand: true,
         flatten: true,
         src: 'bower_components/jquery/dist/jquery.min.*',
         dest: '<%= config.www %>/js'
       },
       {
         expand: true,
         flatten: true,
         src: 'bower_components/font-awesome/css/font-awesome.min.css',
         dest: '<%= config.www %>/css'
       },
       {
         expand: true,
         flatten: true,
         src: 'bower_components/font-awesome/fonts/*',
         dest: '<%= config.www %>/fonts'
       }]
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-htmlmin');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-copy');

  grunt.registerTask('default', ['htmlmin', 'cssmin', 'uglify', 'copy']);
};
