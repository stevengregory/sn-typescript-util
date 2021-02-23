#!/usr/bin/env ruby

require_relative File.join(__dir__, 'utils')

module ServiceNow
  class Build
    def initialize
      @app = ServiceNow::Utils.new.get_application
      @out_dir = 'dist'
    end

    def add_packages
      %x( sh "#{File.join(__dir__, 'install.sh')}" )
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

    def init
      add_packages
      create_prettier_config
      create_tsconfig
      create_nodemon_config
      sync
    end

    def sync
      %x( sh "#{File.join(__dir__, 'sync.sh')}" )
    end

    def transpile
      %x( tsc )
      %x( prettier --write "#{@out_dir}/**/*.js" )
      %x( rsync -av --progress -a --exclude="Interfaces" "#{@out_dir}/" "#{@app}/src" )
    end
  end
end
