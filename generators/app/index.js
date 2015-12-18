'use strict';
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var _ = require('lodash');
var pascalCase = require('pascal-case');
var path = require('path');

var SpringbootGenerator = module.exports = yeoman.generators.Base.extend({

    initializing: function () {
        this.appname = _.kebabCase(path.basename(process.cwd()));
    },

    prompting: function () {
        var done = this.async();

        // Have Yeoman greet the user.
        var logo = "  _   _       ______ _____             \n" +
            " | \\ | |     |  ____|  __ \\            \n" +
            " |  \\| | ___ | |__  | |  | | _____   __\n" +
            " | . ` |/ _ \\|  __| | |  | |/ _ \\ \\ / /\n" +
            " | |\\  | (_) | |    | |__| |  __/\\ V / \n" +
            " |_| \\_|\\___/|_|    |_____/ \\___| \\_/  \n" +
            "                                       \n";
        this.log(chalk.green(logo) + 'Welcome to the supreme ' + chalk.red('generator-yintai-springboot') + ' generator!' + '\n' + chalk.yellow('Usually the default prompt is recommended. '));

        var prompts = [
            {
                type: 'string',
                name: 'organizationName',
                message: '(1/11) What is the organization\'s name of service?',
                default: 'yintai'
            },
            {
                type: 'string',
                name: 'dockerPrefix',
                message: '(2/11) What is your Docker prefix?',
                default: function (response) {
                    return response.organizationName;
                }
            },
            {
                type: 'string',
                name: 'extraMavenRepo',
                message: '(3/11) What private maven repository would you like to use? (eg. https://nexus.yintai.org/public)'
            },
            {
                type: 'string',
                name: 'authorName',
                message: '(4/11) What is the author\'s name of service?',
                default: this.user.git.name()
            },
            {
                type: 'string',
                name: 'authorEmail',
                message: '(5/11) What is the author\'s email of service?',
                default: this.user.git.email()
            },
            {
                type: 'string',
                name: 'baseName',
                message: '(6/11) What is the base name of service?',
                default: this.appname
            },
            {
                type: 'string',
                name: 'packageName',
                message: '(7/11) What is the package name of service?',
                default: function (response) {
                    return 'com.' + response.organizationName + '.' + response.baseName.replace(/\-/g, '');
                }
            },
            {
                type: 'string',
                name: 'description',
                message: '(8/11) What is the description of service?'
            },
            {
                type: 'string',
                name: 'springBootVersion',
                message: '(9/11) What version of Spring Boot would you like to use?',
                default: '1.3.0.RELEASE'
            },
            {
                type: 'checkbox',
                name: 'dependencies',
                message: '10/11) Select your dependencies.',
                choices: [
                    {
                        name: 'Jetty (Tomcat will be uninstalled)',
                        value: 'jetty',
                        checked: 'true'
                    },
                    {
                        name: 'Actuator',
                        value: 'actuator',
                        checked: 'true'
                    },
                    {
                        name: 'Data-jpa',
                        value: 'jpa'
                    }
                ]
            },
            {
                when: function (response) {
                    return response.dependencies.indexOf('jpa') != -1;
                },
                type: 'list',
                name: 'databaseType',
                message: 'Which *type* of database would you like to use? TODO: MongoDB not supported',
                choices: [
                    {
                        value: 'none',
                        name: 'None'
                    },
                    {
                        value: 'sql',
                        name: 'SQL (H2 & PostgreSQL)'
                    },
                    {
                        value: 'mongodb',
                        name: 'MongoDB (TODO: Not supported)'
                    }
                ],
                default: 'sql'
            },
            {
                type: 'confirm',
                name: 'hasSample',
                message: '(11/11) Would you like to contains a sample?',
                default: true
            }
        ];

        this.prompt(prompts, function (props) {
            // To access props later use this.props.someOption;
            this.props = props;
            this.props.applicationName = pascalCase(this.appname) + 'Application';
            var hasDependencies = function (dependency) {
                return props.dependencies.indexOf(dependency) !== -1;
            };
            this.props.jetty = hasDependencies("jetty");
            this.props.actuator = hasDependencies("actuator");
            this.props.jpa = hasDependencies("jpa");
            if (this.props.databaseType == 'sql') {
                this.props.sql = true;
            } else {
                this.props.sql = false;
            }

            done();
        }.bind(this));
    },

    writing: function () {
        var sourceDir = "src/main/groovy/";
        var resourcesDir = "src/main/resources/";
        var testDir = "src/test/";
        var dockerDir = "src/main/docker/";
        var packageDir = this.props.packageName.replace(/\./g, '/') + '/';

        //gradle
        this.template(this.templatePath('build.gradle'), this.destinationPath('build.gradle'), this.props, {'interpolate': /<%=([\s\S]+?)%>/g});
        this.fs.copy(this.templatePath('gradlew'), this.destinationPath('gradlew'));
        this.fs.copy(this.templatePath('gradlew.bat'), this.destinationPath('gradlew.bat'));
        this.fs.copy(this.templatePath('gradle/wrapper/gradle-wrapper.jar'), this.destinationPath('gradle/wrapper/gradle-wrapper.jar'));
        this.fs.copy(this.templatePath('gradle/wrapper/gradle-wrapper.properties'), this.destinationPath('gradle/wrapper/gradle-wrapper.properties'));

        //app
        this.template(this.templatePath(sourceDir + 'com/yintai/Application.groovy'), this.destinationPath(sourceDir + packageDir + this.props.applicationName + ".groovy"), this.props, {'interpolate': /<%=([\s\S]+?)%>/g});

        //resources
        this.template(this.templatePath(resourcesDir + 'application.yml'), this.destinationPath(resourcesDir + 'application.yml'), this.props, {'interpolate': /<%=([\s\S]+?)%>/g});
        if (this.props.jetty) {
            this.fs.copy(this.templatePath(resourcesDir + 'keystore.jks'), this.destinationPath(resourcesDir + 'keystore.jks'));
        }
        //TODO test

        //docker
        this.template(this.templatePath(dockerDir + "Dockerfile"), this.destinationPath(dockerDir + "Dockerfile"), this.props, {'interpolate': /<%=([\s\S]+?)%>/g});

        //readme
        this.template(this.templatePath('README.md'), this.destinationPath('README.md'), this.props, {'interpolate': /<%=([\s\S]+?)%>/g});

        //git
        this.fs.copy(this.templatePath('gitignore'), this.destinationPath('.gitignore'));
    },

    install: function () {
        // this.installDependencies();
    }
});