module.exports = function (grunt) {
    grunt.initConfig({
        mochaTest: {
            test: {
                options: {
                    reporter: 'spec',
                    require: 'should',
                    colors: true,
                    bail: false,
                    timeout: 25000
                },
                src: [ 'pagseguro-checkout.spec.js' ]
            }
        }
    });

    grunt.loadNpmTasks('grunt-mocha-test');

    grunt.registerTask('default', [ 'test' ]);
    grunt.registerTask('test', [ 'mochaTest:test']);
};
