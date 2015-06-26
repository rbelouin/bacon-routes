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
          hostname: "127.0.0.1"
        }
      }
    },
    jasmine: {
      test: {
        src: "test/bundle.js",
        options: {
          host: "http://127.0.0.1:8000",
          outfile: "index.html"
        }
      }
    }
  });

  grunt.loadNpmTasks("grunt-browserify");
  grunt.loadNpmTasks("grunt-contrib-connect");
  grunt.loadNpmTasks("grunt-contrib-jasmine");

  grunt.registerTask("default", ["test"]);
  grunt.registerTask("test", ["browserify", "connect", "jasmine"]);
};
