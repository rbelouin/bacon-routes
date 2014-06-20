module.exports = function(grunt) {

  grunt.initConfig({
    bower_concat: {
      all: {
        dest: "test/dependencies.js",
        mainFiles: {
          "history.js": "scripts/bundled/html5/native.history.js"
        }
      }
    }
  });

  grunt.loadNpmTasks("grunt-bower-concat");

  grunt.registerTask("default", ["bower_concat"]);
};
