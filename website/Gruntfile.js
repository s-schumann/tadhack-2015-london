/*
 * Fixed-To-Mobile Number Mapper
 * Copyright (c) 2015 Sebastian Schumann
 * This code is released under the MIT License.
 * The license is available in the LICENSE file distributed with the project.
 */

module.exports = function(grunt) {
  grunt.initConfig({
    htmlmin: {                        // Task
      multiple: {                     // Target
        files: [{                     // Dictionary of files
          expand: true,
          cwd: './',                  // Project root
          src: '*.html',               // Source
          dest: './output',                 // Destination
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
          dest: './output',
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
          dest: './output',
          ext: '.js'
        }]
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-htmlmin');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.registerTask('default', ['htmlmin', 'cssmin', 'uglify']);
};
