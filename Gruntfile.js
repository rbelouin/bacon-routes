module.exports = function(grunt) {

  grunt.initConfig({
    bower_concat: {
      test: {
        dest: "test/dependencies.js"
      }
    },
    browserify: {
      test: {
        files: {
          "test/bundle.js": "test/browserify-bindings.js"
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
      test_bower: {
        src: "bacon-routes.js",
        options: {
          host: "http://127.0.0.1:8000",
          outfile: "index.html",
          specs: "test/bacon-routes.test.js",
          vendor: "test/dependencies.js"
        }
      },
      test_browerify: {
        options: {
          host: "http://127.0.0.1:8000",
          outfile: "index.html",
          specs: "test/bundle.js"
        }
      }
    }
  });

  grunt.loadNpmTasks("grunt-bower-concat");
  grunt.loadNpmTasks("grunt-browserify");
  grunt.loadNpmTasks("grunt-contrib-connect");
  grunt.loadNpmTasks("grunt-contrib-jasmine");

  grunt.registerTask("default", ["test"]);
  grunt.registerTask("test", ["bower_concat", "browserify", "connect", "jasmine"]);
};
