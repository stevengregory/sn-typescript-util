#!/usr/bin/env ruby

require_relative File.join(__dir__, 'utils')

module ServiceNow
  class Build
    def initialize
      @app = ServiceNow::Utils.new.get_application
      @out_dir = 'dist'
    end

    def create_nodemon_config
      config = 'nodemon.json'
      file = ServiceNow::Utils.new.fetch_file 'templates', config
      File.write(config, file)
      ServiceNow::Utils.new.replace_content config
    end

    def create_prettier_config
      config = '.prettierrc.json'
      file = ServiceNow::Utils.new.fetch_file 'templates', config
      File.write(config, file)
    end

    def create_tsconfig
      config = 'tsconfig.json'
      file = ServiceNow::Utils.new.fetch_file 'templates', config
      File.write(config, file)
      ServiceNow::Utils.new.replace_content config
    end

    def has_prettier_config
      types = [
        '.prettierrc',
        '.prettierrc.json',
        '.prettierrc.yml',
        '.prettierrc.yaml',
        '.prettierrc.json5',
        '.prettierrc.js',
        '.prettierrc.cjs',
        'prettier.config.js',
        'prettier.config.cjs',
        '.prettierrc.toml'
      ]
      types.any? do |item|
        ServiceNow::Utils.new.has_file item
      end
    end

    def init
      make_configs
    end

    def make_configs
      create_nodemon_config
      create_tsconfig
      if has_prettier_config === false
        create_prettier_config
      end
    end

    def transpile
      %x( tsc )
      %x( prettier --write "#{@out_dir}/**/*.js" )
      %x( rsync -av --progress -a --exclude="Interfaces" "#{@out_dir}/" "#{@app}/src" )
    end
  end
end
