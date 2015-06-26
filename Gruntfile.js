module.exports = function(grunt) {

  grunt.initConfig({
    browserify: {
      test: {
        files: {
          "test/bundle.js": "test/bacon-routes.test.js"
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
          "node_modules/mocha/mocha.css",
          "node_modules/mocha/mocha.js",
          "node_modules/proclaim/lib/proclaim.js"
        ],
        dest: "test/"
      }
    }
  });

  grunt.loadNpmTasks("grunt-browserify");
  grunt.loadNpmTasks("grunt-contrib-connect");
  grunt.loadNpmTasks("grunt-contrib-copy");

  grunt.registerTask("default", ["test"]);
  grunt.registerTask("test", ["browserify", "copy", "connect"]);
};
