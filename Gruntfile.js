module.exports = function(grunt) {

  grunt.initConfig({
    bower_concat: {
      all: {
        dest: "test/dependencies.js",
        mainFiles: {
          "history.js": "scripts/bundled/html5/native.history.js"
        }
      }
    },
    connect: {
      test: {
        options: {
          base: "test/",
          hostname: "127.0.0.1",
          keepalive: true
        }
      }
    },
    copy: {
      test: {
        expand: true,
        flatten: true,
        src: [
          "bacon-routes.js",
          "node_modules/mocha/mocha.css",
          "node_modules/mocha/mocha.js",
          "node_modules/proclaim/lib/proclaim.js"
        ],
        dest: "test/"
      }
    }
  });

  grunt.loadNpmTasks("grunt-bower-concat");
  grunt.loadNpmTasks("grunt-contrib-connect");
  grunt.loadNpmTasks("grunt-contrib-copy");

  grunt.registerTask("default", ["bower_concat"]);
  grunt.registerTask("test", ["bower_concat", "copy", "connect"]);
};
